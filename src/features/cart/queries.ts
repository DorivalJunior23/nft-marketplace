import { queryOptions, useQuery } from '@tanstack/react-query';

import { cartApi } from '@/api';

import { useSessionState } from '../auth/session-store';

/** O carrinho é isolado por usuário na chave: visitante e cada conta têm caches distintos. */
export const cartKeys = {
  all: ['cart'] as const,
  current: (ownerId: string) => [...cartKeys.all, ownerId] as const,
};

export function useCartOwnerId(): string {
  const { session } = useSessionState();
  return session ? `user:${session.user.id}` : 'guest';
}

export const cartOptions = (ownerId: string) =>
  queryOptions({
    queryKey: cartKeys.current(ownerId),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    staleTime: 15_000,
  });

export function useCart() {
  return useQuery(cartOptions(useCartOwnerId()));
}

export function useCartCount(): number {
  const { data } = useCart();
  return data?.totalQuantity ?? 0;
}
