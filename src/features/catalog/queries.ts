import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { nftsApi } from '@/api';
import type { NftListQuery } from '@/contracts';

export const catalogKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...catalogKeys.lists(), query] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (id: string) => [...catalogKeys.details(), id] as const,
  related: (id: string) => [...catalogKeys.all, 'related', id] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
};

/**
 * A chave inclui todos os parâmetros, isolando o cache por consulta. O `signal` cancela
 * requisições obsoletas quando os parâmetros mudam; `placeholderData` mantém a página
 * anterior visível (com estado de atualização) enquanto a nova carrega.
 */
export const nftListOptions = (query: NftListQuery) =>
  queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) => nftsApi.list(query, { signal }),
    placeholderData: keepPreviousData,
  });

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => nftsApi.get(id, { signal }),
    staleTime: 60_000,
  });

export const nftRelatedOptions = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.related(id),
    queryFn: ({ signal }) => nftsApi.related(id, { signal }),
    staleTime: 5 * 60_000,
  });

export const featuredOptions = () =>
  queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => nftsApi.featured({ signal }),
    staleTime: 5 * 60_000,
  });
