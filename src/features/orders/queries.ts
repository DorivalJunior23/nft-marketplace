import { queryOptions, useQuery } from '@tanstack/react-query';

import { ordersApi } from '@/api';
import type { Order } from '@/contracts';
import { useCurrentUser } from '@/features/auth/session-store';

export const orderKeys = {
  all: ['orders'] as const,
  list: (userId: string) => ['orders', 'list', userId] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
};

/**
 * Pedido pendente é consultado periodicamente além do socket: garante recuperação após refresh
 * ou reconexão mesmo que o evento order.updated tenha sido perdido. Estados terminais param de consultar.
 */
export const orderDetailOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, { signal }),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
    staleTime: 0,
  });

export const ordersListOptions = (userId: string) =>
  queryOptions({ queryKey: orderKeys.list(userId), queryFn: ordersApi.list, staleTime: 30_000 });

export function useOrder(orderId: string) {
  return useQuery(orderDetailOptions(orderId));
}

export function useOrders() {
  const user = useCurrentUser();
  return useQuery(ordersListOptions(user?.id ?? 'anonymous'));
}

export function isTerminal(order: Order | undefined): boolean {
  return order?.status === 'confirmed' || order?.status === 'declined';
}
