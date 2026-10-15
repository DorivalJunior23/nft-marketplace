import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { RealtimeProvider } from '@/realtime/realtime-provider';

import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

/**
 * Carregado dinamicamente depois dos mocks: o socket.io-client guarda a referência global de
 * WebSocket ao ser importado, então ele só pode ser avaliado após o MSW instalar a interceptação.
 */
export function renderApp(): void {
  const queryClient = createQueryClient();
  // Exposto para inspeção nos testes E2E (cache de consultas); não é usado pela aplicação.
  (window as Window & { __kurioQueryClient?: unknown }).__kurioQueryClient = queryClient;
  const router = createAppRouter(queryClient);

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Elemento #root não encontrado no documento.');

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
