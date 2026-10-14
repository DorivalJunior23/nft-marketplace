import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { ArtworkKey } from '@/contracts';

const PROMOS: ReadonlyArray<{
  title: string;
  text: string;
  artwork: ArtworkKey;
  tab: 'new' | 'trending';
}> = [
  {
    title: 'Lançamentos gênesis\nde edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: 'ape-emerald',
    tab: 'new',
  },
  {
    title: 'Arte digital selecionada\ne muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: 'ape-neon',
    tab: 'trending',
  },
];

/** Cards promocionais do Figma: 586x250, arte à esquerda, texto alinhado à direita e arcos decorativos. */
export function PromoSection() {
  return (
    <section aria-label="Promoções" className="flex justify-between gap-7">
      {PROMOS.map((promo) => (
        <article
          key={promo.tab}
          className="bg-surface-card relative h-[250px] w-[586px] overflow-hidden rounded-[8px]"
        >
          <ArtworkImage
            artwork={promo.artwork}
            size={292}
            alt=""
            className="absolute top-0 -left-[5px] h-[250px] w-[292px] rounded-[18px]"
          />
          <span
            aria-hidden="true"
            className="border-primary absolute top-[142px] -left-[191px] size-[256px] rounded-full border-2"
          />
          <span
            aria-hidden="true"
            className="border-primary absolute top-[134px] -left-[199px] size-[256px] rounded-full border"
          />
          <div className="absolute top-[37px] right-[30px] flex w-[263px] flex-col items-end gap-[9px] text-right">
            <h2 className="text-cream text-[18px] leading-6 font-bold whitespace-pre-line">
              {promo.title}
            </h2>
            <p className="text-text-secondary text-[14px] leading-6">{promo.text}</p>
          </div>
          <Button
            asChild
            size="cta"
            className="absolute top-[164px] right-[30px] w-[140px] justify-between"
          >
            <Link to="/mercado" search={{ tab: promo.tab }}>
              Explorar
              <ArrowRightIcon className="size-[18px]" />
            </Link>
          </Button>
        </article>
      ))}
    </section>
  );
}
