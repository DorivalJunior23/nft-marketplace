import { createFileRoute } from '@tanstack/react-router';

import { FavoritesPage } from '@/features/account/favorites-page';
import { requireSession } from '@/features/auth/route-guard';

export const Route = createFileRoute('/favoritos')({
  beforeLoad: requireSession,
  component: FavoritesPage,
});
