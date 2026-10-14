import type { HTMLAttributes } from 'react';

import type { EthAmount } from '@/contracts';
import { formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

interface EthPriceProps extends HTMLAttributes<HTMLSpanElement> {
  value: EthAmount;
  compareAt?: EthAmount | null;
}

/** Preço em ETH como no Figma: valor em laranja (Text/Accent) e preço anterior em Secondary. */
export function EthPrice({ value, compareAt, className, ...props }: EthPriceProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)} {...props}>
      <span className="text-text-accent font-bold">{formatEth(value)}</span>
      {compareAt ? (
        <span className="text-brand-secondary font-normal">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
