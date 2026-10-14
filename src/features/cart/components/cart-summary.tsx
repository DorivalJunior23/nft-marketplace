import { useId, useState, type FormEvent, type ReactNode } from 'react';

import { Shimmer } from '@/components/common/shimmer';
import type { Quote } from '@/contracts';
import { formatDiscount, formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

import { couponStore, useCouponCode } from '../quote';

interface CartSummaryProps {
  quote: Quote | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: unknown;
  /** Mobile: pílulas arredondadas (raio 40) como no Figma; desktop: cantos de 3px. */
  variant: 'desktop' | 'mobile';
  cta: ReactNode;
  heading?: boolean;
  notice?: ReactNode;
}

function CouponForm({
  quote,
  variant,
}: {
  quote: Quote | undefined;
  variant: 'desktop' | 'mobile';
}) {
  const id = useId();
  const current = useCouponCode();
  const [draft, setDraft] = useState(current);
  const applied = quote?.coupon?.status === 'applied';
  const problem =
    quote?.coupon && quote.coupon.status !== 'applied' ? quote.coupon.description : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    couponStore.set(draft.trim().toUpperCase());
  };

  const remove = () => {
    setDraft('');
    couponStore.set('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-label="Código promocional">
      <label
        htmlFor={id}
        className={cn(
          'text-cream text-[14px] leading-4 font-bold',
          variant === 'mobile' && 'sr-only',
        )}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex items-center overflow-hidden border',
          variant === 'desktop'
            ? 'border-primary h-10 rounded-[3px]'
            : 'border-border bg-surface-card h-[50px] rounded-full shadow-[0_6px_20px_rgb(10_6_4/0.45)]',
          problem && 'border-error',
        )}
      >
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          spellCheck={false}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `${id}-erro` : applied ? `${id}-ok` : undefined}
          className={cn(
            'text-cream placeholder:text-brand-secondary h-full min-w-0 flex-1 bg-transparent focus-visible:outline-none',
            variant === 'desktop'
              ? 'px-2 text-[12px] leading-4'
              : 'px-4 text-[13px] leading-[22px]',
          )}
          data-testid="coupon-input"
        />
        <button
          type="submit"
          className={cn(
            'focus-visible:ring-ring flex h-full shrink-0 items-center justify-center font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
            variant === 'desktop'
              ? 'bg-primary text-ink hover:bg-primary-light w-[102px] rounded-r-[3px] text-[15px] leading-4'
              : 'text-cream w-[97px] rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.54),#D28A4C)] text-[15px] leading-4',
          )}
        >
          Aplicar
        </button>
      </div>
      {problem ? (
        <p id={`${id}-erro`} role="alert" className="text-coral text-[13px] leading-4">
          {problem}
        </p>
      ) : applied ? (
        <p
          id={`${id}-ok`}
          role="status"
          className="text-success flex items-center justify-between gap-2 text-[13px] leading-4"
        >
          <span>
            {quote?.coupon?.code} aplicado: {quote?.coupon?.description}
          </span>
          <button
            type="button"
            onClick={remove}
            className="text-text-accent focus-visible:ring-ring hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Remover
          </button>
        </p>
      ) : null}
    </form>
  );
}

/** Resumo da carteira do Figma: cupom, subtotal, desconto, taxa de rede (estimada) e total. */
export function CartSummary({
  quote,
  isLoading,
  isRefreshing,
  error,
  variant,
  cta,
  heading = true,
  notice,
}: CartSummaryProps) {
  const valueClass = variant === 'desktop' ? 'text-[18px] leading-4' : 'text-[16px] leading-4';
  return (
    <section
      aria-labelledby="resumo-titulo"
      aria-busy={isLoading || isRefreshing || undefined}
      className={cn('flex flex-col', variant === 'desktop' ? 'w-[332px] gap-6' : 'gap-3')}
      data-testid="cart-summary"
    >
      <h2
        id="resumo-titulo"
        className={cn(
          'text-cream text-[18px] leading-4 font-bold',
          heading ? 'border-primary/30 border-b pb-3' : 'sr-only',
        )}
      >
        Resumo da carteira
      </h2>
      {notice}
      <CouponForm quote={quote} variant={variant} />
      <dl
        className={cn(
          'text-cream flex flex-col gap-3 text-[15px] leading-5 transition-opacity',
          isRefreshing && 'opacity-60',
        )}
      >
        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd className={valueClass} data-testid="summary-subtotal">
            {isLoading ? <Shimmer className="h-4 w-20" /> : quote ? formatEth(quote.subtotal) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Desconto do lançamento</dt>
          <dd data-testid="summary-discount">
            {isLoading ? (
              <Shimmer className="h-4 w-16" />
            ) : quote ? (
              formatDiscount(quote.discount)
            ) : (
              '(-) 00.00'
            )}
          </dd>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex w-full items-center justify-between">
            <dt>Taxa de rede</dt>
            <dd className={valueClass} data-testid="summary-fee">
              {isLoading ? (
                <Shimmer className="h-4 w-20" />
              ) : quote ? (
                formatEth(quote.networkFee)
              ) : (
                '—'
              )}
            </dd>
          </div>
          <p className="text-text-accent text-[12px] leading-4">Taxa estimada</p>
        </div>
        <div className="flex items-center justify-between pt-3">
          <dt className="text-[16px] leading-4 font-bold">Total</dt>
          <dd
            className="text-text-accent text-[18px] leading-4 font-bold"
            data-testid="summary-total"
          >
            {isLoading ? <Shimmer className="h-4 w-24" /> : quote ? formatEth(quote.total) : '—'}
          </dd>
        </div>
      </dl>
      {error ? (
        <p role="alert" className="text-coral text-[13px] leading-4">
          Não foi possível calcular a cotação. Tente novamente em instantes.
        </p>
      ) : null}
      {cta}
    </section>
  );
}
