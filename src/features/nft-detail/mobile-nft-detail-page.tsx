import { Link, useRouter } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Shimmer } from '@/components/common/shimmer';
import { ArrowLeftIcon, HeartOutlineIcon, ShopIcon, StarIcon } from '@/components/icons';
import type { Nft } from '@/contracts';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries';
import { formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

import { EditionPicker } from './edition-picker';
import { QuantityStepper } from './quantity-stepper';
import { usePurchaseForm } from './use-purchase-form';

const circleButton =
  'flex size-[35px] items-center justify-center rounded-full border border-border bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/** Detalhes do NFT (mobile, Figma 414px): herói com arte, folha de detalhes e barra de compra fixa. */
export function MobileNftDetailPage({ nft }: { nft: Nft }) {
  const router = useRouter();
  const form = usePurchaseForm(nft);
  const isFavorite = useIsFavorite(nft.id);
  const toggle = useToggleFavorite();
  const { requireAuth } = useRequireAuth();

  return (
    <div className="flex min-h-dvh flex-col pb-[164px]">
      <div className="relative h-[506px] bg-[linear-gradient(180deg,#241612,#2F1D15)]">
        <div className="flex items-center justify-between px-7 pt-6">
          <button
            type="button"
            onClick={() => router.history.back()}
            className={cn(circleButton, 'text-text-secondary')}
            aria-label="Voltar"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => requireAuth(() => toggle.mutate({ nftId: nft.id, next: !isFavorite }))}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className={cn(circleButton, 'text-text-accent', isFavorite && 'bg-primary text-ink')}
            data-testid="favorite-button"
          >
            <HeartOutlineIcon className="h-[14px] w-4" />
          </button>
        </div>
        <div className="px-7 pt-2">
          <ArtworkImage
            artwork={nft.artwork}
            size={361}
            alt={`Arte de ${nft.name}`}
            priority
            className="h-[356px] w-full rounded-[24px]"
          />
        </div>
        <div
          className="absolute top-[365px] left-1/2 flex -translate-x-1/2 items-center gap-[7px]"
          aria-hidden="true"
        >
          <span className="bg-primary h-[7px] w-7 rounded-full" />
          <span className="bg-primary size-[7px] rounded-full" />
          <span className="bg-primary size-[7px] rounded-full" />
        </div>
      </div>

      <section
        aria-labelledby="nft-titulo"
        className="bg-surface-card relative -mt-[114px] flex flex-col gap-3 rounded-t-[31px] px-6 pt-8 pb-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 id="nft-titulo" className="text-cream truncate text-[20px] leading-4 font-bold">
            {nft.name}
          </h1>
          <p className="border-primary flex h-[27px] shrink-0 items-center gap-1 rounded-full border px-1.5 text-[14px] leading-4">
            <StarIcon className="text-amber size-[14px]" />
            <span className="text-cream font-medium">{nft.rating.average.toFixed(1)}</span>
            <span className="text-text-secondary">({nft.rating.count})</span>
            <span className="sr-only">de 5 estrelas</span>
          </p>
        </div>
        <p className="text-text-secondary text-[14px] leading-6">{nft.about}</p>
        <EditionPicker
          editions={nft.editions}
          value={form.editionId}
          onChange={form.selectEdition}
        />
        <dl className="text-brand-secondary flex flex-col gap-3 text-[15px] leading-5">
          <div className="flex gap-1">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Coleção:</dt>
            <dd>{nft.series}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Atributos:</dt>
            <dd>{nft.attributes.join(', ')}</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3 pt-3 text-[14px] leading-6">
          <p className="text-text-secondary whitespace-pre-line">{nft.description}</p>
          <p>
            <span className="text-cream font-bold">Rede: </span>
            <span className="text-text-secondary">{nft.networkNote}</span>
          </p>
          <p>
            <span className="text-cream font-bold">Contrato: </span>
            <span className="text-text-secondary">{nft.contractNote}</span>
          </p>
          <p>
            <span className="text-cream font-bold">Direitos autorais: </span>
            <span className="text-text-secondary">{nft.royaltyNote}</span>
          </p>
        </div>
      </section>

      <div className="bg-surface-card fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-[40px] px-6 pt-5 pb-9 shadow-[0_0_20px_rgb(10_6_4/0.45)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-[15px] leading-4 font-medium">Qtd.</span>
            <QuantityStepper
              size="sm"
              value={form.quantity}
              max={form.maxQuantity}
              onChange={form.setQuantity}
              disabled={!form.canBuy}
            />
          </div>
          <p className="text-text-accent text-[20px] leading-4 font-bold" data-testid="nft-price">
            {formatEth(nft.price)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={form.buy}
            disabled={!form.canBuy}
            aria-busy={form.isBuying || undefined}
            className="text-ink focus-visible:ring-ring focus-visible:ring-offset-surface-card flex h-[60px] w-[196px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#D28A4C,rgb(210_138_76/0.8))] text-[16px] leading-5 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
            data-testid="buy-button"
          >
            {form.canBuy ? 'Comprar NFT' : 'Esgotado'}
          </button>
          <Link
            to="/carrinho"
            aria-label="Ir para o carrinho"
            className="border-border bg-surface-raised text-brand-secondary focus-visible:ring-ring flex size-[60px] items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none"
          >
            <ShopIcon className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileNftDetailSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-busy="true" aria-label="Carregando NFT">
      <div className="h-[506px] bg-[linear-gradient(180deg,#241612,#2F1D15)] px-7 pt-[66px]">
        <Shimmer className="h-[356px] w-full rounded-[24px]" />
      </div>
      <div className="bg-surface-card -mt-[114px] flex flex-col gap-4 rounded-t-[31px] px-6 pt-8 pb-6">
        <Shimmer className="h-5 w-2/3" />
        <Shimmer className="h-16 w-full" />
        <Shimmer className="h-7 w-1/2" />
        <Shimmer className="h-20 w-full" />
        <Shimmer className="h-[220px] w-full" />
      </div>
    </div>
  );
}
