import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/contracts';

import { getDb, hashPassword, mutateDb } from '../db/store';
import { MockApiError, validationError } from '../errors';
import {
  EMAIL_PATTERN,
  getUserById,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
  validatePassword,
} from './auth';

const ENS_PATTERN = /^(?=.{3,40}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const MAX_AVATAR_BYTES = 1_500_000;

export function getProfile(userId: string): Profile {
  const user = getUserById(userId);
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletAlias: user.walletAlias,
    avatarUrl: user.avatarUrl,
  };
}

export function updateProfile(userId: string, body: UpdateProfileRequest): Profile {
  const details: Record<string, string[]> = {};
  const displayName = body.displayName?.trim();
  const username = body.username?.trim().toLowerCase();
  const email = body.email?.trim().toLowerCase();
  const ensName =
    body.ensName === undefined
      ? undefined
      : (body.ensName ?? '')
          .trim()
          .toLowerCase()
          .replace(/\.eth$/, '');
  const walletAlias = body.walletAlias === undefined ? undefined : (body.walletAlias ?? '').trim();

  if (displayName !== undefined && (displayName.length < 2 || displayName.length > 40))
    details.displayName = ['Use de 2 a 40 caracteres.'];
  if (username !== undefined) {
    if (!USERNAME_PATTERN.test(username))
      details.username = [
        'Use de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.',
      ];
    else if (RESERVED_USERNAMES.has(username))
      details.username = ['Este nome de usuário é reservado.'];
  }
  if (email !== undefined && !EMAIL_PATTERN.test(email))
    details.email = ['Informe um e-mail válido.'];
  if (ensName && !ENS_PATTERN.test(ensName))
    details.ensName = ['Use de 3 a 40 caracteres: letras minúsculas, números, hífen ou ponto.'];
  if (walletAlias !== undefined && walletAlias.length > 40)
    details.walletAlias = ['Use no máximo 40 caracteres.'];
  if (Object.keys(details).length) throw validationError(details);

  const db = getDb();
  if (username && db.users.some((user) => user.id !== userId && user.username === username)) {
    throw new MockApiError('conflict', 'Este nome de usuário já está em uso.', {
      username: ['Este nome de usuário já está em uso.'],
    });
  }
  if (email && db.users.some((user) => user.id !== userId && user.email === email)) {
    throw new MockApiError('conflict', 'Já existe uma conta com este e-mail.', {
      email: ['Já existe uma conta com este e-mail.'],
    });
  }

  mutateDb(() => {
    const user = getUserById(userId);
    if (displayName !== undefined) user.displayName = displayName;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (ensName !== undefined) user.ensName = ensName || null;
    if (walletAlias !== undefined) user.walletAlias = walletAlias || null;
  });
  return getProfile(userId);
}

export function updateAvatar(userId: string, body: UpdateAvatarRequest): Profile {
  const dataUrl = body.dataUrl ?? '';
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(dataUrl)) {
    throw validationError({ avatar: ['Envie uma imagem PNG, JPEG, WebP ou GIF.'] });
  }
  if (dataUrl.length > MAX_AVATAR_BYTES)
    throw validationError({ avatar: ['A imagem precisa ter no máximo 1 MB.'] });
  mutateDb(() => {
    getUserById(userId).avatarUrl = dataUrl;
  });
  return getProfile(userId);
}

export function removeAvatar(userId: string): Profile {
  mutateDb(() => {
    getUserById(userId).avatarUrl = null;
  });
  return getProfile(userId);
}

export async function changePassword(userId: string, body: ChangePasswordRequest): Promise<void> {
  const user = getUserById(userId);
  const details: Record<string, string[]> = {};
  if (!body.currentPassword) details.currentPassword = ['Informe a senha atual.'];
  Object.assign(details, validatePassword(body.newPassword ?? '', 'newPassword'));
  if (body.newPassword !== body.newPasswordConfirmation)
    details.newPasswordConfirmation = ['As senhas não coincidem.'];
  if (Object.keys(details).length) throw validationError(details);
  const currentHash = await hashPassword(body.currentPassword, user.passwordSalt);
  if (currentHash !== user.passwordHash)
    throw validationError({ currentPassword: ['Senha atual incorreta.'] });
  if (body.newPassword === body.currentPassword)
    throw validationError({ newPassword: ['A nova senha precisa ser diferente da atual.'] });
  const newHash = await hashPassword(body.newPassword, user.passwordSalt);
  mutateDb(() => {
    getUserById(userId).passwordHash = newHash;
  });
}
