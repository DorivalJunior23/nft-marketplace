import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import type { RouterContext } from '@/app/router';
import { AppShell } from '@/components/layout/app-shell';
import { NotFoundPage } from '@/components/layout/not-found-page';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
});

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
