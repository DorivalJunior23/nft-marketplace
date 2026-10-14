import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/carrinho')({
  component: () => <PlaceholderPage title="carrinho" description="Em construção." />,
});
