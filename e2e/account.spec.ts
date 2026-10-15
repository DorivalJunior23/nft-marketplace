import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { USERS, login } from './helpers';

test.describe('Perfil e carteiras', () => {
  test('edita perfil, avatar e senha com validação da API', async ({ page }) => {
    await login(page, USERS.caio, '/perfil');
    const form = page.getByRole('form', { name: 'Perfil do colecionador' });

    await form.getByLabel('Nome de usuário').fill('novasato');
    await form.getByLabel('Nome ENS').fill('caio-lima');
    await form.getByLabel('Apelido da carteira').fill('Carteira de coleção');
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(form.getByRole('alert')).toContainText('Este nome de usuário já está em uso.');

    await form.getByLabel('Nome de usuário').fill('caio.lima');
    await form.getByLabel('Nome de exibição').fill('Caio L.');
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Perfil atualizado.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Caio L.');

    await page
      .getByLabel('Avatar')
      .locator('input[type=file]')
      .setInputFiles(fileURLToPath(new URL('./fixtures/avatar.png', import.meta.url)));
    await expect(page.getByText('Avatar atualizado.')).toBeVisible();
    await expect(page.getByRole('img', { name: /Avatar de/ })).toBeVisible();

    await form.getByLabel('Senha atual').fill('errada123');
    await form.getByLabel('Nova senha', { exact: true }).fill('Nova@2026');
    await form.getByLabel('Confirmar nova senha').fill('Nova@2026');
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(form.getByRole('alert')).toContainText('Senha atual incorreta.');
    await form.getByLabel('Senha atual').fill(USERS.caio.password);
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible();
  });

  test('cadastra e edita carteiras com erros de validação', async ({ page }) => {
    await login(page, USERS.caio, '/carteiras');
    const form = page.getByTestId('wallet-form-primary');
    await form.getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(form.getByRole('alert').first()).toBeVisible();
    await expect(form.getByLabel('Endereço da carteira')).toHaveAttribute('aria-invalid', 'true');

    await form.getByLabel('Nome de exibição').fill('Caio Lima');
    await form.getByLabel('Apelido da carteira').fill('Principal');
    await form.getByLabel('Rede').selectOption('polygon');
    await form.getByLabel('Nome do perfil').fill('Caio');
    await form.getByLabel('Endereço da carteira').fill('0x1234');
    await form.getByLabel('Tipo de carteira').selectOption('coinbase');
    await form.getByLabel('Código de indicação').fill('KURIO-CAIO');
    await form.getByLabel('E-mail').fill(USERS.caio.email);
    await form.getByLabel('Nome ENS').fill('caio');
    await form.getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(
      form.getByText('Informe um endereço 0x com 40 caracteres hexadecimais.'),
    ).toBeVisible();

    await form
      .getByLabel('Endereço da carteira')
      .fill('0x1234567890abcdef1234567890abcdef12345678');
    await form.getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(page.getByText('Carteira principal salva.')).toBeVisible();
    await page.reload();
    await expect(
      page.getByTestId('wallet-form-primary').getByLabel('Apelido da carteira'),
    ).toHaveValue('Principal');

    await page.getByLabel('Igual à carteira principal').check();
    const secondary = page.getByTestId('wallet-form-secondary');
    await expect(secondary.getByLabel('Endereço da carteira')).toHaveValue(
      '0x1234567890abcdef1234567890abcdef12345678',
    );
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible();
  });
});
