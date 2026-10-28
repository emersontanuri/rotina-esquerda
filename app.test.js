import test from 'node:test';
import assert from 'node:assert/strict';
import { useMonthlyTasks } from './app/composables/useMonthlyTasks.js';
import { SUGGESTIONS, LEGACY_TASKS, freshTask, monthKey, shiftMonth } from './model.js';
test('banco completo, repetição, independência e restauração', () => {
  const disk = storage(), app = useMonthlyTasks(); app.initialize(() => disk);
  assert.equal(SUGGESTIONS.length, 13);
  SUGGESTIONS.forEach(s => app.addSuggestion(s));
  const a = app.addSuggestion(SUGGESTIONS[0]), b = app.addSuggestion(SUGGESTIONS[0]);
  app.rename(a.subtasks[0], 'Personalizado'); app.toggleTask(a, true);
  assert.notEqual(a.id, b.id); assert.notEqual(a.subtasks[0].id, b.subtasks[0].id);
  assert.equal(b.subtasks[0].title, SUGGESTIONS[0].subtasks[0]); assert.equal(b.completed, false);
  const restored = useMonthlyTasks(); restored.initialize(() => disk);
  assert.equal(restored.tasks.value.length, 22);
  assert.equal(restored.tasks.value.at(-2).subtasks[0].title, 'Personalizado');
});
test('cópia entre meses preserva origem e reinicia progresso', () => {
  const disk = storage(), app = useMonthlyTasks(); app.initialize(() => disk); app.openMonth('2026-12');
  const original = app.tasks.value[0]; app.toggleTask(original, true);
  const before = JSON.stringify(original);
  for (const key of ['', '2027-13', '2026-12', '0000-01', '2027-1', null]) assert.equal(app.copyTask(original, key), null);
  const copy = app.copyTask(original, '2027-01');
  assert.equal(app.selected.value, '2026-12'); assert.equal(JSON.stringify(original), before);
  assert.notEqual(copy.id, original.id); assert.notEqual(copy.subtasks[0].id, original.subtasks[0].id);
  assert.equal(copy.completed, false); assert.ok(copy.subtasks.every(s => !s.completed));
  app.copyTask(original, '2027-01'); app.copyTask(original, '2025-11');
  app.openMonth('2027-01'); assert.equal(app.tasks.value.length, 9);
  app.rename(app.tasks.value.at(-1).subtasks[0], 'Cópia editada');
  assert.equal(JSON.stringify(original), before);
  const restored = useMonthlyTasks(); restored.initialize(() => disk); restored.openMonth('2027-01');
  assert.equal(restored.tasks.value.at(-1).subtasks[0].title, 'Cópia editada');
  restored.openMonth('2025-11'); assert.equal(restored.tasks.value.length, 8);
});
test('migração substitui apenas exemplos intactos e não repete', () => {
  const old = LEGACY_TASKS.map(freshTask), edited = freshTask(LEGACY_TASKS[0]), progressed = freshTask(LEGACY_TASKS[1]);
  edited.subtasks[0].title = 'Alterado'; progressed.subtasks[0].completed = true;
  const custom = freshTask({ title: 'Minha tarefa', subtasks: [] });
  const disk = storage(JSON.stringify({ version: 1, months: { '2020-01': [custom, ...old, edited, progressed], '2020-02': [edited, progressed], '2020-03': [] } }));
  const app = useMonthlyTasks(); app.initialize(() => disk); app.openMonth('2020-01');
  assert.equal(app.tasks.value.length, 10); assert.equal(app.tasks.value[0].id, custom.id);
  assert.match(app.tasks.value[1].title, /1ª vez/);
  assert.equal(app.tasks.value.at(-2).subtasks[0].title, 'Alterado'); assert.equal(app.tasks.value.at(-1).subtasks[0].completed, true);
  const saved = disk.raw, restored = useMonthlyTasks(); restored.initialize(() => disk);
  assert.equal(disk.raw, saved); restored.openMonth('2020-02'); assert.equal(restored.tasks.value.length, 2);
  restored.openMonth('2020-03'); assert.equal(restored.tasks.value.length, 0);
});
function storage(raw = null, fail = false) {
  return { raw, getItem() { return this.raw; }, setItem(key, value) { if (fail) throw new Error('blocked'); this.raw = value; } };
}
test('cópia mensal substitui o destino, reinicia progresso e persiste sem alterar a origem', () => {
  const disk = storage(), app = useMonthlyTasks(); app.initialize(() => disk); app.openMonth('2026-12');
  app.addTask('Última tarefa'); app.toggleTask(app.tasks.value[0], true);
  const before = JSON.stringify(app.tasks.value);
  app.openMonth('2027-01'); app.addTask('Será substituída'); app.openMonth('2026-12');
  let writes = 0;
  const setItem = disk.setItem.bind(disk); disk.setItem = (...args) => { writes++; setItem(...args); };
  for (const key of ['', null, '2027-13', '0000-01', '2026-12', '2026-11']) assert.equal(app.copyMonth(key), null);
  assert.equal(writes, 0);
  assert.equal(app.copyMonth('2027-01'), 8); assert.equal(writes, 1);
  assert.equal(app.selected.value, '2026-12'); assert.equal(JSON.stringify(app.tasks.value), before);
  const copies = app.data.value.months['2027-01'];
  assert.deepEqual(copies.map(t => t.title), app.tasks.value.map(t => t.title));
  copies.forEach((copy, i) => {
    const source = app.tasks.value[i];
    assert.notEqual(copy.id, source.id); assert.equal(copy.completed, false);
    assert.deepEqual(copy.subtasks.map(s => s.title), source.subtasks.map(s => s.title));
    copy.subtasks.forEach((sub, j) => { assert.notEqual(sub.id, source.subtasks[j].id); assert.equal(sub.completed, false); });
  });
  assert.equal(app.copyMonth('2027-02'), 8);
  const restored = useMonthlyTasks(); restored.initialize(() => disk); restored.openMonth('2027-02');
  assert.equal(restored.tasks.value.length, 8);
  app.rename(copies[0].subtasks[0], 'Independente'); assert.equal(JSON.stringify(app.tasks.value), before);
  app.openMonth('2027-03'); [...app.tasks.value].forEach(app.removeTask);
  const emptyBefore = disk.raw; assert.equal(app.copyMonth('2027-04'), null); assert.equal(disk.raw, emptyBefore);
});

