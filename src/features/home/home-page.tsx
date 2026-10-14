import { Container } from '@/components/common/container';
import { CatalogSection } from '@/features/catalog/components/catalog-section';
import type { CatalogSearch } from '@/features/catalog/search-params';
import { useIsDesktop } from '@/hooks/use-media-query';

import { BlogSection } from './blog-section';
import { HeroSection } from './hero-section';
import { MobileHomePage } from './mobile-home-page';
import { PromoSection } from './promo-section';

export function HomePage({ search }: { search: CatalogSearch }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return <MobileHomePage search={search} />;
  return (
    <Container className="flex flex-col gap-24 pt-8">
      <HeroSection />
      <CatalogSection search={search} route="/" showFeatured />
      <PromoSection />
      <BlogSection />
    </Container>
  );
}
