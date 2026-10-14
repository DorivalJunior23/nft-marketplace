import { z } from 'zod';

import type { CollectionId, NetworkId, NftListQuery, NftSort, NftTab } from '@/contracts';

const COLLECTION_IDS = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const;
const NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const;
const SORTS = ['recent', 'price-asc', 'price-desc', 'popular'] as const;
const TABS = ['all', 'new', 'trending'] as const;

const list = <T extends string>(values: readonly T[]) =>
  z.preprocess(
    (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value) return value.split(',');
      return undefined;
    },
    z.array(z.enum(values as unknown as [T, ...T[]])).optional(),
  );

const price = z
  .string()
  .regex(/^\d+(\.\d+)?$/)
  .optional()
  .catch(undefined);

/** Estado do catálogo na URL: busca, filtros combináveis, ordenação, aba e página. */
export const catalogSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  collection: list<CollectionId>(COLLECTION_IDS).catch(undefined),
  network: list<NetworkId>(NETWORK_IDS).catch(undefined),
  priceMin: price,
  priceMax: price,
  sort: z.enum(SORTS).optional().catch(undefined),
  tab: z.enum(TABS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export function toListQuery(search: CatalogSearch): NftListQuery {
  return {
    q: search.q,
    collection: search.collection,
    network: search.network,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    sort: (search.sort ?? 'recent') as NftSort,
    tab: (search.tab ?? 'all') as NftTab,
    page: search.page ?? 1,
  };
}

/** Qualquer mudança de filtro reinicia a paginação. */
export function withFilterChange(
  search: CatalogSearch,
  patch: Partial<CatalogSearch>,
): CatalogSearch {
  const next: CatalogSearch = { ...search, ...patch, page: undefined };
  for (const key of Object.keys(next) as Array<keyof CatalogSearch>) {
    const value = next[key];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) delete next[key];
  }
  return next;
}
