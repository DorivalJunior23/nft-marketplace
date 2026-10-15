import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, gotoApp, isMobile, login } from './helpers';

test.describe('Carrinho', () => {
  test('adicionar, alterar quantidade, remover, cupom e persistência após refresh', async ({
    page,
  }) => {
    await gotoApp(page, '/nft/emerald-ape-0042');
    await page.getByRole('radio', { name: /Edição 1\/50/ }).click();
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await page.getByTestId('buy-button').click();
    await expect(page.getByText('adicionado ao carrinho')).toBeVisible();

    await gotoApp(page, '/carrinho');
    const item = page.getByTestId('cart-item').first();
    await expect(item).toContainText('Emerald Ape #0042');
    await expect(item.getByRole('status')).toHaveText('2');
    await expect(page.getByTestId('summary-subtotal')).toHaveText('2.38 ETH');
    await expect(page.getByTestId('summary-total')).toHaveText('2.396 ETH');

    await item.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await expect(item.getByRole('status')).toHaveText('3');
    await expect(page.getByTestId('summary-subtotal')).toHaveText('3.57 ETH');

    await page.getByTestId('coupon-input').fill('EXPIRADO');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'expirou' })).toBeVisible();
    await page.getByTestId('coupon-input').fill('INVALIDO');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'inválido' })).toBeVisible();
    await page.getByTestId('coupon-input').fill('KURIO10');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByTestId('summary-discount')).toHaveText('(-) 0.357 ETH');
    await expect(page.getByTestId('summary-total')).toHaveText('3.229 ETH');

    await page.reload();
    await expect(page.getByTestId('cart-item').first().getByRole('status')).toHaveText('3');
    await expect(page.getByTestId('summary-total')).toHaveText('3.229 ETH');
    await page.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(page.getByTestId('summary-discount')).toHaveText('(-) 00.00');

    await page.getByRole('button', { name: /Remover Emerald Ape/ }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Seu carrinho está vazio' }),
    ).toBeVisible();
  });

  test('itens do visitante são preservados ao autenticar', async ({ page }) => {
    await gotoApp(page, '/');
    await addToCartViaApi(page, 'golden-beat-0207', '1-50', 1);
    await gotoApp(page, '/carrinho');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/);
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByLabel('E-mail').fill(USERS.caio.email);
    await form.getByLabel('Senha', { exact: true }).fill(USERS.caio.password);
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/pagamento$/);
    await gotoApp(page, '/carrinho');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item').first()).toContainText('Golden Beat #0207');
  });

  test('disponibilidade limita a quantidade', async ({ page }) => {
    test.skip(
      isMobile(page),
      'no mobile o stepper mantém o mesmo comportamento; verificado no desktop',
    );
    await login(page, USERS.nova, '/nft/emerald-ape-0042');
    await page.getByRole('radio', { name: /Edição 1\/1\b/ }).click();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled();
  });
});
