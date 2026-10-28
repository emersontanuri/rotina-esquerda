import { test, expect } from '@playwright/test';

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`layout e controles em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.clock.install();
    await page.goto('/tarefas');
    await expect(page.locator('.task')).toHaveCount(7);
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => {};
      window.dispatchEvent(event);
    });
    await page.clock.fastForward(8000);
    await expect(page.getByRole('region', { name: 'Instalar no celular' })).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const small = await page.locator('button, input[type=checkbox], nav a').evaluateAll(elements => elements.filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).map(e => e.getAttribute('aria-label') || e.textContent));
      expect(small).toEqual([]);
      const arrows = await page.locator('.arrows button').evaluateAll(buttons => buttons.map(button => {
        const { width, height } = button.getBoundingClientRect();
        return { width, height };
      }));
      expect(arrows).toEqual([{ width: 44, height: 44 }, { width: 44, height: 44 }]);
      const actions = page.getByRole('button', { name: 'Mais ações do mês', exact: true });
      await actions.click();
      const menu = page.locator('#month-actions-menu');
      await expect(menu).toBeVisible();
      expect(await menu.evaluate(element => {
        const r = element.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      })).toBe(true);
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(actions).toBeFocused();
      await actions.click();
      await page.getByRole('button', { name: 'Tarefas sugeridas', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Tarefas sugeridas', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Fechar', exact: true }).click();
      await expect(actions).toBeFocused();
    }
    await page.locator('.task-toggle').first().click();
    await expect(page.locator('.subtasks').first()).toBeVisible();
    const task = page.locator('.task').first();
    const mainCheckbox = task.locator('.task-row .check');
    await mainCheckbox.check();
    expect(await task.locator('.task-chevron').evaluate(icon => {
      for (let element = icon; element; element = element.parentElement) {
        if (getComputedStyle(element).textDecorationLine.includes('line-through')) return false;
      }
      return icon.getBoundingClientRect().width >= 18;
    })).toBe(true);
    await expect(task.locator('.task-toggle > span').first()).toHaveCSS('text-decoration-line', 'line-through');
    await mainCheckbox.uncheck();
    const row = page.locator('.sub-row').first();
    const title = row.locator('.sub-title');
    const originalTitle = await title.textContent();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      for (const sample of ['Passo curto', 'Escolher um ou mais representantes e acompanhar suas publicações durante o mês', 'Representantes'.repeat(12)]) {
        await title.evaluate((element, text) => element.textContent = text, sample);
        expect(await row.evaluate(element => {
          const [check, text, actions] = [...element.children].map(child => child.getBoundingClientRect());
          return Math.abs(check.top - actions.top) < 1 &&
            check.right <= text.left && text.right <= actions.left &&
            actions.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth &&
            [...element.querySelectorAll('button, input')].every(control => {
              const bounds = control.getBoundingClientRect();
              return bounds.width >= 44 && bounds.height >= 44;
            });
        })).toBe(true);
      }
    }
    await title.evaluate((element, text) => element.textContent = text, originalTitle);
    const checkbox = row.getByRole('checkbox');
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(row.getByRole('button', { name: /^Editar subtarefa:/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByLabel('Nome', { exact: true }).fill('Passo revisado pelo teclado');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(title).toHaveText('Passo revisado pelo teclado');
    await row.getByRole('button', { name: /^Excluir subtarefa:/ }).focus();
    await page.keyboard.press('Enter');
    const confirmation = page.getByRole('dialog', { name: 'Excluir subtarefa?' });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(title).toHaveText('Passo revisado pelo teclado');
    await page.getByRole('button', { name: '+ Nova tarefa', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Nova tarefa' })).toBeVisible();
    expect(await page.getByRole('dialog', { name: 'Nova tarefa' }).evaluate(dialog => {
      const bounds = dialog.getBoundingClientRect();
      return bounds.width <= innerWidth && bounds.height <= innerHeight && parseFloat(getComputedStyle(dialog.querySelector('input')).fontSize) >= 16;
    })).toBe(true);
    await page.getByLabel('Nome', { exact: true }).fill('Uma tarefa com um título bastante longo para testar a quebra de linha em telas pequenas');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.locator('.task')).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/mobile-${width}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Métricas', exact: true }).click();
    await expect(page.locator('.month-tile')).toHaveCount(12);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: `output/metrics-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('PWA inicia nas duas rotas offline e mantém edições locais', async ({ page, context }) => {
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(7);
  const manifestUrl = await page.locator('link[rel=manifest]').getAttribute('href');
  const response = await page.request.get(manifestUrl);
  const manifest = await response.json();
  expect(manifest.name).toBe('Base Ativa');
  expect(manifest.short_name).toBe('Base Ativa');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some(icon => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some(icon => icon.purpose === 'maskable')).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const devtools = await context.newCDPSession(page);
  const { installabilityErrors } = await devtools.send('Page.getInstallabilityErrors');
  // Isolated Playwright contexts cannot install an OS app, but manifest checks still run.
  expect(installabilityErrors.filter(error => error.errorId !== 'in-incognito')).toEqual([]);
  await devtools.detach();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.task')).toHaveCount(7);
  await expect(page.getByText('Você está offline.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '+ Nova tarefa', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Criada offline');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Criada offline', exact: true })).toBeVisible();
  await page.goto('/metricas');
  await expect(page.locator('.month-tile')).toHaveCount(12);
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(8);
  await context.setOffline(false);
  await expect(page.getByText('Você está offline.', { exact: false })).toBeHidden();
});

test('atualização aguarda a pessoa salvar e preserva as tarefas', async ({ page }) => {
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(7);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  // Start with an existing controller, as on a later visit receiving a new release.
  await page.reload();
  await expect(page.locator('.task')).toHaveCount(7);
  await page.getByRole('button', { name: '+ Nova tarefa', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Preservada na atualização');
  await page.request.post('/__test/new-worker');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await expect(page.getByText('Uma nova versão está disponível.', { exact: false })).toBeAttached();
  await expect(page.getByRole('dialog', { name: 'Nova tarefa' })).toBeVisible();
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Preservada na atualização');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: 'Atualizar agora', exact: true }).click();
  await expect(page.getByText('Uma nova versão está disponível.', { exact: false })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Preservada na atualização', exact: true })).toBeVisible();
});

test('armazenamento indisponível não impede a interface e mostra aviso', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/tarefas');
  await expect(page.locator('.task')).toHaveCount(7);
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler');
});
