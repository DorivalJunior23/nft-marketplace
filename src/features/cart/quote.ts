import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { cartApi } from '@/api';
import type { Cart, QuoteLineInput } from '@/contracts';

const COUPON_KEY = 'kurio.coupon';
const listeners = new Set<() => void>();

function readCoupon(): string {
  try {
    return window.sessionStorage.getItem(COUPON_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Cupom digitado pelo usuário; sobrevive ao refresh na mesma aba e segue para o checkout. */
export const couponStore = {
  get: readCoupon,
  set(code: string): void {
    try {
      if (code) window.sessionStorage.setItem(COUPON_KEY, code);
      else window.sessionStorage.removeItem(COUPON_KEY);
    } catch {
      // ignorado
    }
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useCouponCode(): string {
  return useSyncExternalStore(couponStore.subscribe, couponStore.get, () => '');
}

export function cartToQuoteLines(cart: Cart | undefined): QuoteLineInput[] {
  return (cart?.items ?? []).map((item) => ({
    nftId: item.nftId,
    editionId: item.editionId,
    quantity: item.quantity,
  }));
}

/** A chave inclui itens, versões dos NFTs e cupom: qualquer mudança gera nova cotação. */
export const quoteOptions = (
  ownerId: string,
  cart: Cart | undefined,
  couponCode: string,
  context: 'cart' | 'checkout',
) =>
  queryOptions({
    queryKey: [
      'quote',
      ownerId,
      context,
      couponCode || null,
      (cart?.items ?? []).map(
        (item) => `${item.nftId}:${item.editionId}:${item.quantity}:${item.nft.version}`,
      ),
    ],
    queryFn: ({ signal }) =>
      cartApi.quote({ items: cartToQuoteLines(cart), couponCode: couponCode || null }, context, {
        signal,
      }),
    enabled: Boolean(cart && cart.items.length > 0),
    staleTime: 0,
    gcTime: 60_000,
  });

export function useQuote(
  ownerId: string,
  cart: Cart | undefined,
  couponCode: string,
  context: 'cart' | 'checkout',
) {
  return useQuery(quoteOptions(ownerId, cart, couponCode, context));
}
