# Direção de arte — registro da leitura das referências

> Atualizado em 2026-09-21 (Etapa 0).

## 0. Fonte e status da inspeção — LEIA PRIMEIRO

**Não recebi os arquivos das três imagens.** Procurei em todo o ambiente de trabalho
(`/home/user` e sistema de arquivos, por nome e por data) e o único arquivo de imagem presente é
`tools/og-small.png`, que pertence ao site existente de captação de leads — não é uma referência de
arte.

Portanto, a leitura abaixo é **derivada da descrição textual fornecida no pedido (§3.1)**, marcada
como `descrito pelo usuário`, e **não** de inspeção direta dos arquivos. Nada foi copiado, e nenhuma
imagem de terceiros foi baixada para "substituir" o anexo. Quando as imagens forem reanexadas,
este documento deve ser revisado e cada linha reclassificada como `verificado`.

Legenda de status: `descrito` = baseado na descrição do pedido; `verificado` = confirmado na imagem
(ainda nenhum).

## 1. Características aproveitadas

| # | Característica descrita | O que será aproveitado | Como (implementação prevista) | Status |
|---|---|---|---|---|
| 1 | Ilhas suspensas, superfície relativamente plana, base rochosa irregular | Superfície plana o suficiente para caminhar; silhueta inferior rochosa e facetada, com volume | Topo: polígono extrudado com bordas irregulares. Base: pirâmide/cone invertido facetado com deslocamento determinístico por semente fixa (sem procedural aleatório em runtime) | descrito |
| 2 | Rochas facetadas, estilo low-poly, com volume e profundidade | Geometria com poucos polígonos e normais planas (`flatShading`), leitura clara de facetas | `BufferGeometry` própria + `flatShading: true`; iluminação com luz direcional + hemisférica para separar planos | descrito |
| 3 | Ilhas em sequência espacial, formando percurso compreensível | Curva/zigue-zague legível, sem fileira monótona e sem labirinto | Posições em zigue-zague com deslocamento alternado; distância entre ilhas constante o bastante para a ponte ter sempre o mesmo comprimento | descrito |
| 4 | Pontes estreitas de madeira: tábuas, postes, cordas/corrimãos | Ponte como objeto reconhecível, com peças distintas (tábuas, postes, corrimão) | Peças em módulos reutilizados (geometrias e materiais compartilhados) + `InstancedMesh` para tábuas e postes | descrito |
| 5 | Céu, névoa e fundo azul-esverdeado, altitude e distância | Gradiente de céu, névoa exponencial, sensação de altitude | Cor de fundo + gradiente de céu em shader simples ou `Sky`; `fog` (exponencial) casando com a cor do horizonte; ilhas distantes esmaecendo | descrito |
| 6 | Vegetação esparsa e objetos grandes o suficiente para serem reconhecidos | Poucos elementos de vegetação, silhueta grande, foco nos objetos de estudo | Árvores/arbustos low-poly em número pequeno (≈ 4–8 por ilha), sem floresta; objetos de estudo com escala que ocupa fração significativa da ilha | descrito |
| 7 | Computadores, livros, placas e objetos temáticos no centro | Núcleo de interação visível no centro da ilha | Agrupamento central com livro, computador e placa da missão, com hover/foco e rótulo curto | descrito |
| 8 | Rótulos próximos às ilhas, controles discretos e painéis sobrepostos | Rótulo de nome/estado da ilha; UI em HTML sobre o canvas | Rótulos como `Html`/`Billboard` do Drei (poucos, sem poluir); painéis de estudo em DOM, acessíveis | descrito |
| 9 | Aproximação, voo, visão superior e inspeção de etapa | Modos de câmera: guiado, órbita, vista de cima, exploração livre com limites | Máquina de estados de câmera simples; nenhum modo concede acesso a conteúdo bloqueado | descrito |
| 10 | Linhas curvas vermelhas conectando pontos | **Não é requisito.** Será ignorado | Pontes claras e poucas conexões explícitas valem mais que um emaranhado | descrito |

## 2. O que não será copiado

- Marcas, logotipos, nomes de produtos, textos de interface e elementos de UI de terceiros.
- Layouts, ícones e paletas específicas das imagens de referência.
- Assets externos sem licença conhecida e documentada. **No protótipo não haverá asset externo**:
  toda a geometria é própria (código) e todo material é simples (`MeshStandardMaterial`/`MeshLambert`).

## 3. Vocabulário de formas do arquipélago

- **Topo da ilha:** polígono irregular facetado (≈ 8–14 lados), levemente convexo.
- **Base:** cone invertido facetado, com 2 ou 3 "costelas" para dar volume.
- **Rocha solta:** icosaedro/octaedro achatado, escala aleatória determinística.
- **Ponte:** 1 vão reto, 2 corrimãos, N tábuas, 4–6 postes; sem curvas.
- **Computador:** base + tela inclinada (caixa), teclado fino; emissivo suave quando ativo.
- **Livro:** duas capas e uma lombada; "aberto" quando selecionado.
- **Placa da missão:** poste + placa com texto renderizado em DOM (`Html`), não em textura.
- **Árvore:** tronco cilíndrico de 5–6 lados + 1–2 cones/icosaedros de copa.

## 4. Paleta e atmosfera propostas (ajustáveis na Etapa 3)

| Uso | Cor aproximada | Observação |
|---|---|---|
| Céu alto | `#2f6f8f` | azul-esverdeado profundo |
| Horizonte / névoa | `#8fc4bd` | casa com o fundo para dar distância |
| Rocha | cinza-azulado `#8b93a1` → `#5c6472` | facetas claras e escuras |
| Terra / grama | `#6f9e5b` e `#4f7a48` | superfície plana, sem textura |
| Madeira | `#a9793f` / `#7c552a` | tábuas e corrimãos |
| Destaque de interação | âmbar `#f2b53c` | nunca é o **único** sinal (sempre acompanha texto) |
| Bloqueio | cinza dessaturado + cadeado desenhado + texto | nunca só vermelho/verde |
| Aprovado | verde `#4f9d69` | acompanha ícone e texto |

Contraste de texto da UI é tratado em CSS (não na cena). Estados nunca dependem apenas de cor:
cadeado (forma), texto e rótulo acessível acompanham cada estado.

## 5. Orçamento de arte (orçamento de desempenho, por ilha)

- Malhas distintas por ilha: ≤ 12 tipos; instâncias para repetição (tábuas, postes, pedras, árvores).
- Luzes: 1 direcional (com sombra) + 1 hemisférica. Sem pós-processamento no protótipo.
- Neve/névoa: névoa de cena apenas; sem partículas no protótipo.
- Sombra: um único mapa de sombra, resolução limitada, atualizado só quando a cena muda de estado
  relevante; sem sombra em objetos distantes.
- Alvo de DPR: `min(devicePixelRatio, 1.5)`, com opção de qualidade mais baixa.

## 6. Pendências deste documento

- Reanexar as três imagens para reclassificar cada linha como `verificado` e corrigir desvios.
- Confirmar se a atmosfera desejada é a do céu azul-esverdeado (padrão proposto) ou outra.
