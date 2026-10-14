import { createFileRoute } from '@tanstack/react-router';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/em-breve')({
  component: () => (
    <PlaceholderPage
      title="Em breve"
      description="Esta área não faz parte desta versão do marketplace. Explore o catálogo para descobrir NFTs selecionados."
    />
  ),
});
