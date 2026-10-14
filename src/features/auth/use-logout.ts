import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { authApi } from '@/api';
import { guestCart } from '@/lib/guest-cart';
import { reconnectSocket } from '@/realtime/socket';

import { sessionStore } from './session-store';

/**
 * Logout e troca de usuário: encerra a sessão na API, limpa todo o cache de dados
 * privados, renova o carrinho de visitante e reconecta o socket sem credenciais.
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
      guestCart.rotate();
      await queryClient.cancelQueries();
      queryClient.clear();
      reconnectSocket();
      await navigate({ to: '/' });
    },
  });
}
