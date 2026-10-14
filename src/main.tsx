import '@fontsource-variable/roboto-mono';
import '@/styles/globals.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { enableMocks } from '@/mocks/enable';

async function bootstrap(): Promise<void> {
  // Os mocks precisam estar ativos antes da primeira consulta.
  await enableMocks();

  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Elemento #root não encontrado no documento.');

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
