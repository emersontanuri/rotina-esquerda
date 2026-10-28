import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { annualMetrics, achievementSummary } from './metrics.js';
import { useMonthlyTasks } from './app/composables/useMonthlyTasks.js';
import { readTheme, saveTheme, THEME_KEY } from './theme.js';
const done = () => ({ completed: true, subtasks: [] });
const tasks = n => Array.from({ length: n }, done);
const now = new Date(2026, 9, 27);

test('resumo acumulado ignora futuro, resolve empate pelo mês recente e não altera dados', () => {
  const months = { '2025-12': tasks(2), '2026-09': tasks(2), '2026-10': [{ completed: false, subtasks: [{ completed: true }] }], '2026-11': tasks(20) };
  const before = JSON.stringify(months);
  assert.deepEqual(achievementSummary(months, now), { total: 5, active: 3, streak: 2, best: '2026-09', bestCount: 2, tied: true, through: '2026-10' });
  assert.equal(JSON.stringify(months), before);
});

test('resumo preserva sequência entre anos e tolera mês atual vazio', () => {
  const months = { '2025-12': tasks(1), '2026-01': tasks(1) };
  assert.equal(achievementSummary(months, new Date(2026, 1, 1)).streak, 2);
  assert.equal(achievementSummary(months, new Date(2026, 2, 1)).streak, 0);
  assert.deepEqual(achievementSummary({}, now), { total: 0, active: 0, streak: 0, best: null, bestCount: 0, tied: false, through: '2026-10' });
});

test('métricas contam tarefas principais, incluem futuro e preservam entrada', () => {
  const months = { '2026-01': [done(), { completed: true, subtasks: [{ completed: false }] }, { completed: false, subtasks: [{ completed: true }, { completed: true }] }], '2026-12': tasks(2) };
  const before = JSON.stringify(months);
  const result = annualMetrics(months, 2026, now);
  assert.equal(result.total, 4); assert.equal(result.average, 2);
  assert.deepEqual(result.best, ['2026-01', '2026-12']);
  assert.equal(result.entries.length, 12); assert.equal(result.entries[10].future, true);
  assert.equal(result.entries[8].count, 0); assert.equal(JSON.stringify(months), before);
});
test('sequência atual atravessa ano e aceita mês atual zerado', () => {
  const months = { '2025-12': tasks(1), '2026-01': tasks(2), '2026-02': tasks(1), '2026-04': tasks(3) };
  assert.equal(annualMetrics(months, 2026, new Date(2026, 2, 10)).streak, 3);
  months['2026-03'] = tasks(1);
  assert.equal(annualMetrics(months, 2026, new Date(2026, 2, 10)).streak, 4);
  assert.equal(annualMetrics(months, 2026, new Date(2026, 5, 10)).streak, 0);
});
test('anos passados ancoram dezembro; futuro não tem sequência; vazio não tem vencedor', () => {
  const months = { '2025-11': tasks(1), '2025-12': tasks(2), '2027-01': tasks(3) };
  assert.equal(annualMetrics(months, 2025, now).streak, 2);
  assert.equal(annualMetrics(months, 2027, now).streak, null);
  const empty = annualMetrics({}, 2026, now);
  assert.equal(empty.average, 0); assert.equal(empty.total, 0); assert.deepEqual(empty.best, []);
});
test('consulta não cria mês nem grava; store inicializa uma vez e atualiza métricas', () => {
  let writes = 0, reads = 0;
  const disk = { getItem() { reads++; return JSON.stringify({ version: 1, months: {} }); }, setItem() { writes++; } };
  const app = useMonthlyTasks(); app.initialize(() => disk, false); app.initialize(() => disk, false);
  annualMetrics(app.data.value.months, 2026, now);
  assert.equal(reads, 1); assert.equal(writes, 0); assert.deepEqual(app.data.value.months, {});
  app.openMonth('2026-09'); const item = app.addTask('Teste');
  app.toggleTask(item, true); assert.equal(annualMetrics(app.data.value.months, 2026, now).total, 1);
  app.toggleTask(item, false); assert.equal(annualMetrics(app.data.value.months, 2026, now).total, 0);
  app.toggleTask(item, true); app.removeTask(item); assert.equal(annualMetrics(app.data.value.months, 2026, now).total, 0);
});
test('preferência do tema, sistema e falhas de armazenamento', () => {
  const disk = { value: 'dark', getItem() { return this.value; }, setItem(key, value) { assert.equal(key, THEME_KEY); this.value = value; } };
  assert.equal(readTheme(disk), 'dark'); saveTheme(disk, 'light'); assert.equal(readTheme(disk), 'light');
  disk.value = 'invalid'; assert.equal(readTheme(disk, true), 'dark');
  assert.equal(readTheme(disk, false), 'light');
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.equal(readTheme(blocked, true), 'dark'); assert.doesNotThrow(() => saveTheme(blocked, 'dark'));
});
test('script inicial aplica tema antes do aplicativo mesmo sem armazenamento', () => {
  const script = readFileSync('public/theme-init.js', 'utf8');
  for (const [preference, system, expected] of [['dark', false, 'dark'], ['light', true, 'light'], ['system', true, 'dark'], ['invalid', false, 'light'], [null, true, 'dark']]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(script, { document, localStorage: { getItem: () => preference }, window: { matchMedia: () => ({ matches: system }) } });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
  const document = { documentElement: { dataset: {} } };
  runInNewContext(script, { document, get localStorage() { throw Error(); }, window: { matchMedia: () => ({ matches: true }) } });
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('abrir somente métricas não grava migração de exemplos antigos', async () => {
  const { LEGACY_TASKS, freshTask } = await import('./model.js');
  const raw = JSON.stringify({ version: 1, months: { '2026-01': LEGACY_TASKS.map(freshTask) } });
  let writes = 0;
  const app = useMonthlyTasks();
  app.initialize(() => ({ getItem: () => raw, setItem: () => writes++ }), false);
  annualMetrics(app.data.value.months, 2026, now);
  assert.equal(writes, 0);
  app.openMonth('2026-01'); assert.ok(writes > 0);
});

test('botão alterna claro/escuro, persiste e funciona sem armazenamento', async () => {
  let saved = null;
  globalThis.document = { documentElement: { dataset: {} } };
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
    localStorage: { getItem: () => null, setItem: (key, value) => { saved = value; } },
  };
  try {
    const { useTheme } = await import('./app/composables/useTheme.js');
    const theme = useTheme(); theme.start();
    assert.equal(theme.preference.value, 'dark');
    theme.toggle(); assert.equal(theme.preference.value, 'light'); assert.equal(saved, 'light');
    theme.toggle(); assert.equal(document.documentElement.dataset.theme, 'dark'); assert.equal(saved, 'dark');
    window.localStorage.setItem = () => { throw Error('blocked'); };
    assert.doesNotThrow(theme.toggle); assert.equal(theme.preference.value, 'light');
    assert.equal(document.documentElement.dataset.theme, 'light');
  } finally { delete globalThis.document; delete globalThis.window; }
});
