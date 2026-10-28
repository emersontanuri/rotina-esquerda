import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyStorySummary, paginateStoryActivities } from './app/utils/story.js';

const task = (title, completed = true, subtasks = []) => ({ id: title, title, completed, subtasks });

test('resume o mês anterior e compara as listas mensais, inclusive na virada do ano', () => {
  const months = {
    '2025-12': [task('Anterior'), task('Outra')],
    '2026-01': [task('Ação concluída'), task('Em andamento', false), task('Passos', true, [{ id: 's', title: 'passo', completed: false }])],
  };
  const summary = monthlyStorySummary(months, new Date(2026, 1, 10));
  assert.equal(summary.month, '2026-01');
  assert.equal(summary.previousTotal, 2);
  assert.equal(summary.total, 1);
  assert.equal(summary.difference, -1);
  assert.deepEqual(summary.activities, ['Ação concluída']);
});

test('informa ausência de dados de comparação e preserva mês sem atividades', () => {
  const summary = monthlyStorySummary({ '2026-03': [] }, new Date(2026, 3, 10));
  assert.equal(summary.total, 0);
  assert.equal(summary.previousTotal, null);
  assert.equal(summary.difference, null);
  assert.equal(summary.comparisonLabel, 'Não há dados para comparação');
  assert.deepEqual(summary.activities, []);
});

test('resumo do mês atual usa somente as atividades concluídas até agora e compara com o mês anterior', () => {
  const months = {
    '2025-12': [task('Dezembro')],
    '2026-01': [task('Ação atual'), task('Pendente', false), task('Passos feitos', false, [{ id: 's', title: 'passo', completed: true }])],
  };
  const summary = monthlyStorySummary(months, new Date(2026, 0, 15), 'current');
  assert.equal(summary.month, '2026-01');
  assert.equal(summary.comparison, '2025-12');
  assert.equal(summary.inProgress, true);
  assert.equal(summary.total, 2);
  assert.equal(summary.difference, 1);
  assert.deepEqual(summary.activities, ['Ação atual', 'Passos feitos']);
});

test('divide atividades em até dez por página e reduz o lote para títulos longos', () => {
  const ten = Array.from({ length: 10 }, (_, index) => `Atividade ${index + 1}`);
  assert.equal(paginateStoryActivities(ten).length, 1);
  assert.equal(paginateStoryActivities([...ten, 'Décima primeira']).length, 2);
  const pages = paginateStoryActivities(['Uma atividade com um título muito longo '.repeat(20), 'Curta']);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].length, 1);
  assert.equal(pages[1][0], 'Curta');
});
