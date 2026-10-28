<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Sun, Moon } from '@lucide/vue';
import { useTaskStore } from './composables/useTaskStore.js';
import { useTheme } from './composables/useTheme.js';
const { initialize, saveStatus } = useTaskStore();
const { preference, start, toggle } = useTheme();
const themeIcon = computed(() => preference.value === 'dark' ? Moon : Sun);
const { $pwa } = useNuxtApp();
const offline = ref(false);
const installPrompt = ref(null);
const updateConnection = () => { offline.value = !navigator.onLine; };
const offerInstall = event => { event.preventDefault(); installPrompt.value = event; };
const installed = () => { installPrompt.value = null; };
initialize(undefined, false);
onMounted(() => {
  start();
  updateConnection();
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  window.addEventListener('beforeinstallprompt', offerInstall);
  window.addEventListener('appinstalled', installed);
});
onUnmounted(() => {
  window.removeEventListener('online', updateConnection);
  window.removeEventListener('offline', updateConnection);
  window.removeEventListener('beforeinstallprompt', offerInstall);
  window.removeEventListener('appinstalled', installed);
});
async function installApp() {
  const prompt = installPrompt.value;
  installPrompt.value = null;
  await prompt?.prompt();
}
function updateApp() {
  if (document.querySelector('dialog[open]')) return;
  $pwa?.updateServiceWorker(true);
}
</script>
<template>
  <div>
    <VitePwaManifest />
    <a class="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header class="topbar">
      <NuxtLink class="brand" to="/" aria-label="Rotina de Base — início"><img class="brand-mark" src="/rotina-de-base.svg" width="35" height="35" alt=""> ROTINA DE BASE</NuxtLink>
      <nav class="main-nav" aria-label="Navegação principal"><NuxtLink to="/">Tarefas</NuxtLink><NuxtLink to="/metricas">Métricas</NuxtLink></nav>
      <div class="header-tools"><span class="edition">ORGANIZAR · PARTICIPAR · TRANSFORMAR</span><button type="button" class="theme-toggle" :aria-label="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" :title="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle"><component :is="themeIcon" :size="20" aria-hidden="true" /></button></div>
    </header>
    <div v-if="offline" class="app-notice" role="status">Você está offline. Suas tarefas continuam disponíveis neste navegador.</div>
    <div v-if="$pwa?.needRefresh" class="app-notice update-notice" role="status">
      <span>Uma nova versão está disponível. Salve e feche qualquer janela de edição antes de atualizar.</span>
      <button class="secondary" @click="updateApp">Atualizar agora</button>
    </div>
    <NuxtPage />
    <footer><span class="footer-brand"><img src="/rotina-de-base.svg" width="24" height="24" alt=""> ROTINA DE BASE</span><p role="status">{{ saveStatus }}</p><button v-if="installPrompt" class="secondary install-button" @click="installApp">Instalar aplicativo</button><small>Os dados ficam neste navegador e podem ser perdidos ao limpar o armazenamento.</small><small v-if="$pwa?.offlineReady">Aplicativo pronto para uso offline.</small></footer>
  </div>
</template>
