import { createFileRoute } from '@tanstack/react-router';

import { WalletsPage } from '@/features/account/wallets-page';
import { requireSession } from '@/features/auth/route-guard';

export const Route = createFileRoute('/carteiras')({
  beforeLoad: requireSession,
  component: WalletsPage,
});
