import { http } from 'msw';

import type { AddCartItemRequest, QuoteRequest, UpdateCartItemRequest } from '@/contracts';

import { getDb } from '../db/store';
import { addItem, getCart, removeItem, updateItem, type CartContext } from '../services/cart';
import { buildQuote } from '../services/quote';
import { api, guestCartIdFrom, json, readJson, withScenario } from './shared';

/** Carrinho do usuário autenticado, ou do visitante identificado pelo header X-Guest-Cart. */
function cartContext(request: Request): CartContext {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token ? getDb().sessions[token] : undefined;
  const valid = session && Date.parse(session.expiresAt) > Date.now();
  return { userId: valid ? session.userId : null, guestCartId: guestCartIdFrom(request) };
}

export const cartHandlers = [
  http.get(
    api('/cart'),
    withScenario(({ request }) => json(getCart(cartContext(request)))),
  ),
  http.post(
    api('/cart/items'),
    withScenario(async ({ request }) =>
      json(addItem(cartContext(request), await readJson<AddCartItemRequest>(request)), {
        status: 201,
      }),
    ),
  ),
  http.patch(
    api('/cart/items/:lineId'),
    withScenario(async ({ request, params }) => {
      const body = await readJson<UpdateCartItemRequest>(request);
      return json(updateItem(cartContext(request), String(params.lineId), Number(body.quantity)));
    }),
  ),
  http.delete(
    api('/cart/items/:lineId'),
    withScenario(({ request, params }) =>
      json(removeItem(cartContext(request), String(params.lineId))),
    ),
  ),
  http.post(
    api('/quote'),
    withScenario(async ({ request }) => {
      const context =
        new URL(request.url).searchParams.get('context') === 'checkout' ? 'checkout' : 'cart';
      return json(buildQuote(await readJson<QuoteRequest>(request), { context }));
    }),
  ),
];
