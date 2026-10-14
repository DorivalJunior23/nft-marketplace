import type { AddCartItemRequest, Cart, Quote, QuoteRequest } from '@/contracts';

import { http, type RequestConfig } from '../http';

export const cartApi = {
  get: async (config?: RequestConfig): Promise<Cart> =>
    (await http.get<Cart>('/cart', config)).data,
  addItem: async (body: AddCartItemRequest): Promise<Cart> =>
    (await http.post<Cart>('/cart/items', body)).data,
  updateItem: async (lineId: string, quantity: number): Promise<Cart> =>
    (await http.patch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, { quantity })).data,
  removeItem: async (lineId: string): Promise<Cart> =>
    (await http.delete<Cart>(`/cart/items/${encodeURIComponent(lineId)}`)).data,
  quote: async (
    body: QuoteRequest,
    context: 'cart' | 'checkout',
    config?: RequestConfig,
  ): Promise<Quote> =>
    (await http.post<Quote>('/quote', body, { ...config, params: { context } })).data,
};
