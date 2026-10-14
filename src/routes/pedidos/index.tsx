import { createFileRoute } from '@tanstack/react-router';

import { OrdersListPage } from '@/features/orders/orders-list-page';

export const Route = createFileRoute('/pedidos/')({
  component: OrdersListPage,
});
