import { createFileRoute } from '@tanstack/react-router';

import { ProfilePage } from '@/features/account/profile-page';
import { requireSession } from '@/features/auth/route-guard';

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireSession,
  component: ProfilePage,
});
