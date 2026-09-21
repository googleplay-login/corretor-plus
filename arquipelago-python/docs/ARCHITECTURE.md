# Arquitetura — proposta para aprovação

> Atualizado em 2026-09-21 (Etapa 0). **Nada aqui foi implementado ainda.**
> Versões exatas das dependências serão resolvidas e registradas em `package-lock.json` na Etapa 1.

## 1. Stack proposta

| Camada | Escolha | Motivo / observação |
|---|---|---|
| Build | **Vite** | Dev server rápido, build estático simples, aceita `server.host = 0.0.0.0` (exigido pelo preview remoto) e `allowedHosts` para o host do preview |
| UI | **React + TypeScript** (strict) | Componentização e tipagem dos contratos de dados |
| 3D | **three.js** + **@react-three/fiber** (+ **@react-three/drei** apenas onde reduz código real) | Cena declarativa integrada ao estado React |
| Estado | **Zustand** (store tipada, pequena) + **funções de domínio puras** separadas | Regras de aprovação testáveis sem React; sem Redux/Context complexo |
| Estilo | **CSS** com variáveis (um ou dois arquivos + módulos quando fizer sentido) | Sem framework de CSS |
| Persistência | **`localStorage`** com chave exclusiva `arquipelago-python:progress` e `schemaVersion` | IndexedDB só se houver necessidade real (arquivos grandes) |
| Testes | **Vitest** (domínio e componentes) + **Playwright** nos fluxos, se o ambiente permitir | Playwright depende de download de navegador: a confirmar na Etapa 2 |
| Python (etapa 9+) | **Pyodide** em **Web Worker**, sob demanda | Sem API de IA, sem serviço remoto de execução |

Sem dependências por conveniência. Toda dependência nova entra com justificativa em `DECISIONS.md`.
Assets externos exigem licença conhecida e documentada; o protótipo usa **somente geometria própria**.

## 2. Estrutura de pastas (proposta)

```text
arquipelago-python/
  package.json            # lockfile versionado (package-lock.json)
  vite.config.ts          # host 0.0.0.0, allowedHosts do preview, base relativa
  tsconfig.json
  index.html
  src/
    app/                  # composição e inicialização, layout, roteamento de telas
    world/                # cena, ilhas, pontes, props, câmera, navegação
    learning/             # missão, leitura, prática, avaliação, feedback
    content/              # currículo e perguntas por unidade (dados tipados)
    state/                # store, transições e seletores
    persistence/          # salvar, carregar, validar, migrar
    python/               # (etapa 9+) worker, protocolo, execução e testes
    ui/                   # componentes DOM acessíveis
    types/                # contratos compartilhados
    utils/
  public/assets/
  docs/                   # BRIEF, ARCHITECTURE, DECISIONS, BOOK_MAP, CONTENT_GUIDE,
                          # STATE_MACHINE, STAGES, HANDOFF, TEST_REPORT
```

Pastas só são criadas quando têm conteúdo real — nada de diretório vazio "para depois".

## 3. Fronteira de módulos (a regra central)

```
types ──────────► (contratos de dados)

content ────────► dados pedagógicos tipados (sem React, sem three)
       │
       ▼
learning/domain ◄── FUNÇÕES PURAS: nota, aprovação, disponibilidade, pré-requisitos
       ▲             sem React, sem three, sem localStorage  ← TESTADO NO VITEST
       │
state  ─────────► store + seletores; chama o domínio; nunca reimplementa a regra
       │
       ├──► persistence ──► validar/migrar/salvar dados serializáveis apenas
       ├──► ui           ──► DOM acessível, painéis, formulários
       └──► world        ──► three.js/R3F: lê o estado, desenha, emite intenções
                           (NUNCA decide se uma ilha está liberada)
```

Consequências obrigatórias:

- A cena 3D **não** contém regra de aprovação: uma ponte é desenhada como bloqueada com base no
  **seletor** de disponibilidade, não em uma cópia local da regra.
- Uma única fonte de verdade para acesso; abrir painel, mudar parâmetro de URL ou clicar na ponte
  **não** desbloqueia nada.
- Nunca persistir objetos de three.js, componentes React ou funções — apenas dados serializáveis e
  versionados.

## 4. Contratos de dados (esboço — congelados na Etapa 2)

