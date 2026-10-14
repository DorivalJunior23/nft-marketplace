import { createFileRoute } from '@tanstack/react-router';

import { OrderPage } from '@/features/orders/order-page';

export const Route = createFileRoute('/pedidos/$orderId')({
  component: OrderRoute,
});

function OrderRoute() {
  const { orderId } = Route.useParams();
  return <OrderPage orderId={orderId} />;
}
