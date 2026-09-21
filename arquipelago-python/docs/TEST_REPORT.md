# Relatório de testes e verificações

> Atualizado em 2026-09-21 (fim da Etapa 0).
> Regra deste documento: só entra como **executado** o que foi realmente rodado, com comando e
> resultado. Teste visual ou automação indisponível entra como **não executado / pendente** com
> roteiro manual — nunca como aprovado por inspeção de código.

## 1. Etapa 0 — verificações executadas

Ambiente: sandbox Linux do agente, `cwd=/home/user/corretor-plus`, sem navegador gráfico.

| # | Verificação | Comando | Resultado | Conclusão |
|---|---|---|---|---|
| V1 | Repositório e branch | `git log --oneline -10`, `git status --short`, `git branch -a` | branch `arena/01a0c1d6-corretor-plus`, base `1977b3d` (`main`); worktree limpo no início | OK |
| V2 | Conteúdo da raiz do repositório inspecionado | `ls -la` | Site estático de captação de leads presente (HTML/CSS/JS/dados, `_redirects`, `.htaccess`) | **Trabalho existente identificado e preservado** |
| V3 | Existência de `package.json`/`node_modules` na raiz | `ls` | não existem | Site existente é build-free; o arquipélago precisa de projeto próprio |
| V4 | Busca por anexo do livro (PDF/EPUB/MOBI) em todo o ambiente | `find / -xdev \( -iname '*.pdf' -o -iname '*.epub' -o -iname '*.mobi' \)` | **nenhum arquivo** | `BOOK_MAP.md` = **bloqueado**; nenhuma página inventada |
| V5 | Busca por imagens de referência | `find` por extensão e por data recente | apenas `tools/og-small.png` (asset do site de leads) | Imagens de referência **não recebidas**; `ART_DIRECTION.md` marcado como derivado da descrição textual |
| V6 | Ambiente de desenvolvimento | `node -v`, `npm -v`, `npx --version`, `git --version` | Node v22.22.3, npm 10.9.8, Git 2.39.5 | Compatível com Vite + React + TypeScript |
| V7 | Acesso ao registro npm (necessário para instalar o projeto) | `npm ping` | `PONG` em ~234 ms | Instalação viável na Etapa 1 |
| V8 | Regras de deploy do site existente | leitura de `_redirects` e `.htaccess` | rota final `/* → /404.html 404` e `ErrorDocument 404 /404.html` | Publicar o arquipélago em **site separado** (Q-006); nunca editar essas regras sem autorização |
| V9 | Nenhum arquivo do site existente alterado nesta etapa | `git status --short` | apenas arquivos novos sob `arquipelago-python/docs/` | Regra "preservar o trabalho existente" cumprida |

## 2. Não executado nesta etapa (e por que)

| Item | Motivo | Como será verificado |
|---|---|---|
| Build, lint, testes unitários | não existe projeto de aplicação ainda (por desenho: Etapa 0 é sem código) | Etapa 1: `npm run build`, `npm run typecheck`, `npm run test` |
| Verificação visual da cena 3D | não há cena; e o agente não tem navegador gráfico | Etapa 3 em diante: roteiro manual de aceite + medição declarada de FPS |
| Automação de fluxo em navegador (Playwright) | viabilidade de download de navegador ainda não testada | Q-007; se indisponível, roteiro manual registrado como pendente |
| Execução de Python no navegador (Pyodide/Worker) | etapa posterior obrigatoriamente separada (Etapa 9) | Etapa 9: `print('Olá, mundo!')`, erro, `while True: pass` sem congelar, nova execução após interromper |
| Conferência de páginas do livro | arquivo ausente | Etapa 6, após receber o PDF |

## 3. Roteiro manual sugerido ao responsável (não substitui teste automatizado)

Nada a testar ainda nesta etapa: não há aplicação. Na Etapa 1 (subetapa 1.1) o roteiro será:

1. Abrir o preview; conferir cabeçalho (nome, ilha atual, progresso, configurações), área central
   com placeholder honesto da cena, painel de estudo, barra de unidades, ajuda de controles.
2. Navegar só com `Tab`/`Shift+Tab`; conferir foco visível em todos os controles; `Escape` fecha a ajuda.
3. Acionar o "modo de estudo em lista" e voltar; confirmar que a área de cena não quebra.
4. Redimensionar a janela (desktop → estreito) e conferir que o layout continua utilizável.
5. Confirmar que nenhuma mensagem da interface afirma que algo foi salvo (ainda não há persistência).

## 4. Honestidade de resultados

- Nesta etapa **não houve** teste de aplicação, porque não há aplicação. Toda afirmação deste
  relatório é de inspeção de ambiente e repositório, com comando e saída correspondentes.
- Não houve verificação das imagens de referência (arquivos ausentes) nem do livro (arquivo ausente).
  Isso está registrado como pendência, não como aprovado.
- Nenhuma medição de desempenho foi feita; as metas de FPS de `ARCHITECTURE.md` §8 são **metas**, não
  resultados.
