import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import type { CatalogSearch } from './search-params';
import { withFilterChange } from './search-params';

/**
 * Atualiza o estado do catálogo na URL. Filtros usam `replace: false` para que o histórico
 * permita voltar; mudanças de filtro reiniciam a página (ver withFilterChange).
 */
export function useCatalogSearch(search: CatalogSearch, to: '/' | '/mercado') {
  const navigate = useNavigate();

  const setFilters = useCallback(
    (patch: Partial<CatalogSearch>) => {
      void navigate({
        to,
        search: withFilterChange(search, patch),
        hash: to === '/' ? 'mercado' : undefined,
        resetScroll: false,
      });
    },
    [navigate, search, to],
  );

  const setPage = useCallback(
    (page: number) => {
      void navigate({
        to,
        search: { ...search, page: page > 1 ? page : undefined },
        hash: to === '/' ? 'mercado' : undefined,
        resetScroll: false,
      });
    },
    [navigate, search, to],
  );

  return { setFilters, setPage };
}
