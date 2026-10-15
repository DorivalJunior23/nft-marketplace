import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, applyScenario, gotoApp, isMobile, login, mocks } from './helpers';

test.describe('Conta e sessão', () => {
  test('cadastro cria sessão e conflito de e-mail é tratado', async ({ page }) => {
    await gotoApp(page, '/cadastro');
    const form = page.getByRole('form', { name: 'Criar conta' });
    await form.getByLabel('Nome de usuário').fill('novasato');
    await form.getByLabel('E-mail').fill(USERS.nova.email);
    await form.getByLabel('Senha', { exact: true }).fill('Senha@2026');
    await form.getByLabel('Confirmar senha').fill('Senha@2026');
    await form.getByRole('button', { name: /Criar (conta|perfil)/ }).click();
    await expect(
      form.getByRole('alert').filter({ hasText: 'Já existe uma conta com este e-mail.' }),
    ).toBeVisible();

    await form.getByLabel('Nome de usuário').fill('maria.lopes');
    await form.getByLabel('E-mail').fill('maria.lopes@kurio.app');
    await form.getByRole('button', { name: /Criar (conta|perfil)/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await gotoApp(page, '/perfil');
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('maria.lopes');
  });

  test('login com erro, login válido retorna ao fluxo anterior e sessão sobrevive ao refresh', async ({
    page,
  }) => {
    await gotoApp(page, '/perfil');
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/);
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByLabel('E-mail').fill(USERS.nova.email);
    await form.getByLabel('Senha', { exact: true }).fill('errada123');
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(form.getByRole('alert')).toContainText('E-mail ou senha inválidos.');

    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password);
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Sato');

    await page.reload();
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Sato');
  });

  test('sessão expirada leva ao login preservando a rota', async ({ page }) => {
    await applyScenario(page, 'session-expiring');
    await login(page, USERS.nova, '/carteiras');
    await expect(page).toHaveURL(/\/carteiras$/);
    await mocks(page).expireSessions();
    await gotoApp(page, '/perfil');
    await expect(page).toHaveURL(/\/entrar\?redirect=/);
    await expect(page.getByText('Sua sessão expirou')).toBeVisible();
  });

  test('logout e troca de usuário não vazam dados privados', async ({ page }) => {
    await login(page, USERS.nova, '/favoritos');
    await expect(page.getByTestId('nft-card').first()).toBeVisible();
    if (isMobile(page)) {
      await page.getByRole('button', { name: 'Sair' }).click();
    } else {
      await page.getByTestId('logout-button').click();
    }
    await expect(page).toHaveURL(/\/$/);
    // Sem sessão, qualquer rota privada volta ao login.
    await gotoApp(page, '/perfil');
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/);

    await login(page, USERS.caio, '/favoritos');
    await expect(
      page.getByRole('status').filter({ hasText: 'Nenhum NFT favoritado ainda' }),
    ).toBeVisible();
    await expect(page.getByTestId('nft-card')).toHaveCount(0);
  });

  test('rascunho do pagamento e cupom não passam para o próximo usuário da aba', async ({
    page,
  }) => {
    await login(page, USERS.nova, '/');
    await addToCartViaApi(page, 'emerald-ape-0042', '1-50', 1);
    await gotoApp(page, '/pagamento');
    if (isMobile(page)) await page.getByText('Dados do colecionador').click();
    const note = page.getByLabel('Observação do colecionador (opcional)');
    await note.fill('Segredo da Nova');
    await expect(note).toHaveValue('Segredo da Nova');
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem('kurio.checkout.draft')))
      .toContain('Segredo da Nova');
    await gotoApp(page, '/carrinho');
    await page.getByTestId('coupon-input').fill('KURIO10');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByTestId('summary-discount')).not.toHaveText(/0\.00/);
    expect(await page.evaluate(() => window.sessionStorage.getItem('kurio.coupon'))).toBe(
      'KURIO10',
    );

    await gotoApp(page, '/favoritos');
    if (isMobile(page)) {
      await page.getByRole('button', { name: 'Sair' }).click();
    } else {
      await page.getByTestId('logout-button').click();
    }
    await expect(page).toHaveURL(/\/$/);
    expect(
      await page.evaluate(() =>
        Object.keys(window.sessionStorage).filter((key) => key.startsWith('kurio.')),
      ),
    ).toEqual([]);

    await login(page, USERS.caio, '/');
    await addToCartViaApi(page, 'violet-nomad-0314', '1-50', 1);
    await gotoApp(page, '/pagamento');
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Caio Lima');
    if (isMobile(page)) await page.getByText('Dados do colecionador').click();
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('');
    await expect(page.getByTestId('checkout-item')).toHaveCount(1);
    await expect(page.getByText('KURIO10')).toHaveCount(0);
  });
});
