import { http } from 'msw';

import type { CollectionId, NetworkId, NftListQuery, NftSort, NftTab } from '@/contracts';

import { MockApiError } from '../errors';
import { getScenario } from '../runtime';
import { getFeatured, getNft, listNfts, relatedNfts } from '../services/catalog';
import { api, json, withScenario } from './shared';

function parseList<T extends string>(params: URLSearchParams, key: string): T[] | undefined {
  const values = params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .filter(Boolean) as T[];
  return values.length ? values : undefined;
}

function parseQuery(url: URL): NftListQuery {
  const params = url.searchParams;
  const page = Number(params.get('page') ?? '1');
  return {
    q: params.get('q') ?? undefined,
    collection: parseList<CollectionId>(params, 'collection'),
    network: parseList<NetworkId>(params, 'network'),
    priceMin: params.get('priceMin') ?? undefined,
    priceMax: params.get('priceMax') ?? undefined,
    sort: (params.get('sort') as NftSort | null) ?? undefined,
    tab: (params.get('tab') as NftTab | null) ?? undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function assertCatalogAvailable(): void {
  if (getScenario().catalog === 'server-error') {
    throw new MockApiError(
      'transient_error',
      'O catálogo está temporariamente indisponível. Tente novamente em instantes.',
    );
  }
}

export const catalogHandlers = [
  http.get(
    api('/nfts'),
    withScenario(({ request }) => {
      assertCatalogAvailable();
      return json(listNfts(parseQuery(new URL(request.url))));
    }),
  ),
  http.get(
    api('/nfts/featured'),
    withScenario(() => {
      assertCatalogAvailable();
      return json(getFeatured());
    }),
  ),
  http.get(
    api('/nfts/:id'),
    withScenario(({ params }) => {
      assertCatalogAvailable();
      return json(getNft(String(params.id)));
    }),
  ),
  http.get(
    api('/nfts/:id/related'),
    withScenario(({ params }) => json({ items: relatedNfts(getNft(String(params.id))) })),
  ),
];
