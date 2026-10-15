import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Shimmer } from '@/components/common/shimmer';
import { Button } from '@/components/ui/button';
import { featuredOptions } from '@/features/catalog/queries';
import { useCarousel } from '@/hooks/use-carousel';
import { cn } from '@/lib/utils';

/** Herói do Figma: 1200x450, texto à esquerda (600px) e carrossel de artes 450x450 (raio 24) à direita. */
export function HeroSection() {
  const featured = useQuery(featuredOptions());
  const slides = featured.data?.slides ?? [];
  const carousel = useCarousel(slides.length);
  const current = slides[carousel.index];

  return (
    <section
      aria-labelledby="hero-titulo"
      className="flex h-[450px] items-center justify-between gap-[110px] pl-10"
      onMouseEnter={carousel.pause}
      onMouseLeave={carousel.resume}
      onFocus={carousel.pause}
      onBlur={carousel.resume}
    >
      <div className="flex w-[600px] shrink-0 flex-col gap-11">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <p className="text-cream text-[14px] leading-4 font-medium tracking-[1.4px]">
                Bem-vindo à Kurio
              </p>
              <h1
                id="hero-titulo"
                className="text-cream text-[43px] leading-[70px] font-bold uppercase"
              >
                Seja dono do futuro
                <br />
                da arte digital
              </h1>
            </div>
            <p className="text-text-secondary max-w-[557px] text-[14px] leading-6">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Button asChild className="w-[140px]">
            <Link to="/" hash="mercado">
              EXPLORAR
            </Link>
          </Button>
        </div>
        {slides.length > 1 ? (
          <div className="flex justify-end gap-2" role="tablist" aria-label="Destaques do herói">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === carousel.index}
                aria-label={`Destaque ${index + 1}: ${slide.name}`}
                onClick={() => carousel.goTo(index)}
                className={cn(
                  'bg-primary size-2 rounded-full transition-opacity motion-reduce:transition-none',
                  index === carousel.index ? 'opacity-100' : 'opacity-40 hover:opacity-70',
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-end gap-2" aria-hidden="true">
            <span className="bg-primary size-2 rounded-full" />
            <span className="bg-primary size-2 rounded-full" />
            <span className="bg-primary size-2 rounded-full" />
          </div>
        )}
      </div>
      {current ? (
        <div
          className="relative size-[450px] shrink-0 overflow-hidden rounded-[24px]"
          aria-live="polite"
        >
          {slides.map((slide, index) => (
            <Link
              key={slide.id}
              to="/nft/$nftId"
              params={{ nftId: slide.id }}
              tabIndex={index === carousel.index ? 0 : -1}
              aria-hidden={index !== carousel.index}
              className={cn(
                'focus-visible:ring-ring focus-visible:ring-offset-background absolute inset-0 block rounded-[24px] transition-opacity duration-700 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none',
                index === carousel.index ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-label={`Ver ${slide.name}, NFT em destaque`}
            >
              <ArtworkImage
                artwork={slide.artwork}
                size={450}
                alt=""
                priority={index === 0}
                className="size-[450px] rounded-[24px]"
              />
            </Link>
          ))}
        </div>
      ) : featured.isError ? (
        <button
          type="button"
          onClick={() => void featured.refetch()}
          className="bg-surface-card text-text-secondary hover:text-text-accent flex size-[450px] shrink-0 items-center justify-center rounded-[24px] text-[14px]"
        >
          Não foi possível carregar o destaque. Tentar novamente
        </button>
      ) : (
        <Shimmer className="size-[450px] shrink-0 rounded-[24px]" />
      )}
    </section>
  );
}
