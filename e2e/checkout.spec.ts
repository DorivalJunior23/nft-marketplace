import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, gotoApp, isMobile, login, mocks, applyScenario } from './helpers';

async function startCheckout(page: Parameters<typeof login>[0], scenario = 'default') {
  if (scenario !== 'default') await applyScenario(page, scenario);
  await login(page, USERS.nova, '/');
  await addToCartViaApi(page, 'emerald-ape-0042', '1-50', 2);
  await gotoApp(page, '/pagamento');
  await expect(page.getByTestId('checkout-item')).toHaveCount(1);
  await expect(
    page.getByTestId(isMobile(page) ? 'checkout-total-mobile' : 'checkout-total'),
  ).toContainText('ETH');
}

test.describe('Compra', () => {
  test('compra completa do catálogo ao recibo confirmado', async ({ page }) => {
    await gotoApp(page, '/');
    await page
      .getByRole('link', { name: /Emerald Ape #0042, ver detalhes/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/nft\/emerald-ape-0042/);
    await page.getByRole('radio', { name: /Edição 1\/50/ }).click();
    await page.getByTestId('buy-button').click();
    await expect(page.getByText('adicionado ao carrinho')).toBeVisible();
    await gotoApp(page, '/carrinho');
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL(/\/entrar/);
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByLabel('E-mail').fill(USERS.nova.email);
    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password);
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/pagamento$/);

    await expect(page.getByTestId('checkout-item')).toHaveCount(1);
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Sato');
    await page.getByTestId('pay-button').click();
    await expect(page.getByTestId('connection-status')).toContainText('Carteira conectada');
    const dialog = page.getByTestId('review-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('review-total')).toHaveText('1.206 ETH');
    await dialog.getByTestId('confirm-order-button').click();

    await expect(page).toHaveURL(/\/pedidos\/ord_/);
    await expect(page.getByTestId('order-status')).toHaveText(/Pendente|Confirmado/);
    await expect(page.getByTestId('order-status')).toHaveText('Confirmado', { timeout: 15_000 });
    const receipt = page.getByTestId('order-receipt');
    await expect(receipt).toBeVisible();
    await expect(receipt.getByTestId('receipt-total')).toHaveText('1.206 ETH');
    await expect(receipt.getByTestId('receipt-transaction')).toHaveText(
      /^0x[0-9a-f]{4}…[0-9A-F]{4}$/,
    );
    await expect(receipt.getByTestId('receipt-item')).toHaveCount(1);

    // O recibo é um snapshot: mudar o catálogo depois não altera os valores.
    await mocks(page).increasePrice('emerald-ape-0042', 1.5);
    await page.reload();
    await expect(page.getByTestId('order-receipt').getByTestId('receipt-total')).toHaveText(
      '1.206 ETH',
    );
    await gotoApp(page, '/carrinho');
    await expect(
      page.getByRole('status').filter({ hasText: 'Seu carrinho está vazio' }),
    ).toBeVisible();
  });

  test('pagamento recusado preserva os itens no carrinho', async ({ page }) => {
    await startCheckout(page, 'payment-declined');
    await page.getByTestId('pay-button').click();
    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/pedidos\/ord_/);
    await expect(page.getByTestId('order-status')).toHaveText('Recusado', { timeout: 15_000 });
    await expect(page.getByText('A rede recusou a transação')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
  });

  test('clique repetido cria um único pedido', async ({ page }) => {
    await startCheckout(page);
    await page.getByTestId('pay-button').click();
    const confirm = page.getByTestId('confirm-order-button');
    await expect(confirm).toBeVisible();
    await confirm.click({ clickCount: 3, delay: 20 });
    await expect(page).toHaveURL(/\/pedidos\/ord_/);
    await expect(page.getByTestId('order-status')).toHaveText('Confirmado', { timeout: 15_000 });
    expect(await mocks(page).ordersOf(USERS.nova.id)).toHaveLength(1);
  });

  test('timeout após criar o pedido é recuperado pela chave de idempotência', async ({ page }) => {
    test.setTimeout(90_000);
    await startCheckout(page, 'order-timeout');
    await page.getByTestId('pay-button').click();
    await page.getByTestId('confirm-order-button').click();
    const dialog = page.getByTestId('review-dialog');
    await expect(dialog.getByRole('alert')).toContainText('demorou mais que o esperado', {
      timeout: 20_000,
    });
    expect(await mocks(page).ordersOf(USERS.nova.id)).toHaveLength(1);
    await dialog.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page).toHaveURL(/\/pedidos\/ord_/);
    await expect(page.getByTestId('order-status')).toHaveText('Confirmado', { timeout: 15_000 });
    expect(await mocks(page).ordersOf(USERS.nova.id)).toHaveLength(1);
  });

  test('preço alterado via Socket.IO durante o checkout exige nova confirmação', async ({
    page,
  }) => {
    await startCheckout(page);
    const totalId = isMobile(page) ? 'checkout-total-mobile' : 'checkout-total';
    await expect(page.getByTestId(totalId)).toHaveText('2.396 ETH');
    await page.getByTestId('pay-button').click();
    const dialog = page.getByTestId('review-dialog');
    await expect(dialog.getByTestId('review-total')).toHaveText('2.396 ETH');

    // Evento chega pelo socket.io-client real enquanto a revisão está aberta.
    await mocks(page).increasePrice('emerald-ape-0042', 1.1);
    await expect(page.getByTestId(totalId)).toHaveText('2.636 ETH');
    await dialog.getByTestId('confirm-order-button').click();
    await expect(page.getByTestId('quote-changed')).toBeVisible();
    await expect(page.getByTestId('pay-button')).toBeDisabled();
    expect(await mocks(page).ordersOf(USERS.nova.id)).toHaveLength(0);

    await page.getByRole('button', { name: 'Entendi, usar os novos valores' }).click();
    await expect(page.getByTestId('pay-button')).toBeEnabled();
    await page.getByTestId('pay-button').click();
    await expect(page.getByTestId('review-dialog').getByTestId('review-total')).toHaveText(
      '2.636 ETH',
    );
    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/pedidos\/ord_/);
  });

  test('edição esgotada durante o checkout bloqueia a confirmação', async ({ page }) => {
    await startCheckout(page);
    await mocks(page).setAvailability('emerald-ape-0042', '1-50', 0);
    await expect(page.getByTestId('pay-button')).toBeDisabled();
  });

  test('sessão expirada no checkout preserva o contexto para retomada', async ({ page }) => {
    await startCheckout(page, 'session-expiring');
    // No mobile os dados do colecionador ficam numa seção recolhida.
    if (isMobile(page)) await page.getByText('Dados do colecionador').click();
    await page
      .getByLabel('Observação do colecionador (opcional)')
      .fill('Entregar na carteira de reserva');
    await mocks(page).expireSessions();
    await page.getByTestId('pay-button').click();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/);
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByLabel('E-mail').fill(USERS.nova.email);
    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password);
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/pagamento$/);
    if (isMobile(page)) await page.getByText('Dados do colecionador').click();
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
      'Entregar na carteira de reserva',
    );
    await expect(page.getByTestId('checkout-item')).toHaveCount(1);
  });
});
