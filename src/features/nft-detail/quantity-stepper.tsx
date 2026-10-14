import { useId } from 'react';

import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  /** Mobile: botões de 20x30 e valor 18px; desktop: 33x50 e valor 20px. */
  size?: 'md' | 'sm';
  label?: string;
  disabled?: boolean;
}

/** Stepper do Figma: botões ovais laranja com "−" e "+" pretos e o valor entre eles. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  size = 'md',
  label = 'Quantidade',
  disabled = false,
}: QuantityStepperProps) {
  const id = useId();
  const canDecrease = value > min && !disabled;
  const canIncrease = value < max && !disabled;
  const buttonClass = cn(
    'flex items-center justify-center rounded-full border border-ink bg-primary text-black shadow-[0_6.6px_19.8px_rgb(20_13_10/0.15)] transition-colors hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
    size === 'md' ? 'h-[50px] w-[33px]' : 'h-[30px] w-5',
  );
  return (
    <div
      className={cn('flex items-center', size === 'md' ? 'gap-3' : 'gap-3')}
      role="group"
      aria-labelledby={id}
    >
      <span id={id} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Diminuir quantidade"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 15 2"
          className={size === 'md' ? 'h-0.5 w-[15px]' : 'h-px w-[9px]'}
          fill="currentColor"
        >
          <rect width="15" height="2" rx="1" />
        </svg>
      </button>
      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn(
          'text-cream min-w-[13px] text-center tabular-nums',
          size === 'md' ? 'text-[20px] leading-7' : 'text-[18px] leading-[25px] font-medium',
        )}
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Aumentar quantidade"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 15 15"
          className={size === 'md' ? 'size-[15px]' : 'size-[9px]'}
          fill="currentColor"
        >
          <rect x="6.5" width="2" height="15" rx="1" />
          <rect y="6.5" width="15" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
}
