import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Shimmer } from '@/components/common/shimmer';
import type { Cart, Quote } from '@/contracts';
import { formatDiscount, formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

interface OrderItemsSummaryProps {
  cart: Cart | undefined;
  quote: Quote | undefined;
  isLoading: boolean;
  couponCode: string;
  compact?: boolean;
}

/** "Seus NFTs" do pagamento (Figma): itens com (x qtd) e subtotal, totais centralizados. */
export function OrderItemsSummary({
  cart,
  quote,
  isLoading,
  couponCode,
  compact = false,
}: OrderItemsSummaryProps) {
  const items = cart?.items ?? [];
  return (
    <section aria-labelledby="seus-nfts" className="flex flex-col gap-3">
      <h2 id="seus-nfts" className="text-cream text-[17px] leading-4 font-bold">
        Seus NFTs
      </h2>
      <div className="border-primary/30 text-cream flex items-center justify-between border-b pb-3 text-[16px] leading-4">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul className="flex flex-col gap-3" data-testid="checkout-items">
        {isLoading
          ? ['a', 'b'].map((key) => (
              <li key={key}>
                <Shimmer className="h-[70px] w-full rounded-none" />
              </li>
            ))
          : items.map((item) => (
              <li
                key={item.id}
                className="bg-surface-card flex h-[70px] items-center gap-2 pr-4 pl-1"
                data-testid="checkout-item"
              >
                <ArtworkImage
                  artwork={item.nft.artwork}
                  size={70}
                  alt=""
                  className="size-[70px] rounded-[8px]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="text-cream truncate text-[16px] leading-4 font-bold">
                    {item.nft.name}
                  </p>
                  <p className="text-brand-secondary text-[14px] leading-4">
                    ID do token: {item.nft.tokenId}
                  </p>
                </div>
                <p className="flex items-center gap-4 text-right">
                  <span className="text-text-secondary text-[14px] leading-4">
                    (x {item.quantity})
                  </span>
                  <span className="text-text-accent text-[18px] leading-4 font-bold">
                    {formatEth(item.lineTotal)}
                  </span>
                </p>
              </li>
            ))}
      </ul>
      <div
        className={cn('text-cream flex flex-col gap-3 text-[15px] leading-5', compact && 'pt-2')}
      >
        <p className="text-center text-[14px] leading-4">
          {couponCode ? (
            <>
              Cupom <span className="text-text-accent font-bold">{couponCode}</span>{' '}
              {quote?.coupon?.status === 'applied'
                ? 'aplicado.'
                : quote?.coupon
                  ? `não aplicado: ${quote.coupon.description}`
                  : ''}
            </>
          ) : (
            <>
              Tem um código promocional?{' '}
              <Link to="/carrinho" className="text-text-accent hover:underline">
                Aplique aqui
              </Link>
            </>
          )}
        </p>
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-[18px] leading-4" data-testid="checkout-subtotal">
            {quote ? formatEth(quote.subtotal) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Desconto do lançamento</span>
          <span data-testid="checkout-discount">
            {quote ? formatDiscount(quote.discount) : '(-) 00.00'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Taxa de rede</span>
          <span className="text-[18px] leading-4" data-testid="checkout-fee">
            {quote ? formatEth(quote.networkFee) : '—'}
          </span>
        </div>
        <p className="text-text-accent text-center text-[12px] leading-4">Taxa estimada</p>
        <div className="border-primary/30 border-t pt-3">
          <div className="mx-auto flex w-[321px] max-w-full items-center justify-between">
            <span className="text-[16px] leading-4 font-bold">Total</span>
            <span
              className="text-text-accent text-[18px] leading-4 font-bold"
              data-testid="checkout-total"
            >
              {quote ? formatEth(quote.total) : '—'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
