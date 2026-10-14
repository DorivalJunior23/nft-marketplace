import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { isApiClientError } from '@/api';
import { Container } from '@/components/common/container';
import { ErrorState } from '@/components/common/query-state';
import { Shimmer } from '@/components/common/shimmer';
import { NotFoundPage } from '@/components/layout/not-found-page';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Order } from '@/contracts';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatEth } from '@/lib/money';
import { useRealtime } from '@/realtime/hooks';
import { cn } from '@/lib/utils';

import { formatReceiptDate } from './format';
import { OrderReceipt } from './order-receipt';
import { useOrder } from './queries';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Recusado',
};

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[13px] leading-4 font-bold',
        status === 'confirmed' && 'border-success/60 text-success',
        status === 'declined' && 'border-error/60 text-coral',
        status === 'pending' && 'border-amber/60 text-amber',
      )}
      data-testid="order-status"
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 rounded-full',
          status === 'confirmed'
            ? 'bg-success'
            : status === 'declined'
              ? 'bg-error'
              : 'bg-amber animate-pulse',
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function OrderStatusCard({ order }: { order: Order }) {
  const { status: realtime } = useRealtime();
  return (
    <section
      aria-labelledby="pedido-titulo"
      className="bg-surface-card flex flex-col gap-5 rounded-[8px] p-6"
      data-testid="order-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="pedido-titulo" className="text-cream text-[22px] leading-[29px] font-bold">
          Pedido {order.receipt.transactionId}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-text-secondary text-[14px] leading-6" role="status" aria-live="polite">
        {order.status === 'pending'
          ? `Aguardando confirmação na rede. ${realtime === 'connected' ? 'Você será avisado assim que a transação for processada.' : 'Sem conexão em tempo real no momento; continuamos verificando o pedido periodicamente.'}`
          : order.status === 'confirmed'
            ? `Transação confirmada em ${formatReceiptDate(order.updatedAt)}. Os NFTs foram transferidos para sua carteira.`
            : (order.declineReason ?? 'A transação foi recusada pela rede.')}
      </p>
      <ul className="text-cream flex flex-col gap-2 text-[14px] leading-5">
        {order.receipt.items.map((item) => (
          <li key={`${item.nftId}-${item.editionId}`} className="flex items-center justify-between">
            <span>
              {item.name} <span className="text-text-secondary">(x {item.quantity})</span>
            </span>
            <span className="text-text-accent font-bold">{formatEth(item.lineTotal)}</span>
          </li>
        ))}
        <li className="border-primary/30 flex items-center justify-between border-t pt-2 text-[16px] font-bold">
          <span>Total</span>
          <span className="text-text-accent">{formatEth(order.receipt.total)}</span>
        </li>
      </ul>
      <div className="flex flex-wrap gap-3">
        {order.status === 'declined' ? (
          <Button asChild size="sm">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link to="/pedidos">Meus pedidos</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/mercado">Continuar explorando</Link>
        </Button>
      </div>
    </section>
  );
}

/** Página do pedido: pendente (polling + socket), confirmado (recibo do Figma) ou recusado. */
export function OrderPage({ orderId }: { orderId: string }) {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const [receiptDismissed, setReceiptDismissed] = useState(false);

  if (order.isPending) {
    return (
      <Container className="pt-8" aria-busy="true" aria-label="Carregando pedido">
        <Shimmer className="h-48 w-full rounded-[8px]" />
      </Container>
    );
  }
  if (order.isError) {
    if (
      isApiClientError(order.error) &&
      (order.error.status === 404 || order.error.status === 403)
    ) {
      return (
        <NotFoundPage
          title="Pedido não encontrado"
          description="Este pedido não existe ou pertence a outra conta."
        />
      );
    }
    return (
      <Container className="pt-8">
        <ErrorState
          error={order.error}
          onRetry={() => void order.refetch()}
          title="Não foi possível carregar o pedido"
        />
      </Container>
    );
  }

  const data = order.data;
  const showReceipt = data.status === 'confirmed' && !receiptDismissed;

  return (
    <Container className={cn('flex flex-col gap-8', isDesktop ? 'pt-8' : 'pt-6 pb-10')}>
      <OrderStatusCard order={data} />
      {showReceipt && isDesktop ? (
        <Dialog open onOpenChange={(open) => (open ? undefined : setReceiptDismissed(true))}>
          <DialogContent
            showCloseButton={false}
            className="bg-surface-card shadow-float block max-h-[92dvh] w-[578px] max-w-[calc(100%-2rem)] overflow-y-auto rounded-none border-0 p-0 sm:max-w-[578px]"
          >
            <DialogTitle className="sr-only">Pedido confirmado</DialogTitle>
            <OrderReceipt order={data} layout="modal" onClose={() => setReceiptDismissed(true)} />
          </DialogContent>
        </Dialog>
      ) : null}
      {showReceipt && !isDesktop ? <OrderReceipt order={data} layout="sheet" /> : null}
      {data.status === 'confirmed' && receiptDismissed ? (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => setReceiptDismissed(false)}
        >
          Ver recibo
        </Button>
      ) : null}
      {data.status === 'confirmed' ? (
        <button type="button" className="sr-only" onClick={() => void navigate({ to: '/pedidos' })}>
          Ir para meus pedidos
        </button>
      ) : null}
    </Container>
  );
}
