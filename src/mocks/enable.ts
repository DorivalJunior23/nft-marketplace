export const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true';

/**
 * Ativa a camada de mocks (REST + Socket.IO) antes de renderizar a aplicação.
 * Controlada por VITE_ENABLE_MOCKS; presente também no build de demonstração.
 */
export async function enableMocks(): Promise<void> {
  if (!MOCKS_ENABLED) return;
  const [{ initDb }, { resumePendingOrders }, { worker }, { installDevApi }] = await Promise.all([
    import('./db/store'),
    import('./services/orders'),
    import('./browser'),
    import('./dev-api'),
  ]);
  await initDb();
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
  resumePendingOrders();
  installDevApi();
}
