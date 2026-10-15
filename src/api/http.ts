import type { AxiosError } from 'axios';
import axios, { type AxiosRequestConfig } from 'axios';

import type { ApiErrorBody, ApiErrorType } from '@/contracts';
import { sessionStore } from '@/features/auth/session-store';
import { guestCart } from '@/lib/guest-cart';

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 8000;

/** Erro normalizado: tudo que a UI precisa para decidir mensagem, retry e rollback. */
export class ApiClientError extends Error {
  readonly type: ApiErrorType;
  readonly status: number | null;
  readonly details: Record<string, string[]> | undefined;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;

  constructor(
    body: ApiErrorBody,
    status: number | null,
    options: { network?: boolean; timeout?: boolean } = {},
  ) {
    super(body.message);
    this.name = 'ApiClientError';
    this.type = body.type;
    this.status = status;
    this.details = body.details;
    this.isNetworkError = options.network ?? false;
    this.isTimeout = options.timeout ?? false;
  }

  /** Falhas transitórias (rede, timeout, 5xx) podem ser repetidas; 4xx não. */
  get isRetryable(): boolean {
    return this.isNetworkError || this.isTimeout || (this.status !== null && this.status >= 500);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

function toClientError(error: AxiosError<ApiErrorBody>): ApiClientError {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError(
      {
        type: 'timeout',
        message: 'A requisição demorou demais. Verifique sua conexão e tente novamente.',
      },
      null,
      { timeout: true },
    );
  }
  if (!error.response) {
    return new ApiClientError(
      {
        type: 'network_error',
        message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      },
      null,
      { network: true },
    );
  }
  const { status, data } = error.response;
  const body: ApiErrorBody =
    data && typeof data === 'object' && 'type' in data
      ? data
      : {
          type: status >= 500 ? 'transient_error' : 'unknown',
          message: 'Não foi possível concluir a operação.',
        };
  return new ApiClientError(body, status);
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = sessionStore.getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('X-Guest-Cart', guestCart.getId());
  return config;
});

/** Endpoints em que 401 significa credencial inválida, não sessão expirada. */
const PUBLIC_401_PATHS = ['/auth/login', '/auth/register'];

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const clientError = toClientError(error);
    const path = error.config?.url ?? '';
    // Só encerra a sessão se o 401 recusou o token atual: respostas atrasadas de uma sessão
    // anterior (ou sem token) não podem derrubar um login feito depois.
    const sentToken = String(error.config?.headers?.Authorization ?? '');
    const currentToken = sessionStore.getToken();
    if (
      clientError.isUnauthorized &&
      currentToken !== null &&
      sentToken === `Bearer ${currentToken}` &&
      !PUBLIC_401_PATHS.some((p) => path.endsWith(p))
    ) {
      sessionStore.end('expired');
    }
    return Promise.reject(clientError);
  },
);

export type RequestConfig = AxiosRequestConfig;
