# Revisão mobile first e PWA

Revisão de 28/10/2026, usando a captura fornecida e o build local de produção.

## Diagnóstico e ajustes

| Área | Antes | Ajuste |
| --- | --- | --- |
| Cartões | Título, ações e adição de subtarefa em três faixas; muito espaço vertical no celular | Ações e resumo de passos reunidos no rodapé, título com quebra segura |
| Toque | Setas de 32px, ações de 36px, checkbox de 21px | Áreas de 44 × 44px, preservando a caixa visual menor do checkbox |
| CSS | Layout de desktop corrigido com `max-width` | Base para 320px com ampliações em 450, 700 e 1024px |
| Modais | Padding fixo, altura sem limite nos diálogos de edição | Altura máxima em `dvh`, rolagem interna, fonte de input de 16px e fundo sem rolagem |
| Navegação | Links menores e sem atalho ao conteúdo | Abas com área de toque e link de salto para teclado |
| Métricas | Seis meses por linha mesmo nas telas mais estreitas | Três colunas na base, seis a partir de 450px e doze no desktop |
| Instalação | Sem manifest ou ícones de instalação | Manifest standalone, ícones PNG de 192/512px, maskable e Apple Touch |
| Offline | Dados locais disponíveis, mas arquivos do app dependiam da rede | Precache gerado pelo Workbox, rotas e chunks disponíveis offline |
| Atualizações | Sem fluxo de atualização PWA | Aviso e botão explícito; diálogo aberto impede a ação de atualizar |

A identidade foi preservada: papel claro ou fundo escuro, vermelho, Barlow
Condensed nos títulos, DM Sans no texto e cartões com borda lateral.
As preferências de movimento reduzido e as safe areas são respeitadas.

## Estratégia PWA

`@vite-pwa/nuxt` gera o service worker a partir do build, incluindo os chunks
das duas páginas. O modo é `prompt`, sem atualização automática durante edição.
O fallback de navegação serve a aplicação em `/`; `/api/` não entra nesse fallback.
O cache contém arquivos do aplicativo; o modelo de tarefas e a chave
`rotina-esquerda:v1` permanecem compatíveis.

A instalação usa o evento nativo `beforeinstallprompt` quando disponível.
O controle desse evento não depende de localStorage, para manter o funcionamento
temporário mesmo quando o armazenamento estiver bloqueado. O rodapé informa
quando o cache offline estiver pronto e a interface mostra o estado sem rede.

## Validação automatizada

- 18 testes de modelo, persistência, migrações, temas e métricas.
- Build estático `npm run generate`, com manifest e service worker gerados.
- Seis cenários de layout: 320, 375, 414, 768, 1024 e 1440 CSS px.
- Temas claro/escuro, ausência de overflow horizontal, controles com 44px,
  expansão de passos, criação com título longo e modais dentro da tela.
- Recarga offline, criação e persistência offline, acesso direto a `/metricas`
  sem visita anterior à página e retorno às tarefas.
- Atualização com service worker previamente instalado: uma edição aberta
  permanece intacta, salvar e atualizar preserva a tarefa.
- Armazenamento bloqueado: interface funcional com aviso.
- Critérios do manifest consultados pelo Chrome DevTools Protocol; o bloqueio
  `in-incognito` é esperado no contexto isolado do Playwright e não valida a
  instalação no sistema operacional.

Os testes usam Chrome instalado, acessado por `PLAYWRIGHT_CHANNEL=chrome`.
As capturas foram inspecionadas visualmente e ficam em `output/mobile-*.png`
e `output/metrics-*.png`. `pnpm test:e2e` usa o build existente; rode
`pnpm generate` antes quando alterar o aplicativo.

## Limites e conferência em aparelho

Não houve publicação nem instalação em Android/iOS físico. Antes de publicar,
confira em HTTPS o ícone da tela inicial, o modo standalone, o teclado virtual,
as áreas do sistema e a reabertura offline após fechar completamente o app.
O Safari instala pelo menu Compartilhar. A oferta de instalação depende do
navegador; não aparece em todos os contextos de teste ou navegação privada.

O cache exige uma primeira visita online concluída. Fontes do Google não fazem
parte do precache: sem rede, são usadas fontes locais de reserva. Instalação e
cache não substituem backup; limpar o armazenamento continua apagando tarefas.

Referências: [integração Nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt),
[instalação de PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