```ts
type Availability = 'ready' | 'under-construction';         // conteúdo
type UnitState    = 'locked' | 'available' | 'studying' | 'ready-for-assessment'
                  | 'assessing' | 'passed';                 // derivado, não persistido cru

interface LearningUnit {
  id: string; contentVersion: number; order: number;
  title: string; summary: string;
  prerequisiteIds: string[];
  objectives: string[];
  estimatedMinutes: number;                                  // sempre rotulado "estimativa"
  bookReference: BookReference;                              // ver BOOK_MAP.md
  lesson: { sections: LessonSection[] };
  examples: Example[];
  practice: PracticeItem[];
  assessment: { id: string; questionIds: string[]; passingScore: 80; variant?: string };
  world: { position: [number, number, number]; appearance: IslandLook;
           props: PropSpec[]; connections: { to: string; kind: 'bridge' }[] };
  availability: Availability;
}

interface Question {
  id: string; objectiveId: string; difficulty: 'facil' | 'media' | 'dificil';
  type: 'multipla-escolha' | 'prever-saida' | 'completar-codigo';
  prompt: string; code?: string;
  options: { id: string; text: string }[];                   // resposta correta por ID, nunca índice
  correctOptionId: string;
  optionFeedback: Record<string, string>;                    // explicação por alternativa relevante
  reviewRef: { unitId: string; sectionId: string };
  reviewHint: string;                                        // o que revisar
}

interface Attempt {
  id: string; unitId: string; assessmentVersion: string;
  answers: Record<string, string>;                           // questionId -> optionId
  correctCount: number; total: number; score: number;        // score = acertos/total*100 (real)
  passed: boolean; finishedAt: string;                       // ISO
}

interface Progress {
  schemaVersion: number; curriculumVersion: string; updatedAt: string;
  selectedUnitId: string | null;
  preferences: { quality: 'alto' | 'medio' | 'baixo'; reducedMotion: 'sistema' | 'ligado' | 'desligado'; view: '3d' | 'lista' };
  units: Record<string, {
    readingMarked: boolean; drafts: Record<string, string>;
    attempts: Attempt[]; bestScore: number | null; lastResult: 'aprovado' | 'reprovado' | null;
    passedAt: string | null;
  }>;
  notes?: Record<string, string>;                            // etapa 12
}
```

## 5. Máquina de estados pedagógica

```
bloqueada ──(todos os pré-requisitos aprovados E unidade 'ready')──► disponível
disponível ──(abre o painel / começa a estudar)──► estudando
estudando ──(leitura marcada)──► pronta_para_avaliação
pronta_para_avaliação ──(abre a avaliação)──► em_avaliação   [transitório de UI, não persistido]
em_avaliação ──(≥ 80%)──► aprovada
em_avaliação ──(< 80%)──► volta a "estudando" (revisão) — a ilha continua acessível
```

- `acessibilidade` é **calculada** dos pré-requisitos aprovados (`prerequisiteIds.every(passou)`),
  nunca um booleano solto que possa divergir do resto do estado.
- Regra de liberação da avaliação (padrão proposto): **leitura marcada + unidade acessível**. A
  prática é recomendada, sem bloqueio artificial adicional.
- Desmarcar leitura depois de aprovado **não revoga** a aprovação e **não** re-bloqueia a avaliação.
- Unidade `under-construction` nunca fica disponível só porque o pré-requisito foi concluído.
- Última unidade implementada mostra conclusão própria (sem tentar acessar um ID inexistente).
- Reprovar não bloqueia a ilha atual nem apaga a melhor nota.

## 6. Persistência

- Chave exclusiva: `arquipelago-python:progress` (não usa `localStorage.clear()` jamais; limpeza
  remove apenas as chaves próprias, com prefixo).
- Escrita sempre com `try/catch`: cota excedida, modo privado ou armazenamento indisponível
  produzem **aviso honesto** ("esta sessão está funcionando sem salvar"), nunca um falso "salvo".
- Leitura tolerante: ausente, com campos faltando, JSON inválido, `schemaVersion` desconhecido.
  Migração simples com backup da versão anterior antes de reescrever.
- Reinício do curso somente após confirmação clara; cancelar não altera dados.
- Nada de analytics, nem coleta não solicitada. Nada de conta, login ou sincronização.

## 7. Câmera e entrada (progressivo)

| Modo | Comportamento | Concede acesso a conteúdo? |
|---|---|---|
| Guiado | Acompanha a ilha atual e transições autorizadas | Não altera permissões |
| Órbita | Gira em torno da ilha selecionada, com limites de zoom/inclinação | Não |
| Vista de cima | Mapa do arquipélago com estados; só seleciona unidades permitidas | Não |
| Exploração livre | Voo com limites (WASD/QE, Shift) | **Não** — apenas visual |

