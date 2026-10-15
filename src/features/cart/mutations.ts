import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

import { cartApi } from '@/api';
import type { AddCartItemRequest, Cart } from '@/contracts';
import { errorMessage } from '@/lib/error-message';

import { cartKeys, useCartOwnerId } from './queries';

function useCartMutationBase() {
  const queryClient = useQueryClient();
  const ownerId = useCartOwnerId();
  const key = cartKeys.current(ownerId);
  return { queryClient, key };
}

export function useAddToCart() {
  const { queryClient, key } = useCartMutationBase();
  return useMutation({
    mutationFn: (body: AddCartItemRequest) => cartApi.addItem(body),
    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(key, cart);
    },
    onError: (error) => toast.error(errorMessage(error, 'Não foi possível adicionar ao carrinho.')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/**
 * Quantidade com atualização otimista: o resumo muda na hora e volta ao snapshot se a API
 * recusar (disponibilidade, limite por pedido ou falha transitória).
 */
export function useUpdateCartItem() {
  const { queryClient, key } = useCartMutationBase();
  return useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      cartApi.updateItem(lineId, quantity),
    onMutate: async ({ lineId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous) {
        queryClient.setQueryData<Cart>(key, {
          ...previous,
          items: previous.items
            .map((item) => (item.id === lineId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        });
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error, 'Não foi possível atualizar a quantidade.'));
    },
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useRemoveCartItem() {
  const { queryClient, key } = useCartMutationBase();
  return useMutation({
    mutationFn: (lineId: string) => cartApi.removeItem(lineId),
    onMutate: async (lineId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous)
        queryClient.setQueryData<Cart>(key, {
          ...previous,
          items: previous.items.filter((item) => item.id !== lineId),
        });
      return { previous };
    },
    onError: (error, _lineId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error, 'Não foi possível remover o item.'));
    },
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
