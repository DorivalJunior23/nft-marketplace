import { expect, test } from '@playwright/test';

import { USERS, addToCartViaApi, gotoApp, isMobile, login } from './helpers';

test.describe('Acessibilidade', () => {
  test('skip link, navegação por teclado e foco visível', async ({ page }) => {
    test.skip(isMobile(page), 'o skip link e o cabeçalho desktop não existem na composição mobile');
    await gotoApp(page, '/');
    await expect(page.getByTestId('nft-card').first()).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo principal' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#conteudo')).toBeFocused();

    await page.keyboard.press('Tab');
    const first = page.locator(':focus');
    await expect(first).toBeVisible();
    const ring = await first.evaluate(
      (element) =>
        getComputedStyle(element).boxShadow !== 'none' ||
        getComputedStyle(element).outlineStyle !== 'none',
    );
    expect(ring).toBe(true);
  });

  test('diálogo de busca prende o foco, fecha com Escape e devolve o foco ao gatilho', async ({
    page,
  }) => {
    test.skip(isMobile(page), 'a busca global em diálogo é desktop');
    await gotoApp(page, '/');
    const trigger = page.getByRole('button', { name: 'Buscar NFTs' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('Sheet de filtros no mobile prende o foco, fecha com Escape e devolve o foco', async ({
    page,
  }) => {
    test.skip(!isMobile(page), 'o Sheet de filtros é a composição mobile');
    await gotoApp(page, '/');
    const trigger = page.getByRole('button', { name: /Abrir filtros/ });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: 'Filtros' });
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(':focus')).toHaveCount(1);
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    await expect(sheet.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('pílulas de edição seguem o padrão de rádio: setas movem a seleção', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-0042');
    const group = page.getByRole('radiogroup', { name: 'Edição:' });
    const first = group.getByRole('radio').first();
    await first.focus();
    await expect(first).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowRight');
    const second = group.getByRole('radio').nth(1);
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute('aria-checked', 'true');
    await expect(first).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('End');
    await expect(group.getByRole('radio').last()).toBeFocused();
    // Um único tab stop: Tab sai do grupo em vez de passar por cada pílula.
    await page.keyboard.press('Tab');
    await expect(group.locator(':focus')).toHaveCount(0);
  });

  test('validação de formulário associa mensagens aos campos', async ({ page }) => {
    await gotoApp(page, '/entrar');
    const form = page.getByRole('form', { name: 'Entrar na conta' });
    await form.getByRole('button', { name: 'Entrar' }).click();
    const email = form.getByLabel('E-mail');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toHaveText('Informe seu e-mail.');
    await expect(form.getByRole('alert').first()).toBeVisible();
  });

  test('sem overflow horizontal nas larguras avaliadas', async ({ page }) => {
    // Desktop: além dos 1440 do Figma, cobre tablet e notebooks (768, 1024, 1180, 1280).
    const widths = isMobile(page) ? [390] : [768, 1024, 1180, 1280, 1440];
    const routes = ['/', '/mercado', '/nft/emerald-ape-0042', '/carrinho', '/entrar', '/perfil'];
    await login(page, USERS.nova, '/');
    await addToCartViaApi(page, 'emerald-ape-0042', '1-50', 1);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of routes) {
        await gotoApp(page, path);
        await expect(page.getByRole('main')).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `overflow de ${overflow}px em ${path} a ${width}px`).toBeLessThanOrEqual(
          1,
        );
      }
    }
  });
});
