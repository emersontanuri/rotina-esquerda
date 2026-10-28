<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { ChevronDown, Copy, Pencil, Trash2 } from '@lucide/vue';
import { SUGGESTIONS, isComplete, monthKey, shiftMonth, validMonth } from '../../model.js';
import { useTaskStore } from '../composables/useTaskStore.js';

const { data, selected, tasks, completed, percent, monthTitle, warning, openMonth, addTask, addSuggestion, copyTask, copyMonth, addSubtask, rename, toggleTask, toggleSubtask, removeTask, removeSubtask } = useTaskStore();
const monthCopyDialog = ref(null), monthCopyInput = ref(null), monthCopyCancel = ref(null);
const monthDestination = ref(''), monthCopyError = ref(''), confirmingMonthCopy = ref(false), copyNotice = ref('');
const destinationCount = computed(() => data.value.months[monthDestination.value]?.length || 0);
const nextMonth = computed(() => selected.value < '9999-12' ? shiftMonth(selected.value, 1) : '');
let monthCopyReturnFocus;
async function showMonthCopy(event) {
  monthCopyReturnFocus = event.currentTarget;
  monthDestination.value = nextMonth.value; monthCopyError.value = ''; confirmingMonthCopy.value = false;
  monthCopyDialog.value.showModal(); await nextTick(); monthCopyInput.value.focus();
}
function closeMonthCopy() { monthCopyDialog.value.close(); monthCopyReturnFocus?.focus(); }
async function submitMonthCopy() {
  if (!validMonth(monthDestination.value) || monthDestination.value <= selected.value || !tasks.value.length) {
    monthCopyError.value = 'Escolha um mês válido posterior ao mês de origem.';
    confirmingMonthCopy.value = false; await nextTick(); monthCopyInput.value.focus(); return;
  }
  if (!confirmingMonthCopy.value) {
    confirmingMonthCopy.value = true; await nextTick(); monthCopyCancel.value.focus(); return;
  }
  const count = copyMonth(monthDestination.value);
  if (count === null) return;
  copiedMonth.value = monthDestination.value;
  copyNotice.value = `${count} ${count === 1 ? 'tarefa copiada' : 'tarefas copiadas'} para ${copiedMonth.value.split('-').reverse().join('/')}.`;
  closeMonthCopy();
}
const suggestionsDialog = ref(null), suggestionsClose = ref(null), suggestionNotice = ref('');
const copyDialog = ref(null), copyInput = ref(null), copyTarget = ref(null), destination = ref(''), copyError = ref(''), copiedMonth = ref('');
let suggestionsReturnFocus, copyReturnFocus;
async function showSuggestions(event) {
  suggestionsReturnFocus = event.currentTarget; suggestionNotice.value = '';
  suggestionsDialog.value.showModal(); await nextTick(); suggestionsClose.value.focus();
}
function closeSuggestions() { suggestionsDialog.value.close(); suggestionsReturnFocus?.focus(); }
function includeSuggestion(suggestion) {
  addSuggestion(suggestion);
  suggestionNotice.value = `“${suggestion.title}” adicionada a ${monthTitle.value}. ${tasks.value.length} tarefas no mês.`;
}
async function showCopy(task, event) {
  copyReturnFocus = event.currentTarget; copyTarget.value = task;
  destination.value = shiftMonth(selected.value, 1); copyError.value = '';
  copyDialog.value.showModal(); await nextTick(); copyInput.value.focus();
}
function closeCopy() { copyDialog.value.close(); copyReturnFocus?.focus(); }
function submitCopy() {
  if (!copyTask(copyTarget.value, destination.value)) {
    copyError.value = 'Escolha um mês válido diferente do mês de origem.'; copyInput.value.focus(); return;
  }
  copiedMonth.value = destination.value; copyNotice.value = `Tarefa copiada para ${copiedMonth.value.split('-').reverse().join('/')}.`; closeCopy();
}
async function viewCopiedMonth() {
  openMonth(copiedMonth.value); copiedMonth.value = '';
  await nextTick(); document.getElementById('add-task')?.focus();
}
const editor = ref(null), titleInput = ref(null), title = ref(''), error = ref(''), editorTitle = ref('');
const expandedTasks = ref(new Set());
const deleteDialog = ref(null), cancelDeleteButton = ref(null), pendingDelete = ref(null);
let deleteReturnFocus;
function toggleExpanded(task) {
  if (expandedTasks.value.has(task.id)) expandedTasks.value.delete(task.id);
  else expandedTasks.value.add(task.id);
}
let editTarget, returnFocus;
onMounted(() => openMonth(selected.value));
async function edit(task, sub, mode, event) {
  returnFocus = event.currentTarget;
  editTarget = { task, sub, mode };
  editorTitle.value = mode === 'new-task' ? 'Nova tarefa' : mode === 'new-sub' ? 'Nova subtarefa' : `Editar ${sub ? 'subtarefa' : 'tarefa'}`;
  title.value = mode.startsWith('new') ? '' : (sub || task).title;
  error.value = '';
  editor.value.showModal(); await nextTick(); titleInput.value.focus();
}
function closeEditor() { editor.value.close(); returnFocus?.focus(); }
function submit() {
  const value = title.value.trim();
  if (!value) { error.value = 'Escreva um nome para continuar.'; titleInput.value.focus(); return; }
  const { task, sub, mode } = editTarget;
  if (mode === 'new-task') addTask(value);
  else if (mode === 'new-sub') { addSubtask(task, value); expandedTasks.value.add(task.id); }
  else rename(sub || task, value);
  closeEditor();
}
async function requestDelete(task, sub, event) {
  pendingDelete.value = { task, sub };
  deleteReturnFocus = event.currentTarget;
  deleteDialog.value.showModal();
  await nextTick(); cancelDeleteButton.value.focus();
}
function cancelDelete() {
  deleteDialog.value.close(); pendingDelete.value = null; deleteReturnFocus?.focus();
}
async function confirmDelete() {
  if (!pendingDelete.value) return;
  const { task, sub } = pendingDelete.value;
  if (sub) removeSubtask(task, sub);
  else { removeTask(task); expandedTasks.value.delete(task.id); }
  deleteDialog.value.close(); pendingDelete.value = null;
  await nextTick(); document.getElementById(sub ? `add-${task.id}` : 'add-task')?.focus();
}
</script>

