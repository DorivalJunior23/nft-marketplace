import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toast } from '@/lib/toast';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Container } from '@/components/common/container';
import { EthPrice } from '@/components/common/eth-price';
import { Shimmer } from '@/components/common/shimmer';
import { HeartIcon, LinkedinIcon, ShareIcon, StarIcon, TwitterIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Nft } from '@/contracts';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { nftRelatedOptions } from '@/features/catalog/queries';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries';
import { cn } from '@/lib/utils';

import { EditionPicker } from './edition-picker';
import { NftGallery } from './nft-gallery';
import { QuantityStepper } from './quantity-stepper';
import { usePurchaseForm } from './use-purchase-form';

function Rating({ average, count }: { average: number; count: number }) {
  const filled = Math.round(average);
  return (
    <div
      role="img"
      className="flex min-w-0 flex-wrap items-center gap-1"
      aria-label={`Avaliação ${average} de 5, ${count} avaliações de colecionadores`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={cn('size-[15px]', star <= filled ? 'text-primary' : 'text-text-secondary')}
        />
      ))}
      <span className="text-cream ml-1 text-[15px] leading-5" aria-hidden="true">
        {count} avaliações de colecionadores
      </span>
    </div>
  );
}

export function FavoriteButton({ nft, className }: { nft: Nft; className?: string }) {
  const isFavorite = useIsFavorite(nft.id);
  const toggle = useToggleFavorite();
  const { requireAuth } = useRequireAuth();
  return (
    <Button
      variant="outline"
      size="cta"
      className={cn(
        'border-primary text-text-accent w-[130px] gap-2',
        isFavorite && 'bg-primary/15',
        className,
      )}
      aria-pressed={isFavorite}
      aria-busy={toggle.isPending || undefined}
      onClick={() => requireAuth(() => toggle.mutate({ nftId: nft.id, next: !isFavorite }))}
      data-testid="favorite-button"
    >
      <HeartIcon className="text-primary size-5" />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  );
}

function ShareLinks({ nft }: { nft: Nft }) {
  const share = (channel: string) => {
    const url = window.location.href;
    if (channel === 'Copiar link') {
      void navigator.clipboard?.writeText(url).then(() => toast.success('Link copiado.'));
      return;
    }
    toast.info(`Compartilhar no ${channel} não está disponível nesta demonstração.`);
  };
  const buttonClass =
    'flex size-5 items-center justify-center text-cream hover:text-text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
  return (
    <div className="flex items-center gap-2">
      <p className="text-cream text-[15px] leading-4 font-bold">Compartilhar este NFT:</p>
      <button
        type="button"
        className={buttonClass}
        aria-label={`Compartilhar ${nft.name} no LinkedIn`}
        onClick={() => share('LinkedIn')}
      >
        <LinkedinIcon className="h-[14px] w-[15px]" />
      </button>
      <button
        type="button"
        className={buttonClass}
        aria-label={`Copiar link de ${nft.name}`}
        onClick={() => share('Copiar link')}
      >
        <ShareIcon className="size-[18px]" />
      </button>
      <button
        type="button"
        className={buttonClass}
        aria-label={`Compartilhar ${nft.name} no Twitter`}
        onClick={() => share('Twitter')}
      >
        <TwitterIcon className="h-3 w-4" />
      </button>
    </div>
  );
}

