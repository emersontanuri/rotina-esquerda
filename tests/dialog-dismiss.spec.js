import { test, expect } from '@playwright/test';

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`clique fora cancela os popups sem alterar dados em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.task')).toHaveCount(7);
    const before = await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'));
    const actions = page.getByRole('button', { name: 'Mais ações do mês', exact: true });
    const add = page.getByRole('button', { name: '+ Nova tarefa', exact: true });
    const copy = page.getByRole('button', { name: /^Copiar para outro mês:/ }).first();
    const remove = page.getByRole('button', { name: /^Excluir tarefa:/ }).first();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await actions.click();
      await expect(page.locator('#month-actions-menu')).toBeVisible();
      await page.mouse.click(2, 2);
      await expect(page.locator('#month-actions-menu')).toBeHidden();
      for (const kind of ['editor', 'suggestions', 'copy', 'month', 'confirmation', 'delete']) {
        let trigger = add;
        if (kind === 'editor') await add.click();
        else if (kind === 'copy') { trigger = copy; await copy.click(); }
        else if (kind === 'delete') { trigger = remove; await remove.click(); }
        else {
          trigger = actions;
          await actions.click();
          await page.getByRole('button', { name: kind === 'suggestions' ? 'Tarefas sugeridas' : 'Copiar todas para outro mês', exact: true }).click();
          if (kind === 'confirmation') await page.getByRole('button', { name: 'Continuar', exact: true }).click();
        }
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        // O espaço interno do diálogo também recebe cliques diretamente.
        const bounds = await dialog.boundingBox();
        await page.mouse.click(bounds.x + 5, bounds.y + 5);
        await expect(dialog).toBeVisible();
        await page.mouse.click(2, 2);
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'))).toBe(before);
      }
    }
    await page.goto('/metricas');
    const share = page.getByRole('button', { name: 'Compartilhar conquistas', exact: true });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await share.click();
      const dialog = page.getByRole('dialog', { name: 'Suas conquistas em story' });
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      await page.mouse.click(bounds.x + 5, bounds.y + 5);
      await expect(dialog).toBeVisible();
      await page.mouse.click(2, 2);
      await expect(dialog).toBeHidden();
      await expect(share).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem('rotina-esquerda:v1'))).toBe(before);
    }
  });
}