<template>
  <div>
    <main id="main-content" tabindex="-1">
      <section class="hero"><div><p class="eyebrow">O COLETIVO COMEÇA NO COTIDIANO</p><h1>Pequenos passos.<br><span>Grandes mudanças.</span></h1><p class="intro">Um mês de cada vez, uma ação de cada vez.<br>Este é o seu espaço para transformar intenção em mobilização.</p></div><div class="poster" aria-hidden="true"><span>NINGUÉM<br>TRANSFORMA<br>SOZINHO.</span><b>✳</b><small>FAÇA PARTE DO MOVIMENTO</small></div></section>
      <div v-if="warning" class="warning" role="alert">{{ warning }}</div>
      <section class="workspace" aria-label="Tarefas do mês">
        <div class="month-bar"><div><p class="eyebrow">SUA AGENDA DE MOBILIZAÇÃO</p><div class="month-controls"><h2 id="month-title">{{ monthTitle }}</h2><div class="arrows"><button class="icon-button" aria-label="Mês anterior" @click="openMonth(shiftMonth(selected, -1))">←</button><button class="icon-button" aria-label="Próximo mês" @click="openMonth(shiftMonth(selected, 1))">→</button></div><button v-if="selected !== monthKey()" class="text-button" @click="openMonth(monthKey())">Mês atual</button></div></div><div class="month-actions"><button class="secondary" :disabled="!tasks.length || !nextMonth" @click="showMonthCopy($event)">Copiar todas para outro mês</button><button class="secondary" @click="showSuggestions($event)">Tarefas sugeridas</button><button id="add-task" class="primary" @click="edit(null, null, 'new-task', $event)">+ Nova tarefa</button></div></div>
        <div v-if="copiedMonth" class="copy-notice"><span role="status">{{ copyNotice }}</span><button class="text-button" @click="viewCopiedMonth">Ver mês</button></div><div class="progress-panel"><div class="progress-text"><span>{{ completed }} de {{ tasks.length }} tarefas concluídas</span><span id="progress-percent">{{ percent }}%</span></div><div class="progress-track" role="progressbar" aria-label="Progresso mensal" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="percent"><div :style="{ width: `${percent}%` }" /></div><p>Cada ação conta. Siga no seu ritmo.</p></div>
        <div class="list-heading"><span>PLANO DO MÊS</span><span>{{ tasks.length }} {{ tasks.length === 1 ? 'TAREFA' : 'TAREFAS' }}</span></div>
        <div id="tasks">
          <p v-if="!tasks.length" class="empty">Seu mês está em aberto. Adicione uma tarefa para dar o primeiro passo.</p>
          <article v-for="task in tasks" :key="task.id" class="task" :class="{ done: isComplete(task) }">
            <div class="task-row">
              <input class="check" type="checkbox" :checked="isComplete(task)" :indeterminate="task.subtasks.some(sub => sub.completed) && !isComplete(task)" :aria-label="`Concluir tarefa: ${task.title}`" @change="toggleTask(task, $event.target.checked)">
              <h3 class="task-title">
                <button v-if="task.subtasks.length" type="button" class="task-toggle" :aria-expanded="expandedTasks.has(task.id)" :aria-controls="`subtasks-${task.id}`" @click="toggleExpanded(task)">
                  <span>{{ task.title }}</span><ChevronDown class="task-chevron" :class="{ collapsed: !expandedTasks.has(task.id) }" :size="18" aria-hidden="true" />
                </button>
                <span v-else>{{ task.title }}</span>
              </h3>
            </div>
            <ul v-if="task.subtasks.length" v-show="expandedTasks.has(task.id)" :id="`subtasks-${task.id}`" class="subtasks">
              <li v-for="sub in task.subtasks" :key="sub.id" class="sub-row" :class="{ completed: sub.completed }">
                <input class="check" type="checkbox" :checked="sub.completed" :aria-label="`Concluir subtarefa: ${sub.title}`" @change="toggleSubtask(task, sub, $event.target.checked)">
                <span class="sub-title">{{ sub.title }}</span>
                <div class="task-actions"><button class="action" :aria-label="`Editar subtarefa: ${sub.title}`" @click="edit(task, sub, 'edit', $event)" title="Editar"><Pencil :size="18" aria-hidden="true" /></button><button class="action delete" :aria-label="`Excluir subtarefa: ${sub.title}`" @click="requestDelete(task, sub, $event)" title="Excluir"><Trash2 :size="18" aria-hidden="true" /></button></div>
              </li>
            </ul>
            <div class="task-footer">
              <div class="subtask-summary"><button :id="`add-${task.id}`" class="add-sub" :aria-label="`Adicionar subtarefa em: ${task.title}`" @click="edit(task, null, 'new-sub', $event)">+ Subtarefa</button><span v-if="task.subtasks.length" class="sub-count">{{ task.subtasks.filter(sub => sub.completed).length }}/{{ task.subtasks.length }} passos</span></div>
              <div class="task-actions"><button class="action" :aria-label="`Copiar para outro mês: ${task.title}`" title="Copiar para outro mês" @click="showCopy(task, $event)"><Copy :size="18" aria-hidden="true" /></button><button class="action" :aria-label="`Editar tarefa: ${task.title}`" @click="edit(task, null, 'edit', $event)" title="Editar"><Pencil :size="18" aria-hidden="true" /></button><button class="action delete" :aria-label="`Excluir tarefa: ${task.title}`" @click="requestDelete(task, null, $event)" title="Excluir"><Trash2 :size="18" aria-hidden="true" /></button></div>
            </div>
          </article>
        </div>
        <div class="bottom-note"><span aria-hidden="true">✳</span><p>A transformação também se constrói na constância.<br><strong>Seu próximo passo pode ser pequeno. Comece por ele.</strong></p></div>
      </section>
    </main>
    <dialog ref="editor" aria-labelledby="editor-title" @cancel="closeEditor"><form @submit.prevent="submit"><p class="eyebrow">UM PASSO DE CADA VEZ</p><h2 id="editor-title">{{ editorTitle }}</h2><label for="title-input">Nome</label><input id="title-input" ref="titleInput" v-model="title" name="title" required autocomplete="off" :aria-invalid="!!error" aria-describedby="input-error"><p id="input-error" class="input-error" role="alert">{{ error }}</p><div class="dialog-actions"><button type="button" class="secondary" @click="closeEditor">Cancelar</button><button type="submit" class="primary">Salvar</button></div></form></dialog>
    <dialog ref="suggestionsDialog" class="suggestions-dialog" aria-labelledby="suggestions-title" @cancel.prevent="closeSuggestions">
      <div class="suggestions-heading"><h2 id="suggestions-title">Tarefas sugeridas</h2><button ref="suggestionsClose" class="secondary" @click="closeSuggestions">Fechar</button></div>
      <p>Escolha ações para {{ monthTitle }}. Você pode editar os passos depois.</p>
      <p class="suggestion-notice" role="status">{{ suggestionNotice }}</p>
      <article v-for="suggestion in SUGGESTIONS" :key="suggestion.title" class="suggestion-card">
        <h3>{{ suggestion.title }}</h3><ul><li v-for="step in suggestion.subtasks" :key="step">{{ step }}</li></ul>
        <button class="secondary" :aria-label="`Adicionar ao mês: ${suggestion.title}`" @click="includeSuggestion(suggestion)">Adicionar ao mês</button>
      </article>
    </dialog>
    <dialog ref="copyDialog" aria-labelledby="copy-title" @cancel.prevent="closeCopy">
      <form @submit.prevent="submitCopy" novalidate>
        <h2 id="copy-title">Copiar para outro mês</h2><p class="copy-description">{{ copyTarget?.title }}</p>
        <label for="copy-month">Mês de destino</label><input id="copy-month" ref="copyInput" v-model="destination" type="month" min="0001-01" max="9999-12" required :aria-invalid="!!copyError" aria-describedby="copy-help copy-error">
        <p id="copy-help">A cópia terá todos os passos desmarcados.</p><p id="copy-error" class="input-error" role="alert">{{ copyError }}</p>
        <div class="dialog-actions"><button type="button" class="secondary" @click="closeCopy">Cancelar</button><button type="submit" class="primary">Copiar tarefa</button></div>
      </form>
    </dialog>
    <dialog ref="monthCopyDialog" aria-labelledby="month-copy-title" @cancel.prevent="closeMonthCopy">
      <form @submit.prevent="submitMonthCopy" novalidate>
        <h2 id="month-copy-title">{{ confirmingMonthCopy ? 'Confirmar cópia do mês' : 'Copiar todas para outro mês' }}</h2>
        <p>{{ tasks.length }} tarefas de {{ monthTitle }} serão copiadas com todos os passos desmarcados.</p>
        <template v-if="!confirmingMonthCopy">
          <label for="month-copy-destination">Mês de destino</label>
          <input id="month-copy-destination" ref="monthCopyInput" v-model="monthDestination" type="month" :min="nextMonth" max="9999-12" required :aria-invalid="!!monthCopyError" aria-describedby="month-copy-error">
          <p id="month-copy-error" class="input-error" role="alert">{{ monthCopyError }}</p>
        </template>
        <template v-else>
          <p>Destino: <strong>{{ monthDestination.split('-').reverse().join('/') }}</strong>.</p>
          <p v-if="destinationCount">As {{ destinationCount }} tarefas existentes no destino e suas subtarefas serão excluídas e substituídas. Esta substituição não pode ser desfeita.</p>
          <p v-else>O destino está vazio ou ainda não foi criado. Ele receberá somente as cópias.</p>
        </template>
        <div class="dialog-actions">
          <button ref="monthCopyCancel" type="button" class="secondary" @click="closeMonthCopy">Cancelar</button>
          <button type="submit" class="primary">{{ !confirmingMonthCopy ? 'Continuar' : destinationCount ? 'Substituir e copiar' : 'Copiar tarefas' }}</button>
        </div>
      </form>
    </dialog>
    <dialog ref="deleteDialog" class="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" @cancel.prevent="cancelDelete">
      <p class="eyebrow">CONFIRMAR EXCLUSÃO</p>
      <h2 id="delete-title">Excluir {{ pendingDelete?.sub ? 'subtarefa' : 'tarefa' }}?</h2>
      <div id="delete-description" v-if="pendingDelete" class="delete-description">
        <p>Você vai excluir <strong>“{{ (pendingDelete.sub || pendingDelete.task).title }}”</strong>.</p>
        <p v-if="!pendingDelete.sub && pendingDelete.task.subtasks.length">As {{ pendingDelete.task.subtasks.length }} subtarefas também serão excluídas.</p>
        <p>Esta ação não pode ser desfeita.</p>
      </div>
      <div class="dialog-actions"><button ref="cancelDeleteButton" type="button" class="secondary" @click="cancelDelete">Cancelar</button><button type="button" class="primary" @click="confirmDelete">Excluir</button></div>
    </dialog>
  </div>
