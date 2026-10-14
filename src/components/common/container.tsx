import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/** Largura útil do Figma: 1200px centralizados (1440 - 2 × 120). Abaixo disso, 24px de margem. */
export const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mx-auto w-full max-w-[1200px] px-6 md:px-10 xl:px-0', className)}
      {...props}
    />
  ),
);
Container.displayName = 'Container';
