import type { Nft, Order, Wallet } from '@/contracts';

import {
  createNftFixtures,
  createWalletFixtures,
  FIXTURE_USERS,
  WALLET_OWNERS,
  type UserRecord,
} from './fixtures';

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface CartLineRecord {
  id: string;
  nftId: string;
  editionId: Nft['editions'][number]['id'];
  quantity: number;
}

export interface CartRecord {
  id: string;
  ownerType: 'guest' | 'user';
  ownerId: string;
  items: CartLineRecord[];
  version: number;
  updatedAt: string;
}

export interface IdempotencyRecord {
  key: string;
  userId: string;
  payloadHash: string;
  orderId: string;
}

export interface MockDb {
  schemaVersion: number;
  nfts: Nft[];
  users: UserRecord[];
  sessions: Record<string, SessionRecord>;
  favorites: Record<string, string[]>;
  carts: Record<string, CartRecord>;
  wallets: Record<string, Wallet & { userId: string }>;
  orders: Record<string, Order>;
  idempotency: Record<string, IdempotencyRecord>;
  seededAt: string;
}

const SCHEMA_VERSION = 1;
export const DB_STORAGE_KEY = 'kurio.mockdb.v1';

let db: MockDb | null = null;

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

export function createSalt(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

async function createFreshDb(): Promise<MockDb> {
  const users: UserRecord[] = [];
  for (const fixture of FIXTURE_USERS) {
    const passwordSalt = `salt_${fixture.id}`;
    users.push({
      id: fixture.id,
      email: fixture.email,
      username: fixture.username,
      displayName: fixture.displayName,
      avatarUrl: null,
      ensName: fixture.ensName,
      walletAlias: fixture.walletAlias,
      passwordHash: await hashPassword(fixture.password, passwordSalt),
      passwordSalt,
      createdAt: '2026-08-15T10:00:00.000Z',
    });
  }
  const wallets: MockDb['wallets'] = {};
  for (const wallet of createWalletFixtures()) {
    wallets[wallet.id] = { ...wallet, userId: WALLET_OWNERS[wallet.id] ?? 'usr_nova' };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createNftFixtures(),
    users,
    sessions: {},
    favorites: { usr_nova: ['sage-nomad-0009', 'golden-beat-0207'], usr_caio: [] },
    carts: {},
    wallets,
    orders: {},
    idempotency: {},
    seededAt: new Date().toISOString(),
  };
}

function readPersisted(): MockDb | null {
  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDb;
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function persistDb(): void {
  if (!db) return;
  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Sem armazenamento: o estado vive só em memória até o refresh.
  }
}

/** Carrega o banco persistido ou semeia um novo. Deve rodar antes do primeiro handler. */
export async function initDb(): Promise<MockDb> {
  db = readPersisted() ?? (await createFreshDb());
  persistDb();
  return db;
}

export function getDb(): MockDb {
  if (!db) throw new Error('Banco da simulação não inicializado. Chame initDb() antes.');
  return db;
}

/** Aplica uma mutação e persiste em seguida. */
export function mutateDb<T>(fn: (current: MockDb) => T): T {
  const result = fn(getDb());
  persistDb();
  return result;
}

/** Restaura integralmente o cenário conhecido (fixtures originais). */
export async function resetDb(): Promise<MockDb> {
  db = await createFreshDb();
  persistDb();
  return db;
}
