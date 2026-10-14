import { createFileRoute } from '@tanstack/react-router';

import { catalogSearchSchema } from '@/features/catalog/search-params';
import { HomePage } from '@/features/home/home-page';

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: IndexRoute,
});

function IndexRoute() {
  const search = Route.useSearch();
  return <HomePage search={search} />;
}
