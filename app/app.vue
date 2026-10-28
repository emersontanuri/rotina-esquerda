<script setup>
import { computed, onMounted } from 'vue';
import { Sun, Moon } from '@lucide/vue';
import { useTaskStore } from './composables/useTaskStore.js';
import { useTheme } from './composables/useTheme.js';
const { initialize, saveStatus } = useTaskStore();
const { preference, start, toggle } = useTheme();
const themeIcon = computed(() => preference.value === 'dark' ? Moon : Sun);
initialize(undefined, false);
onMounted(start);
</script>
<template>
  <div>
    <header class="topbar">
      <NuxtLink class="brand" to="/" aria-label="Rotina de Base — início"><img class="brand-mark" src="/rotina-de-base.svg" width="35" height="35" alt=""> ROTINA DE BASE</NuxtLink>
      <nav class="main-nav" aria-label="Navegação principal"><NuxtLink to="/">Tarefas</NuxtLink><NuxtLink to="/metricas">Métricas</NuxtLink></nav>
      <div class="header-tools"><span class="edition">ORGANIZAR · PARTICIPAR · TRANSFORMAR</span><button type="button" class="theme-toggle" :aria-label="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" :title="preference === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle"><component :is="themeIcon" :size="20" aria-hidden="true" /></button></div>
    </header>
    <NuxtPage />
    <footer><span class="footer-brand"><img src="/rotina-de-base.svg" width="24" height="24" alt=""> ROTINA DE BASE</span><p role="status">{{ saveStatus }}</p><small>Os dados ficam neste navegador e podem ser perdidos ao limpar o armazenamento.</small></footer>
  </div>
</template>
