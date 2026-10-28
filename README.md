# Rotina de Base · Nuxt 4

Aplicação Nuxt 4 e Vue 3 com tarefas e subtarefas mensais, edição e persistência no navegador.

## Executar

Requer Node.js 22 ou superior e pnpm 10 (versão fixada em `packageManager`).

```sh
pnpm install
pnpm dev
```

Abra http://127.0.0.1:3000. Também é possível usar npm install e npm run dev. Preserve o mesmo endereço, perfil de navegador e porta usados anteriormente para reencontrar as listas salvas.

## Verificar e compilar

```sh
pnpm test
pnpm build
pnpm start
```

pnpm generate gera arquivos estáticos em .output/public. O app usa renderização no cliente (ssr: false), sem API ou banco de dados.

## Mobile e PWA

O layout começa em 320px e amplia em 450, 700 e 1024px. Os cartões agrupam
as ações no rodapé e os controles têm área mínima de 44px. Os formulários
usam fonte de 16px e os diálogos respeitam a altura útil e as safe areas.

O módulo `@vite-pwa/nuxt` gera manifest, service worker e precache dos arquivos
do aplicativo no build. Após a primeira visita online e a conclusão do cache,
as rotas `/` e `/metricas` funcionam offline, inclusive ao recarregar.
As tarefas continuam na chave local existente, sem sincronização com servidor.
As fontes externas são opcionais: sem rede, a interface usa fontes locais.

Em navegadores compatíveis, o rodapé oferece **Instalar aplicativo** quando
o navegador disponibiliza a instalação. No Safari do iPhone/iPad, use
**Compartilhar → Adicionar à Tela de Início**. Em produção é necessário HTTPS;
localhost é aceito para desenvolvimento. Instalar não cria backup dos dados.

Novos builds apresentam **Atualizar agora**. A atualização só recarrega após
ação da pessoa e não é aplicada enquanto houver um diálogo aberto. Feche e
salve a edição antes de atualizar. O modo `pnpm dev` não registra o service
worker; valide o PWA com o build estático.

```sh
pnpm exec playwright install chromium
pnpm generate
pnpm test:e2e
```

Os testes E2E iniciam um servidor local na porta 4173 e verificam seis larguras,
temas, áreas de toque, edição, recarga offline e acesso direto às métricas.
Para usar Chrome já instalado no PowerShell:
`$env:PLAYWRIGHT_CHANNEL='chrome'; pnpm test:e2e`.
Capturas e traces ficam em `output/`. Consulte `docs/mobile-pwa.md` para a análise.

## Skills de desenvolvimento

As 36 skills globais e seus gatilhos estão documentados em `docs/skills.md`.
O arquivo `AGENTS.md` orienta o uso no projeto; `docs/skills-lock.json` registra
as fontes, commits e hashes instalados. Elas ficam disponíveis no próximo turno.
As ferramentas de vídeo do Brag são opcionais e não entram no build do app.

## Organização e dados

Em **Métricas → Compartilhar conquistas**, uma prévia apresenta seu streak mensal,
tarefas concluídas, meses ativos e melhor mês do histórico até o mês atual,
independentemente do ano selecionado. Meses futuros ficam de fora. Os números
refletem o estado atual das listas, sem histórico de datas de conclusão.
O story é um PNG de 1080 × 1920 gerado no navegador, com apenas dados agregados.
O modelo usa uma arte de cartaz com textura, mobilização coletiva e destaque
para a sequência. Textos e números são preenchidos com seus resultados reais;
a arte e a fonte de título ficam no cache do PWA para uso offline.
Use **Compartilhar imagem** em dispositivos compatíveis ou **Baixar PNG** para
anexar à rede desejada. A publicação é feita por você no aplicativo escolhido.
A geração também funciona offline depois que o PWA estiver em cache.

- app/app.vue: navegação, tema e avisos do PWA.
- app/pages/index.vue: tarefas e diálogos de edição.
- app/composables/useMonthlyTasks.js: estado mensal, operações e persistência.
- app/assets/css/main.css: estilos responsivos.
- model.js: exemplos iniciais, validação e calendário.

Cada novo mês começa com sete tarefas: engajar representantes da esquerda duas vezes, acompanhar uma decisão legislativa, conhecer uma ação do governo, cobrar um compromisso de campanha, participar de uma atividade coletiva e acompanhar a esquerda na sua região. As duas ocorrências de engajamento são independentes. Edite INITIAL_TASKS em model.js para alterar os padrões.

A janela Tarefas sugeridas oferece 13 tipos de ação com passos editáveis. “Adicionar ao mês” cria uma tarefa independente e mantém o banco aberto; sugestões podem ser adicionadas mais de uma vez. O catálogo SUGGESTIONS é fixo no código.

O ícone de cópia de cada tarefa abre “Copiar para outro mês”, com o próximo mês preenchido. Escolha qualquer mês diferente da origem, inclusive anterior. A cópia recebe novos identificadores e todos os passos desmarcados. O destino mantém suas tarefas; se ainda não existir, recebe primeiro os sete padrões. A confirmação permite abrir o destino com “Ver mês”.

Na leitura dos dados, exemplos antigos intactos são substituídos por uma sequência dos sete padrões em cada mês afetado, na posição do primeiro exemplo removido. A identificação exige título e sequência exata dos passos originais e todas as marcações desfeitas. Exemplos editados ou com progresso, tarefas personalizadas e meses vazios são preservados. A migração não se repete depois de salva.

A chave rotina-esquerda:v1 continua compatível com a versão anterior: { version: 1, months: { "AAAA-MM": [tarefas] } }. Tarefas têm id, title, completed e subtasks; subtarefas têm id, title e completed.

A ação **Copiar todas para outro mês** copia a lista do mês aberto para um único mês posterior, com o próximo mês preenchido. Após escolher o destino, uma confirmação informa quantas tarefas serão removidas e copiadas. A lista de destino é substituída integralmente, sem adicionar padrões; a origem permanece intacta. As cópias recebem novos identificadores e tarefas e passos desmarcados. Cancelar ou pressionar Escape não altera dados. A confirmação oferece **Ver mês**. A ação fica indisponível em meses vazios ou sem destino posterior representável.

O checkbox principal marca todos os passos; o progresso considera tarefas principais concluídas. Exclusão de tarefa com subtarefas pede confirmação. Mudanças afetam somente o mês selecionado, exceto as ações explícitas de cópia para outro mês.

Não há login ou sincronização. Pessoas no mesmo perfil de navegador e endereço compartilham o armazenamento. Limpar dados do navegador apaga as listas. Falhas são informadas; dados inválidos são preservados e a sessão funciona temporariamente em memória. Nenhum dado das tarefas é enviado ao servidor. As fontes do Google são opcionais, com fontes locais de reserva.

Os testes cobrem calendário, progresso, operações, banco de sugestões, cópia entre meses, migração, restauração e falhas de armazenamento. Para conferir a interface, navegue entre meses, adicione sugestões, copie tarefas, edite os passos, recarregue a página e teste teclado e telas estreitas.


