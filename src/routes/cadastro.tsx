import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/cadastro')({
  component: () => <PlaceholderPage title="cadastro" description="Em construção." />,
});
