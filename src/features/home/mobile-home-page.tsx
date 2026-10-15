import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useId, useMemo, useRef, useState, type FormEvent } from 'react';

import { ArtworkImage } from '@/components/common/artwork-image';
import { EmptyState, ErrorState } from '@/components/common/query-state';
import { ArrowRightIcon, FilterIcon, SearchIcon } from '@/components/icons';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { NftSummary } from '@/contracts';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { CatalogFilters } from '@/features/catalog/components/catalog-filters';
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar';
import {
  MobileNftCard,
  MobileNftCardSkeleton,
} from '@/features/catalog/components/mobile-nft-card';
import { Pagination } from '@/features/catalog/components/pagination';
import { featuredOptions, nftListOptions } from '@/features/catalog/queries';
import { toListQuery, type CatalogSearch } from '@/features/catalog/search-params';
import { useCatalogSearch } from '@/features/catalog/use-catalog-search';
import { useFavorites, useToggleFavorite } from '@/features/favorites/queries';
import { useCarousel } from '@/hooks/use-carousel';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { cn } from '@/lib/utils';

interface MobileHomePageProps {
  search: CatalogSearch;
  route?: '/' | '/mercado';
}

const SKELETONS = ['a', 'b', 'c', 'd'];

/** Início mobile do Figma (414px): busca + filtro, banner, abas, grade em 2 colunas e barra inferior. */
export function MobileHomePage({ search, route = '/' }: MobileHomePageProps) {
  const query = toListQuery(search);
  const list = useQuery(nftListOptions(query));
  const favorites = useFavorites();
  const favoriteIds = useMemo(() => favorites.data ?? [], [favorites.data]);
  const toggle = useToggleFavorite();
  const { requireAuth } = useRequireAuth();
  const toggleFavorite = useCallback(
    (nft: NftSummary) =>
      requireAuth(() => toggle.mutate({ nftId: nft.id, next: !favoriteIds.includes(nft.id) })),
    [requireAuth, toggle, favoriteIds],
  );
  const { setFilters, setPage } = useCatalogSearch(search, route);
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [term, setTerm] = useState(search.q ?? '');
  const searchId = useId();
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useReturnFocus(filterButtonRef);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ q: term.trim() || undefined });
  };

  const activeFilters =
    (search.collection?.length ?? 0) +
    (search.network?.length ?? 0) +
    (search.priceMin || search.priceMax ? 1 : 0);

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-6 pt-10 pb-[126px]">
      <div className="flex items-center justify-between gap-2">
        <form
          onSubmit={submitSearch}
          role="search"
          className="bg-surface-card flex h-[45px] flex-1 items-center gap-2 rounded-[10px] px-3"
        >
          <SearchIcon className="text-brand-secondary size-[22px] shrink-0" />
          <label htmlFor={searchId} className="sr-only">
            Buscar NFTs
          </label>
          <input
            id={searchId}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Explorar coleções"
            className="text-cream placeholder:text-brand-secondary h-full min-w-0 flex-1 bg-transparent text-[14px] leading-4 font-bold focus-visible:outline-none"
          />
        </form>
        <button
          ref={filterButtonRef}
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="text-ink focus-visible:ring-ring focus-visible:ring-offset-background relative flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,rgb(210_138_76/0.45),#D28A4C)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`Abrir filtros${activeFilters ? `, ${activeFilters} ativos` : ''}`}
        >
          <FilterIcon className="size-[22px]" />
          {activeFilters ? (
            <span
              aria-hidden="true"
              className="border-ink bg-cream text-ink absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 text-[10px] font-bold"
            >
              {activeFilters}
            </span>
          ) : null}
        </button>
      </div>

      {route === '/' ? <MobileHeroBanner /> : null}

      <div className="pt-2">
        <CatalogToolbar
          compact
          tab={query.tab ?? 'all'}
          sort={query.sort ?? 'recent'}
          onTabChange={(tab) => setFilters({ tab: tab === 'all' ? undefined : tab })}
          onSortChange={(sort) => setFilters({ sort: sort === 'recent' ? undefined : sort })}
        />
      </div>

      <section
        aria-labelledby="catalogo-mobile"
        aria-busy={list.isFetching || undefined}
        className={cn(
          'pt-2',
          list.isFetching && !list.isPending && !list.isPlaceholderData && 'opacity-70',
        )}
      >
        <h2 id="catalogo-mobile" className="sr-only">
          Catálogo de NFTs
        </h2>
        {list.isPending || (list.isPlaceholderData && list.isFetching) ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6" aria-label="Carregando catálogo">
            {SKELETONS.map((key, index) => (
              <li key={key} className={cn(index % 2 === 1 && 'mt-8')}>
                <MobileNftCardSkeleton />
              </li>
            ))}
          </ul>
        ) : list.isError ? (
          <ErrorState
            error={list.error}
            onRetry={() => void list.refetch()}
            title="Não foi possível carregar o catálogo"
            compact
          />
        ) : list.data && list.data.items.length === 0 ? (
          <EmptyState
            title="Nenhum NFT encontrado"
            description="Ajuste os filtros ou a busca."
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
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6">
            {list.data?.items.map((nft, index) => (
              <li key={nft.id} className={cn(index % 2 === 1 && 'mt-8')}>
                <MobileNftCard
                  nft={nft}
                  priority={index < 2}
                  isFavorite={favoriteIds.includes(nft.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </li>
            ))}
          </ul>
        )}
        {list.data && list.data.totalPages > 1 ? (
          <div className="flex justify-center pt-8">
            <Pagination
              page={list.data.page}
              totalPages={list.data.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          onCloseAutoFocus={returnFocus}
          className="border-border bg-surface-card text-cream max-h-[88dvh] overflow-y-auto p-0"
        >
          <SheetHeader className="px-5 pt-5">
            <SheetTitle className="text-cream text-[18px] leading-6 font-bold">Filtros</SheetTitle>
            <SheetDescription className="text-text-secondary text-[13px]">
              Combine coleções, faixa de preço e rede.
            </SheetDescription>
          </SheetHeader>
          <CatalogFilters
            search={search}
            facets={list.data?.facets}
            onChange={setFilters}
            className="pt-2"
          />
          <div className="border-border bg-surface-card sticky bottom-0 flex gap-3 border-t p-5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => void navigate({ to: route, search: {} })}
            >
              Limpar
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setFiltersOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <MobileTabBar />
    </div>
  );
}

/**
 * Banner do topo mobile (366x190) sobre o fundo da página: gradiente laranja 20→10 % e duas elipses
 * com gradiente linear e borda nítida (o retângulo cinza do Figma é só máscara). É um carrossel dos
 * mesmos destaques do desktop: a arte grande é o destaque atual e a pequena, o próximo; a cada
 * 5 s (ou no toque na pequena) elas trocam de lugar.
 */
function MobileHeroBanner() {
  const featured = useQuery(featuredOptions());
  const slides = featured.data?.slides ?? [];
  const carousel = useCarousel(slides.length);
  const current = slides[carousel.index];
  const next = slides[(carousel.index + 1) % Math.max(slides.length, 1)];
  const advance = () => carousel.goTo((carousel.index + 1) % Math.max(slides.length, 1));
  return (
    <section
      aria-labelledby="hero-mobile"
      className="relative h-[190px] overflow-hidden rounded-[12px]"
      onFocus={carousel.pause}
      onBlur={carousel.resume}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[12px] bg-[linear-gradient(180deg,rgb(210_138_76/0.20),rgb(210_138_76/0.10))]"
      />
      <span
        aria-hidden="true"
        className="absolute -top-[31px] -left-20 size-[248px] rounded-full bg-[linear-gradient(160deg,rgb(221_154_95/0.43),rgb(210_138_76/0.04))]"
      />
      <span
        aria-hidden="true"
        className="absolute -top-[10px] left-[73px] size-[248px] rounded-full bg-[linear-gradient(160deg,rgb(221_154_95/0.37),rgb(210_138_76/0))]"
      />
      <div className="relative flex h-full flex-col justify-between px-4 pt-1.5 pb-1.5">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-1.5">
              <p className="text-cream text-[12px] leading-4 font-medium">Bem-vindo à Kurio</p>
              <h1
                id="hero-mobile"
                className="text-cream text-[18px] leading-[29px] font-bold uppercase"
              >
                Seja dono da
                <br />
                cultura digital
              </h1>
              <p className="text-text-secondary text-[12px] leading-[18px]">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
            </div>
            <Link
              to="/mercado"
              className="text-text-accent mt-1 -mb-3 flex min-h-11 items-center gap-2 text-[12px] leading-[14px] font-bold"
            >
              EXPLORAR <ArrowRightIcon className="text-primary size-4" />
            </Link>
          </div>
          <div className="relative h-[146px] w-[138px] shrink-0" aria-live="polite">
            {current ? (
              <Link
                to="/nft/$nftId"
                params={{ nftId: current.id }}
                aria-label={`Ver ${current.name}, NFT em destaque`}
                className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-[16px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ArtworkImage
                  key={current.id}
                  artwork={current.artwork}
                  size={138}
                  alt=""
                  priority
                  className="size-[138px] rounded-[16px] motion-safe:animate-[hero-fade_700ms_ease-out]"
                />
              </Link>
            ) : (
              <ArtworkImage
                artwork="ape-emerald"
                size={138}
                alt=""
                priority
                className="size-[138px] rounded-[16px]"
              />
            )}
            {next && slides.length > 1 ? (
              <button
                type="button"
                onClick={advance}
                aria-label={`Próximo destaque: ${next.name}`}
                className="focus-visible:ring-ring focus-visible:ring-offset-background absolute top-[88px] left-[14px] block rounded-[16px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ArtworkImage
                  key={next.id}
                  artwork={next.artwork}
                  size={58}
                  alt=""
                  className="size-[58px] rounded-[16px] motion-safe:animate-[hero-fade_700ms_ease-out]"
                />
              </button>
            ) : (
              <ArtworkImage
                artwork="ape-sage"
                size={58}
                alt=""
                className="absolute top-[88px] left-[14px] size-[58px] rounded-[16px]"
              />
            )}
          </div>
        </div>
        {slides.length > 1 ? (
          <div
            className="flex justify-center -space-x-[9px]"
            role="tablist"
            aria-label="Destaques do herói"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === carousel.index}
                aria-label={`Destaque ${index + 1}: ${slide.name}`}
                onClick={() => carousel.goTo(index)}
                className="focus-visible:ring-ring flex size-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-primary block size-[7px] rounded-full transition-opacity motion-reduce:transition-none',
                    index === carousel.index ? 'opacity-100' : 'opacity-40',
                  )}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            <span className="bg-primary size-[7px] rounded-full" />
            <span className="bg-primary size-[7px] rounded-full" />
            <span className="bg-primary size-[7px] rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
}
