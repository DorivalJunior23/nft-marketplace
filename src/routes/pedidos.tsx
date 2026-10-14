import { createFileRoute, Outlet } from '@tanstack/react-router';

import { requireSession } from '@/features/auth/route-guard';

export const Route = createFileRoute('/pedidos')({
  beforeLoad: requireSession,
  component: () => <Outlet />,
});
