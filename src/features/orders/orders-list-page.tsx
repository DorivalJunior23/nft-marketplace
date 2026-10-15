import { Link } from '@tanstack/react-router';

import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Shimmer } from '@/components/common/shimmer';
import { Button } from '@/components/ui/button';
import { AccountLayout } from '@/features/account/account-layout';
import { formatEth } from '@/lib/money';

import { formatReceiptDate } from './format';
import { OrderStatusBadge } from './order-page';
import { useOrders } from './queries';

/** "Atividade" da conta: lista de pedidos com estado e total. */
export function OrdersListPage() {
  const orders = useOrders();
  return (
    <AccountLayout title="Atividade">
      <h1 className="text-cream text-[16px] leading-4 font-bold">Meus pedidos</h1>
      {orders.isPending ? (
        <div
          className="flex flex-col gap-3"
          role="status"
          aria-busy="true"
          aria-label="Carregando pedidos"
        >
          <Shimmer className="h-16 w-full" />
          <Shimmer className="h-16 w-full" />
        </div>
      ) : orders.isError ? (
        <ErrorState
          error={orders.error}
          onRetry={() => void orders.refetch()}
          title="Não foi possível carregar seus pedidos"
        />
      ) : orders.data.length === 0 ? (
        <EmptyState
          title="Você ainda não fez pedidos"
          action={
            <Button asChild size="sm">
              <Link to="/mercado">Explorar o mercado</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" data-testid="orders-list">
          {orders.data.map((order) => (
            <li key={order.id}>
              <Link
                to="/pedidos/$orderId"
                params={{ orderId: order.id }}
                className="bg-surface-card hover:bg-surface-raised focus-visible:ring-ring flex flex-wrap items-center justify-between gap-3 rounded-[8px] px-5 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-cream text-[16px] leading-5 font-bold">
                    {order.receipt.transactionId}
                  </span>
                  <span className="text-text-secondary text-[13px] leading-4">
                    {formatReceiptDate(order.createdAt)} · {order.receipt.items.length}{' '}
                    {order.receipt.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-text-accent text-[16px] leading-4 font-bold">
                    {formatEth(order.receipt.total)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
