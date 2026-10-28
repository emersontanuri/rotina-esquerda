export default defineNuxtConfig({
  compatibilityDate: '2026-10-27',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      script: [{ src: '/theme-init.js', tagPosition: 'head' }],
      title: 'Rotina de Base — O coletivo começa no cotidiano',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/rotina-de-base.svg' }],
      meta: [
        { name: 'theme-color', content: '#c92c25' },
        { name: 'description', content: 'Rotina de Base. O coletivo começa no cotidiano. Organize suas tarefas mensais de mobilização, uma ação de cada vez.' },
      ],
    },
  },
});
