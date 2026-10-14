import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/carteiras')({
  component: () => <PlaceholderPage title="carteiras" description="Em construção." />,
});
