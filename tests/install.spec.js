import { test, expect } from '@playwright/test';

test('convite aguarda oito segundos, pode fechar e instalar pelo topo', async ({ page }) => {
  await page.clock.install();
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(7);
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installRequested = true; };
    window.dispatchEvent(event);
  });
  const notice = page.getByRole('region', { name: 'Instalar no celular' });
  await expect(page.locator('header').getByRole('button', { name: 'Instalar aplicativo' })).toBeVisible();
  await page.clock.fastForward(7000);
  await expect(notice).toBeHidden();
  await page.clock.fastForward(1000);
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Fechar aviso de instalação' }).click();
  await page.getByRole('link', { name: 'Métricas', exact: true }).click();
  await page.clock.fastForward(15000);
  await expect(notice).toBeHidden();
  await page.locator('header').getByRole('button', { name: 'Instalar aplicativo' }).click();
  expect(await page.evaluate(() => window.installRequested)).toBe(true);
  await expect(page.locator('header').getByRole('button', { name: 'Instalar aplicativo' })).toBeHidden();
});

test('iPhone recebe instruções e o topo reabre o aviso fechado', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { value: 'iPhone' }));
  await page.clock.install();
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(7);
  await page.clock.fastForward(8000);
  const notice = page.getByRole('region', { name: 'Instalar no celular' });
  await expect(notice).toContainText('Adicionar à Tela de Início');
  await notice.getByRole('button', { name: 'Fechar aviso de instalação' }).click();
  await page.reload();
  await expect(page.locator('.task')).toHaveCount(7);
  await page.clock.fastForward(10000);
  await expect(notice).toBeHidden();
  await page.locator('header').getByRole('button', { name: 'Instalar aplicativo' }).click();
  await expect(notice).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(notice).toBeHidden();
  await expect(page.locator('header').getByRole('button', { name: 'Instalar aplicativo' })).toBeHidden();
});
