import { createFileRoute } from '@tanstack/react-router';

import { Container } from '@/components/common/container';
import { CatalogSection } from '@/features/catalog/components/catalog-section';
import { catalogSearchSchema } from '@/features/catalog/search-params';
import { MobileHomePage } from '@/features/home/mobile-home-page';
import { useIsDesktop } from '@/hooks/use-media-query';

export const Route = createFileRoute('/mercado')({
  validateSearch: catalogSearchSchema,
  component: MarketPage,
});

function MarketPage() {
  const search = Route.useSearch();
  const isDesktop = useIsDesktop();
  if (!isDesktop) return <MobileHomePage search={search} route="/mercado" />;
  return (
    <Container className="flex flex-col gap-24 pt-8">
      <CatalogSection search={search} route="/mercado" />
    </Container>
  );
}
