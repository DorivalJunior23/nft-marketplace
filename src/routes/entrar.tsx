import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: () => <PlaceholderPage title="Entrar" description="Em construção." />,
});
