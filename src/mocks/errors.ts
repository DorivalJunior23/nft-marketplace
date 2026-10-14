import type { ApiErrorBody, ApiErrorType } from '@/contracts';

const STATUS_BY_TYPE: Record<ApiErrorType, number> = {
  validation_error: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  availability_conflict: 409,
  quote_outdated: 409,
  idempotency_conflict: 409,
  wallet_rejected: 409,
  transient_error: 503,
  network_error: 0,
  timeout: 0,
  unknown: 500,
};

/** Erro de domínio da simulação; o handler converte em resposta HTTP num único lugar. */
export class MockApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(type: ApiErrorType, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'MockApiError';
    this.status = STATUS_BY_TYPE[type];
    this.body = details ? { type, message, details } : { type, message };
  }
}

export function validationError(
  details: Record<string, string[]>,
  message = 'Revise os campos destacados.',
) {
  return new MockApiError('validation_error', message, details);
}

export function notFound(message: string) {
  return new MockApiError('not_found', message);
}

export function unauthorized(message = 'Sua sessão expirou. Entre novamente para continuar.') {
  return new MockApiError('unauthorized', message);
}
