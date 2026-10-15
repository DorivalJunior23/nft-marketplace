import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, gotoApp, isMobile, login, mocks } from './helpers';

test.describe('Tempo real', () => {
  test('nft.updated atualiza catálogo, detalhe e carrinho; duplicados e antigos são ignorados', async ({
    page,
  }) => {
    await gotoApp(page, '/');
    await addToCartViaApi(page, 'violet-nomad-0314', '1-50', 1);
    await gotoApp(page, '/carrinho');
    await expect(page.getByTestId('cart-item-total').first()).toHaveText('1.39 ETH');
    expect(await mocks(page).socketConnections()).toBe(1);

    await mocks(page).increasePrice('violet-nomad-0314', 1.1);
    await expect(page.getByTestId('cart-item-total').first()).toHaveText('1.53 ETH');
    await expect(page.getByTestId('summary-total')).toHaveText('1.546 ETH');
    await expect(page.getByTestId('cart-notices')).toContainText('mudou de 1.39 ETH para 1.53 ETH');

    // Duplicata (mesma versão) e evento antigo não geram novo aviso nem regridem o valor.
    await mocks(page).republishNft('violet-nomad-0314');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('cart-notices').locator('li')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-total').first()).toHaveText('1.53 ETH');

    await gotoApp(page, '/nft/violet-nomad-0314');
    await expect(page.getByTestId('nft-price')).toContainText('1.53 ETH');
    await gotoApp(page, '/mercado?q=Violet');
    await expect(page.getByTestId('nft-card').first()).toContainText('1.53 ETH');
  });

  test('desconexão reconcilia com o REST e pedido pendente é retomado após recarregar', async ({
    page,
  }) => {
    await login(page, USERS.nova, '/');
    await addToCartViaApi(page, 'golden-beat-0207', '1-50', 1);
    await gotoApp(page, '/pagamento');
    await page.getByTestId('pay-button').click();
    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/pedidos\/ord_/);

    // Queda do socket enquanto o pedido está pendente: nada é duplicado e o estado é recuperado.
    await mocks(page).dropSocket();
    await page.reload();
    await expect(page.getByTestId('order-status')).toHaveText('Confirmado', { timeout: 15_000 });
    expect(await mocks(page).ordersOf(USERS.nova.id)).toHaveLength(1);
    await expect.poll(() => mocks(page).socketConnections()).toBe(1);
  });

  test('eventos de pedido de outro usuário não chegam à sessão atual', async ({ page }) => {
    await login(page, USERS.nova, '/');
    await addToCartViaApi(page, 'golden-signal-0160', '1-50', 1);
    await gotoApp(page, '/pagamento');
    await page.getByTestId('pay-button').click();
    await page.getByTestId('confirm-order-button').click();
    await expect(page.getByTestId('order-status')).toHaveText('Confirmado', { timeout: 15_000 });
    const [order] = await mocks(page).ordersOf(USERS.nova.id);

    // Troca de usuário: sai pela interface (limpa cache e socket) e entra com outra conta.
    await gotoApp(page, '/pedidos');
    if (isMobile(page)) await page.getByRole('button', { name: 'Sair' }).click();
    else await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/$/);
    await login(page, USERS.caio, '/pedidos');
    await expect(
      page.getByRole('status').filter({ hasText: 'Você ainda não fez pedidos' }),
    ).toBeVisible();
    await mocks(page).republishOrder(order!.id);
    await page.waitForTimeout(500);
    await expect(page.getByTestId('orders-list')).toHaveCount(0);
  });
});
