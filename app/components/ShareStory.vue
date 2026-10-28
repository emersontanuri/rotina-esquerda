<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { Share2 } from '@lucide/vue';
import { achievementSummary } from '../../metrics.js';
import { useTaskStore } from '../composables/useTaskStore.js';
import { createStory, storyDescription } from '../utils/story.js';
import { dismissOnBackdrop } from '../utils/dialog.js';

const { data } = useTaskStore();
const dialog = ref(null), trigger = ref(null), closeButton = ref(null);
const imageUrl = ref(''), description = ref(''), loading = ref(false), sharing = ref(false);
const supported = ref(false), error = ref(''), status = ref('');
let file, generation = 0;
function release() {
  generation++;
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = ''; file = null;
}
function close() {
  dialog.value.close(); release(); trigger.value?.focus();
}
async function generate() {
  release();
  const token = generation;
  loading.value = true; error.value = ''; status.value = ''; supported.value = false;
  try {
    const summary = achievementSummary(data.value.months, new Date());
    const result = await createStory(summary);
    if (token !== generation) return;
    file = result;
    description.value = storyDescription(summary);
    imageUrl.value = URL.createObjectURL(file);
    try { supported.value = !!navigator.share && !!navigator.canShare?.({ files: [file] }); } catch { supported.value = false; }
  } catch {
    if (token === generation) error.value = 'Não foi possível gerar a imagem. Tente novamente.';
  } finally {
    if (token === generation) loading.value = false;
  }
}
function open() {
  dialog.value.showModal(); closeButton.value.focus(); generate();
}
function download() {
  if (!file) return;
  const link = document.createElement('a');
  link.href = imageUrl.value; link.download = file.name;
  document.body.append(link); link.click(); link.remove();
}
async function share() {
  if (!file || sharing.value) return;
  const token = generation;
  sharing.value = true; error.value = ''; status.value = '';
  try {
    await navigator.share({ files: [file] });
    if (token === generation) status.value = 'Imagem entregue ao compartilhamento do dispositivo.';
  } catch (cause) {
    if (token === generation && cause.name !== 'AbortError') error.value = 'Não foi possível compartilhar. Tente novamente ou baixe o PNG.';
  } finally { sharing.value = false; }
}
onBeforeUnmount(release);
</script>

<template>
  <button ref="trigger" class="primary share-story-trigger" type="button" @click="open"><Share2 :size="18" aria-hidden="true" />Compartilhar conquistas</button>
  <dialog ref="dialog" class="share-story-dialog" aria-labelledby="share-story-title" aria-describedby="share-story-help" @cancel.prevent="close" @click="dismissOnBackdrop($event, close)">
    <div class="share-story-heading"><h2 id="share-story-title">Suas conquistas em story</h2><button ref="closeButton" type="button" class="secondary" @click="close">Fechar</button></div>
    <p id="share-story-help">Histórico acumulado até o mês atual. Escolha a rede no menu do dispositivo ou baixe a imagem para publicar.</p>
    <p v-if="loading" role="status">Preparando sua imagem…</p>
    <img v-if="imageUrl" class="share-story-preview" :src="imageUrl" :alt="`Story com ${description}`" width="1080" height="1920">
    <p v-if="imageUrl && !supported" role="status">Este navegador não oferece compartilhamento de imagens. Baixe o PNG e anexe na rede desejada.</p>
    <p v-if="error" role="alert" class="input-error">{{ error }}</p>
    <p v-if="status" role="status">{{ status }}</p>
    <div class="share-story-actions">
      <button v-if="!imageUrl && !loading" type="button" class="secondary" @click="generate">Tentar novamente</button>
      <button type="button" class="secondary" :disabled="!imageUrl || loading" @click="download">Baixar PNG</button>
      <button type="button" class="primary" :disabled="!imageUrl || !supported || sharing" @click="share">{{ sharing ? 'Compartilhando…' : 'Compartilhar imagem' }}</button>
    </div>
  </dialog>
</template>

<style scoped>
.share-story-trigger { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; margin-bottom:1rem; }
.share-story-dialog { width:min(38rem, calc(100% - 2rem)); max-height:calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)); overflow-y:auto; }
.share-story-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
.share-story-heading h2 { min-width:0; margin:0; font-size:1.5rem; overflow-wrap:anywhere; }
.share-story-heading button { flex-shrink:0; white-space:nowrap; }
.share-story-dialog p { font-size:.875rem; line-height:1.6; }
.share-story-preview { display:block; width:min(100%, 18rem); height:auto; margin:1rem auto; border:1px solid var(--line); }
.share-story-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:.75rem; margin-top:1rem; }
button { min-width:44px; }
button:disabled { opacity:.55; cursor:not-allowed; }
@media (min-width:700px) { .share-story-preview { width:min(100%, 20rem); } }
</style>
