import { computed, ref } from 'vue';
import { STORAGE_KEY, SUGGESTIONS, createMonth, freshTask, isComplete, migrateLegacyTasks, monthKey, validMonth, validateData } from '../../model.js';

// Acesso ao navegador apenas em initialize(), durante a inicialização no cliente.
export function useMonthlyTasks() {
  const data = ref({ version: 1, months: {} });
  const selected = ref(monthKey());
  const warning = ref('');
  const saveStatus = ref('Salvo neste navegador. Sem cadastro, do seu jeito.');
  let storage, blocked = false, initialized = false;
  const tasks = computed(() => data.value.months[selected.value] || []);
  const completed = computed(() => tasks.value.filter(isComplete).length);
  const percent = computed(() => tasks.value.length ? Math.round(completed.value / tasks.value.length * 100) : 0);
  const monthTitle = computed(() => {
    const [year, month] = selected.value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  });
  function save() {
    if (blocked) { saveStatus.value = 'Lista temporária — alterações não salvas.'; return; }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data.value));
      saveStatus.value = 'Tudo salvo neste navegador.';
      warning.value = '';
    } catch {
      warning.value = 'O navegador não permitiu salvar. Suas alterações estão disponíveis nesta página, mas podem ser perdidas ao recarregar.';
      saveStatus.value = 'Alterações não salvas. Armazenamento indisponível.';
    }
  }
  function openMonth(key) {
    if (!validMonth(key)) return false;
    if (migrateLegacyTasks(data.value)) save();
    selected.value = key;
    if (!data.value.months[key]) { data.value.months[key] = createMonth(); save(); }
  }
  function initialize(getStorage = () => window.localStorage, createSelected = true) {
    if (initialized) return;
    initialized = true;
    try {
      storage = getStorage();
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!validateData(parsed)) throw new Error('invalid');
        data.value = parsed;
      }
    } catch {
      blocked = true;
      warning.value = 'Não foi possível ler os dados salvos. Para protegê-los, nada será sobrescrito. Você pode usar uma lista temporária nesta página; alterações não serão salvas.';
      saveStatus.value = 'Lista temporária — alterações não salvas.';
    }
    if (createSelected) openMonth(selected.value);
  }
  function addTask(title) {
    const task = { id: crypto.randomUUID(), title, completed: false, subtasks: [] };
    tasks.value.push(task); save(); return task;
  }
  function addSuggestion(suggestion) {
    if (!SUGGESTIONS.includes(suggestion)) return null;
    const task = freshTask(suggestion);
    tasks.value.push(task); save(); return task;
  }
  function copyTask(task, destination) {
    if (!validMonth(destination) || destination === selected.value || !tasks.value.includes(task)) return null;
    const copy = freshTask(task);
    if (!data.value.months[destination]) data.value.months[destination] = createMonth();
    data.value.months[destination].push(copy); save(); return copy;
  }
  function addSubtask(task, title) {
    task.subtasks.push({ id: crypto.randomUUID(), title, completed: false }); task.completed = false; save();
  }
  function copyMonth(destination) {
    if (!validMonth(destination) || destination <= selected.value || !tasks.value.length) return null;
    const copies = tasks.value.map(freshTask);
    data.value.months[destination] = copies;
    save(); return copies.length;
  }
  function rename(item, title) { item.title = title; save(); }
  function toggleTask(task, checked) { task.completed = checked; task.subtasks.forEach(sub => sub.completed = checked); save(); }
  function toggleSubtask(task, sub, checked) { sub.completed = checked; task.completed = isComplete(task); save(); }
  function removeTask(task) { data.value.months[selected.value] = tasks.value.filter(item => item.id !== task.id); save(); }
  function removeSubtask(task, sub) {
    const complete = isComplete(task);
    task.subtasks = task.subtasks.filter(item => item.id !== sub.id);
    task.completed = task.subtasks.length ? isComplete(task) : complete; save();
  }
  return { data, selected, tasks, completed, percent, monthTitle, warning, saveStatus, initialize, openMonth, addTask, addSuggestion, copyTask, copyMonth, addSubtask, rename, toggleTask, toggleSubtask, removeTask, removeSubtask };
}
