import { useId } from 'react';

import { WALLET_TYPES, type WalletType } from '@/contracts';
import { cn } from '@/lib/utils';

interface WalletTypeOptionsProps {
  value: WalletType | '';
  onChange: (value: WalletType) => void;
  variant: 'desktop' | 'mobile';
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px]',
        selected ? 'border-primary' : 'border-border-soft',
      )}
    >
      {selected ? <span className="bg-primary size-2 rounded-full" /> : null}
    </span>
  );
}

/** "Carteira e rede" do Figma: WalletConnect (selo de marcas), MetaMask e Coinbase Wallet. */
export function WalletTypeOptions({ value, onChange, variant }: WalletTypeOptionsProps) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex flex-col gap-4">
      <p
        id={id}
        className={cn(
          'text-cream',
          variant === 'desktop'
            ? 'text-center text-[17px] leading-4 font-bold'
            : 'text-[16px] leading-4 font-bold',
        )}
      >
        Carteira e rede
      </p>
      {WALLET_TYPES.map((type) => {
        const selected = value === type.id;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type.id)}
            className={cn(
              'focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-3 border text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              variant === 'desktop'
                ? cn(
                    'h-[45px] rounded-[3px] px-3',
                    selected ? 'border-primary' : 'border-border hover:border-border-soft',
                  )
                : cn(
                    'bg-surface-card h-[65px] rounded-[15px] border-transparent px-3.5 shadow-[0_0_20px_rgb(10_6_4/0.45)]',
                    selected && 'border-primary',
                  ),
            )}
            data-testid={`wallet-type-${type.id}`}
          >
            {variant === 'mobile' ? (
              <span
                className="border-border bg-surface-raised text-text-accent flex size-10 shrink-0 items-center justify-center rounded-full border text-[14px] leading-[18px] font-bold"
                aria-hidden="true"
              >
                {type.name.charAt(0)}
              </span>
            ) : (
              <Radio selected={selected} />
            )}
            {type.id === 'walletconnect' && variant === 'desktop' ? (
              <span className="border-border-soft bg-surface-dark text-text-accent flex h-[26px] items-center rounded-[6px] border px-2 text-[9px] leading-3 font-bold tracking-[0.1px]">
                METAMASK&nbsp;&nbsp;•&nbsp;&nbsp;WALLETCONNECT&nbsp;&nbsp;•&nbsp;&nbsp;COINBASE
                <span className="sr-only"> (WalletConnect)</span>
              </span>
            ) : (
              <span
                className={cn(
                  'text-cream flex-1',
                  variant === 'desktop' ? 'text-[15px] leading-5' : 'text-[14px] leading-4',
                )}
              >
                {type.name}
              </span>
            )}
            {variant === 'mobile' ? <Radio selected={selected} /> : null}
          </button>
        );
      })}
    </div>
  );
}