function RelatedSection({ nftId }: { nftId: string }) {
  const related = useQuery(nftRelatedOptions(nftId));
  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="border-primary/30 flex flex-col gap-3 border-b pb-3">
        <h2 id="relacionados-titulo" className="text-text-accent text-[17px] leading-4 font-bold">
          Mais desta coleção
        </h2>
      </div>
      <div className="flex flex-col items-center gap-8">
        <ul className="grid w-full grid-cols-3 gap-7 lg:grid-cols-4 xl:flex xl:justify-between lg:[&>li:nth-child(4)]:flex lg:[&>li:nth-child(5)]:hidden [&>li:nth-child(n+4)]:hidden xl:[&>li:nth-child(n+4)]:flex">
          {(related.data ?? Array.from({ length: 5 }, () => null)).map((item, index) => (
            <li
              key={item?.id ?? index}
              className="flex w-full max-w-[219px] flex-col gap-3 xl:w-[219px]"
            >
              {item ? (
                <>
                  <Link
                    to="/nft/$nftId"
                    params={{ nftId: item.id }}
                    className="bg-surface-card focus-visible:ring-ring focus-visible:ring-offset-background block aspect-[219/255] w-full px-1 pt-5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none xl:aspect-auto xl:h-[255px]"
                    aria-label={`${item.name}, ver detalhes`}
                  >
                    <ArtworkImage
                      artwork={item.artwork}
                      size={212}
                      alt=""
                      className="mx-auto aspect-square h-auto w-full max-w-[212px] rounded-[13px] xl:size-[212px]"
                    />
                  </Link>
                  <div className="flex flex-col">
                    <h3 className="text-cream truncate text-[15px] leading-5">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: item.id }}
                        className="hover:text-text-accent focus-visible:outline-none"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <EthPrice
                      value={item.price}
                      compareAt={item.compareAtPrice}
                      className="text-[16px] leading-4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Shimmer className="h-[255px] w-[219px] rounded-none" />
                  <Shimmer className="h-5 w-3/4" />
                  <Shimmer className="h-4 w-1/3" />
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="border-primary size-3 rounded-full border-[1.3px]" />
          <span className="bg-primary size-3 rounded-full" />
          <span className="border-primary size-3 rounded-full border-[1.3px]" />
        </div>
      </div>
    </section>
  );
}

/** Detalhes do NFT (desktop, Figma): galeria + painel de compra, descrição com abas e relacionados. */
export function NftDetailPage({ nft }: { nft: Nft }) {
  const form = usePurchaseForm(nft);
  return (
    <Container className="flex flex-col gap-24 pt-8">
      <section aria-labelledby="nft-titulo" className="flex flex-col gap-3">
        <nav
          aria-label="Trilha de navegação"
          className="text-cream text-[15px] leading-4 font-bold"
        >
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          <span aria-hidden="true"> / </span>
          <Link to="/mercado" className="hover:text-text-accent">
            Mercado
          </Link>
        </nav>
        <div className="flex flex-col gap-8 lg:flex-row">
          <NftGallery name={nft.name} gallery={nft.gallery} />
          <div className="flex min-h-[448px] flex-1 flex-col justify-between gap-3">
            <div className="border-primary/30 flex flex-col gap-3 border-b pb-3">
              <h1 id="nft-titulo" className="text-cream text-[28px] leading-[37px] font-bold">
                {nft.name}
              </h1>
              <div className="flex items-center justify-between gap-4">
                <EthPrice
                  value={nft.price}
                  compareAt={nft.compareAtPrice}
                  className="text-[22px] leading-4"
                  data-testid="nft-price"
                />
                <Rating average={nft.rating.average} count={nft.rating.count} />
              </div>
            </div>
            <div className="flex max-w-[574px] flex-col gap-3">
              <h2 className="text-cream text-[15px] leading-4 font-bold">Sobre este NFT:</h2>
              <p className="text-text-secondary text-[14px] leading-6">{nft.about}</p>
            </div>
            <EditionPicker
              editions={nft.editions}
              value={form.editionId}
              onChange={form.selectEdition}
            />
            <div className="flex items-center justify-between gap-4">
              <QuantityStepper
                value={form.quantity}
                max={form.maxQuantity}
                onChange={form.setQuantity}
                disabled={!form.canBuy}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="cta"
                  className="w-[130px] text-[14px] font-bold"
                  onClick={form.buy}
                  disabled={!form.canBuy}
                  aria-busy={form.isBuying || undefined}
                  data-testid="buy-button"
                >
                  {form.canBuy ? 'COMPRAR' : 'ESGOTADO'}
                </Button>
                <FavoriteButton nft={nft} />
              </div>
            </div>
            {form.edition && form.edition.status === 'available' ? (
              <p className="sr-only" aria-live="polite">
                Edição {form.edition.label}: {form.edition.available} disponíveis, limite de{' '}
                {form.maxQuantity} por pedido.
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
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
              <ShareLinks nft={nft} />
            </div>
          </div>
        </div>
      </section>

      <DescriptionSection nft={nft} />
      <RelatedSection nftId={nft.id} />
    </Container>
  );
}

const DESCRIPTION_TAB_CLASS =
  'group/tab text-cream data-[state=active]:text-text-accent focus-visible:ring-ring relative h-auto flex-none rounded-none border-0 bg-transparent px-0 pt-0 pb-3 text-[17px] leading-4 font-normal shadow-none data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:shadow-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none';

/** Abas do Figma: "Detalhes do NFT" e "Avaliações de colecionadores" (sem avaliações individuais na demonstração). */
function DescriptionSection({ nft }: { nft: Nft }) {
  return (
    <section aria-labelledby="descricao-titulo" className="flex flex-col gap-3">
      <h2 id="descricao-titulo" className="sr-only">
        Detalhes e avaliações
      </h2>
      <Tabs defaultValue="detalhes" className="gap-3">
        <TabsList
          aria-label="Detalhes e avaliações"
          className="border-primary/30 h-auto w-full justify-start gap-8 rounded-none border-b bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto"
        >
          <TabsTrigger value="detalhes" className={DESCRIPTION_TAB_CLASS}>
            Detalhes do NFT
            <span
              aria-hidden="true"
              className="bg-primary absolute inset-x-0 -bottom-px h-[3px] opacity-0 group-data-[state=active]/tab:opacity-100"
            />
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className={DESCRIPTION_TAB_CLASS}>
            Avaliações de colecionadores ({nft.rating.count})
            <span
              aria-hidden="true"
              className="bg-primary absolute inset-x-0 -bottom-px h-[3px] opacity-0 group-data-[state=active]/tab:opacity-100"
            />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="avaliacoes" className="text-[14px] leading-6">
          <p className="text-text-secondary">
            Nota média {nft.rating.average.toFixed(1)} de 5 em {nft.rating.count} avaliações. As
            avaliações individuais não estão disponíveis nesta demonstração.
          </p>
        </TabsContent>
        <TabsContent value="detalhes" className="flex flex-col gap-3 text-[14px] leading-6">
          <p className="text-text-secondary whitespace-pre-line">{nft.description}</p>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-cream font-bold">Rede:</dt>
              <dd className="text-text-secondary">{nft.networkNote}</dd>
            </div>
            <div>
              <dt className="text-cream font-bold">Contrato:</dt>
              <dd className="text-text-secondary">{nft.contractNote}</dd>
            </div>
            <div>
              <dt className="text-cream font-bold">Direitos autorais:</dt>
              <dd className="text-text-secondary">{nft.royaltyNote}</dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export function NftDetailSkeleton() {
  return (
    <Container
      className="flex flex-col gap-24 pt-8"
      role="status"
      aria-busy="true"
      aria-label="Carregando NFT"
    >
      <div className="flex flex-col gap-3">
        <Shimmer className="h-4 w-36" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full max-w-[573px] items-center gap-5 lg:w-[460px] lg:shrink-0 lg:gap-7 xl:w-[573px]">
            <div className="flex w-[80px] shrink-0 flex-col gap-4 xl:w-[100px]">
              {['a', 'b', 'c', 'd'].map((key) => (
                <Shimmer key={key} className="size-[80px] rounded-[8px] xl:size-[100px]" />
              ))}
            </div>
            <Shimmer className="aspect-square min-w-0 flex-1 rounded-[6px] xl:size-[444px] xl:flex-none" />
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <Shimmer className="h-9 w-2/3" />
            <Shimmer className="h-5 w-1/3" />
            <Shimmer className="h-16 w-full" />
            <Shimmer className="h-7 w-1/2" />
            <Shimmer className="h-12 w-full" />
            <Shimmer className="h-20 w-1/2" />
          </div>
        </div>
      </div>
      {/* Reserva a altura da descrição e dos relacionados: o rodapé não desloca quando os dados chegam. */}
      <div className="flex flex-col gap-3">
        <Shimmer className="h-7 w-1/3" />
        <Shimmer className="h-[300px] w-full" />
      </div>
      <div className="flex flex-col gap-8">
        <Shimmer className="h-7 w-48" />
        <div className="grid grid-cols-3 gap-7 lg:grid-cols-4 xl:flex xl:justify-between lg:[&>:nth-child(4)]:block lg:[&>:nth-child(5)]:hidden [&>:nth-child(n+4)]:hidden xl:[&>:nth-child(n+4)]:block">
          {['a', 'b', 'c', 'd', 'e'].map((key) => (
            <Shimmer
              key={key}
              className="aspect-[219/303] w-full max-w-[219px] rounded-none xl:h-[303px] xl:w-[219px]"
            />
          ))}
        </div>
        <Shimmer className="mx-auto h-3 w-14" />
      </div>
    </Container>
  );
}
