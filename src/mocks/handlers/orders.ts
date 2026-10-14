import { delay, http } from 'msw';

import type { CreateOrderRequest } from '@/contracts';

import { consumeOnce, getScenario } from '../runtime';
import { authenticate } from '../services/auth';
import { createOrder, getOrder, listOrders } from '../services/orders';
import { api, json, readJson, withScenario } from './shared';

export const ordersHandlers = [
  http.post(
    api('/orders'),
    withScenario(async ({ request }) => {
      const { user } = authenticate(request);
      const key = request.headers.get('idempotency-key');
      const body = await readJson<CreateOrderRequest>(request);
      const result = createOrder(user.id, body, key);
      // Cenário "order-timeout": o pedido é criado, mas a primeira resposta nunca chega.
      if (
        !result.replayed &&
        getScenario().orderCreate === 'timeout-once' &&
        consumeOnce('order-timeout')
      ) {
        await delay('infinite');
      }
      return json(result.order, { status: result.replayed ? 200 : 201 });
    }),
  ),
  http.get(
    api('/orders'),
    withScenario(({ request }) => json({ items: listOrders(authenticate(request).user.id) })),
  ),
  http.get(
    api('/orders/:orderId'),
    withScenario(({ request, params }) =>
      json(getOrder(authenticate(request).user.id, String(params.orderId))),
    ),
  ),
];
