import { test, expect } from '@playwright/test';

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`cópia mensal confirma, cancela e persiste offline em ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      if (localStorage.getItem('rotina-esquerda:v1')) return;
      const now = new Date();
      const key = offset => {
        const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      };
      localStorage.setItem('rotina-esquerda:v1', JSON.stringify({ version: 1, months: {
        [key(0)]: [{ id: 'source', title: 'Plano personalizado', completed: true, subtasks: [{ id: 'step', title: 'Passo personalizado', completed: true }] }],
        [key(1)]: [{ id: 'old', title: 'Será substituída', completed: false, subtasks: [] }],
      } }));
    });
    await page.goto('/tarefas');
    const trigger = page.getByRole('button', { name: 'Copiar todas para outro mês', exact: true });
    const actions = page.getByRole('button', { name: 'Mais ações do mês', exact: true });
    await expect(trigger).toBeHidden();
    const before = await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'));
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    await context.setOffline(true);
    await actions.click();
    await trigger.click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByLabel('Mês de destino', { exact: true });
    await expect(input).toBeFocused();
    const destination = await input.inputValue();
    await input.fill('2020-01');
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('posterior');
    await input.fill(destination);
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(dialog).toContainText('1 tarefas existentes');
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await dialog.evaluate(element => {
        const r = element.getBoundingClientRect();
        return r.width <= innerWidth && r.height <= innerHeight && document.documentElement.scrollWidth <= innerWidth &&
          [...element.querySelectorAll('button')].every(button => button.getBoundingClientRect().height >= 44);
      })).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(actions).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'))).toBe(before);
    await actions.click();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'))).toBe(before);
    await actions.click();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    await dialog.getByRole('button', { name: 'Substituir e copiar', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: '1 tarefa copiada' })).toBeVisible();
    await page.getByRole('button', { name: 'Ver mês', exact: true }).click();
    await expect(page.locator('.task')).toHaveCount(1);
    await expect(page.locator('.task-row .check')).not.toBeChecked();
    await page.reload();
    await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
    await expect(page.locator('.task')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Plano personalizado', exact: true })).toBeVisible();
    await actions.click();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(dialog).toContainText('somente as cópias');
    await dialog.getByRole('button', { name: 'Copiar tarefas', exact: true }).click();
    await page.getByRole('button', { name: 'Ver mês', exact: true }).click();
    await expect(page.locator('.task')).toHaveCount(1);
  });
}
