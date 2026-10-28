# Skills do projeto

Instalação global realizada em 28/10/2026, em `~/.codex/skills`.
São 31 skills publicadas do Matt Pocock e cinco skills adicionais. As skills
experimentais de `skills/in-progress` não foram incluídas. Cada diretório
inclui os arquivos auxiliares da fonte, sem habilitar hooks globais.

| Fonte | Uso no projeto |
| --- | --- |
| [Matt Pocock](https://github.com/mattpocock/skills) | Diagnóstico, TDD, revisão, design de módulos, pesquisa e planejamento |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Hierarquia visual, tipografia e refinamento da interface existente |
| [am-will frontend-responsive-ui](https://github.com/am-will/codex-skills/tree/main/skills/frontend-responsive-ui) | Layout mobile first, toque, breakpoints e validação de telas |
| [Ponytail](https://github.com/DietrichGebert/ponytail/tree/main/skills/ponytail) | Menor mudança completa, reutilização e controle de complexidade |
| [Caveman](https://github.com/JuliusBrussee/caveman/tree/main/skills/caveman) | Comunicação concisa sob demanda, sem reduzir o conteúdo técnico |
| [Brag](https://github.com/latent-spaces/brag/tree/main/skills/brag) | Vídeo de divulgação sob demanda |

O inventário `skills-lock.json` registra commits e SHA-256 de todos os arquivos
instalados. Não é um lockfile automático do Codex: serve para auditoria e
reprodução da instalação. As skills ficam disponíveis no próximo turno.

## Seleção por tarefa

1. Leia o código e defina o comportamento observável a corrigir.
2. Para layout, leia `frontend-design/SKILL.md` e `frontend-responsive-ui/SKILL.md`.
3. Para bugs, use `diagnosing-bugs`; para lógica nova, `tdd`. Use os testes existentes.
4. Para revisão, use `code-review` e os princípios de `ponytail`.
5. Para alterações maiores, consulte `ask-matt` para escolher o fluxo adequado.
   Skills de comando, como `grill-with-docs`, são acionadas pelo usuário.

Exemplos de pedidos: “use frontend-responsive-ui para revisar os cartões em
320px”, “use diagnosing-bugs para investigar a persistência”, “use code-review
no diff atual”, “use caveman nas respostas”.

## Vídeo com Brag

Somente ao solicitar `/brag`, prepare o vídeo em `output/brag/` usando dados
de demonstração. A skill requer Node 22+, FFmpeg e o CLI Hyperframes; consulte
o README e o SKILL.md instalados para as skills Hyperframes exigidas pelo fluxo.
Essas ferramentas de vídeo não são dependências do aplicativo e não foram
instaladas nem executadas nesta revisão. Publicar o vídeo requer pedido explícito.

## Instalar em outra máquina

Use o instalador do Codex `skill-installer/scripts/install-skill-from-github.py`
com `--repo`, `--ref` e `--path` registrados no inventário. Ele instala em
`$CODEX_HOME/skills`. Exemplo:

```sh
python <skill-installer>/scripts/install-skill-from-github.py --repo anthropics/skills --ref dbd4588f9e1033efb41dad4bef2f7947c8993d44 --path skills/frontend-design
```

Nesta máquina, Python não estava disponível. Os arquivos foram copiados via
HTTPS das fontes oficiais nos commits registrados, com verificação dos hashes
Git e SHA-256, sem sobrescrever diretórios existentes ou executar scripts baixados.
Para atualizar, revise primeiro as mudanças upstream e preserve personalizações
globais. Não execute duas instalações diferentes da mesma skill.
