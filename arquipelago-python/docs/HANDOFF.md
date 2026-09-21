# Handoff — estado atual do projeto

> **Última atualização:** 2026-09-21, fim da **Etapa 0** (análise e plano).
> **Próxima ação:** aguardando autorização para a subetapa **1.1 — Scaffold e casca acessível**.

Este documento permite que outro chat (ou outra pessoa) retome o projeto sem reescrever nada. Ele
descreve o que existe **de fato** no repositório, não o que foi combinado verbalmente.

## 1. Estado real do repositório (verificado, não presumido)

- Repositório: `googleplay-login/corretor-plus`, branch de trabalho
  `arena/01a0c1d6-corretor-plus` (base `1977b3d`, `main`).
- A raiz contém um **produto diferente e em produção**: site estático de captação de leads de plano
  de saúde ("Carlos Consultor"), build-free (sem `package.json`): `index.html`, `simulacao.html`,
  `obrigado.html`, `painel.html`, `privacidade.html`, `termos.html`, `404.html`, `css/styles.css`,
  `js/*.js`, `data/*.js`, `tests/test.mjs`, `tools/`, `_redirects`, `.htaccess`, `robots.txt`,
  `sitemap.xml`, `llms.txt`, `humans.txt`, `site.webmanifest`, `.well-known/security.txt`.
- **Nada fora de `arquipelago-python/docs/` foi criado ou alterado.** O site existente está intacto.

## 2. Ambiente verificado

| Item | Valor observado | Como foi verificado |
|---|---|---|
| Node.js | v22.22.3 | `node -v` |
| npm | 10.9.8 | `npm -v` |
| Git | 2.39.5 | `git --version` |
| Acesso ao npm registry | OK (`PONG` em ~234 ms) | `npm ping` |
| `package.json` na raiz | **não existe** | `ls` |
| `node_modules` | **não existe** | `ls` |
| Dependências instaladas | nenhuma | estado do diretório |
| Busca por PDF/EPUB/MOBI em todo o ambiente | **nenhum arquivo** | `find / -xdev -iname '*.pdf' -o -iname '*.epub' -o -iname '*.mobi'` |
| Busca por imagens recentes fora do projeto | apenas `tools/og-small.png` (asset do site de leads) | `find` por extensão e por data |

## 3. Anexos — o que recebi e o que não recebi

| Anexo esperado | Situação | Consequência |
|---|---|---|
| 3 imagens de referência (ilhas flutuantes low-poly) | **não recebidas** | `ART_DIRECTION.md` foi montado a partir da sua descrição textual (§3.1) e está marcado como `descrito`, não `verificado`. Reanexar para revisão |
| Livro em PDF | **não recebido** | `BOOK_MAP.md` está **bloqueado**; nenhuma página/edição foi inventada; Etapas 6, 7 e 11 paradas |

Nenhum conteúdo foi baixado para "substituir" os anexos. Nenhuma imagem de terceiros foi usada.

## 4. Arquivos criados nesta etapa (todos documentação)

| Arquivo | Conteúdo |
|---|---|
| `arquipelago-python/docs/BRIEF.md` | produto, regras de trabalho, relação com o site existente, escopo exato das 3 primeiras ilhas, critério de conclusão |
| `arquipelago-python/docs/ART_DIRECTION.md` | direção de arte, status honesto da inspeção das imagens, vocabulário de formas, paleta, orçamento de arte |
| `arquipelago-python/docs/BOOK_MAP.md` | status **bloqueado**, procedimento de verificação, tabelas com referências `null`, mapa curricular provisório |
| `arquipelago-python/docs/ARCHITECTURE.md` | stack, estrutura de pastas, fronteira de módulos, contratos de dados, máquina de estados, persistência, câmera, desempenho, riscos |
| `arquipelago-python/docs/STAGES.md` | painel das etapas 0–14, subetapas da Etapa 1 (1.1 com escopo e critérios de aceite) |
| `arquipelago-python/docs/DECISIONS.md` | D-001…D-011 registradas + Q-001…Q-007 aguardando aprovação |
| `arquipelago-python/docs/HANDOFF.md` | este documento |
| `arquipelago-python/docs/TEST_REPORT.md` | verificações realmente executadas e não executadas |

`BRIEF.md` já está completo. `STATE_MACHINE.md` e `CONTENT_GUIDE.md` nascem como esqueleto na
subetapa 1.1 e são completados na Etapa 2 (contratos de estado e de conteúdo definitivos).

## 5. Comandos

Nada a executar ainda: não há aplicação. Nesta etapa só houve inspeção:

```bash
# inspeção feita na Etapa 0
node -v && npm -v && git --version
find / -xdev \( -iname '*.pdf' -o -iname '*.epub' -o -iname '*.mobi' \) 2>/dev/null   # nenhum resultado
cd /home/user/corretor-plus && git status --short                                       # só arquivos novos em arquipelago-python/
```

Quando a subetapa 1.1 for autorizada, os comandos passarão a ser (a confirmar na implementação):

```bash
cd arquipelago-python
npm install
npm run dev        # servidor em 0.0.0.0 (preview)
npm run build
npm run typecheck
npm run test
```

## 6. Riscos e bloqueios ativos

| # | Risco/bloqueio | Estado | Menor correção possível |
|---|---|---|---|
| B1 | Livro ausente → Etapas 6, 7, 11 bloqueadas | **aberto** | Reanexar o PDF, ou informar título/autor/edição (as páginas ficam pendentes) |
| B2 | Imagens de referência ausentes → direção de arte não verificada | **aberto** | Reanexar as três imagens para eu revisar `ART_DIRECTION.md` |
| R3 | Deploy no mesmo domínio do site de leads (regras globais de 404/redirect) | mitigado por padrão | Publicar como site separado (Q-006) — nunca editar `_redirects`/`.htaccess` sem autorização |
| R5 | Verificação visual do 3D pelo agente é limitada (não afirmo "está bonito" nem FPS medido) | permanente | Critérios verificáveis + medição registrada + roteiro manual de aceite para você |
| R6 | Playwright pode exigir download de navegador | a testar na Etapa 2 | Seguir com Vitest e roteiro manual (Q-007) |

## 7. Próxima ação (uma só, quando você autorizar)

**Subetapa 1.1 — Scaffold e casca acessível.** Escopo e critérios de aceite em `STAGES.md` §3.
Limite rígido: Vite + React + TypeScript + casca de layout acessível em pt-BR, com placeholder
honesto da cena, alternativa em lista, tratamento de WebGL ausente, Vitest de fumaça e docs de
continuidade atualizados. **Sem three.js, sem ilhas, sem avaliação, sem persistência, sem Pyodide.**

## 8. O que não deve ser feito por outro chat ao retomar

- Não recomeçar do zero nem reescrever os documentos existentes sem motivo registrado.
- Não alterar nada fora de `arquipelago-python/`.
- Não implementar 3D, avaliação ou conteúdo de unidades antes das etapas correspondentes.
- Não preencher páginas do livro por estimativa.
- Não adicionar dependências "por conveniência" nem assets sem licença documentada.
- Não introduzir backend, conta, IA ou credencial.