Regras: foco em editor/formulário/painel suspende comandos de movimento (teclas digitadas em texto
nunca movem o avatar); `Escape` fecha painel ou sai do modo atual com prioridade previsível; botão
"Voltar à minha ilha" sempre recupera câmera útil; transições canceláveis/recuperáveis e respeitam
`prefers-reduced-motion`; sem captura automática de ponteiro e sem tela cheia forçada; canvas e
câmera recalculados no redimensionamento; **recurso não implementado não aparece como botão**.

## 8. Desempenho e robustez

- Geometrias e materiais compartilhados; `InstancedMesh` para repetição (tábuas, postes, pedras,
  árvores); nenhum `new` por frame.
- Limites: 1 luz com sombra, sem pós-processamento no protótipo, DPR limitado
  (`min(dpr, 1.5)`), névoa no lugar de partículas, sem renderizar detalhe que não se percebe.
- Nada de `setState` por frame: a câmera anima fora do ciclo de render do React.
- Descarte correto de geometrias, materiais e listeners; pausa de atividade quando a aba perde foco.
- WebGL indisponível ou contexto perdido: mensagem clara + botão para o modo de estudo em lista.
- **Metas mensuráveis:** 30 FPS a 1280×720 com DPR ≤ 1.5 em um cenário de 3 ilhas + 2 pontes;
  painel de estudo respondendo em menos de 100 ms após a ação. Método: contador de FPS simples
  exibido em modo de depuração (a criar na Etapa 13) e medição registrada em `TEST_REPORT.md`.
  **Nada será afirmado como atingido sem medição registrada.** A "máquina de referência" é o
  navegador do usuário sobre o preview; ela deve ser declarada junto do número medido.

## 9. Python no navegador (etapas 9+) — desenho, não implementação

- Carregamento **sob demanda**, na primeira abertura de exercício executável; runtime em Web Worker.
- Protocolo tipado: `init | run | cancel | result | error | state`, com `executionId` para que
  resposta atrasada de execução antiga seja descartada.
- Timeout **aplicado pelo controlador fora do worker** (ex.: 5 s na primeira versão), separando
  claramente "carregar runtime" de "executar". Interrupção real: encerrar e recriar o worker.
- Saída limitada e truncada; uma execução por vez; ambiente limpo entre submissões conforme
  contrato documentado no `python/` quando chegar a hora.
- `input()`: fila explícita de entradas definida antes da execução, ou limitação informada na UI.
  Nunca deixar código esperando entrada sem interface.
- Arquivos: sistema de arquivos virtual com fixtures; jamais o disco do usuário sem ação explícita.
- **Segurança (modelo de confiança a documentar na Etapa 9):** Web Worker melhora responsividade e
  isolamento operacional, mas **não** é fronteira completa de segurança (Pyodide interopera com JS e
  recursos do navegador). Não prometer execução absolutamente segura de código arbitrário; não
  colocar segredos no cliente; timeout não é limite rígido de memória. Código compartilhado ou não
  confiável exigiria isolamento adicional e origem separada.

## 10. Riscos registrados

| # | Risco | Impacto | Mitigação proposta |
|---|---|---|---|
| R1 | Livro/PDF ausente (bloqueio atual) | Referências e conteúdo das unidades não podem ser finalizados | Avançar etapas 1–5; Etapa 6+ bloqueada; receber o arquivo |
| R2 | Edição do livro com Python antigo | Exemplos divergentes confundem o aluno | Nota de diferença explícita por unidade (`BOOK_MAP.md` §6); explicar, nunca corrigir em silêncio |
| R3 | Deploy no mesmo domínio do site atual (regras de 404/redirect globais) | Site de captação quebrado | Publicar separado (subdomínio); nunca editar `_redirects`/`.htaccess` sem autorização |
| R4 | Preview remoto com host/origin restrito | Tela em branco no preview | Vite com `host: 0.0.0.0` e `allowedHosts`; base relativa; nenhuma chamada a `localhost` |
| R5 | Verificação visual 3D no ambiente do agente é limitada | Não posso afirmar que "está bonito" ou que roda a 30 FPS | Critérios verificáveis + medição declarada + roteiro manual de aceite para o usuário |
| R6 | Playwright pode exigir download de navegador | Automação de fluxo indisponível | Vitest obrigatório; Playwright só se o ambiente permitir; senão, roteiro manual registrado como pendente |
| R7 | Pyodide é grande e depende de CDN | Primeira carga lenta, falsa impressão de app quebrado | Carregamento sob demanda com progresso e explicação explícita; nunca prometer uso offline |
| R8 | Conteúdo pode ficar desalinhado do livro | Curso perde valor curricular | Toda unidade carrega `bookReference` e fica `pendente` até verificação |

## 11. Dependências e decisões que precisam de aprovação

Ver `DECISIONS.md` — seção "Aguardando aprovação do responsável" (Q-001 a Q-007).
