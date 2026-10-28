import { test, expect } from '@playwright/test';

const pix = '00020101021126580014br.gov.bcb.pix01363fdfecbf-5b46-408e-b903-89a5e78ba3275204000053039865802BR5917EMERSON J T SILVA6009PETROLINA62070503***630444FB';

test('rodapé leva ao apoio e permite copiar o Pix por teclado', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: {
    writeText: async text => { window.copiedPix = text; },
  } }));
  await page.goto('/tarefas');
  await page.getByRole('link', { name: 'Apoie o Base Ativa' }).click();
  await expect(page).toHaveURL('/apoie');
  await expect(page.getByRole('heading', { name: 'Apoie o Base Ativa' })).toBeVisible();
  const coffee = page.getByRole('link', { name: 'Apoiar pelo Buy Me a Coffee' });
  await expect(coffee).toHaveAttribute('href', 'https://buymeacoffee.com/tanuri');
  await expect(coffee).toHaveAttribute('target', '_blank');
  await expect(coffee).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByLabel('Pix Copia e Cola')).toHaveValue(pix);
  const copy = page.getByRole('button', { name: 'Copiar código Pix' });
  await page.getByLabel('Pix Copia e Cola').focus();
  await page.keyboard.press('Tab');
  await expect(copy).toBeFocused();
  expect(await copy.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Código Pix copiado.' })).toBeVisible();
  expect(await page.evaluate(() => window.copiedPix)).toBe(pix);
});

test('falha na cópia orienta seleção manual e mantém o código disponível', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: {
    writeText: async () => { throw new Error('Permissão negada'); },
  } }));
  await page.goto('/apoie');
  await page.getByRole('button', { name: 'Copiar código Pix' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Não foi possível copiar.' })).toContainText('copie manualmente');
  await expect(page.getByLabel('Pix Copia e Cola')).toHaveValue(pix);
  await expect(page.getByLabel('Pix Copia e Cola')).toHaveAttribute('readonly', '');
});

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`apoio legível em ${width}px nos dois temas`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/apoie');
    await page.evaluate(() => document.fonts.ready);
    const qr = page.getByRole('img', { name: /QR Code Pix/ });
    await expect.poll(() => qr.evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('main a, main button, main input, .support-link').evaluateAll(elements => elements.every(e => {
        const r = e.getBoundingClientRect();
        return r.width >= 44 && r.height >= 44;
      }))).toBe(true);
      const sections = await page.locator('.support-options section').evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect();
        return { top: r.top, left: r.left, bottom: r.bottom };
      }));
      if (width >= 700) expect(sections[0].top).toBe(sections[1].top);
      else expect(sections[1].top).toBeGreaterThan(sections[0].bottom);
      await page.screenshot({ path: `output/support-${width}-${theme}.png`, fullPage: true });
    }
    if (width === 375) await qr.screenshot({ path: 'output/support-qr.png' });
  });
}

test('página, QR Code e cópia do Pix continuam disponíveis offline', async ({ page, context }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: {
    writeText: async text => { window.copiedPix = text; },
  } }));
  await page.goto('/apoie');
  await expect(page.locator('h1')).toHaveText('Apoie o Base Ativa');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Apoie o Base Ativa');
  await expect.poll(() => page.locator('.pix-qr').evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Copiar código Pix' }).click();
  expect(await page.evaluate(() => window.copiedPix)).toBe(pix);
});
