import {
  delay,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type JsonBodyType,
  type PathParams,
} from 'msw';

import type { ApiErrorBody } from '@/contracts';

import { MockApiError } from '../errors';
import { getScenario, scenarioLatency } from '../runtime';

export const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export function api(path: string): string {
  return `${API_BASE}${path}`;
}

type Resolver<
  Params extends PathParams = PathParams,
  Body extends DefaultBodyType = DefaultBodyType,
> = HttpResponseResolver<Params, Body>;

/**
 * Envolve um resolver com o comportamento do cenário ativo: falha de rede,
 * latência artificial e conversão de MockApiError em resposta HTTP.
 */
export function withScenario<
  Params extends PathParams = PathParams,
  Body extends DefaultBodyType = DefaultBodyType,
>(
  resolver: Resolver<Params, Body>,
  options: { skipLatency?: boolean } = {},
): Resolver<Params, Body> {
  return async (info) => {
    const scenario = getScenario();
    if (scenario.network === 'offline') return HttpResponse.error();
    if (!options.skipLatency) await delay(scenarioLatency());
    try {
      return await resolver(info);
    } catch (error) {
      if (error instanceof MockApiError)
        return HttpResponse.json(error.body, { status: error.status });
      const body: ApiErrorBody = { type: 'unknown', message: 'Erro inesperado na simulação.' };
      console.error('[mocks] erro não tratado', error);
      return HttpResponse.json(body, { status: 500 });
    }
  };
}

export function json<T extends JsonBodyType>(body: T, init?: ResponseInit) {
  return HttpResponse.json(body, init);
}

export function guestCartIdFrom(request: Request): string | null {
  return request.headers.get('x-guest-cart');
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MockApiError('validation_error', 'Corpo da requisição inválido.');
  }
}
