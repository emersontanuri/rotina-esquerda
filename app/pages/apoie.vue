<script setup>
import { ref } from 'vue';

useHead({ title: 'Apoie o Base Ativa' });
const pix = '00020101021126580014br.gov.bcb.pix01363fdfecbf-5b46-408e-b903-89a5e78ba3275204000053039865802BR5917EMERSON J T SILVA6009PETROLINA62070503***630444FB';
const copyStatus = ref('');

async function copyPix() {
  try {
    await navigator.clipboard.writeText(pix);
    copyStatus.value = 'Código Pix copiado. Cole no aplicativo do seu banco.';
  } catch {
    copyStatus.value = 'Não foi possível copiar. Selecione o código no campo Pix Copia e Cola e copie manualmente.';
  }
}
</script>

<template>
  <main id="main-content" class="support">
    <header class="hero">
      <h1>Apoie o Base Ativa</h1>
      <p>Sua contribuição voluntária ajuda a manter e desenvolver o Base Ativa. Escolha como apoiar e contribua com o valor que quiser.</p>
    </header>
    <div class="support-options">
      <section aria-labelledby="coffee-title">
        <h2 id="coffee-title">Um café para seguir construindo</h2>
        <p>Você pode apoiar o projeto pelo Buy Me a Coffee.</p>
        <a class="primary coffee-link" href="https://buymeacoffee.com/tanuri" target="_blank" rel="noopener noreferrer">Apoiar pelo Buy Me a Coffee<span class="sr-only"> (abre em nova aba)</span></a>
      </section>
      <section aria-labelledby="pix-title">
        <h2 id="pix-title">Contribua com Pix</h2>
        <p>Escaneie o QR Code com o aplicativo do seu banco ou copie o código abaixo.</p>
        <img class="pix-qr" src="/pix-apoio.svg" width="256" height="256" alt="QR Code Pix para apoiar o Base Ativa. O mesmo código está disponível no campo abaixo.">
        <p class="pix-recipient">Destinatário: <strong>EMERSON J T SILVA</strong></p>
        <label for="pix-code">Pix Copia e Cola</label>
        <input id="pix-code" type="text" :value="pix" readonly spellcheck="false">
        <button type="button" class="primary" @click="copyPix">Copiar código Pix</button>
        <p class="copy-status" role="status">{{ copyStatus }}</p>
      </section>
    </div>
    <p class="support-note">Acessar o Buy Me a Coffee e concluir o pagamento exige conexão com a internet. O QR Code e o código Pix ficam disponíveis offline após o aplicativo estar em cache.</p>
  </main>
</template>

<style scoped>
.support { padding-bottom:2rem; }
.hero p { max-width:60ch; margin:0; }
.support-options { display:grid; gap:2rem; border-top:2px solid var(--ink); padding-top:1.5rem; }
section { min-width:0; }
section p { margin:1rem 0; }
.coffee-link { display:inline-flex; align-items:center; justify-content:center; min-height:var(--touch); text-decoration:none; }
.pix-qr { display:block; width:min(100%,16rem); height:auto; background:#fff; }
.pix-recipient { overflow-wrap:anywhere; }
label { display:block; margin-bottom:.5rem; }
input { display:block; width:100%; min-width:0; min-height:var(--touch); margin-bottom:1rem; padding:.625rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--card); font-size:1rem; }
.copy-status { min-height:1.5em; }
.support-note { max-width:70ch; margin:2rem 0 0; color:var(--muted); }
@media (min-width:700px) {
  .support-options { grid-template-columns:repeat(2,minmax(0,1fr)); }
  section + section { border-left:1px solid var(--line); padding-left:2rem; }
}
</style>
