import { expect, type Page } from '@playwright/test';

export const USERS = {
  nova: {
    email: 'nova.sato@kurio.app',
    password: 'Kurio@2026',
    displayName: 'Nova Sato',
    id: 'usr_nova',
  },
  caio: {
    email: 'caio.lima@kurio.app',
    password: 'Kurio@2026',
    displayName: 'Caio Lima',
    id: 'usr_caio',
  },
} as const;

/** Define o cenário dos mocks antes de qualquer script da página rodar. */
export async function applyScenario(page: Page, scenario: string): Promise<void> {
  await page.addInitScript((id) => {
    window.localStorage.setItem('kurio.mock.scenario', id);
  }, scenario);
}

/** Aguarda o MSW e a API de controle da simulação ficarem disponíveis. */
export async function waitForMocks(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean(window.__kurio?.mocks), null, { timeout: 15_000 });
}

export async function gotoApp(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await waitForMocks(page);
}

/** Login pela interface (modal no desktop, tela no mobile). */
export async function login(
  page: Page,
  user: (typeof USERS)[keyof typeof USERS] = USERS.nova,
  redirect?: string,
): Promise<void> {
  await gotoApp(page, redirect ? `/entrar?redirect=${encodeURIComponent(redirect)}` : '/entrar');
  const form = page.getByRole('form', { name: 'Entrar na conta' });
  await form.getByLabel('E-mail').fill(user.email);
  await form.getByLabel('Senha', { exact: true }).fill(user.password);
  await form.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/entrar/);
}

/** Adiciona um NFT ao carrinho pela API da simulação (com a sessão/carrinho atuais da página). */
export async function addToCartViaApi(
  page: Page,
  nftId: string,
  editionId = '1-50',
  quantity = 1,
): Promise<void> {
  const status = await page.evaluate(
    async ({ nftId, editionId, quantity }) => {
      const session = window.localStorage.getItem('kurio.session');
      const token = session ? (JSON.parse(session) as { token: string }).token : null;
      let guest = window.localStorage.getItem('kurio.guest-cart');
      if (!guest) {
        guest = crypto.randomUUID();
        window.localStorage.setItem('kurio.guest-cart', guest);
      }
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-guest-cart': guest,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nftId, editionId, quantity }),
      });
      return response.status;
    },
    { nftId, editionId, quantity },
  );
  expect(status).toBe(201);
}

/** Acesso à API de controle dos mocks (window.__kurio.mocks) a partir do teste. */
export function mocks(page: Page) {
  return {
    setScenario: (id: string) =>
      page.evaluate((scenario) => void window.__kurio?.mocks.scenario.set(scenario), id),
    increasePrice: (id: string, factor = 1.1) =>
      page.evaluate(
        ([nftId, f]) => void window.__kurio?.mocks.nft.increasePrice(nftId as string, f as number),
        [id, factor] as const,
      ),
    setAvailability: (id: string, editionId: string, available: number) =>
      page.evaluate(
        ([nftId, edition, qty]) =>
          void window.__kurio?.mocks.nft.setAvailability(
            nftId as string,
            edition as never,
            qty as number,
          ),
        [id, editionId, available] as const,
      ),
    republishNft: (id: string) =>
      page.evaluate((nftId) => void window.__kurio?.mocks.nft.republish(nftId), id),
    republishOrder: (id: string, stale = false) =>
      page.evaluate(
        ([orderId, s]) =>
          void window.__kurio?.mocks.orders.republish(orderId as string, { stale: s as boolean }),
        [id, stale] as const,
      ),
    dropSocket: () => page.evaluate(() => window.__kurio?.mocks.socket.dropConnections() ?? 0),
    socketConnections: () =>
      page.evaluate(() => window.__kurio?.mocks.socket.connectionCount() ?? 0),
    expireSessions: () => page.evaluate(() => void window.__kurio?.mocks.session.expireAll()),
    ordersOf: (userId: string) =>
      page.evaluate(
        (id) =>
          (window.__kurio?.mocks.orders.listForUser(id) ?? []).map((o) => ({
            id: o.id,
            status: o.status,
          })),
        userId,
      ),
  };
}

export const isMobile = (page: Page): boolean => (page.viewportSize()?.width ?? 1440) < 768;
