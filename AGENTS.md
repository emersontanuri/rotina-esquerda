# Base Ativa

Aplicação Nuxt 4/Vue 3, mobile first, com tarefas mensais e dados locais.
Antes de editar, leia `README.md` e os arquivos afetados. Preserve os dados
compatíveis com `rotina-esquerda:v1` e as confirmações de exclusão.

## Agent skills

As skills são globais, em `$CODEX_HOME/skills` (padrão `~/.codex/skills`).
Fontes, versões e hashes estão em `docs/skills-lock.json`.
Leia o `SKILL.md` relevante antes de aplicar uma skill; não carregue o catálogo inteiro.
O guia de seleção e os limites estão em `docs/skills.md`.

- Interface: `frontend-design` preserva a identidade visual existente.
- Layout: `frontend-responsive-ui`, começando em 320px e ampliando com `min-width`.
- Implementação: use o princípio de `ponytail`: reutilizar antes de criar abstrações ou dependências.
- Bugs: `diagnosing-bugs`; comportamento novo: `tdd`; revisão: `code-review`.
- Arquitetura: `codebase-design`, `domain-modeling` e `improve-codebase-architecture` quando o escopo justificar.
- `caveman` só altera a concisão da conversa quando solicitado; mantenha português e precisão.
- `brag` só é executada quando houver pedido de vídeo. Instalar a skill não inicia renderização ou publicação.
- Comandos de orquestração, criação de issues, PRs, hooks e deploys dependem do pedido da sessão.

### Issue tracker

O remoto é `emersontanuri/rotina-esquerda` no GitHub. Não publique issues ou
comentários por iniciativa própria. Registre análises locais em `docs/`.

### Domain docs

Projeto de contexto único. Consulte `GLOSSARY.md` e `docs/adr/` se existirem.
Crie documentação de domínio apenas quando houver termos ou decisões reais a registrar.

## Implementação e validação

- CSS base para mobile; breakpoints existentes: 450, 700 e 1024px.
- Controles com área mínima de 44 × 44 CSS px, foco visível e nomes acessíveis.
- Inputs com fonte de 16px, modais limitados por `dvh`, respeito às safe areas.
- Cache PWA para arquivos estáticos; tarefas continuam no armazenamento local.
- Atualizações do PWA exigem ação da pessoa e não recarregam edições abertas.
- Execute `pnpm test`, `pnpm generate` e `pnpm test:e2e` para mudanças de PWA.
- Verifique 320, 375, 414, 768, 1024 e 1440px, temas claro/escuro e navegação offline.
- Nunca apresente instalação em dispositivo físico como validada por emulação.
