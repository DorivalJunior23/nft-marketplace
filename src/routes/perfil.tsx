import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/perfil')({
  component: () => <PlaceholderPage title="perfil" description="Em construção." />,
});
