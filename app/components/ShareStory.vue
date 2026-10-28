<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { ChevronLeft, ChevronRight, Share2 } from '@lucide/vue';
import { achievementSummary } from '../../metrics.js';
import { useTaskStore } from '../composables/useTaskStore.js';
import { createMonthlyStories, createStory, monthlyStorySummary, storyDescription } from '../utils/story.js';
import { dismissOnBackdrop } from '../utils/dialog.js';

const { data } = useTaskStore();
const dialog = ref(null), trigger = ref(null), closeButton = ref(null);
const mode = ref('achievements'), files = ref([]), imageUrls = ref([]), page = ref(0);
const period = ref('previous');
const description = ref(''), loading = ref(false), sharing = ref(false), supported = ref(false);
const error = ref(''), status = ref('');
let generation = 0;
const file = computed(() => files.value[page.value] || null);
const imageUrl = computed(() => imageUrls.value[page.value] || '');
const hasPages = computed(() => files.value.length > 1);

function release() { generation++; imageUrls.value.forEach(url => URL.revokeObjectURL(url)); imageUrls.value = []; files.value = []; page.value = 0; }
function close() { dialog.value.close(); release(); trigger.value?.focus(); }
async function setSupported(currentFile) { try { supported.value = !!navigator.share && !!navigator.canShare?.({ files: [currentFile] }); } catch { supported.value = false; } }
async function generate(nextMode = mode.value) {
  release(); const token = generation; mode.value = nextMode; loading.value = true; error.value = ''; status.value = ''; supported.value = false;
  try {
    const summary = nextMode === 'monthly' ? monthlyStorySummary(data.value.months, new Date(), period.value) : achievementSummary(data.value.months, new Date());
    const generated = nextMode === 'monthly' ? await createMonthlyStories(summary) : [await createStory(summary)];
    if (token !== generation) return;
    files.value = generated; imageUrls.value = generated.map(current => URL.createObjectURL(current));
    description.value = nextMode === 'monthly' ? `Resumo de ${summary.monthTitle}, com ${summary.total} ${summary.total === 1 ? 'atividade concluída' : 'atividades concluídas'}.` : storyDescription(summary);
    await setSupported(generated[0]);
  } catch { if (token === generation) error.value = 'Não foi possível gerar a imagem. Tente novamente.'; }
  finally { if (token === generation) loading.value = false; }
}
function open() { dialog.value.showModal(); closeButton.value.focus(); generate('achievements'); }
function selectPage(index) { page.value = Math.max(0, Math.min(index, files.value.length - 1)); status.value = ''; setSupported(file.value); }
function download() { if (!file.value) return; const link = document.createElement('a'); link.href = imageUrl.value; link.download = file.value.name; document.body.append(link); link.click(); link.remove(); }
async function share() {
  if (!file.value || sharing.value) return; const token = generation; sharing.value = true; error.value = ''; status.value = '';
  try { await navigator.share({ files: [file.value] }); if (token === generation) status.value = 'Imagem entregue ao compartilhamento do dispositivo.'; }
  catch (cause) { if (token === generation && cause.name !== 'AbortError') error.value = 'Não foi possível compartilhar. Tente novamente ou baixe o PNG.'; }
  finally { sharing.value = false; }
}
onBeforeUnmount(release);
</script>

<template>
  <button ref="trigger" class="primary share-story-trigger" type="button" @click="open"><Share2 :size="18" aria-hidden="true" />Compartilhar conquistas</button>
  <dialog ref="dialog" class="share-story-dialog" aria-labelledby="share-story-title" aria-describedby="share-story-help" @cancel.prevent="close" @click="dismissOnBackdrop($event, close)">
    <div class="share-story-heading"><h2 id="share-story-title">Suas conquistas em story</h2><button ref="closeButton" type="button" class="secondary" @click="close">Fechar</button></div>
    <p id="share-story-help">Crie uma arte com seu histórico acumulado ou com as atividades concluídas no mês escolhido.</p>
    <label class="share-story-type">Tipo de arte<select aria-label="Tipo de arte" :value="mode" @change="generate($event.target.value)"><option value="achievements">Conquistas acumuladas</option><option value="monthly">Resumo do mês</option></select></label>
    <label v-if="mode === 'monthly'" class="share-story-type">Período<select v-model="period" aria-label="Período do resumo" @change="generate()"><option value="previous">Mês anterior</option><option value="current">Mês atual (até agora)</option></select></label>
    <p v-if="mode === 'monthly' && period === 'current'">O mês está em andamento; a comparação usa os resultados atuais e o mês anterior completo.</p>
    <p v-if="loading" role="status">Preparando sua imagem…</p>
    <div v-if="imageUrl" class="share-story-page"><img class="share-story-preview" :src="imageUrl" :alt="`Story com ${description}`" width="1080" height="1920"></div>
    <div v-if="hasPages" class="share-story-navigation" aria-label="Navegação das imagens"><button type="button" class="secondary" :disabled="page === 0" aria-label="Imagem anterior" @click="selectPage(page - 1)"><ChevronLeft aria-hidden="true" />Anterior</button><span aria-live="polite">{{ page + 1 }}/{{ files.length }}</span><button type="button" class="secondary" :disabled="page === files.length - 1" aria-label="Próxima imagem" @click="selectPage(page + 1)">Próxima<ChevronRight aria-hidden="true" /></button></div>
    <p v-if="imageUrl && !supported" role="status">Este navegador não oferece compartilhamento de imagens. Baixe o PNG e anexe na rede desejada.</p>
    <p v-if="error" role="alert" class="input-error">{{ error }}</p><p v-if="status" role="status">{{ status }}</p>
    <div class="share-story-actions"><button v-if="!imageUrl && !loading" type="button" class="secondary" @click="generate()">Tentar novamente</button><button type="button" class="secondary" :disabled="!imageUrl || loading" @click="download">Baixar PNG</button><button type="button" class="primary" :disabled="!imageUrl || !supported || sharing" @click="share">{{ sharing ? 'Compartilhando…' : 'Compartilhar imagem' }}</button></div>
  </dialog>
</template>

<style scoped>
.share-story-trigger { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; margin-bottom:1rem; }
.share-story-dialog { width:min(38rem, calc(100% - 2rem)); max-height:calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)); overflow-y:auto; }
.share-story-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
.share-story-heading h2 { min-width:0; margin:0; font-size:1.5rem; overflow-wrap:anywhere; }
.share-story-heading button { flex-shrink:0; white-space:nowrap; }
.share-story-dialog p { font-size:.875rem; line-height:1.6; }
.share-story-type { display:grid; gap:.375rem; margin:1rem 0; font-weight:700; }
.share-story-type select { min-height:44px; font:inherit; padding:.5rem; }
.share-story-preview { display:block; width:min(100%, 18rem); height:auto; margin:1rem auto; border:1px solid var(--line); }
.share-story-navigation { display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
.share-story-navigation button { display:inline-flex; align-items:center; gap:.25rem; }
.share-story-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:.75rem; margin-top:1rem; }
button { min-width:44px; }
button:disabled { opacity:.55; cursor:not-allowed; }
@media (min-width:700px) { .share-story-preview { width:min(100%, 20rem); } }
</style>
