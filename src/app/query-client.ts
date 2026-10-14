import { QueryClient } from '@tanstack/react-query';

import { isApiClientError } from '@/api/http';

/**
 * Política de cache (documentada em ARCHITECTURE.md):
 * - staleTime curto para listagens, que também recebem eventos em tempo real;
 * - retry só para falhas transitórias (rede, timeout, 5xx), nunca para 4xx;
 * - refetch ao reconectar para reconciliar com o REST depois de uma queda do socket.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (isApiClientError(error)) return error.isRetryable;
  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
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
