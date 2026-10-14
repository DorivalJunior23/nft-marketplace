import '@fontsource-variable/roboto-mono';
import '@/styles/globals.css';

import { enableMocks } from '@/mocks/enable';

async function bootstrap(): Promise<void> {
  // Os mocks (REST e WebSocket) precisam estar ativos antes de qualquer módulo da aplicação
  // ser avaliado; por isso a aplicação é importada dinamicamente depois.
  await enableMocks();
  const { renderApp } = await import('@/app/render');
  renderApp();
}

void bootstrap();
