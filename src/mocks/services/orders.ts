import type { CreateOrderRequest, Order, OrderReceipt, OrderUpdatedEvent } from '@/contracts';
import { NETWORKS, WALLET_TYPES } from '@/contracts';

import { fnv1a } from '../db/seed';
import { getDb, mutateDb } from '../db/store';
import { MockApiError, notFound, validationError } from '../errors';
import { realtimeBus } from '../realtime-bus';
import { getScenario } from '../runtime';
import { EMAIL_PATTERN } from './auth';
import { adjustAvailability } from './catalog';
import { removePurchased } from './cart';
import { buildQuote } from './quote';

const settlementTimers = new Map<string, number>();

function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4).toUpperCase()}`;
}

function validateCollector(body: CreateOrderRequest): void {
  const c = body.collector ?? ({} as CreateOrderRequest['collector']);
  const details: Record<string, string[]> = {};
  const required: Array<keyof typeof c> = [
    'displayName',
    'username',
    'profileName',
    'email',
    'network',
    'walletAddress',
    'walletType',
    'referralCode',
    'ensName',
  ];
  for (const field of required) {
    if (!c[field] || String(c[field]).trim() === '') details[field] = ['Campo obrigatório.'];
  }
  if (c.email && !EMAIL_PATTERN.test(c.email)) details.email = ['Informe um e-mail válido.'];
  if (c.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(c.walletAddress))
    details.walletAddress = ['Informe um endereço 0x com 40 caracteres hexadecimais.'];
  if (c.network && !NETWORKS[c.network]) details.network = ['Selecione uma rede válida.'];
  if (c.walletType && !WALLET_TYPES.some((type) => type.id === c.walletType))
    details.walletType = ['Selecione uma carteira válida.'];
  if (!body.walletId) details.walletId = ['Selecione uma carteira cadastrada.'];
  if (!body.quoteFingerprint) details.quoteFingerprint = ['Cotação ausente.'];
  if (Object.keys(details).length) throw validationError(details);
}

function publishOrderUpdate(order: Order): void {
  const event: OrderUpdatedEvent = {
    eventId: realtimeBus.nextEventId('evt_order'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: { status: order.status, receipt: order.receipt, declineReason: order.declineReason },
  };
  realtimeBus.publish({ event, targetUserId: order.userId });
}

/** Liquida um pedido pendente: confirmado ou recusado. Estados terminais não mudam mais. */
export function settleOrder(orderId: string, outcome: 'confirmed' | 'declined'): Order | null {
  const timer = settlementTimers.get(orderId);
  if (timer) {
    window.clearTimeout(timer);
    settlementTimers.delete(orderId);
  }
  const order = mutateDb((db) => {
    const current = db.orders[orderId];
    if (!current || current.status !== 'pending') return null;
    current.status = outcome;
    current.version += 1;
    current.updatedAt = new Date().toISOString();
    current.declineReason =
      outcome === 'declined'
        ? 'A rede recusou a transação: saldo insuficiente na carteira conectada.'
        : null;
    return current;
  });
  if (!order) return null;
  if (outcome === 'confirmed') {
    removePurchased(
      order.userId,
      order.receipt.items.map((item) => ({
        id: item.nftId,
        nftId: item.nftId,
        editionId: item.editionId,
        quantity: item.quantity,
      })),
    );
  } else {
    adjustAvailability(order.receipt.items, 1);
  }
  publishOrderUpdate(order);
  return order;
}

function scheduleSettlement(order: Order): void {
  const scenario = getScenario();
  const timer = window.setTimeout(
    () => settleOrder(order.id, scenario.orderSettlement),
    scenario.orderSettlementMs,
  );
  settlementTimers.set(order.id, timer);
}

/** Após um refresh, pedidos ainda pendentes voltam a ser liquidados. */
export function resumePendingOrders(): void {
  for (const order of Object.values(getDb().orders)) {
    if (order.status === 'pending' && !settlementTimers.has(order.id)) scheduleSettlement(order);
  }
}

export interface CreateOrderResult {
  order: Order;
  /** true quando a chave de idempotência recuperou um pedido já existente. */
  replayed: boolean;
}

export function createOrder(
  userId: string,
  body: CreateOrderRequest,
  idempotencyKey: string | null,
): CreateOrderResult {
  if (!idempotencyKey)
    throw validationError(
      { 'Idempotency-Key': ['Header obrigatório.'] },
      'Chave de idempotência ausente.',
    );
  validateCollector(body);
  const payloadHash = fnv1a(
    JSON.stringify({
      items: body.items,
      couponCode: body.couponCode ?? null,
      walletId: body.walletId,
      network: body.network,
    }),
  );
  const existing = getDb().idempotency[idempotencyKey];
  if (existing) {
    if (existing.userId !== userId)
      throw new MockApiError('forbidden', 'Chave de idempotência pertence a outro usuário.');
    if (existing.payloadHash !== payloadHash) {
      throw new MockApiError(
        'idempotency_conflict',
        'Esta chave de idempotência já foi usada com um pedido diferente.',
      );
    }
    const order = getDb().orders[existing.orderId];
    if (!order) throw notFound('Pedido não encontrado.');
    return { order, replayed: true };
  }

  const wallet = getDb().wallets[body.walletId];
  if (!wallet || wallet.userId !== userId)
    throw validationError({ walletId: ['Selecione uma carteira cadastrada.'] });

  const quote = buildQuote({ items: body.items, couponCode: body.couponCode ?? null });
  if (quote.items.length === 0)
    throw validationError({ items: ['O pedido precisa de pelo menos um item.'] });
  if (quote.issues.length) {
    throw new MockApiError(
      'availability_conflict',
      quote.issues.map((issue) => issue.message).join(' '),
    );
  }
  if (quote.fingerprint !== body.quoteFingerprint) {
    throw new MockApiError(
      'quote_outdated',
      'Preço, disponibilidade ou taxas mudaram. Revise a cotação e confirme novamente.',
    );
  }

  adjustAvailability(quote.items, -1);

  const now = new Date();
  const txHash = `0x${randomHex(64)}`;
  const network = NETWORKS[body.network] ?? NETWORKS.ethereum;
  const receipt: OrderReceipt = {
    transactionId: shortHash(txHash),
    explorerUrl: `${network.explorer}${txHash}`,
    network: network.id,
    walletName:
      WALLET_TYPES.find((type) => type.id === wallet.walletType)?.name ?? wallet.walletAlias,
    walletType: wallet.walletType,
    date: now.toISOString(),
    items: quote.items.map((item) => ({
      nftId: item.nftId,
      name: item.nft.name,
      tokenId: item.tokenId,
      artwork: item.nft.artwork,
      editionId: item.editionId,
      editionLabel: item.editionLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    couponCode: quote.coupon?.status === 'applied' ? quote.coupon.code : null,
    networkFee: quote.networkFee,
    total: quote.total,
  };
  const order: Order = {
    id: `ord_${randomHex(10)}`,
    userId,
    status: 'pending',
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    receipt,
    declineReason: null,
  };
  mutateDb((db) => {
    db.orders[order.id] = order;
    db.idempotency[idempotencyKey] = {
      key: idempotencyKey,
      userId,
      payloadHash,
      orderId: order.id,
    };
  });
  scheduleSettlement(order);
  return { order, replayed: false };
}

export function getOrder(userId: string, orderId: string): Order {
  const order = getDb().orders[orderId];
  if (!order) throw notFound('Pedido não encontrado.');
  if (order.userId !== userId)
    throw new MockApiError('forbidden', 'Você não tem permissão para ver este pedido.');
  return order;
}

export function listOrders(userId: string): Order[] {
  return Object.values(getDb().orders)
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Reemite o estado atual (duplicata) ou um evento antigo (versão anterior) para testes do cliente. */
export function republishOrder(orderId: string, options: { stale?: boolean } = {}): void {
  const order = getDb().orders[orderId];
  if (!order) return;
  const event: OrderUpdatedEvent = {
    eventId: realtimeBus.nextEventId('evt_order'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: options.stale ? Math.max(order.version - 1, 0) : order.version,
    occurredAt: new Date().toISOString(),
    data: options.stale
      ? { status: 'pending', receipt: order.receipt, declineReason: null }
      : { status: order.status, receipt: order.receipt, declineReason: order.declineReason },
  };
  realtimeBus.publish({ event, targetUserId: order.userId });
}
