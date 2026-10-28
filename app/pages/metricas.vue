<script setup>
import { computed, ref } from 'vue';
import { ClipboardCheck, Flame, ChartNoAxesColumnIncreasing, Calculator } from '@lucide/vue';
import { annualMetrics } from '../../metrics.js';
import { useTaskStore } from '../composables/useTaskStore.js';

const { data, warning } = useTaskStore();
const now = new Date();
const year = ref(now.getFullYear());
const years = computed(() => [...new Set([now.getFullYear(), ...Object.keys(data.value.months).map(key => Number(key.slice(0, 4)))])].sort((a, b) => b - a));
const metrics = computed(() => annualMetrics(data.value.months, year.value, now));
const fullMonth = key => new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1));
const shortMonth = key => fullMonth(key).slice(0, 3);
const best = computed(() => metrics.value.best.map(fullMonth).join(', ') || 'Nenhum ainda');
const format = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const level = count => count ? Math.max(1, Math.ceil(count / metrics.value.max * 5)) : 0;
const ceiling = computed(() => Math.max(5, Math.ceil(metrics.value.max / 5) * 5));
const streakLabel = computed(() => metrics.value.streak === null ? 'Indisponível' : `${metrics.value.streak} ${metrics.value.streak === 1 ? 'mês' : 'meses'}`);
const streakMessage = computed(() => metrics.value.streak === null ? 'A sequência deste ano poderá ser acompanhada quando ele começar.' : metrics.value.streak === 0 ? 'Uma tarefa concluída pode ser o começo de uma nova sequência.' : 'Cada mês dessa sequência tem pelo menos uma tarefa concluída. Siga no seu ritmo.');
</script>

<template>
  <main id="main-content" class="metrics-page" tabindex="-1">
    <section class="metrics-hero">
      <div><p class="eyebrow">SUA CONSTÂNCIA EM MOVIMENTO</p><h1>Cada <span>ação</span> conta.</h1><p class="intro">Acompanhe suas tarefas concluídas, mês a mês.</p></div>
      <label class="year-picker">Ano <select v-model.number="year"><option v-for="option in years" :key="option" :value="option">{{ option }}</option></select></label>
    </section>
    <div v-if="warning" class="warning" role="alert">{{ warning }}</div>
    <div class="metric-cards">
      <article class="metric-card"><ClipboardCheck aria-hidden="true" /><strong>{{ format(metrics.total) }}</strong><p>Tarefas concluídas no ano</p></article>
      <article class="metric-card"><Flame aria-hidden="true" /><strong>{{ streakLabel }}</strong><p>Sequência de meses ativos</p><small>{{ year === now.getFullYear() ? 'Atual, podendo começar no ano anterior' : year < now.getFullYear() ? 'Até dezembro do ano selecionado' : 'O ano ainda não começou' }}</small></article>
      <article class="metric-card best-month"><ChartNoAxesColumnIncreasing aria-hidden="true" /><strong>{{ best }}</strong><p>{{ metrics.best.length > 1 ? 'Meses mais ativos' : 'Mês mais ativo' }}</p></article>
      <article class="metric-card"><Calculator aria-hidden="true" /><strong>{{ format(metrics.average) }}</strong><p>Média por mês ativo</p><small>Apenas meses com conclusões</small></article>
    </div>
    <section class="metrics-panel heatmap-panel" aria-labelledby="heatmap-title">
      <h2 id="heatmap-title">Seu ano em cores</h2><p class="panel-description">Cada bloco representa um mês.</p>
      <ol class="monthly-heatmap">
        <li v-for="month in metrics.entries" :key="month.key" class="month-tile" :class="`heat-${level(month.count)}`">
          <span class="tile-month">{{ shortMonth(month.key) }}</span><strong>{{ month.future && !month.count ? '—' : month.count }}</strong>
          <small v-if="month.future && !month.count">Ainda não começou</small><span v-else class="sr-only">tarefas concluídas</span>
        </li>
      </ol>
      <div class="heatmap-caption"><div class="heat-legend" aria-label="A intensidade aumenta conforme a quantidade de tarefas"><span>Menos tarefas</span><i v-for="n in 5" :key="n" :class="`heat-${n}`" aria-hidden="true" /><span>Mais tarefas</span></div><p>As cores comparam os meses deste ano.</p></div>
    </section>
    <div class="metrics-bottom">
      <section class="metrics-panel chart-panel" aria-labelledby="chart-title">
        <h2 id="chart-title">Tarefas concluídas por mês</h2><p class="panel-description">{{ year }} · Total: <strong>{{ format(metrics.total) }}</strong></p>
        <div class="bar-chart">
          <div class="chart-axis" aria-hidden="true"><span>{{ ceiling }}</span><span>{{ format(ceiling / 2) }}</span><span>0</span></div>
          <div class="chart-columns">
            <div v-for="month in metrics.entries" :key="month.key" class="chart-column">
              <div class="bar-track"><div class="month-bar-fill" :style="{ height: `${month.count / ceiling * 100}%` }"><span class="bar-value">{{ month.future && !month.count ? '—' : month.count }}</span></div></div>
              <span class="bar-label">{{ shortMonth(month.key) }}</span><span class="sr-only">{{ month.future && !month.count ? 'Ainda não começou' : `${month.count} tarefas concluídas` }}</span>
            </div>
          </div>
        </div>
      </section>
      <aside class="streak-poster" aria-label="Constância mensal">
        <span class="streak-asterisk" aria-hidden="true">✳</span>
        <h2>{{ metrics.streak === null ? 'UM ANO' : streakLabel }}<br>{{ metrics.streak ? 'EM MOVIMENTO' : 'PARA CONSTRUIR' }}</h2>
        <p>{{ streakMessage }}</p><small>Constância construída mês a mês.</small>
      </aside>
    </div>
    <p v-if="!metrics.total" class="metrics-empty" role="status">Nenhuma tarefa concluída em {{ year }}. Suas ações vão dar cor a este espaço.</p>
    <p class="metrics-footnote">Os números refletem o estado atual das listas mensais. Alterar ou excluir tarefas atualiza as métricas. A sequência ignora meses futuros.</p>
  </main>
</template>
