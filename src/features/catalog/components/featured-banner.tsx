import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Shimmer } from '@/components/common/shimmer';

import { featuredOptions } from '../queries';

/** Banner "NFT em destaque / Oferta limitada" da sidebar (310x470, gradiente laranja a 10%). */
export function FeaturedBanner() {
  const featured = useQuery(featuredOptions());
  const nft = featured.data?.featured;
  return (
    <section
      aria-labelledby="destaque-titulo"
      className="relative flex h-[470px] flex-col gap-4 overflow-hidden bg-[linear-gradient(180deg,rgb(210_138_76/0.10)_0%,rgb(210_138_76/0.03)_100%)] pt-6 pb-1"
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id="destaque-titulo" className="text-text-accent text-[24px] leading-8 font-bold">
          NFT EM DESTAQUE
        </h2>
        <p className="text-cream text-center text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>
      </div>
      {nft ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`Ver ${nft.name} em destaque`}
        >
          <ArtworkImage
            artwork={nft.artwork}
            size={310}
            alt=""
            className="h-[368px] w-[310px] rounded-[22px]"
          />
        </Link>
      ) : (
        <Shimmer className="h-[368px] w-[310px] rounded-[22px]" />
      )}
      <span
        aria-hidden="true"
        className="absolute top-[105px] left-[38px] size-[15px] rounded-full bg-[linear-gradient(180deg,#D28A4C,transparent)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[343px] left-[248px] size-[45px] rounded-full bg-[linear-gradient(180deg,#D28A4C,transparent)]"
      />
    </section>
  );
}
