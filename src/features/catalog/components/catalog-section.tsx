import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { nftListOptions } from '../queries';
import { toListQuery, type CatalogSearch } from '../search-params';
import { useCatalogSearch } from '../use-catalog-search';
import { CatalogFilters } from './catalog-filters';
import { CatalogToolbar } from './catalog-toolbar';
import { FeaturedBanner } from './featured-banner';
import { NftCard, NftCardSkeleton } from './nft-card';
import { Pagination } from './pagination';

interface CatalogSectionProps {
  search: CatalogSearch;
  route: '/' | '/mercado';
  /** Mostra o banner "NFT em destaque" abaixo dos filtros (só na Início). */
  showFeatured?: boolean;
}

const SKELETON_KEYS = Array.from({ length: 9 }, (_, index) => `s${index}`);

/** Catálogo desktop do Figma: sidebar de 310px + grade de 3 colunas (842px) com paginação. */
export function CatalogSection({ search, route, showFeatured = false }: CatalogSectionProps) {
  const query = toListQuery(search);
  const list = useQuery(nftListOptions(query));
  const { setFilters, setPage } = useCatalogSearch(search, route);
  const navigate = useNavigate();

  // Nova consulta (filtros/página) mostra skeleton; só o refetch da mesma consulta fica em segundo plano.
  const isInitialLoading = list.isPending || (list.isPlaceholderData && list.isFetching);
  const isRefreshing = list.isFetching && !isInitialLoading;

  return (
    <section id="mercado" aria-labelledby="catalogo-titulo" className="flex scroll-mt-6 gap-12">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>
      <aside className="flex w-[310px] shrink-0 flex-col gap-6">
        <CatalogFilters search={search} facets={list.data?.facets} onChange={setFilters} />
        {showFeatured ? <FeaturedBanner /> : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <CatalogToolbar
          tab={query.tab ?? 'all'}
          sort={query.sort ?? 'recent'}
          onTabChange={(tab) => setFilters({ tab: tab === 'all' ? undefined : tab })}
          onSortChange={(sort) => setFilters({ sort: sort === 'recent' ? undefined : sort })}
        />

        <div
          className={cn(
            'flex flex-col gap-[72px] transition-opacity',
            isRefreshing && 'opacity-70',
          )}
          aria-busy={list.isFetching || undefined}
          data-testid="catalog-grid"
        >
          <p className="sr-only" aria-live="polite">
            {list.isFetching
              ? 'Atualizando catálogo.'
              : list.data
                ? `${list.data.total} NFTs encontrados.`
                : ''}
          </p>

          {isInitialLoading ? (
            <ul className="grid grid-cols-3 gap-x-8 gap-y-[72px]" aria-label="Carregando catálogo">
              {SKELETON_KEYS.map((key) => (
                <li key={key}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : list.isError ? (
            <ErrorState
              error={list.error}
              onRetry={() => void list.refetch()}
              title="Não foi possível carregar o catálogo"
            />
          ) : list.data && list.data.items.length === 0 ? (
            <EmptyState
              title="Nenhum NFT encontrado"
              description="Ajuste os filtros ou a busca para encontrar outras obras."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void navigate({ to: route, search: {} })}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-3 gap-x-8 gap-y-[72px]">
              {list.data?.items.map((nft, index) => (
                <li key={nft.id} className="flex justify-start">
                  <NftCard nft={nft} priority={index < 3} />
                </li>
              ))}
            </ul>
          )}

          {list.data && list.data.totalPages > 1 ? (
            <div className="flex justify-end">
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
