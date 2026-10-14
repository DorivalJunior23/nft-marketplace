import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { EthPrice } from '@/components/common/eth-price';
import { Shimmer } from '@/components/common/shimmer';
import { HeartOutlineIcon } from '@/components/icons';
import type { NftSummary } from '@/contracts';
import { cn } from '@/lib/utils';

interface MobileNftCardProps {
  nft: NftSummary;
  priority?: boolean;
  onToggleFavorite?: (nft: NftSummary) => void;
  isFavorite?: boolean;
}

/** Card mobile do Figma: 175x200 com gradiente, arte 168x168 (raio 16), botão de favorito e preço. */
export function MobileNftCard({
  nft,
  priority = false,
  onToggleFavorite,
  isFavorite = false,
}: MobileNftCardProps) {
  return (
    <article className="flex flex-col gap-2" data-testid="nft-card">
      <div className="relative h-[200px] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#241612,#2F1D15)] px-1 pt-5">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`${nft.name}, ver detalhes`}
        >
          <ArtworkImage
            artwork={nft.artwork}
            size={168}
            alt=""
            priority={priority}
            className="mx-auto size-[168px] rounded-[16px]"
          />
        </Link>
        {nft.rarity === 'raro' ? (
          <span className="bg-primary text-ink absolute top-4 left-0 flex h-8 w-[68px] items-center pl-2 text-[13px] leading-4 font-medium">
            RARO
          </span>
        ) : null}
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(nft)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className={cn(
              'border-border bg-surface-raised text-primary focus-visible:ring-ring absolute top-3 right-[11px] flex size-7 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none',
              isFavorite && 'bg-primary text-ink',
            )}
          >
            <HeartOutlineIcon className="h-[13px] w-[15px]" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col pl-2">
        <h3 className="text-cream truncate text-[15px] leading-5">
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="focus-visible:outline-none">
            {nft.name}
          </Link>
        </h3>
        <EthPrice
          value={nft.price}
          compareAt={nft.compareAtPrice}
          className="text-[16px] leading-4"
        />
      </div>
    </article>
  );
}

export function MobileNftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2" data-testid="nft-card-skeleton">
      <Shimmer className="h-[200px] rounded-[20px]" />
      <div className="flex flex-col gap-1 pl-2">
        <Shimmer className="h-5 w-3/4" />
        <Shimmer className="h-4 w-1/3" />
      </div>
    </div>
  );
}
