import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Shimmer } from '@/components/common/shimmer';
import { Button } from '@/components/ui/button';
import { featuredOptions } from '@/features/catalog/queries';

/** Herói do Figma: 1200x450, texto à esquerda (600px) e arte 450x450 com raio 24 à direita. */
export function HeroSection() {
  const featured = useQuery(featuredOptions());
  const hero = featured.data?.hero;
  return (
    <section
      aria-labelledby="hero-titulo"
      className="flex h-[450px] items-center justify-between gap-[110px] pl-10"
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
        <div className="flex justify-end gap-2 pr-0" aria-hidden="true">
          <span className="bg-primary size-2 rounded-full" />
          <span className="bg-primary size-2 rounded-full" />
          <span className="bg-primary size-2 rounded-full" />
        </div>
      </div>
      {hero ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: hero.id }}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block shrink-0 rounded-[24px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`Ver ${hero.name}, NFT em destaque`}
        >
          <ArtworkImage
            artwork={hero.artwork}
            size={450}
            alt=""
            priority
            className="size-[450px] rounded-[24px]"
          />
        </Link>
      ) : (
        <Shimmer className="size-[450px] shrink-0 rounded-[24px]" />
      )}
    </section>
  );
}
