import { test, expect } from '@playwright/test';

test('prévia social está no HTML estático e usa imagem quadrada leve', async ({ request, page }) => {
  const response = await request.get('/');
  const html = await response.text();
  const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  expect(imageUrl).toBeTruthy();
  expect(html).toContain('property="og:image:width" content="600"');
  expect(html).toContain('property="og:image:height" content="600"');
  const path = new URL(imageUrl).pathname;
  const image = await request.get(path);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/jpeg');
  expect((await image.body()).length).toBeLessThan(300_000);
  await page.goto('/');
  expect(await page.evaluate(async path => {
    const image = new Image();
    image.src = path;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, path)).toEqual([600, 600]);
});
