import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

/** Wordmark "KURIO": 14px, bold, espaçamento de 10% (1.4px), como no Figma. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'text-cream inline-flex h-[34px] items-center text-[14px] leading-[18px] font-bold tracking-[1.4px] uppercase',
        className,
      )}
      aria-label="Kurio, página inicial"
    >
      KURIO
    </Link>
  );
}
