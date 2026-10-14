import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  Wallet,
  WalletConnectRequest,
  WalletConnectResponse,
  WalletInput,
} from '@/contracts';

import { http } from '../http';

export const profileApi = {
  get: async (): Promise<Profile> => (await http.get<Profile>('/profile')).data,
  update: async (body: UpdateProfileRequest): Promise<Profile> =>
    (await http.patch<Profile>('/profile', body)).data,
  updateAvatar: async (body: UpdateAvatarRequest): Promise<Profile> =>
    (await http.put<Profile>('/profile/avatar', body)).data,
  removeAvatar: async (): Promise<Profile> => (await http.delete<Profile>('/profile/avatar')).data,
  changePassword: async (body: ChangePasswordRequest): Promise<void> => {
    await http.post('/profile/password', body);
  },
};

export const walletsApi = {
  list: async (): Promise<Wallet[]> => (await http.get<{ items: Wallet[] }>('/wallets')).data.items,
  create: async (body: WalletInput): Promise<Wallet> =>
    (await http.post<Wallet>('/wallets', body)).data,
  update: async (walletId: string, body: Partial<WalletInput>): Promise<Wallet> =>
    (await http.put<Wallet>(`/wallets/${encodeURIComponent(walletId)}`, body)).data,
  connect: async (walletId: string, body: WalletConnectRequest): Promise<WalletConnectResponse> =>
    (
      await http.post<WalletConnectResponse>(
        `/wallets/${encodeURIComponent(walletId)}/connect`,
        body,
      )
    ).data,
  disconnect: async (walletId: string): Promise<Wallet> =>
    (await http.post<Wallet>(`/wallets/${encodeURIComponent(walletId)}/disconnect`)).data,
};
