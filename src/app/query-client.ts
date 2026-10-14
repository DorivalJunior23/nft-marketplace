import { QueryClient } from '@tanstack/react-query';

/**
 * Política de cache (documentada em ARCHITECTURE.md):
 * - staleTime curto para listagens, que também recebem eventos em tempo real;
 * - sem retry em erros 4xx (decidido no cliente Axios), 2 tentativas em falhas transitórias;
 * - refetch ao reconectar para reconciliar com o REST depois de uma queda do socket.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
