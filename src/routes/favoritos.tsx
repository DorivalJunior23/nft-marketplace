import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/favoritos')({
  component: () => <PlaceholderPage title="favoritos" description="Em construção." />,
});
