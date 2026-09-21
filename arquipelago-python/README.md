# Arquipélago Python

Aplicação web para aprender Python em um arquipélago 3D navegável: cada ilha é uma unidade de
aprendizagem, com livro, computador, placa de missão e uma ponte para a próxima unidade.

> **Estado atual: Etapa 0 concluída (análise e plano). Nenhum código de aplicação foi escrito ainda.**
> Aguardando autorização para a subetapa **1.1 — Scaffold e casca acessível**.

## Índice da documentação

| Documento | Para quê serve |
|---|---|
| [`docs/BRIEF.md`](docs/BRIEF.md) | Produto, regras de trabalho, relação com o site existente, escopo exato das três primeiras ilhas |
| [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) | Direção de arte e status honesto da inspeção das imagens de referência |
| [`docs/BOOK_MAP.md`](docs/BOOK_MAP.md) | **Bloqueado**: livro não recebido; nenhuma página inventada; mapa curricular provisório |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, estrutura de pastas, fronteira de módulos, contratos, riscos |
| [`docs/STAGES.md`](docs/STAGES.md) | Painel das etapas 0–14 e critérios de aceite da subetapa 1.1 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisões registradas (D-001…D-011) e perguntas pendentes (Q-001…Q-007) |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | Estado real do projeto, comandos, bloqueios, próxima ação |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | O que foi verificado de fato, o que não foi e como será |

## Bloqueios abertos

1. **Livro (PDF) não recebido** → as Etapas 6, 7 e 11 ficam bloqueadas; nenhuma página é estimada.
2. **Imagens de referência não recebidas** → a direção de arte é derivada da descrição textual e
   precisa de revisão quando as imagens forem reanexadas.

## Onde este projeto vive

Pasta independente `arquipelago-python/`, dentro de um repositório que já hospeda outro produto em
produção (o site estático de captação de leads na raiz). **Nada fora desta pasta é alterado.**
Ver `docs/DECISIONS.md` (D-001, Q-001).
