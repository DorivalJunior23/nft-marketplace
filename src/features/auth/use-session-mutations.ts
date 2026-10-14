import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/api';
import type { LoginRequest, RegisterRequest, Session } from '@/contracts';
import { guestCart } from '@/lib/guest-cart';
import { reconnectSocket } from '@/realtime/socket';

import { sessionStore } from './session-store';

/** Chaves privadas: nunca sobrevivem a uma troca de usuário. */
const PRIVATE_KEYS = [['cart'], ['favorites'], ['profile'], ['wallets'], ['orders']];

function startSession(queryClient: ReturnType<typeof useQueryClient>, session: Session): void {
  for (const key of PRIVATE_KEYS) queryClient.removeQueries({ queryKey: key });
  sessionStore.start(session);
  // O carrinho do visitante já foi mesclado no servidor; um novo id evita reaproveitá-lo.
  guestCart.rotate();
  reconnectSocket();
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<LoginRequest, 'guestCartId'>) =>
      authApi.login({ ...body, guestCartId: guestCart.peekId() ?? undefined }),
    onSuccess: (session) => startSession(queryClient, session),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<RegisterRequest, 'guestCartId'>) =>
      authApi.register({ ...body, guestCartId: guestCart.peekId() ?? undefined }),
    onSuccess: (session) => startSession(queryClient, session),
  });
}
