import { useRef, useState } from 'react';

import { ArtworkImage } from '@/components/common/artwork-image';
import { ArtworkLightbox } from '@/components/common/artwork-lightbox';
import { SearchIcon } from '@/components/icons';
import type { ArtworkKey } from '@/contracts';
import { cn } from '@/lib/utils';

interface NftGalleryProps {
  name: string;
  gallery: ArtworkKey[];
}

/** Galeria do Figma: 4 miniaturas 100x100 (raio 8) e imagem principal 404x404 em moldura 444x444. */
export function NftGallery({ name, gallery }: NftGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLButtonElement>(null);
  const current = gallery[active] ?? gallery[0] ?? 'ape-emerald';
  return (
    <div className="flex w-full max-w-[573px] items-center gap-5 lg:w-[460px] lg:shrink-0 lg:gap-7 xl:w-[573px]">
      <ul
        className="flex w-[80px] shrink-0 flex-col gap-4 xl:w-[100px]"
        aria-label="Miniaturas da galeria"
      >
        {gallery.slice(0, 4).map((artwork, index) => (
          <li key={`${artwork}-${index}`}>
            <button
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              aria-label={`Ver imagem ${index + 1} de ${name}`}
              className={cn(
                'bg-surface-card focus-visible:ring-ring focus-visible:ring-offset-background block size-[80px] overflow-hidden rounded-[8px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none xl:size-[100px]',
                index === active && 'ring-primary ring-1',
              )}
            >
              <ArtworkImage artwork={artwork} size={100} alt="" className="size-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="bg-surface-card relative flex aspect-square min-w-0 flex-1 items-center justify-center rounded-[6px] p-5 xl:size-[444px] xl:flex-none">
        <ArtworkImage
          artwork={current}
          size={404}
          alt={`Arte de ${name}`}
          priority
          className="size-full rounded-[24px] xl:size-[404px]"
        />
        <button
          ref={zoomRef}
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Ampliar a arte de ${name}`}
          className="border-border bg-surface-raised text-cream hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-surface-card absolute top-[13px] right-3 flex size-[30px] items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <SearchIcon className="size-5" />
        </button>
        <ArtworkLightbox
          open={zoomOpen}
          onOpenChange={setZoomOpen}
          artwork={current}
          name={name}
          triggerRef={zoomRef}
        />
      </div>
    </div>
  );
}