</template>

<style scoped>
.month-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.month-actions button:disabled { opacity: .55; cursor: not-allowed; }
.copy-notice { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
.suggestions-dialog { width: min(680px, calc(100% - 32px)); max-height: 85dvh; overflow-y: auto; }
.suggestions-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.suggestions-heading h2 { margin: 0; }
.suggestion-notice { position: sticky; top: -30px; background: var(--paper); padding: 12px 0; z-index: 1; }
.suggestion-notice:empty { display: none; }
.suggestion-card { border-top: 1px solid var(--line); padding: 18px 0; }
.suggestion-card h3 { margin: 0; overflow-wrap: anywhere; }
.suggestion-card li { line-height: 1.7; }
.copy-description { overflow-wrap: anywhere; }
@media (max-width: 700px) { .month-bar { flex-wrap: wrap; } .month-actions { width: 100%; } }
.delete-description { line-height: 1.7; overflow-wrap: anywhere; color: var(--muted); }
.delete-description strong { color: var(--ink); }
.task-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  padding: 8px 0;
  min-height: 44px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
.task-toggle > span:first-child { min-width: 0; overflow-wrap: anywhere; }
.task-chevron { margin-left: auto; color: var(--red); flex-shrink: 0; }
.task-chevron.collapsed { transform: rotate(-90deg); }
.done .task-toggle > span:first-child { text-decoration: line-through; }
.task-actions .action:hover { background: var(--surface); }
</style>





