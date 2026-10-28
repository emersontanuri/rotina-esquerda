# Rotina de Base · Nuxt 4

Aplicação Nuxt 4 e Vue 3 com tarefas e subtarefas mensais, edição e persistência no navegador.

## Executar

Requer Node.js 22 ou superior.

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

## Organização e dados

- app/app.vue: interface reativa e diálogo de edição.
- app/composables/useMonthlyTasks.js: estado mensal, operações e persistência.
- app/assets/css/main.css: estilos responsivos.
- model.js: exemplos iniciais, validação e calendário.

Cada novo mês começa com sete tarefas: engajar representantes da esquerda duas vezes, acompanhar uma decisão legislativa, conhecer uma ação do governo, cobrar um compromisso de campanha, participar de uma atividade coletiva e acompanhar a esquerda na sua região. As duas ocorrências de engajamento são independentes. Edite INITIAL_TASKS em model.js para alterar os padrões.

A janela Tarefas sugeridas oferece 13 tipos de ação com passos editáveis. “Adicionar ao mês” cria uma tarefa independente e mantém o banco aberto; sugestões podem ser adicionadas mais de uma vez. O catálogo SUGGESTIONS é fixo no código.

O ícone de cópia de cada tarefa abre “Copiar para outro mês”, com o próximo mês preenchido. Escolha qualquer mês diferente da origem, inclusive anterior. A cópia recebe novos identificadores e todos os passos desmarcados. O destino mantém suas tarefas; se ainda não existir, recebe primeiro os sete padrões. A confirmação permite abrir o destino com “Ver mês”.

Na leitura dos dados, exemplos antigos intactos são substituídos por uma sequência dos sete padrões em cada mês afetado, na posição do primeiro exemplo removido. A identificação exige título e sequência exata dos passos originais e todas as marcações desfeitas. Exemplos editados ou com progresso, tarefas personalizadas e meses vazios são preservados. A migração não se repete depois de salva.

A chave rotina-esquerda:v1 continua compatível com a versão anterior: { version: 1, months: { "AAAA-MM": [tarefas] } }. Tarefas têm id, title, completed e subtasks; subtarefas têm id, title e completed.

O checkbox principal marca todos os passos; o progresso considera tarefas principais concluídas. Exclusão de tarefa com subtarefas pede confirmação. Mudanças afetam somente o mês selecionado.

Não há login ou sincronização. Pessoas no mesmo perfil de navegador e endereço compartilham o armazenamento. Limpar dados do navegador apaga as listas. Falhas são informadas; dados inválidos são preservados e a sessão funciona temporariamente em memória. Nenhum dado das tarefas é enviado ao servidor. As fontes do Google são opcionais, com fontes locais de reserva.

Os testes cobrem calendário, progresso, operações, banco de sugestões, cópia entre meses, migração, restauração e falhas de armazenamento. Para conferir a interface, navegue entre meses, adicione sugestões, copie tarefas, edite os passos, recarregue a página e teste teclado e telas estreitas.


