import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileApi, walletsApi } from '@/api';
import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  Wallet,
  WalletInput,
} from '@/contracts';
import { sessionStore, useCurrentUser } from '@/features/auth/session-store';

export const accountKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  wallets: (userId: string) => ['wallets', userId] as const,
};

export const profileOptions = (userId: string) =>
  queryOptions({
    queryKey: accountKeys.profile(userId),
    queryFn: profileApi.get,
    staleTime: 60_000,
  });

export const walletsOptions = (userId: string) =>
  queryOptions({
    queryKey: accountKeys.wallets(userId),
    queryFn: walletsApi.list,
    staleTime: 60_000,
  });

const ANONYMOUS = 'anonymous';

function useUserId(): string {
  return useCurrentUser()?.id ?? ANONYMOUS;
}

/** Sem sessão a consulta fica desligada: nada de requisição sem token (e 401 inútil). */
export function useProfile() {
  const userId = useUserId();
  return useQuery({ ...profileOptions(userId), enabled: userId !== ANONYMOUS });
}

export function useWallets() {
  const userId = useUserId();
  return useQuery({ ...walletsOptions(userId), enabled: userId !== ANONYMOUS });
}

function syncSessionUser(profile: Profile): void {
  const user = sessionStore.getUser();
  if (!user) return;
  sessionStore.updateUser({
    ...user,
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    walletAlias: profile.walletAlias,
    avatarUrl: profile.avatarUrl,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const key = accountKeys.profile(useUserId());
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => profileApi.update(body),
    onSuccess: (profile) => {
      queryClient.setQueryData<Profile>(key, profile);
      syncSessionUser(profile);
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const key = accountKeys.profile(useUserId());
  return useMutation({
    mutationFn: (body: UpdateAvatarRequest | null) =>
      body ? profileApi.updateAvatar(body) : profileApi.removeAvatar(),
    onSuccess: (profile) => {
      queryClient.setQueryData<Profile>(key, profile);
      syncSessionUser(profile);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => profileApi.changePassword(body),
  });
}

export function useSaveWallet() {
  const queryClient = useQueryClient();
  const key = accountKeys.wallets(useUserId());
  return useMutation({
    mutationFn: ({ walletId, input }: { walletId: string | null; input: WalletInput }) =>
      walletId ? walletsApi.update(walletId, input) : walletsApi.create(input),
    onSuccess: (wallet) => {
      queryClient.setQueryData<Wallet[]>(key, (current = []) => {
        const others = current.filter((item) => item.id !== wallet.id);
        return [...others, wallet].sort(
          (a, b) => (a.kind === 'primary' ? -1 : 1) - (b.kind === 'primary' ? -1 : 1),
        );
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
