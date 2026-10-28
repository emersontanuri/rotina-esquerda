<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Sun, Moon, Download, X } from '@lucide/vue';
import { useTaskStore } from './composables/useTaskStore.js';
import { useTheme } from './composables/useTheme.js';
const { initialize, saveStatus } = useTaskStore();
const { preference, start, toggle } = useTheme();
const themeIcon = computed(() => preference.value === 'dark' ? Moon : Sun);
const { $pwa } = useNuxtApp();
const route = useRoute();
const isPresentation = computed(() => route.path === '/apresentacao');
const offline = ref(false);
const installPrompt = ref(null);
const ios = ref(false);
const standalone = ref(false);
const installDelayElapsed = ref(false);
const installDismissed = ref(false);
const installHelp = ref(false);
const canInstall = computed(() => !standalone.value && (installPrompt.value || ios.value));
const showInstallNotice = computed(() => canInstall.value && (installHelp.value || (installDelayElapsed.value && !installDismissed.value)));
let installTimer;
const updateConnection = () => { offline.value = !navigator.onLine; };
const offerInstall = event => { event.preventDefault(); installPrompt.value = event; };
const installed = () => { installPrompt.value = null; standalone.value = true; };
function dismissInstall() {
  installDismissed.value = true;
  installHelp.value = false;
  try { sessionStorage.setItem('rotina-esquerda:install-dismissed', '1'); } catch {}
}
initialize(undefined, false);
onMounted(() => {
  start();
  updateConnection();
  standalone.value = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  ios.value = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  try { installDismissed.value = sessionStorage.getItem('rotina-esquerda:install-dismissed') === '1'; } catch {}
  installTimer = window.setTimeout(() => { installDelayElapsed.value = true; }, 8000);
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  window.addEventListener('beforeinstallprompt', offerInstall);
  window.addEventListener('appinstalled', installed);
});
onUnmounted(() => {
  window.clearTimeout(installTimer);
  window.removeEventListener('online', updateConnection);
  window.removeEventListener('offline', updateConnection);
  window.removeEventListener('beforeinstallprompt', offerInstall);
  window.removeEventListener('appinstalled', installed);
});
async function installApp() {
  const prompt = installPrompt.value;
  if (!prompt) { installHelp.value = true; return; }
  installPrompt.value = null;
  dismissInstall();
  try { await prompt.prompt(); }
  catch { installPrompt.value = prompt; }
}
function updateApp() {
  if (document.querySelector('dialog[open]')) return;
  $pwa?.updateServiceWorker(true);
}
</script>
<template>
  <div :class="{ 'presentation-shell': isPresentation }">
    <VitePwaManifest />
    <a class="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header class="topbar">
      <NuxtLink class="brand" to="/" aria-label="Rotina de Base — início"><img class="brand-mark" src="/rotina-de-base.svg" width="35" height="35" alt=""> ROTINA DE BASE</NuxtLink>
      <nav v-if="!isPresentation" class="main-nav" aria-label="Navegação principal"><NuxtLink to="/">Tarefas</NuxtLink><NuxtLink to="/metricas">Métricas</NuxtLink></nav>
      <div class="header-tools"><span v-if="!isPresentation" class="edition">ORGANIZAR · PARTICIPAR · TRANSFORMAR</span><button v-if="canInstall && !isPresentation" type="button" class="theme-toggle" aria-label="Instalar aplicativo" title="Instalar aplicativo" @click="installApp"><Download :size="20" aria-hidden="true" /></button><button type="button" class="theme-toggle" :aria-label="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" :title="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle"><component :is="themeIcon" :size="20" aria-hidden="true" /></button></div>
    </header>
    <section v-if="showInstallNotice" class="app-notice install-notice" aria-label="Instalar no celular">
      <div role="status"><strong>Tenha a Rotina de Base na tela de início</strong><p v-if="ios && !installPrompt">No Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</p><p v-else>Instale no celular para abrir suas tarefas com um toque.</p></div>
      <button v-if="installPrompt" type="button" class="primary" @click="installApp">Instalar aplicativo</button>
      <button type="button" class="icon-button" aria-label="Fechar aviso de instalação" @click="dismissInstall"><X :size="20" aria-hidden="true" /></button>
    </section>
    <div v-if="offline" class="app-notice" role="status">Você está offline. Suas tarefas continuam disponíveis neste navegador.</div>
    <div v-if="$pwa?.needRefresh" class="app-notice update-notice" role="status">
      <span>Uma nova versão está disponível. Salve e feche qualquer janela de edição antes de atualizar.</span>
      <button class="secondary" @click="updateApp">Atualizar agora</button>
    </div>
    <NuxtPage />
    <footer v-if="!isPresentation"><span class="footer-brand"><img src="/rotina-de-base.svg" width="24" height="24" alt=""> ROTINA DE BASE</span><p role="status">{{ saveStatus }}</p><button v-if="installPrompt" class="secondary install-button" @click="installApp">Instalar aplicativo</button><small>Os dados ficam neste navegador e podem ser perdidos ao limpar o armazenamento.</small><small v-if="$pwa?.offlineReady">Aplicativo pronto para uso offline.</small></footer>
  </div>
</template>
