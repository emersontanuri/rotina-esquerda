import { test, expect } from '@playwright/test';

test('apresentação leva às tarefas sem iniciar o vídeo automaticamente', async ({ page }) => {
  await page.goto('/apresentacao');
  await expect(page.getByRole('heading', { name: 'O coletivo começa no cotidiano' })).toBeVisible();
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  expect(await video.evaluate(element => element.paused && !element.autoplay && element.controls)).toBe(true);
  await expect(page.locator('footer, .main-nav')).toHaveCount(0);
  await page.getByRole('link', { name: 'Ir para minhas tarefas' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.task')).toHaveCount(7);
  await expect(page.locator('.main-nav')).toBeVisible();
});

for (const width of [320, 375, 414, 768, 1024, 1440, 1920, 2560]) {
 for (const height of [600, 900]) {
  test(`apresentação legível em ${width}×${height}px nos dois temas`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/apresentacao');
    await page.evaluate(() => document.fonts.ready);
    const cta = page.getByRole('link', { name: 'Ir para minhas tarefas' });
    const art = page.locator('.presentation-art img');
    await expect(art).toHaveCount(2);
    await expect.poll(() => art.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await expect(cta).toBeVisible();
      expect(await page.locator('.presentation').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom >= innerHeight - 1 && Math.abs(bounds.bottom + scrollY - document.documentElement.scrollHeight) < 1;
      })).toBe(true);
      expect(await cta.evaluate(element => {
        const r = element.getBoundingClientRect();
        return r.width >= 44 && r.height >= 44 && (innerHeight < 900 || r.bottom <= innerHeight) && document.documentElement.scrollWidth <= innerWidth;
      })).toBe(true);
      expect(await art.evaluateAll(images => {
        if (innerWidth < 700) return images.every(image => getComputedStyle(image).display === 'none');
        const content = [...document.querySelectorAll('.presentation-message, .presentation-media, .presentation-cta')].map(element => element.getBoundingClientRect());
        const pageBottom = document.querySelector('.presentation').getBoundingClientRect().bottom;
        return images.every(image => {
          const bounds = image.getBoundingClientRect();
          const proportional = Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight) < .01;
          const separate = content.every(box => bounds.right <= box.left || bounds.left >= box.right || bounds.top >= box.bottom || bounds.bottom <= box.top);
          const largeEnough = innerWidth < 1920 || bounds.width >= 450;
          return proportional && separate && largeEnough && bounds.width > 0 && Math.abs(bounds.bottom - pageBottom) < 1;
        });
      })).toBe(true);
      if (width < 700) {
        expect(await page.locator('.presentation-art').evaluate(element => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return style.position === 'absolute' && style.maskImage === 'none' && style.backgroundImage.includes('/presentation/mobilizacao.png') && bounds.height >= bounds.width * 2 / 3 - 1;
        })).toBe(true);
      }
      await cta.focus();
      await expect(cta).toBeFocused();
      await page.screenshot({ path: `output/presentation-${width}-${height}-${theme}.png`, fullPage: true });
    }
    await page.setViewportSize({ width, height: 420 });
    await page.locator('html').evaluate(element => element.style.fontSize = '200%');
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
 }
}

test('vídeo horizontal reproduz quando a pessoa inicia', async ({ page }) => {
  await page.goto('/apresentacao');
  const video = page.locator('video');
  await page.getByRole('button', { name: 'Reproduzir apresentação de 25 segundos' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => video.evaluate(element => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Reproduzir apresentação de 25 segundos' })).toHaveCount(0);
  await expect(video).toBeFocused();
  expect(await video.evaluate(element => element.videoWidth / element.videoHeight)).toBeCloseTo(16 / 9);
  await video.evaluate(element => element.pause());
});

test('falha de conexão permite tentar reproduzir novamente', async ({ page }) => {
  await page.route('**/videos/rotina-de-base.mp4', route => route.abort());
  await page.goto('/apresentacao');
  const play = page.getByRole('button', { name: 'Reproduzir apresentação de 25 segundos' });
  await play.click();
  await expect(page.getByRole('alert')).toContainText('Verifique sua conexão');
  await expect(play).toBeFocused();
  await page.unroute('**/videos/rotina-de-base.mp4');
  await play.click();
  await expect.poll(() => page.locator('video').evaluate(element => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('apresentação e acesso às tarefas funcionam offline sem precache do vídeo', async ({ page, context }) => {
  await page.goto('/apresentacao');
  await expect(page.locator('h1')).toHaveText('O coletivo começano cotidiano');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  expect(await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = (await Promise.all(keys.map(async key => (await caches.open(key)).keys()))).flat();
    return requests.some(request => new URL(request.url).pathname.endsWith('.mp4'));
  })).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'O coletivo começa no cotidiano' })).toBeVisible();
  await expect.poll(() => page.locator('.presentation-play img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => page.locator('.presentation-art img').evaluateAll(images => images.length === 2 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.getByRole('link', { name: 'Ir para minhas tarefas' }).click();
  await expect(page.locator('.task')).toHaveCount(7);
  await page.reload();
  await expect(page.locator('.task')).toHaveCount(7);
});
