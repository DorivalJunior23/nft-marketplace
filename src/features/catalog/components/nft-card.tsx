import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { ArtworkImage } from '@/components/common/artwork-image';
import { ArtworkLightbox } from '@/components/common/artwork-lightbox';
import { EthPrice } from '@/components/common/eth-price';
import { Shimmer } from '@/components/common/shimmer';
import { CartIcon, HeartIcon, HeartOutlineIcon, SearchIcon } from '@/components/icons';
import type { NftSummary } from '@/contracts';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { useAddToCart } from '@/features/cart/mutations';
import { nftDetailOptions } from '@/features/catalog/queries';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface NftCardProps {
  nft: NftSummary;
  priority?: boolean;
  className?: string;
}

const ACTION_CLASS =
  'border-border bg-surface-raised text-cream hover:border-primary hover:text-text-accent focus-visible:ring-ring focus-visible:ring-offset-surface-card flex size-[35px] items-center justify-center rounded-[4px] border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

/** Ações rápidas do card (Figma, estado hover): adicionar ao carrinho, favoritar e ampliar a arte. */
function CardActions({ nft, soldOut }: { nft: NftSummary; soldOut: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const isFavorite = useIsFavorite(nft.id);
  const toggleFavorite = useToggleFavorite();
  const { requireAuth } = useRequireAuth();
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLButtonElement>(null);
  const [adding, setAdding] = useState(false);

  // A listagem não traz as edições: busca o detalhe (cacheado) e adiciona a primeira disponível.
  const quickAdd = async () => {
    setAdding(true);
    try {
      const detail = await queryClient.fetchQuery(nftDetailOptions(nft.id));
      const edition = detail.editions.find((item) => item.status === 'available');
      if (!edition) {
        toast.info(`${nft.name} não tem edições disponíveis no momento.`);
        return;
      }
      await addToCart.mutateAsync({ nftId: nft.id, editionId: edition.id, quantity: 1 });
      toast.success(`${nft.name} (edição ${edition.label}) adicionado ao carrinho.`, {
        action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
      });
    } catch {
      // Erros de API já viram toast na mutation; falha ao buscar o detalhe cai no aviso abaixo.
      if (!addToCart.isError) toast.error('Não foi possível adicionar ao carrinho.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="absolute top-[258px] left-1/2 flex -translate-x-1/2 gap-[10px] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      data-testid="nft-card-actions"
    >
      <button
        type="button"
        onClick={() => void quickAdd()}
        disabled={soldOut || adding}
        aria-busy={adding || undefined}
        aria-label={soldOut ? `${nft.name} esgotado` : `Adicionar ${nft.name} ao carrinho`}
        className={ACTION_CLASS}
      >
        <CartIcon className="size-5" />
      </button>
      <button
        type="button"
        onClick={() =>
          requireAuth(() => toggleFavorite.mutate({ nftId: nft.id, next: !isFavorite }))
        }
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        className={cn(ACTION_CLASS, isFavorite && 'border-primary text-primary')}
      >
        {isFavorite ? <HeartIcon className="size-5" /> : <HeartOutlineIcon className="size-5" />}
      </button>
      <button
        ref={zoomRef}
        type="button"
        onClick={() => setZoomOpen(true)}
        aria-label={`Ampliar a arte de ${nft.name}`}
        className={ACTION_CLASS}
      >
        <SearchIcon className="size-5" />
      </button>
      <ArtworkLightbox
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        artwork={nft.artwork}
        name={nft.name}
        triggerRef={zoomRef}
      />
    </div>
  );
}

/**
 * Card do catálogo desktop (Figma): moldura 258x300 em Surface Card com a arte 250x250
 * (raio 15) deslocada 24px do topo; nome 16/400 e preço 18/700 abaixo, com 6px entre eles.
 * No hover (e com foco dentro) aparece a barra de ações rápidas dos frames Login/Cadastro.
 */
export function NftCard({ nft, priority = false, className }: NftCardProps) {
  const soldOut = nft.totalAvailable === 0;
  return (
    <article
      className={cn('group relative flex w-full max-w-[258px] flex-col gap-3', className)}
      data-testid="nft-card"
    >
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="bg-surface-card focus-visible:ring-ring focus-visible:ring-offset-background relative block h-[300px] w-full overflow-hidden pt-6 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`${nft.name}, ${soldOut ? 'esgotado' : 'ver detalhes'}`}
      >
        <ArtworkImage
          artwork={nft.artwork}
          size={250}
          alt=""
          priority={priority}
          className="mx-auto aspect-square h-auto w-full max-w-[250px] rounded-[15px] transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {nft.rarity === 'raro' ? (
          <span className="bg-primary text-ink absolute top-6 left-4 px-2 py-[7px] text-[13px] leading-4 font-medium">
            RARO
          </span>
        ) : null}
        {soldOut ? (
          <span className="border-border-soft bg-surface-dark text-coral absolute right-4 bottom-4 rounded-[4px] border px-2 py-1 text-[12px] leading-4 font-bold">
            ESGOTADO
          </span>
        ) : null}
      </Link>
      <CardActions nft={nft} soldOut={soldOut} />
      <div className="flex flex-col gap-1.5">
        <h3 className="text-cream truncate text-[16px] leading-4 font-normal">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="hover:text-text-accent focus-visible:outline-none"
          >
            {nft.name}
          </Link>
        </h3>
        <EthPrice
          value={nft.price}
          compareAt={nft.compareAtPrice}
          className="text-[18px] leading-4"
        />
      </div>
    </article>
  );
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex w-full max-w-[258px] flex-col gap-3', className)}
      data-testid="nft-card-skeleton"
    >
      <Shimmer className="h-[300px] w-full rounded-none" />
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-1/3" />
      </div>
    </div>
  );
}
