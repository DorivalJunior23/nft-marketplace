import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/criadores')({
  component: () => (
    <PlaceholderPage
      title="Criadores"
      description="Esta área não faz parte desta versão do marketplace. Explore o catálogo para descobrir NFTs selecionados."
    />
  ),
});
