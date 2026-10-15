import type { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NETWORKS, WALLET_TYPES, type Cart, type Quote, type Wallet } from '@/contracts';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { formatDiscount, formatEth } from '@/lib/money';

import type { SubmitState } from '../use-checkout';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: Cart | undefined;
  quote: Quote | undefined;
  wallet: Wallet | null;
  network: string;
  email: string;
  submit: SubmitState;
  /** A cotação revalidada mudou depois da revisão (evento em tempo real). */
  quoteChanged?: boolean;
  onConfirm: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

/** Revisão antes do envio: itens, valores da cotação revalidada, carteira e rede. */
export function ReviewDialog({
  open,
  onOpenChange,
  cart,
  quote,
  wallet,
  network,
  email,
  submit,
  quoteChanged = false,
  onConfirm,
  triggerRef,
}: ReviewDialogProps) {
  const busy = submit.status === 'submitting';
  // Depois de um timeout o pedido já existe: a mudança de cotação vem da própria criação.
  const showQuoteChanged = quoteChanged && submit.status === 'idle';
  const returnFocus = useReturnFocus(triggerRef);
  const walletName =
    WALLET_TYPES.find((type) => type.id === wallet?.walletType)?.name ?? wallet?.walletAlias ?? '';
  const networkName = NETWORKS[network as keyof typeof NETWORKS]?.name ?? network;
  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="border-border bg-surface-card text-cream max-w-[520px] gap-6 p-8"
        data-testid="review-dialog"
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-cream text-[22px] leading-[29px] font-bold">
            Revisar pedido
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-[14px] leading-6">
            Confira os valores revalidados agora e confirme o envio. A carteira está conectada e
            nada será cobrado de verdade nesta simulação.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto text-[14px] leading-5">
          {cart?.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="truncate">
                {item.nft.name} <span className="text-text-secondary">(x {item.quantity})</span>
              </span>
              <span className="text-text-accent shrink-0 font-bold">
                {formatEth(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="border-primary/30 flex flex-col gap-2 border-t pt-4 text-[14px] leading-5">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{quote ? formatEth(quote.subtotal) : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto</dt>
            <dd>{quote ? formatDiscount(quote.discount) : '(-) 00.00'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{quote ? formatEth(quote.networkFee) : '—'}</dd>
          </div>
          <div className="flex justify-between text-[16px] font-bold">
            <dt>Total</dt>
            <dd className="text-text-accent" data-testid="review-total">
              {quote ? formatEth(quote.total) : '—'}
            </dd>
          </div>
          <div className="text-text-secondary flex justify-between pt-2">
            <dt>Carteira</dt>
            <dd className="text-right">
              {walletName} · {networkName}
              <br />
              <span className="text-[12px]">{wallet?.address}</span>
            </dd>
          </div>
          <div className="text-text-secondary flex justify-between">
            <dt>Recibo para</dt>
            <dd>{email}</dd>
          </div>
        </dl>
        {showQuoteChanged ? (
          <p
            role="alert"
            className="border-amber/60 bg-amber/10 text-cream rounded-[4px] border px-3 py-2 text-[13px] leading-4"
            data-testid="review-quote-changed"
          >
            Preço, disponibilidade ou taxas mudaram enquanto você revisava. Volte para conferir os
            novos valores antes de confirmar.
          </p>
        ) : submit.status === 'timeout' || submit.status === 'error' ? (
          <p
            role="alert"
            className="border-amber/60 bg-amber/10 text-cream rounded-[4px] border px-3 py-2 text-[13px] leading-4"
          >
            {submit.message}
          </p>
        ) : null}
        <DialogFooter className="gap-3 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Voltar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            data-testid="confirm-order-button"
          >
            {busy
              ? 'Enviando pedido…'
              : showQuoteChanged
                ? 'Revisar novos valores'
                : submit.status === 'timeout'
                  ? 'Tentar novamente'
                  : 'Confirmar compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
