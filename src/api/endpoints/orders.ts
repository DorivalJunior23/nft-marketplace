import type { CreateOrderRequest, Order } from '@/contracts';

import { http, type RequestConfig } from '../http';

export const ordersApi = {
  /** Idempotente: a mesma chave com o mesmo conteúdo devolve o mesmo pedido. */
  create: async (
    body: CreateOrderRequest,
    idempotencyKey: string,
    config?: RequestConfig,
  ): Promise<Order> =>
    (
      await http.post<Order>('/orders', body, {
        ...config,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  get: async (orderId: string, config?: RequestConfig): Promise<Order> =>
    (await http.get<Order>(`/orders/${encodeURIComponent(orderId)}`, config)).data,
  list: async (): Promise<Order[]> => (await http.get<{ items: Order[] }>('/orders')).data.items,
};
