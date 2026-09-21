# Decisões

> Atualizado em 2026-09-21 (Etapa 0).
> Formato: ID, decisão, motivo, consequências, status.
> Status: `registrada` = padrão adotado (reversível, mude quando quiser) ·
> `aguardando aprovação` = preciso da sua resposta para seguir.

## Registradas (padrões propostos nesta etapa)

### D-001 — Pasta independente dentro do repositório
- **Decisão:** o projeto vive em `arquipelago-python/` na raiz do repositório, com `package.json`,
  build, testes e docs próprios. Nada fora dessa pasta é alterado.
- **Motivo:** o repositório já hospeda outro produto em produção (site de captação de leads
  "Carlos Consultor", na raiz, build-free). Preservar o existente é regra explícita.
- **Consequências:** dois pipelines de build independentes; `git status` limita-se a
  `arquipelago-python/`; a chave de `localStorage` é exclusiva do projeto, sem colisão.
- **Reversível:** sim — mover para um repositório separado é uma operação mecânica (copiar a pasta e
  re-inicializar o Git). Pergunta em Q-001.

### D-002 — Nome provisório "Arquipélago Python"
- **Decisão:** manter o nome provisório até você definir o definitivo; ele aparece em um único
  arquivo de configuração de marca (`src/app/brand.ts`, criado na Etapa 1) para troca fácil.
- **Motivo:** evitar renomear dezenas de lugares depois.
- **Reversível:** sim.

### D-003 — Sem assets externos no protótipo
- **Decisão:** toda a geometria é gerada em código (low-poly próprio) e todo material é simples.
- **Motivo:** licença conhecida e documentada é obrigatória para asset externo; geometria própria
  evita risco jurídico e mantém o download leve.
- **Consequências:** visual mais sóbrio que o de pacotes prontos; mais código de modelagem.
- **Reversível:** sim, com registro de licença por asset em `DECISIONS.md`.

### D-004 — Idioma pt-BR e tom para iniciantes
- **Decisão:** interface, conteúdo, mensagens de erro e nomes de acessibilidade em português
  brasileiro. Código-fonte (identificadores, comentários) em inglês técnico simples.
- **Motivo:** público iniciante brasileiro; o pedido é explícito.
- **Reversível:** sim, mas custoso depois do conteúdo escrito.

### D-005 — Domínio puro como fonte única de verdade
- **Decisão:** nota, aprovação, disponibilidade e transições vivem em funções puras em
  `src/learning/`; a cena 3D, o painel, as pontes e o modo lista apenas **leem** esse resultado.
- **Motivo:** impedir que a regra dos 80% divirja entre interfaces; regra testável sem React.
- **Consequências:** obrigatório derivar acesso de `prerequisiteIds` aprovados, nunca de um booleano
  solto; nenhuma segunda implementação da regra em nenhum componente.
- **Status:** base técnica do projeto (a confirmar em Q-005 apenas o nome da biblioteca de estado).

### D-006 — `passingScore = 80`, comparação no valor real
- **Decisão:** `score = correctCount / total * 100`; aprovado se `score >= 80`, **antes** de qualquer
  arredondamento de exibição (4/5 = 80 aprovado; 3/5 = 60 reprovado).
- **Motivo:** regra do produto; exibição nunca converte reprovação em aprovação.
- **Reversível:** sim, em um único lugar, se você autorizar mudança de critério.

### D-007 — Liberação da avaliação sem bloqueio artificial
- **Decisão:** a avaliação libera com **leitura marcada + unidade acessível**; a prática é
  recomendada, mas não bloqueia. Desmarcar leitura depois de aprovado não revoga aprovação nem
  re-bloqueia a avaliação.
- **Motivo:** regra padrão definida por você em §10; evita fricção desnecessária.
- **Reversível:** sim (é uma transição no domínio).

### D-008 — Chave de persistência exclusiva, com versão de esquema
- **Decisão:** `localStorage` com chave `arquipelago-python:progress`, `schemaVersion` numérico e
  validação na leitura. Proibido `localStorage.clear()`; só chaves com o prefixo do projeto.
- **Motivo:** convivência segura com o site existente no mesmo domínio/subdomínio; robustez a dados
  corrompidos.
- **Consequências:** falha de gravação gera aviso honesto de "sessão sem persistência".
- **Reversível:** sim.

### D-009 — Vite servindo em `0.0.0.0` com hosts permitidos
- **Decisão:** `server.host = '0.0.0.0'`, `allowedHosts` incluindo o host do preview e `base: './'`.
- **Motivo:** requisito do ambiente de preview; código do navegador nunca chama `localhost` para
  falar com serviço remoto.
- **Reversível:** sim, mas manter o padrão em qualquer ambiente remoto.

### D-010 — Nada de backend, conta, IA ou credencial
- **Decisão:** aplicação 100% cliente; nenhuma chamada a API de IA; nenhum segredo no cliente.
- **Motivo:** regra do projeto.
- **Consequências:** progresso é local; a interface explica que não há conta nem sincronização e que
  limpar os dados do navegador apaga o progresso.

### D-011 — Etapa 6+ permanece bloqueada sem o livro
- **Decisão:** nenhuma unidade é marcada como publicada enquanto `bookReference.verification` não for
  `verified`. Até lá, a interface mostra "referência pendente", nunca páginas plausíveis.
- **Motivo:** proibição explícita de inventar páginas e de apresentar conteúdo desalinhado.
- **Consequências:** etapas 6, 7 e 11 paradas; 1–5 liberadas.

## Aguardando aprovação do responsável

| ID | Pergunta | Opções | Padrão se você não decidir |
|---|---|---|---|
| Q-001 | Onde o projeto deve viver? | (a) `arquipelago-python/` neste repositório; (b) repositório novo e separado; (c) outro nome/local | (a) — já registrado em D-001 |
| Q-002 | Livro de referência | (a) reanexar o PDF; (b) informar título/edição; (c) autorizar outro livro | bloqueio mantido (D-011) |
| Q-003 | Imagens de referência visual | (a) reanexar as três imagens para eu revisar `ART_DIRECTION.md`; (b) seguir com a direção derivada da sua descrição textual | (b) — arte segue o documento atual |
| Q-004 | Nome definitivo do produto | texto livre | "Arquipélago Python" (D-002) |
| Q-005 | Biblioteca de estado | (a) Zustand; (b) `useReducer` + Context do React, sem dependência extra | (a) |
| Q-006 | Deploy | (a) site separado/subdomínio (recomendado, não toca no site atual); (b) subpasta no mesmo domínio (exige ajustar `_redirects` e `.htaccess` — só com sua autorização) | (a) |
| Q-007 | Playwright | (a) tentar instalar navegador na Etapa 2 e usar; (b) seguir só com Vitest + roteiro manual até você pedir | (b) até a Etapa 2 confirmar viabilidade |

## Decisões já fechadas por você no pedido (não precisam de nova aprovação)

- Python no navegador é etapa **posterior e separada** (etapas 9–10): Pyodide em Web Worker,
  sob demanda, sem API de IA e sem serviço remoto de execução.
- Cinco perguntas por avaliação, mesmo peso; exigir todas respondidas; corrigir só no envio.
- Sem limite punitivo de tentativas; salvar cada tentativa e a melhor nota.
- Interface em pt-BR, com modo de estudo em lista e alternativas acessíveis a tudo que estiver na cena.
- `localStorage` no início; IndexedDB só se houver necessidade real.
