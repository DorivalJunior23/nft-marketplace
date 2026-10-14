import { isApiClientError } from '@/api';

/** Mensagem legível para a UI a partir de qualquer erro (API normalizada ou genérico). */
export function errorMessage(
  error: unknown,
  fallback = 'Não foi possível carregar os dados.',
): string {
  if (isApiClientError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
