import { useQueries } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Button } from '@/components/ui/button';
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card';
import { MobileNftCard } from '@/features/catalog/components/mobile-nft-card';
import { nftDetailOptions } from '@/features/catalog/queries';
import { useFavorites, useToggleFavorite } from '@/features/favorites/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

import { AccountLayout } from './account-layout';

/** Lista de interesse: os NFTs favoritados pelo usuário autenticado. */
export function FavoritesPage() {
  const isDesktop = useIsDesktop();
  const favorites = useFavorites();
  const toggle = useToggleFavorite();
  const ids = favorites.data ?? [];
  const details = useQueries({ queries: ids.map((id) => nftDetailOptions(id)) });

  return (
    <AccountLayout title="Lista de interesse">
      <h1 className="text-cream text-[16px] leading-4 font-bold">Lista de interesse</h1>
      {favorites.isPending ? (
        <ul
          className={cn(
            'grid gap-6',
            isDesktop ? 'grid-cols-2 gap-x-8 xl:grid-cols-3' : 'grid-cols-2 gap-x-4',
          )}
          aria-label="Carregando favoritos"
        >
          {['a', 'b', 'c'].map((key) => (
            <li key={key}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.isError ? (
        <ErrorState
          error={favorites.error}
          onRetry={() => void favorites.refetch()}
          title="Não foi possível carregar seus favoritos"
        />
      ) : ids.length === 0 ? (
        <EmptyState
          title="Nenhum NFT favoritado ainda"
          description="Toque em Favoritar na página de um NFT para guardá-lo aqui."
          action={
            <Button asChild size="sm">
              <Link to="/mercado">Explorar o mercado</Link>
            </Button>
          }
        />
      ) : (
        <ul
          className={cn(
            'grid gap-8',
            isDesktop ? 'grid-cols-2 gap-x-8 xl:grid-cols-3' : 'grid-cols-2 gap-x-4',
          )}
        >
          {details.map((detail, index) => {
            const id = ids[index]!;
            if (!detail.data) {
              return (
                <li key={id}>
                  <NftCardSkeleton />
                </li>
              );
            }
            return (
              <li key={id} className="flex flex-col gap-3">
                {isDesktop ? <NftCard nft={detail.data} /> : <MobileNftCard nft={detail.data} />}
                <button
                  type="button"
                  onClick={() => toggle.mutate({ nftId: id, next: false })}
                  className="text-text-accent focus-visible:ring-ring hover:bg-primary/15 hover:text-coral self-start rounded-[4px] px-1 text-[13px] leading-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  Remover da lista
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
