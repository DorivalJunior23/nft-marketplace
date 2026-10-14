import type { FeaturedResponse, Nft, NftListQuery, NftListResponse, NftSummary } from '@/contracts';

import { http, type RequestConfig } from '../http';

function toSearchParams(query: NftListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  query.collection?.forEach((id) => params.append('collection', id));
  query.network?.forEach((id) => params.append('network', id));
  if (query.priceMin) params.set('priceMin', query.priceMin);
  if (query.priceMax) params.set('priceMax', query.priceMax);
  if (query.sort) params.set('sort', query.sort);
  if (query.tab && query.tab !== 'all') params.set('tab', query.tab);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  return params;
}

export const nftsApi = {
  list: async (query: NftListQuery, config?: RequestConfig): Promise<NftListResponse> =>
    (await http.get<NftListResponse>('/nfts', { ...config, params: toSearchParams(query) })).data,
  featured: async (config?: RequestConfig): Promise<FeaturedResponse> =>
    (await http.get<FeaturedResponse>('/nfts/featured', config)).data,
  get: async (id: string, config?: RequestConfig): Promise<Nft> =>
    (await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, config)).data,
  related: async (id: string, config?: RequestConfig): Promise<NftSummary[]> =>
    (await http.get<{ items: NftSummary[] }>(`/nfts/${encodeURIComponent(id)}/related`, config))
      .data.items,
};
