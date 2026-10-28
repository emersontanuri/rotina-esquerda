<script setup>
import { nextTick, ref } from 'vue';
import { Play } from '@lucide/vue';

useHead({
  title: 'Conheça a Rotina de Base — O coletivo começa no cotidiano',
  link: [{ rel: 'preload', href: '/fonts/barlow-condensed-800.ttf', as: 'font', type: 'font/ttf', crossorigin: '' }],
});
const video = ref(null);
const playButton = ref(null);
const started = ref(false);
const playbackError = ref(false);

async function playVideo() {
  const retry = playbackError.value;
  playbackError.value = false;
  try {
    if (retry || video.value.error) video.value.load();
    await video.value.play();
    started.value = true;
    video.value.focus();
  } catch {
    await failVideo();
  }
}

async function failVideo() {
  started.value = false;
  playbackError.value = true;
  video.value?.pause();
  await nextTick();
  playButton.value?.focus();
}
</script>

<template>
  <main id="main-content" class="presentation">
    <div class="presentation-message">
      <h1>O coletivo começa<br>no cotidiano</h1>
      <p>Transforme intenção em ação. Organize suas tarefas mensais e faça sua participação acontecer.</p>
    </div>
    <figure class="presentation-media">
      <div class="presentation-film">
        <video ref="video" controls playsinline preload="none" poster="/presentation/video-cartaz.png" width="1920" height="1080" :tabindex="started ? 0 : -1" aria-label="Conheça a Rotina de Base: demonstração das tarefas e métricas" @play="started = true" @error="failVideo">
          <source src="/videos/rotina-de-base.mp4" type="video/mp4" @error="failVideo">
          Seu navegador não suporta este vídeo. <a href="/videos/rotina-de-base.mp4">Baixar a demonstração</a>.
        </video>
        <button v-if="!started" ref="playButton" class="presentation-play" type="button" aria-label="Reproduzir apresentação de 25 segundos" @click="playVideo">
          <img src="/presentation/video-cartaz.png" alt="" width="1672" height="941">
          <span class="play-disc"><Play :size="28" fill="currentColor" aria-hidden="true" /></span>
        </button>
      </div>
      <figcaption>Conheça em 25 segundos</figcaption>
      <p v-if="playbackError" class="playback-error" role="alert">Não foi possível reproduzir o vídeo. Verifique sua conexão e tente novamente.</p>
    </figure>
    <NuxtLink class="primary presentation-cta" to="/">Ir para minhas tarefas</NuxtLink>
    <div class="presentation-art" aria-hidden="true">
      <img class="art-left" src="/presentation/mobilizacao-esquerda.png" alt="" width="726" height="1022">
      <img class="art-right" src="/presentation/mobilizacao-direita.png" alt="" width="696" height="1024">
    </div>
  </main>
</template>

<style scoped>
@font-face {
  font-family:CartazDisplay;
  src:url('/fonts/barlow-condensed-800.ttf') format('truetype');
  font-weight:800;
  font-display:swap;
}
.presentation {
  position:relative;
  isolation:isolate;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:1.25rem;
  flex:1;
  width:100%;
  margin:0;
  max-width:none;
  min-height:0;
  padding-block:2rem max(12rem, env(safe-area-inset-bottom));
  text-align:center;
}
.presentation-art { position:absolute; z-index:-1; inset:auto 0 0; aspect-ratio:3 / 2; background:url('/presentation/mobilizacao.png') center bottom / 100% auto no-repeat; pointer-events:none; }
.presentation-art img { display:none; height:auto; }
.presentation-message { width:100%; max-width:48rem; }
.presentation h1 { position:relative; font-family:CartazDisplay,'Barlow Condensed','Arial Narrow',Impact,sans-serif; font-size:clamp(2.5rem, 8.5vw, 5.5rem); margin:0 0 1.5rem; padding-bottom:.875rem; overflow-wrap:anywhere; }
.presentation h1::after { content:''; position:absolute; bottom:0; left:50%; width:7rem; height:.3rem; background:var(--red); border-radius:60% 35% 55% 25%; transform:translateX(-50%) rotate(-2deg); }
.presentation-message p { margin:0 auto; max-width:48ch; color:var(--ink); font-size:1rem; line-height:1.65; }
.presentation-media { width:100%; max-width:42rem; margin:0; }
.presentation-film { position:relative; width:100%; overflow:hidden; border:1px solid var(--ink); border-radius:.35rem; background:var(--paper); }
video { display:block; width:100%; height:auto; aspect-ratio:16/9; object-fit:contain; background:#000; }
.presentation-play { position:absolute; inset:0; display:grid; place-items:center; width:100%; height:100%; padding:0; border:0; background:var(--paper); }
.presentation-play img { position:absolute; width:100%; height:100%; object-fit:cover; }
.play-disc { position:relative; display:grid; place-items:center; width:3.75rem; height:3.75rem; padding-left:.2rem; border:1px solid #fffaf0; border-radius:50%; background:#b7241dea; color:#fffaf0; box-shadow:0 .125rem .75rem #25241f30; }
.presentation-play:focus-visible { outline-offset:-5px; }
.presentation-play:hover { filter:none; }
.presentation-play:hover .play-disc { background:#9b1d17; }
figcaption { margin-top:.625rem; font-size:.875rem; color:var(--muted); }
.playback-error { margin:.5rem 0 0; font-size:.875rem; color:var(--red); }
.presentation-cta { display:inline-flex; align-items:center; justify-content:center; width:100%; max-width:20rem; min-height:3.25rem; padding:.75rem 1.25rem; text-decoration:none; font-size:1rem; }
:global(:root[data-theme=dark]) .presentation-art { opacity:.65; }
@media (min-width:450px) {
  .presentation { padding-bottom:14rem; }
}
@media (min-width:700px) {
  .presentation { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,min(60%,48rem)) minmax(0,1fr); gap:1.25rem; align-content:start; padding-inline:0; padding-bottom:2rem; }
  .presentation-message,.presentation-media,.presentation-cta { grid-column:2; justify-self:center; }
  .presentation-message { grid-row:1; }
  .presentation-media { grid-row:2; }
  .presentation-cta { grid-row:3; }
  .presentation-art { inset:0; height:auto; aspect-ratio:auto; background:none; }
  .presentation-art img { display:block; position:absolute; bottom:0; width:min(30rem,calc((100% - min(60%,48rem)) / 2 - .625rem)); }
  .art-left { left:0; }
  .art-right { right:0; }
  .presentation h1 { font-size:clamp(2.5rem,5.5vw,5.5rem); }
  .presentation-message p { max-width:42ch; font-size:1.125rem; }
  .presentation-media { width:100%; }
  .play-disc { width:4.75rem; height:4.75rem; }
}
@media (min-width:1024px) {
  .presentation { gap:1.25rem; }
  .presentation-message { max-width:48rem; }
  .presentation-media { max-width:min(42rem, 72dvh); }
}
</style>
