import type { LoginRequest, RegisterRequest, Session, User } from '@/contracts';

import type { UserRecord } from '../db/fixtures';
import { createSalt, getDb, hashPassword, mutateDb, type SessionRecord } from '../db/store';
import { MockApiError, unauthorized, validationError } from '../errors';
import { getScenario } from '../runtime';
import { mergeGuestCart } from './cart';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;
export const RESERVED_USERNAMES = new Set(['admin', 'kurio', 'suporte', 'root']);

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    username: record.username,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    ensName: record.ensName,
    walletAlias: record.walletAlias,
    createdAt: record.createdAt,
  };
}

export function validatePassword(password: string, field = 'password'): Record<string, string[]> {
  const errors: string[] = [];
  if (password.length < 8) errors.push('A senha precisa ter pelo menos 8 caracteres.');
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    errors.push('Use letras e números na senha.');
  return errors.length ? { [field]: errors } : {};
}

function createSession(userId: string): SessionRecord {
  const ttl = getScenario().sessionTtlMs;
  const session: SessionRecord = {
    token: `sess_${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(Date.now() + ttl).toISOString(),
  };
  mutateDb((db) => {
    db.sessions[session.token] = session;
  });
  return session;
}

function toSessionResponse(session: SessionRecord, user: UserRecord): Session {
  return { token: session.token, expiresAt: session.expiresAt, user: toUser(user) };
}

export async function register(body: RegisterRequest): Promise<Session> {
  const username = (body.username ?? '').trim().toLowerCase();
  const email = (body.email ?? '').trim().toLowerCase();
  const details: Record<string, string[]> = {};
  if (!USERNAME_PATTERN.test(username))
    details.username = [
      'Use de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.',
    ];
  else if (RESERVED_USERNAMES.has(username))
    details.username = ['Este nome de usuário é reservado.'];
  if (!EMAIL_PATTERN.test(email)) details.email = ['Informe um e-mail válido.'];
  Object.assign(details, validatePassword(body.password ?? ''));
  if (body.password !== body.passwordConfirmation)
    details.passwordConfirmation = ['As senhas não coincidem.'];
  if (Object.keys(details).length) throw validationError(details);

  const db = getDb();
  if (db.users.some((user) => user.email === email)) {
    throw new MockApiError('conflict', 'Já existe uma conta com este e-mail.', {
      email: ['Já existe uma conta com este e-mail.'],
    });
  }
  if (db.users.some((user) => user.username === username)) {
    throw new MockApiError('conflict', 'Este nome de usuário já está em uso.', {
      username: ['Este nome de usuário já está em uso.'],
    });
  }

  const passwordSalt = createSalt();
  const record: UserRecord = {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    email,
    username,
    displayName: username,
    avatarUrl: null,
    ensName: null,
    walletAlias: null,
    passwordHash: await hashPassword(body.password, passwordSalt),
    passwordSalt,
    createdAt: new Date().toISOString(),
  };
  mutateDb((current) => {
    current.users.push(record);
    current.favorites[record.id] = [];
  });
  if (body.guestCartId) mergeGuestCart(body.guestCartId, record.id);
  return toSessionResponse(createSession(record.id), record);
}

export async function login(body: LoginRequest): Promise<Session> {
  const email = (body.email ?? '').trim().toLowerCase();
  const details: Record<string, string[]> = {};
  if (!EMAIL_PATTERN.test(email)) details.email = ['Informe um e-mail válido.'];
  if (!body.password) details.password = ['Informe sua senha.'];
  if (Object.keys(details).length) throw validationError(details);

  const user = getDb().users.find((item) => item.email === email);
  const hash = user ? await hashPassword(body.password, user.passwordSalt) : null;
  if (!user || hash !== user.passwordHash) {
    throw new MockApiError('unauthorized', 'E-mail ou senha inválidos.');
  }
  if (body.guestCartId) mergeGuestCart(body.guestCartId, user.id);
  return toSessionResponse(createSession(user.id), user);
}

export function logout(token: string | null): void {
  if (!token) return;
  mutateDb((db) => {
    delete db.sessions[token];
  });
}

export function getUserById(userId: string): UserRecord {
  const user = getDb().users.find((item) => item.id === userId);
  if (!user) throw unauthorized();
  return user;
}

/** Resolve a sessão do header Authorization; lança 401 se ausente, inválida ou expirada. */
export function authenticate(request: Request): { user: UserRecord; session: SessionRecord } {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized('Entre na sua conta para continuar.');
  const session = getDb().sessions[token];
  if (!session) throw unauthorized();
  if (Date.parse(session.expiresAt) <= Date.now()) {
    logout(token);
    throw unauthorized();
  }
  return { user: getUserById(session.userId), session };
}

export function getSession(request: Request): Session {
  const { user, session } = authenticate(request);
  return toSessionResponse(session, user);
}

/** Força a expiração de todas as sessões (usado pelos cenários e testes). */
export function expireAllSessions(): void {
  mutateDb((db) => {
    db.sessions = {};
  });
}
