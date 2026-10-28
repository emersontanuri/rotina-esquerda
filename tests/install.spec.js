import { test, expect } from '@playwright/test';

for (const path of ['/', '/apresentacao', '/tarefas']) {
  for (const width of [320, 375, 414, 768, 1024, 1440]) {
    test(`convite flutuante em ${path} com ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.clock.install();
      await page.goto(path);
      const main = page.locator('main');
      await expect(main).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt', { cancelable: true });
        event.prompt = async () => {};
        window.dispatchEvent(event);
      });
      const before = await main.boundingBox();
      await page.clock.fastForward(8000);
      const notice = page.getByRole('region', { name: 'Instalar no celular' });
      await expect(notice).toBeVisible();
      expect(await main.boundingBox()).toEqual(before);
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await expect(notice).toHaveCSS('position', 'fixed');
        const box = await notice.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(16);
        expect(box.x + box.width).toBeLessThanOrEqual(width - 16);
        expect(box.width).toBeLessThanOrEqual(640);
        expect(box.y + box.height).toBeCloseTo(796, 0);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        expect(await notice.boundingBox()).toEqual(box);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await page.setViewportSize({ width, height: 180 });
      const shortBox = await notice.boundingBox();
      expect(shortBox.y).toBeGreaterThanOrEqual(16);
      expect(shortBox.y + shortBox.height).toBeLessThanOrEqual(164);
      await page.setViewportSize({ width, height: 812 });
      const close = notice.getByRole('button', { name: 'Fechar aviso de instalação' });
      await close.focus();
      await expect(close).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(notice).toBeHidden();
      expect(await main.boundingBox()).toEqual(before);
    });
  }
}

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
