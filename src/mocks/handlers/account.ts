import { http } from 'msw';

import type {
  ChangePasswordRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  WalletConnectRequest,
  WalletInput,
} from '@/contracts';

import { authenticate } from '../services/auth';
import {
  changePassword,
  getProfile,
  removeAvatar,
  updateAvatar,
  updateProfile,
} from '../services/profile';
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  listWallets,
  updateWallet,
} from '../services/wallets';
import { api, json, readJson, withScenario } from './shared';

export const accountHandlers = [
  http.get(
    api('/profile'),
    withScenario(({ request }) => json(getProfile(authenticate(request).user.id))),
  ),
  http.patch(
    api('/profile'),
    withScenario(async ({ request }) =>
      json(
        updateProfile(authenticate(request).user.id, await readJson<UpdateProfileRequest>(request)),
      ),
    ),
  ),
  http.put(
    api('/profile/avatar'),
    withScenario(async ({ request }) =>
      json(
        updateAvatar(authenticate(request).user.id, await readJson<UpdateAvatarRequest>(request)),
      ),
    ),
  ),
  http.delete(
    api('/profile/avatar'),
    withScenario(({ request }) => json(removeAvatar(authenticate(request).user.id))),
  ),
  http.post(
    api('/profile/password'),
    withScenario(async ({ request }) => {
      await changePassword(
        authenticate(request).user.id,
        await readJson<ChangePasswordRequest>(request),
      );
      return new Response(null, { status: 204 });
    }),
  ),
  http.get(
    api('/wallets'),
    withScenario(({ request }) => json({ items: listWallets(authenticate(request).user.id) })),
  ),
  http.post(
    api('/wallets'),
    withScenario(async ({ request }) =>
      json(
        createWallet(authenticate(request).user.id, await readJson<Partial<WalletInput>>(request)),
        { status: 201 },
      ),
    ),
  ),
  http.put(
    api('/wallets/:walletId'),
    withScenario(async ({ request, params }) =>
      json(
        updateWallet(
          authenticate(request).user.id,
          String(params.walletId),
          await readJson<Partial<WalletInput>>(request),
        ),
      ),
    ),
  ),
  http.post(
    api('/wallets/:walletId/connect'),
    withScenario(async ({ request, params }) =>
      json(
        connectWallet(
          authenticate(request).user.id,
          String(params.walletId),
          await readJson<WalletConnectRequest>(request),
        ),
      ),
    ),
  ),
  http.post(
    api('/wallets/:walletId/disconnect'),
    withScenario(({ request, params }) =>
      json(disconnectWallet(authenticate(request).user.id, String(params.walletId))),
    ),
  ),
];
