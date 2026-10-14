import type { Wallet, WalletConnectRequest, WalletConnectResponse, WalletInput } from '@/contracts';
import { NETWORKS, WALLET_TYPES } from '@/contracts';

import { getDb, mutateDb } from '../db/store';
import { MockApiError, notFound, validationError } from '../errors';
import { getScenario } from '../runtime';
import { EMAIL_PATTERN } from './auth';

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const ENS_PATTERN = /^(?=.{3,44}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/;

function strip(wallet: Wallet & { userId: string }): Wallet {
  const copy: Wallet & { userId?: string } = { ...wallet };
  delete copy.userId;
  return copy;
}

export function listWallets(userId: string): Wallet[] {
  return Object.values(getDb().wallets)
    .filter((wallet) => wallet.userId === userId)
    .sort((a, b) => (a.kind === 'primary' ? -1 : 1) - (b.kind === 'primary' ? -1 : 1))
    .map(strip);
}

function validateInput(body: Partial<WalletInput>): WalletInput {
  const details: Record<string, string[]> = {};
  const required: Array<keyof WalletInput> = [
    'kind',
    'displayName',
    'walletAlias',
    'network',
    'profileName',
    'address',
    'walletType',
    'referralCode',
    'email',
    'ensName',
  ];
  for (const field of required) {
    const value = body[field];
    if (value === undefined || value === null || String(value).trim() === '')
      details[field] = ['Campo obrigatório.'];
  }
  if (body.kind && !['primary', 'secondary'].includes(body.kind))
    details.kind = ['Tipo de carteira inválido.'];
  if (body.network && !NETWORKS[body.network]) details.network = ['Selecione uma rede válida.'];
  if (body.walletType && !WALLET_TYPES.some((type) => type.id === body.walletType))
    details.walletType = ['Selecione uma carteira válida.'];
  if (body.address && !ADDRESS_PATTERN.test(body.address))
    details.address = ['Informe um endereço 0x com 40 caracteres hexadecimais.'];
  if (
    body.secondaryAddress &&
    !ADDRESS_PATTERN.test(body.secondaryAddress) &&
    !ENS_PATTERN.test(body.secondaryAddress)
  ) {
    details.secondaryAddress = ['Informe um endereço 0x ou um nome ENS.'];
  }
  if (body.email && !EMAIL_PATTERN.test(body.email)) details.email = ['Informe um e-mail válido.'];
  if (body.ensName && !ENS_PATTERN.test(body.ensName.toLowerCase()))
    details.ensName = ['Use letras minúsculas, números, hífen ou ponto.'];
  if (Object.keys(details).length) throw validationError(details);
  return {
    kind: body.kind!,
    displayName: body.displayName!.trim(),
    walletAlias: body.walletAlias!.trim(),
    network: body.network!,
    profileName: body.profileName!.trim(),
    address: body.address!.trim(),
    secondaryAddress: body.secondaryAddress?.trim() || null,
    walletType: body.walletType!,
    referralCode: body.referralCode!.trim(),
    email: body.email!.trim().toLowerCase(),
    ensName: body
      .ensName!.trim()
      .toLowerCase()
      .replace(/\.eth$/, ''),
  };
}

export function createWallet(userId: string, body: Partial<WalletInput>): Wallet {
  const input = validateInput(body);
  const existing = Object.values(getDb().wallets).find(
    (wallet) => wallet.userId === userId && wallet.kind === input.kind,
  );
  if (existing) {
    throw new MockApiError(
      'conflict',
      `Você já tem uma carteira ${input.kind === 'primary' ? 'principal' : 'secundária'}. Edite a existente.`,
    );
  }
  const now = new Date().toISOString();
  const wallet: Wallet & { userId: string } = {
    ...input,
    id: `wal_${crypto.randomUUID().slice(0, 8)}`,
    connection: 'disconnected',
    createdAt: now,
    updatedAt: now,
    userId,
  };
  mutateDb((db) => {
    db.wallets[wallet.id] = wallet;
  });
  return strip(wallet);
}

function getOwned(userId: string, walletId: string): Wallet & { userId: string } {
  const wallet = getDb().wallets[walletId];
  if (!wallet) throw notFound('Carteira não encontrada.');
  if (wallet.userId !== userId)
    throw new MockApiError('forbidden', 'Esta carteira pertence a outro usuário.');
  return wallet;
}

export function updateWallet(userId: string, walletId: string, body: Partial<WalletInput>): Wallet {
  const wallet = getOwned(userId, walletId);
  const input = validateInput({ ...wallet, ...body });
  if (input.kind !== wallet.kind) {
    const clash = Object.values(getDb().wallets).find(
      (item) => item.userId === userId && item.kind === input.kind && item.id !== walletId,
    );
    if (clash) throw new MockApiError('conflict', 'Já existe outra carteira deste tipo.');
  }
  return mutateDb(() => {
    Object.assign(wallet, input, { updatedAt: new Date().toISOString() });
    return strip(wallet);
  });
}

/** Simula a conexão da extensão de carteira: sucesso ou recusa, conforme o cenário. */
export function connectWallet(
  userId: string,
  walletId: string,
  body: WalletConnectRequest,
): WalletConnectResponse {
  const wallet = getOwned(userId, walletId);
  if (!body.network || !NETWORKS[body.network])
    throw validationError({ network: ['Selecione uma rede válida.'] });
  if (getScenario().walletConnect === 'rejected') {
    mutateDb(() => {
      wallet.connection = 'rejected';
    });
    throw new MockApiError(
      'wallet_rejected',
      'A conexão foi recusada na carteira. Tente novamente ou use outra carteira.',
    );
  }
  mutateDb(() => {
    wallet.connection = 'connected';
    wallet.network = body.network;
    wallet.updatedAt = new Date().toISOString();
  });
  return { walletId, status: 'connected', address: wallet.address, network: body.network };
}

export function disconnectWallet(userId: string, walletId: string): Wallet {
  const wallet = getOwned(userId, walletId);
  return mutateDb(() => {
    wallet.connection = 'disconnected';
    return strip(wallet);
  });
}
