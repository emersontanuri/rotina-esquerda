import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

async function openStory(page) {
  await page.goto('/metricas');
  await page.getByRole('button', { name: 'Compartilhar conquistas', exact: true }).click();
  await expect(page.getByRole('img', { name: /Story com/ })).toBeVisible();
}

test('prévia exporta o mesmo PNG e devolve o foco ao fechar', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date();
    const key = offset => {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };
    const task = id => ({ id, title: 'Título privado', completed: true, subtasks: [] });
    window.originalTasks = JSON.stringify({ version: 1, months: {
      [key(-13)]: [], [key(-1)]: [task('a')], [key(0)]: [task('b'), task('c')], [key(1)]: [task('future')],
    } });
    localStorage.setItem('rotina-esquerda:v1', window.originalTasks);
  });
  await openStory(page);
  const image = page.getByRole('img', { name: /Story com/ });
  await expect(image).toHaveAttribute('alt', /2 meses em sequência, 3 tarefas concluídas e 2 meses ativos/);
  expect(await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1') === window.originalTasks)).toBe(true);
  expect(await image.evaluate(img => [img.naturalWidth, img.naturalHeight])).toEqual([1080, 1920]);
  const digest = await image.evaluate(async img => {
    const bytes = await (await fetch(img.src)).arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar PNG', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^base-ativa-\d{4}-\d{2}\.png$/);
  const stream = await file.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(createHash('sha256').update(Buffer.concat(chunks)).digest('hex')).toBe(digest);
  await file.saveAs('output/story-preview.png');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Compartilhar conquistas', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: 'Ano' }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Compartilhar conquistas', exact: true }).click();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('alt', /2 meses em sequência, 3 tarefas concluídas e 2 meses ativos/);
});

test('compartilhamento nativo, cancelamento e erro mantêm download disponível', async ({ page }) => {
  await page.addInitScript(() => {
    window.shareMode = 'cancel';
    Object.defineProperty(navigator, 'canShare', { value: ({ files }) => files[0].type === 'image/png' });
    Object.defineProperty(navigator, 'share', { value: async ({ files }) => {
      window.sharedFile = { type: files[0].type, size: files[0].size };
      if (window.shareMode === 'cancel') throw new DOMException('Cancelado', 'AbortError');
      if (window.shareMode === 'error') throw new Error('Falha');
    } });
  });
  await openStory(page);
  const share = page.getByRole('button', { name: 'Compartilhar imagem', exact: true });
  await share.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(() => window.shareMode = 'error');
  await share.click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível compartilhar');
  await page.evaluate(() => window.shareMode = 'success');
  await share.click();
  await expect(page.getByRole('dialog')).toContainText('Imagem entregue');
  expect(await page.evaluate(() => window.sharedFile)).toMatchObject({ type: 'image/png' });
  await expect(page.getByRole('button', { name: 'Baixar PNG' })).toBeEnabled();
});

test('sem suporte oferece download; falha de geração permite tentar novamente', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined });
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      if (!window.failedOnce) { window.failedOnce = true; args[0](null); }
      else original.apply(this, args);
    };
  });
  await page.goto('/metricas');
  await page.getByRole('button', { name: 'Compartilhar conquistas' }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível gerar');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('img', { name: /Story com/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compartilhar imagem' })).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('Baixe o PNG');
});

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`story acessível em ${width}px e ambos os temas`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await openStory(page);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await page.getByRole('dialog').evaluate(dialog => {
        const r = dialog.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && dialog.scrollWidth <= dialog.clientWidth;
      })).toBe(true);
      expect(await page.getByRole('dialog').locator('button').evaluateAll(buttons => buttons.every(button => {
        const r = button.getBoundingClientRect(); return r.width >= 44 && r.height >= 44;
      }))).toBe(true);
      const closeSize = await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).evaluate(button => {
        const style = getComputedStyle(button);
        const text = document.createRange(); text.selectNodeContents(button);
        const required = text.getBoundingClientRect().width + ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, key) => sum + parseFloat(style[key]), 0);
        return { actual: button.getBoundingClientRect().width, required };
      });
      expect(closeSize.actual).toBeGreaterThanOrEqual(closeSize.required - .5);
    }
  });
}

test('gera story offline após cache do PWA', async ({ page, context }) => {
  await page.goto('/metricas');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Compartilhar conquistas' }).click();
  await expect(page.getByRole('img', { name: /Story com/ })).toBeVisible();
  expect(await page.evaluate(async () => !!(await caches.match('/share/story-background.png', { ignoreSearch: true })))).toBe(true);
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'StoryDisplay' && font.status === 'loaded'))).toBe(true);
});
