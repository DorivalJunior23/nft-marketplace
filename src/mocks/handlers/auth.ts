import { http } from 'msw';

import type { LoginRequest, RegisterRequest } from '@/contracts';

import { authenticate, getSession, login, logout, register } from '../services/auth';
import { api, json, readJson, withScenario } from './shared';

export const authHandlers = [
  http.post(
    api('/auth/register'),
    withScenario(async ({ request }) =>
      json(await register(await readJson<RegisterRequest>(request)), { status: 201 }),
    ),
  ),
  http.post(
    api('/auth/login'),
    withScenario(async ({ request }) => json(await login(await readJson<LoginRequest>(request)))),
  ),
  http.get(
    api('/auth/session'),
    withScenario(({ request }) => json(getSession(request))),
  ),
  http.post(
    api('/auth/logout'),
    withScenario(({ request }) => {
      const header = request.headers.get('authorization') ?? '';
      logout(header.startsWith('Bearer ') ? header.slice(7) : null);
      return new Response(null, { status: 204 });
    }),
  ),
  http.get(
    api('/me'),
    withScenario(({ request }) => json(authenticate(request).user)),
  ),
];
