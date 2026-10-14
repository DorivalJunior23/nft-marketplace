import type { AddCartItemRequest, Cart, CartItem, EditionId } from '@/contracts';
import { addEth, mulEth } from '@/lib/money';

import { getDb, mutateDb, type CartLineRecord, type CartRecord } from '../db/store';
import { MockApiError, notFound, validationError } from '../errors';
import { findNft, getEdition, getNft, toSummary } from './catalog';

export interface CartContext {
  userId: string | null;
  guestCartId: string | null;
}

function cartKey(ctx: CartContext): { id: string; ownerType: 'guest' | 'user'; ownerId: string } {
  if (ctx.userId) return { id: `cart_user_${ctx.userId}`, ownerType: 'user', ownerId: ctx.userId };
  if (ctx.guestCartId)
    return { id: `cart_guest_${ctx.guestCartId}`, ownerType: 'guest', ownerId: ctx.guestCartId };
  throw validationError(
    { cart: ['Identificação do carrinho ausente.'] },
    'Carrinho não identificado.',
  );
}

function ensureCart(ctx: CartContext): CartRecord {
  const key = cartKey(ctx);
  const existing = getDb().carts[key.id];
  if (existing) return existing;
  return mutateDb((db) => {
    const record: CartRecord = {
      ...key,
      items: [],
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    db.carts[key.id] = record;
    return record;
  });
}

function touch(record: CartRecord): void {
  record.version += 1;
  record.updatedAt = new Date().toISOString();
}

export function toCartResponse(record: CartRecord): Cart {
  const items: CartItem[] = [];
  for (const line of record.items) {
    const nft = findNft(line.nftId);
    if (!nft) continue;
    const edition = nft.editions.find((item) => item.id === line.editionId);
    if (!edition) continue;
    items.push({
      id: line.id,
      nftId: line.nftId,
      editionId: line.editionId,
      quantity: line.quantity,
      nft: toSummary(nft),
      edition: { ...edition },
      unitPrice: nft.price,
      lineTotal: mulEth(nft.price, line.quantity),
    });
  }
  return {
    id: record.id,
    ownerType: record.ownerType,
    items,
    subtotal: items.reduce((sum, item) => addEth(sum, item.lineTotal), '0'),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    version: record.version,
    updatedAt: record.updatedAt,
  };
}

export function getCart(ctx: CartContext): Cart {
  return toCartResponse(ensureCart(ctx));
}

function assertAvailability(nftId: string, editionId: EditionId, quantity: number): void {
  const nft = getNft(nftId);
  const edition = getEdition(nft, editionId);
  if (edition.status !== 'available' || edition.available === 0) {
    throw new MockApiError(
      'availability_conflict',
      `A edição ${edition.label} de ${nft.name} está esgotada.`,
    );
  }
  if (quantity > edition.available) {
    throw new MockApiError(
      'availability_conflict',
      `Só restam ${edition.available} unidade(s) da edição ${edition.label} de ${nft.name}.`,
    );
  }
  if (quantity > edition.maxPerOrder) {
    throw new MockApiError(
      'availability_conflict',
      `O limite por pedido desta edição é ${edition.maxPerOrder}.`,
    );
  }
}

export function addItem(ctx: CartContext, body: AddCartItemRequest): Cart {
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw validationError({ quantity: ['Informe uma quantidade inteira maior que zero.'] });
  }
  const record = ensureCart(ctx);
  const existing = record.items.find(
    (line) => line.nftId === body.nftId && line.editionId === body.editionId,
  );
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  assertAvailability(body.nftId, body.editionId, nextQuantity);
  return mutateDb(() => {
    if (existing) existing.quantity = nextQuantity;
    else {
      record.items.push({
        id: `line_${crypto.randomUUID().slice(0, 8)}`,
        nftId: body.nftId,
        editionId: body.editionId,
        quantity,
      });
    }
    touch(record);
    return toCartResponse(record);
  });
}

export function updateItem(ctx: CartContext, lineId: string, quantity: number): Cart {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw validationError({ quantity: ['Informe uma quantidade inteira.'] });
  }
  const record = ensureCart(ctx);
  const line = record.items.find((item) => item.id === lineId);
  if (!line) throw notFound('Item não encontrado no carrinho.');
  if (quantity > 0) assertAvailability(line.nftId, line.editionId, quantity);
  return mutateDb(() => {
    if (quantity === 0) record.items = record.items.filter((item) => item.id !== lineId);
    else line.quantity = quantity;
    touch(record);
    return toCartResponse(record);
  });
}

export function removeItem(ctx: CartContext, lineId: string): Cart {
  const record = ensureCart(ctx);
  if (!record.items.some((item) => item.id === lineId))
    throw notFound('Item não encontrado no carrinho.');
  return mutateDb(() => {
    record.items = record.items.filter((item) => item.id !== lineId);
    touch(record);
    return toCartResponse(record);
  });
}

/** Ao autenticar, os itens do visitante são somados ao carrinho do usuário, respeitando a disponibilidade. */
export function mergeGuestCart(guestCartId: string, userId: string): void {
  const guest = getDb().carts[`cart_guest_${guestCartId}`];
  if (!guest || guest.items.length === 0) return;
  const userCart = ensureCart({ userId, guestCartId: null });
  mutateDb((db) => {
    for (const line of guest.items) {
      const nft = findNft(line.nftId);
      const edition = nft?.editions.find((item) => item.id === line.editionId);
      if (!nft || !edition || edition.available === 0) continue;
      const existing = userCart.items.find(
        (item) => item.nftId === line.nftId && item.editionId === line.editionId,
      );
      const cap = Math.min(edition.available, edition.maxPerOrder);
      if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, cap);
      else userCart.items.push({ ...line, quantity: Math.min(line.quantity, cap) });
    }
    touch(userCart);
    delete db.carts[guest.id];
  });
}

/** Remove apenas os itens e quantidades efetivamente comprados. */
export function removePurchased(userId: string, purchased: CartLineRecord[]): void {
  const record = ensureCart({ userId, guestCartId: null });
  mutateDb(() => {
    for (const bought of purchased) {
      const line = record.items.find(
        (item) => item.nftId === bought.nftId && item.editionId === bought.editionId,
      );
      if (!line) continue;
      line.quantity -= bought.quantity;
    }
    record.items = record.items.filter((item) => item.quantity > 0);
    touch(record);
  });
}
