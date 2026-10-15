import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, gotoApp, login } from './helpers';

/** Regressão visual com dados estáveis (cenário padrão, fixtures determinísticas, animações desligadas). */
test.describe('Regressão visual', () => {
  test('início', async ({ page }) => {
    await gotoApp(page, '/');
    await expect(page.getByTestId('nft-card').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('inicio.png', {
      fullPage: true,
      mask: [page.getByTestId('scenario-panel-button')],
    });
  });

  test('detalhe', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-0042');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('detalhe.png', {
      fullPage: true,
      mask: [page.getByTestId('scenario-panel-button')],
    });
  });

  test('carrinho', async ({ page }) => {
    await gotoApp(page, '/');
    await addToCartViaApi(page, 'emerald-ape-0042', '1-50', 2);
    await addToCartViaApi(page, 'violet-nomad-0314', '1-10', 1);
    await gotoApp(page, '/carrinho');
    await expect(page.getByTestId('summary-total')).toContainText('ETH');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('carrinho.png', {
      fullPage: true,
      mask: [page.getByTestId('scenario-panel-button')],
    });
  });

  test('pagamento', async ({ page }) => {
    await login(page, USERS.nova, '/');
    await addToCartViaApi(page, 'emerald-ape-0042', '1-50', 2);
    await gotoApp(page, '/pagamento');
    await expect(page.getByTestId('checkout-item')).toHaveCount(1);
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Sato');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('pagamento.png', {
      fullPage: true,
      mask: [page.getByTestId('scenario-panel-button')],
    });
  });
});
