import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { EthPrice } from '@/components/common/eth-price';
import { Shimmer } from '@/components/common/shimmer';
import type { NftSummary } from '@/contracts';
import { cn } from '@/lib/utils';

interface NftCardProps {
  nft: NftSummary;
  priority?: boolean;
  className?: string;
}

/**
 * Card do catálogo desktop (Figma): moldura 258x300 em Surface Card com a arte 250x250
 * (raio 15) deslocada 24px do topo; nome 16/400 e preço 18/700 abaixo, com 6px entre eles.
 */
export function NftCard({ nft, priority = false, className }: NftCardProps) {
  const soldOut = nft.totalAvailable === 0;
  return (
    <article
      className={cn('group flex w-full max-w-[258px] flex-col gap-3', className)}
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
