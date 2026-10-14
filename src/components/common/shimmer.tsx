import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Skeleton com shimmer. As dimensões vêm de quem usa (mesmas do conteúdo real),
 * para não deslocar o layout. Respeita prefers-reduced-motion via CSS global.
 */
export function Shimmer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--surface-card)_0%,var(--surface-raised)_45%,var(--surface-dark)_50%,var(--surface-raised)_55%,var(--surface-card)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