test('cópia mensal mantém proteção e avisos quando armazenamento falha', () => {
  for (const disk of [storage('{invalid'), storage(null, true)]) {
    const before = disk.raw, app = useMonthlyTasks(); app.initialize(() => disk); app.openMonth('2026-12');
    assert.equal(app.copyMonth('2027-01'), 7);
    assert.equal(disk.raw, before); assert.match(app.saveStatus.value, /não salvas/);
    assert.ok(app.warning.value);
  }
});
test('operações reativas, progresso e persistência entre meses e sessões', () => {
  const disk = storage(), app = useMonthlyTasks(); app.initialize(() => disk);
  assert.equal(app.tasks.value.length, 7);
  app.toggleTask(app.tasks.value[0], true); assert.equal(app.completed.value, 1);
  app.openMonth(shiftMonth(monthKey(), 1)); assert.equal(app.completed.value, 0);
  app.openMonth(monthKey()); assert.equal(app.completed.value, 1);
  const id = app.addTask('Nova').id, task = app.tasks.value.find(item => item.id === id);
  app.rename(task, '<script>texto</script>'); app.addSubtask(task, 'Passo');
  app.toggleSubtask(task, task.subtasks[0], true); assert.equal(app.completed.value, 2);
  app.rename(task.subtasks[0], 'Revisado');
  const restored = useMonthlyTasks(); restored.initialize(() => disk);
  assert.equal(restored.tasks.value.at(-1).subtasks[0].title, 'Revisado');
  app.removeSubtask(task, task.subtasks[0]); assert.equal(task.completed, true);
  app.removeTask(task); assert.equal(app.tasks.value.length, 7);
});
test('dados inválidos ou versão incompatível não são sobrescritos', () => {
  for (const raw of ['{invalid', '{"version":2,"months":{}}']) {
    const disk = storage(raw), app = useMonthlyTasks(); app.initialize(() => disk);
    app.addTask('Temporária'); assert.equal(disk.raw, raw);
    assert.match(app.warning.value, /nada será sobrescrito/);
    assert.match(app.saveStatus.value, /não salvas/);
  }
});
test('armazenamento bloqueado preserva uso temporário', () => {
  const app = useMonthlyTasks(); app.initialize(() => { throw new Error('blocked'); });
  app.addTask('Em memória'); assert.equal(app.tasks.value.length, 8);
  assert.match(app.warning.value, /Não foi possível ler/);
  const disk = storage(null, true), write = useMonthlyTasks(); write.initialize(() => disk);
  write.addTask('Não salva'); assert.equal(disk.raw, null);
  assert.match(write.warning.value, /não permitiu salvar/);
});

