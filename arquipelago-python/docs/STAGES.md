# Etapas — o que está concluído, em andamento, pendente e bloqueado

> Atualizado em 2026-09-21 (fim da Etapa 0).
> Legenda de status: `concluída` · `em andamento` · `pendente` (aguardando autorização) ·
> `bloqueada` (impedimento real) · `autorizada`.

## 1. Painel geral

| Etapa | Nome | Status | Observação |
|---|---|---|---|
| 0 | Análise e plano, sem código de aplicação | **concluída** | Sem código de aplicação. Anexos de imagem e livro **não** recebidos (ver §3 e `BOOK_MAP.md`) |
| 1 | Fundação e documentação | pendente | Aguardando autorização. Subetapa sugerida: **1.1** (abaixo) |
| 2 | Domínio e progressão testados | pendente | Sem dependência do livro |
| 3 | Uma ilha 3D bem resolvida | pendente | Sem dependência do livro |
| 4 | Três ilhas e pontes | pendente | Sem dependência do livro |
| 5 | Navegação e avatar | pendente | Sem dependência do livro |
| 6 | Estudo e livro | **bloqueada** | Exige referência bibliográfica verificada |
| 7 | Avaliação completa | bloqueada | Depende da 6 (referências + conteúdo) |
| 8 | Persistência e protótipo utilizável | pendente | Depende de 2 e 7 para a demonstração ponta a ponta |
| 9 | Prova de conceito do Python (Pyodide/Worker) | pendente | Isolada, sem espalhar editor pelas ilhas |
| 10 | Exercícios práticos avaliados | pendente | Depende de 9 |
| 11 | Expansão curricular em lotes | bloqueada | Depende do livro |
| 12 | Recursos complementares | pendente | Subetapas independentes, só sob autorização |
| 13 | Polimento, acessibilidade e desempenho | pendente | |
| 14 | Auditoria e entrega | pendente | |

Etapas 1 a 5 são **independentes do livro** e podem ser executadas em ordem. As etapas 6, 7 e 11
permanecem bloqueadas até o PDF (ou a referência textual) ser verificado.

## 2. Etapa 0 — concluída: entregáveis

| Entregável | Onde está |
|---|---|
| Leitura das referências visuais | `ART_DIRECTION.md` — **derivada da descrição textual**; arquivos de imagem não recebidos |
| Identificação do livro e acessibilidade do PDF | `BOOK_MAP.md` — **bloqueado**: nenhum arquivo de livro presente no ambiente |
| Mapa curricular preliminar | `BOOK_MAP.md` §4 — tudo marcado como provisório, referências `null` |
| Proposta técnica, riscos, dependências, decisões | `ARCHITECTURE.md`, `DECISIONS.md` |
| Escopo exato das três primeiras ilhas | `BRIEF.md` §5 |
| Divisão das etapas | este arquivo + resposta da Etapa 0 |

Nada de código de aplicação foi escrito. Nenhum arquivo fora de `arquipelago-python/docs/` foi
criado ou alterado.

## 3. Subetapas da Etapa 1

### 1.1 Scaffold e casca acessível — **sugerida como próxima subetapa autorizável**

Escopo (nada de 3D, nada de conteúdo pedagógico):

- Projeto Vite + React + TypeScript em `arquipelago-python/`, com `package.json` e lockfile
  versionados; `strict` no TypeScript.
- Scripts: `dev`, `build`, `preview`, `typecheck`, `test`, `lint`.
- `vite.config.ts` com `server.host = '0.0.0.0'`, `allowedHosts` liberando o host do preview e
  `base: './'` (funciona em subpasta e em subdomínio).
- Casca de layout em pt-BR: cabeçalho (nome, ilha atual, progresso, configurações), área central
  com **placeholder explícito** de cena + alternativa de **modo de estudo em lista**, painel lateral
  de estudo vazio com estados, barra inferior de unidades, ajuda curta de controles (ocultável).
- Semântica e acessibilidade desde o início: HTML semântico, `label`s, foco visível, skip link,
  navegação por teclado, `aria-live` para mensagens de status, respeito a
  `prefers-reduced-motion`.
- Tratamento do caso "WebGL indisponível" já na casca (detecção + mensagem + botão para a lista).
- Teste de fumaça com Vitest + um teste de componente da casca. `npm run build` limpo.
- Documentos `STATE_MACHINE.md` e `CONTENT_GUIDE.md` criados como esqueleto de decisões (contratos
  completos ficam para a Etapa 2).

Fora do escopo da 1.1: three.js, ilhas, pontes, avatar, avaliação, persistência, Pyodide,
dependências além de React/TypeScript/Vite/Vitest.

Critérios de aceite da 1.1:

1. `npm run dev` sobe servidor escutando `0.0.0.0` e a página abre no host de preview sem erro de
   host/origin (nenhuma requisição a `localhost`/`127.0.0.1` a partir do navegador).
2. `npm run build` e `npm run typecheck` concluem sem erro; `npm run test` passa.
3. A casca mostra cabeçalho, área de cena (placeholder honesto, sem fingir 3D), painel de estudo,
   barra de unidades e ajuda de controles.
4. Navegação por teclado alcança todos os controles, foco visível, `Escape` fecha a ajuda.
5. Simulação de WebGL ausente continua permitindo chegar ao modo de estudo em lista.
6. Nenhum arquivo fora de `arquipelago-python/` alterado; site existente intacto
   (verificável por `git status` mostrando apenas caminhos sob `arquipelago-python/`).
7. `HANDOFF.md` e `STAGES.md` atualizados com o resultado real.

### 1.2 (proposta, não autorizada agora)

Documentos de estado/currículo completos (`STATE_MACHINE.md`, `CONTENT_GUIDE.md`), tokens de estilo
definitivos e decisões Q-004/Q-005 fechadas. Pode ser absorvida pela Etapa 2 se você preferir.

## 4. Convenção de aceite para todas as etapas

Uma fase **não** está concluída porque os arquivos foram criados: os critérios de aceite precisam ser
verificados e registrados em `TEST_REPORT.md`, com comandos e resultados reais. Teste visual ou
automação indisponível é registrado como **pendente** com roteiro manual — nunca como aprovado por
inspeção de código.
