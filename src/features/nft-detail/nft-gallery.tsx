import { useState } from 'react';

import { ArtworkImage } from '@/components/common/artwork-image';
import type { ArtworkKey } from '@/contracts';
import { cn } from '@/lib/utils';

interface NftGalleryProps {
  name: string;
  gallery: ArtworkKey[];
}

/** Galeria do Figma: 4 miniaturas 100x100 (raio 8) e imagem principal 404x404 em moldura 444x444. */
export function NftGallery({ name, gallery }: NftGalleryProps) {
  const [active, setActive] = useState(0);
  const current = gallery[active] ?? gallery[0] ?? 'ape-emerald';
  return (
    <div className="flex w-[573px] shrink-0 items-center gap-7">
      <ul className="flex w-[100px] flex-col gap-4" aria-label="Miniaturas da galeria">
        {gallery.slice(0, 4).map((artwork, index) => (
          <li key={`${artwork}-${index}`}>
            <button
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              aria-label={`Ver imagem ${index + 1} de ${name}`}
              className={cn(
                'bg-surface-card focus-visible:ring-ring focus-visible:ring-offset-background block size-[100px] overflow-hidden rounded-[8px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                index === active && 'ring-primary ring-1',
              )}
            >
              <ArtworkImage artwork={artwork} size={100} alt="" className="size-[100px]" />
            </button>
          </li>
        ))}
      </ul>
      <div className="bg-surface-card relative flex size-[444px] items-center justify-center rounded-[6px]">
        <ArtworkImage
          artwork={current}
          size={404}
          alt={`Arte de ${name}`}
          priority
          className="size-[404px] rounded-[24px]"
        />
      </div>
    </div>
  );
}
