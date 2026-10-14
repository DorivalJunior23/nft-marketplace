import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/pedidos')({
  component: () => <PlaceholderPage title="pedidos" description="Em construção." />,
});
