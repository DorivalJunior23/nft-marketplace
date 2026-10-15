import { expect, test } from '@playwright/test';

import { gotoApp, isMobile, useScenario } from './helpers';

test.describe('Catálogo', () => {
  test('busca, filtros combinados, ordenação e paginação ficam na URL e voltam pelo histórico', async ({
    page,
  }) => {
    await gotoApp(page, '/mercado');
    await expect(page.getByTestId('nft-card').first()).toBeVisible();

    if (isMobile(page)) {
      await page.getByRole('button', { name: /Abrir filtros/ }).click();
    }
    await page.getByLabel(/Música/).check();
    await expect(page).toHaveURL(/collection=musica/);
    await page.getByLabel(/Jogos/).check();
    await expect(page).toHaveURL(/collection=musica,jogos/);
    await page.getByLabel(/Ethereum/).check();
    await expect(page).toHaveURL(/network=ethereum/);
    if (isMobile(page)) {
      await page.getByRole('button', { name: 'Ver resultados' }).click();
    }

    const cards = page.getByTestId('nft-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(9);

    if (!isMobile(page)) {
      await page.getByRole('button', { name: /Ordenar por/ }).click();
      await page.getByRole('menuitemradio', { name: 'Menor preço' }).click();
      await expect(page).toHaveURL(/sort=price-asc/);
      // Página reinicia ao mudar filtro: vai para a página 2 e troca um filtro.
      const next = page
        .getByRole('link', { name: 'Página 2' })
        .or(page.getByRole('button', { name: 'Página 2' }));
      if (await next.count()) {
        await next.first().click();
        await expect(page).toHaveURL(/page=2/);
        await page.getByLabel(/Polygon/).check();
        await expect(page).not.toHaveURL(/page=2/);
      }
    }

    await page.goBack();
    await expect(page).toHaveURL(/collection=musica,jogos/);
    await page.reload();
    await expect(page).toHaveURL(/collection=musica,jogos/);
    if (isMobile(page)) await page.getByRole('button', { name: /Abrir filtros/ }).click();
    await expect(page.getByLabel(/Música/)).toBeChecked();
    await expect(page.getByLabel(/Jogos/)).toBeChecked();
  });

  test('busca por texto e resultado vazio com limpeza de filtros', async ({ page }) => {
    await gotoApp(page, '/mercado?q=nao-existe-xyz');
    await expect(
      page.getByRole('status').filter({ hasText: 'Nenhum NFT encontrado' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page).toHaveURL(/\/mercado$/);
    await expect(page.getByTestId('nft-card').first()).toBeVisible();
  });

  test('acesso direto ao detalhe e NFT inexistente', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-0042');
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #0042' })).toBeVisible();
    await expect(page.getByTestId('nft-price')).toContainText('1.19 ETH');

    await gotoApp(page, '/nft/nao-existe');
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible();
  });

  test('rota inexistente mostra página 404', async ({ page }) => {
    await gotoApp(page, '/rota-que-nao-existe');
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  });

  test('skeletons aparecem em rede lenta e erro permite nova tentativa', async ({ page }) => {
    await useScenario(page, 'slow');
    await page.goto('/mercado');
    await expect(page.getByTestId('nft-card-skeleton').first()).toBeVisible();
    await expect(page.getByTestId('nft-card').first()).toBeVisible({ timeout: 15_000 });

    await useScenario(page, 'server-error');
    await page.goto('/mercado');
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => window.__kurio?.mocks.scenario.set('default'));
    await alert.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByTestId('nft-card').first()).toBeVisible();
  });
});
