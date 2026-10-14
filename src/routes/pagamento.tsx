import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/pagamento')({
  component: () => <PlaceholderPage title="pagamento" description="Em construção." />,
});
