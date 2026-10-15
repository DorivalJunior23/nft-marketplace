import { expect, test } from '@playwright/test';

import { USERS, gotoApp, login, mocks } from './helpers';

test.describe('Favoritos', () => {
  test('favoritar persiste para o usuário e falha de mutation faz rollback', async ({ page }) => {
    await login(page, USERS.caio, '/nft/emerald-ape-0042');
    const button = page.getByTestId('favorite-button');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Adicionado à sua lista de interesse.')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

    await mocks(page).setScenario('favorites-fail');
    await page.getByTestId('favorite-button').click();
    await expect(page.getByText('Não foi possível atualizar seus favoritos')).toBeVisible();
    await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

    await mocks(page).setScenario('default');
    await gotoApp(page, '/favoritos');
    await expect(page.getByTestId('nft-card')).toHaveCount(1);
  });

  test('visitante é levado ao login ao favoritar e volta ao NFT', async ({ page }) => {
    await gotoApp(page, '/nft/sage-nomad-0009');
    await page.getByTestId('favorite-button').click();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnft%2Fsage-nomad-0009/);
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByLabel('E-mail').fill(USERS.caio.email);
    await form.getByLabel('Senha', { exact: true }).fill(USERS.caio.password);
    await form.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/nft\/sage-nomad-0009$/);
  });
});
