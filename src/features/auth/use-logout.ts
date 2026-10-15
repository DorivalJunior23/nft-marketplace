import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { authApi } from '@/api';
import { couponStore } from '@/features/cart/quote';
import { checkoutDraft, idempotencyStore } from '@/features/checkout/checkout-storage';
import { guestCart } from '@/lib/guest-cart';
import { reconnectSocket } from '@/realtime/socket';

import { sessionStore } from './session-store';

/**
 * Logout e troca de usuário: encerra a sessão na API, limpa todo o cache de dados
 * privados e o estado da aba (rascunho do checkout, chave de idempotência, cupom),
 * renova o carrinho de visitante e reconecta o socket sem credenciais.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // A sessão local é encerrada mesmo que a API falhe.
      }
    },
    onSettled: async () => {
      sessionStore.end('logout');
      checkoutDraft.clear();
      idempotencyStore.clear();
      couponStore.set('');
      guestCart.rotate();
      await queryClient.cancelQueries();
      queryClient.clear();
      reconnectSocket();
      await navigate({ to: '/' });
    },
  });
}
