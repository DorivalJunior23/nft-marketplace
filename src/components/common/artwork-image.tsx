import type { ImgHTMLAttributes } from 'react';

import type { ArtworkKey } from '@/contracts';
import { cn } from '@/lib/utils';

const WIDTHS = [160, 320, 480, 640, 900] as const;

interface ArtworkImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'sizes'
> {
  artwork: ArtworkKey;
  /** Largura renderizada em CSS px (1x); o srcset cobre 2x. */
  size: number;
  alt: string;
  priority?: boolean;
}

/** Arte do NFT com variantes AVIF/WebP geradas por scripts/optimize-images.mjs. */
export function ArtworkImage({
  artwork,
  size,
  alt,
  priority = false,
  className,
  ...props
}: ArtworkImageProps) {
  const srcSet = (ext: 'avif' | 'webp') =>
    WIDTHS.map((w) => `/images/nfts/${artwork}-${w}.${ext} ${w}w`).join(', ');
  const fallbackWidth = WIDTHS.find((w) => w >= size * 2) ?? 900;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={`${size}px`} />
      <img
        src={`/images/nfts/${artwork}-${fallbackWidth}.webp`}
        srcSet={srcSet('webp')}
        sizes={`${size}px`}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block object-cover', className)}
        {...props}
      />
    </picture>
  );
}
