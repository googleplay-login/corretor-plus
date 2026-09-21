# Mapa do livro e mapa curricular

> Atualizado em 2026-09-21 (Etapa 0).
>
> ## ⚠️ STATUS: BLOQUEADO — o arquivo do livro não foi recebido
>
> Procurei PDF, EPUB ou MOBI em todo o ambiente de trabalho (`/home/user` e sistema de arquivos).
> **Nenhum arquivo de livro está presente.** Por isso:
>
> - **Nenhuma** edição, capítulo, seção, página impressa ou página de PDF foi verificada.
> - Toda referência bibliográfica neste documento está como `null` / `referência pendente`.
> - Nenhum número de página foi estimado, deduzido ou "plausibilizado".
> - O currículo abaixo é **provisório** e será reconciliado com o PDF antes da produção
>   definitiva das unidades. A Etapa 6 (estudo e livro) não pode ser aceita enquanto isso.

## 1. O que preciso para desbloquear

Uma destas opções:

1. Anexar o arquivo do livro (PDF, ou EPUB) na conversa; ou
2. Informar título, autor, edição, editora, ano e idioma — para eu registrar a referência textual e
   continuar sem o arquivo (as páginas permanecem pendentes até a verificação); ou
3. Autorizar explicitamente a adoção de outro livro que eu possa verificar.

Sem uma dessas opções, as Etapas 1 a 5 (infraestrutura, domínio, 3D, ilhas, navegação) podem
avançar normalmente: elas não dependem do conteúdo do livro. As Etapas 6 em diante dependem.

## 2. Procedimento de verificação (a executar quando o arquivo existir)

1. **Identificação:** título, autor(es), edição, editora/ano, tradutor (se houver) e idioma, a partir
   da folha de rosto e da página de créditos — não a partir de metadados do arquivo sozinhos.
2. **Organização do sumário:** extrair o índice (capítulos, seções, subseções, apêndices).
3. **Pesquisabilidade:** testar a extração de texto em páginas variadas. Se não houver camada de
   texto, registrar que a leitura dependerá de OCR e tratar como fonte menos confiável.
4. **Diferença entre página do PDF e número impresso:** mapear **por seção**, comparando o número
   impresso visível com a página física do arquivo. **Não** assumir deslocamento constante: pré-texto
   (prefácio, sumário, agradecimentos) e eventuais páginas em branco ou inserções produzem
   deslocamentos que variam ao longo do livro.
5. **Amostragem seletiva:** ler apenas os trechos necessários de cada unidade (abertura do capítulo,
   definições, exemplos, resumo e exercícios). **Não** despejar o livro inteiro em contexto.
6. **Conferência com Python atual:** identificar exemplos da edição que não funcionam ou mudaram
   (por exemplo, sintaxe de `print`, divisão, `input`, f-strings, tratamento de exceções,
   diferenças de biblioteca padrão). Cada divergência vira uma nota didática explícita: "no livro
   aparece assim; no Python atual, assim; o motivo é este".
7. **Preenchimento da tabela** abaixo com páginas impressas **e** páginas do PDF, mais o status de
   verificação por unidade.
8. **Registro de direitos:** o PDF não é publicado, não é commitado no Git e não é distribuído com a
   aplicação. Aulas, perguntas e exemplos do aplicativo são **originais**, alinhados aos objetivos
   do livro — não reprodução de capítulos.

## 3. Tabela de referências — Unidades 1 a 3 (provisórias)

Status possíveis: `pendente` (arquivo ausente), `parcial` (identificado, não conferido),
`verificado` (conferido no arquivo). Hoje **todas são `pendente`**.

| Unidade (id) | Título provisório | Capítulo | Seções | Págs. impressas | Págs. do PDF | Deslocamento | Status |
|---|---|---|---|---|---|---|---|
| `u01-primeiro-programa` | Ilha do Primeiro Programa | `null` | `null` | `null` | `null` | `null` | **referência pendente** |
| `u02-variaveis-e-tipos` | Ilha das Caixas Rotuladas | `null` | `null` | `null` | `null` | `null` | **referência pendente** |
| `u03-listas` | Ilha das Caixas Enfileiradas | `null` | `null` | `null` | `null` | `null` | **referência pendente** |

Campos vazios são `null` de propósito. Nenhum valor será preenchido por estimativa.

## 4. Mapa curricular preliminar (provisório, independente do livro)

Sequência temática derivada do pedido (§9). **Não** é a ordem final: a ordem definitiva deve
respeitar o livro e as dependências pedagógicas. Um capítulo extenso pode render várias ilhas; um
assunto complexo não será comprimido só para reduzir o número de ilhas.

| Ordem | Tema | Ilhas previstas | Referência | Status |
|---|---|---|---|---|
| 1 | Preparação do ambiente e primeiro programa | 1 | `null` | provisório |
| 2 | Variáveis, strings e números | 1 | `null` | provisório |
| 3 | Listas e operações com coleções | 1 | `null` | provisório |
| 4 | Repetições (`for`) | 1–2 | `null` | provisório |
| 5 | Condicionais (`if`/`elif`/`else`) | 1–2 | `null` | provisório |
| 6 | Dicionários | 1 | `null` | provisório |
| 7 | Entrada de dados e laços `while` | 1–2 | `null` | provisório |
| 8 | Funções | 2 | `null` | provisório |
| 9 | Classes | 2 | `null` | provisório |
| 10 | Arquivos e exceções | 2 | `null` | provisório |
| 11 | Testes | 1–2 | `null` | provisório |
| 12 | Projeto integrador | 1 | `null` | provisório |

Rótulos de disponibilidade no produto (distintos entre si, nunca confundidos na interface):

- `ready` — unidade publicada e jogável;
- `em-construção` — conteúdo ainda não produzido;
- `bloqueada-por-pré-requisito` — conteúdo pronto, mas inacessível.

No protótipo, **somente três unidades** existirão com `ready`; as demais aparecem como
`em-construção` e **nunca** como curso pronto.

## 5. Contrato de referência por unidade (a ser preenchido na verificação)

```ts
type BookVerification = 'pending' | 'partial' | 'verified';

interface BookReference {
  bookId: string;            // identificador estável da obra/edição
  edition: string | null;    // ex.: "3ª edição"
  language: string | null;   // ex.: "pt-BR"
  chapter: string | null;
  sections: string[] | null;
  printedPages: string | null;   // ex.: "12–18" — como aparece impresso
  pdfPages: string | null;       // ex.: "24–30" — página física do arquivo
  offsetNotes: string | null;    // observações sobre o deslocamento
  verification: BookVerification;
}
```

Regra de produto: enquanto `verification !== 'verified'`, a unidade **não** é marcada como
publicada e a interface mostra "referência pendente" em vez de páginas.

## 6. Diferenças de edição × Python atual (a detalhar após a verificação)

Já registrado como risco: a edição do livro pode descrever um Python mais antigo. Se houver
divergência, a correção será **explicada na interface**, nunca aplicada em silêncio, e o texto do
livro continuará sendo o texto do livro. Exemplos prováveis de ajuste: forma de `print`, divisão
inteira `/` vs `//`, `input()` como string, f-strings em edições antigas, `raise ... from`, e
mensagens de erro que mudaram de redação entre versões.

## 7. Pendências explícitas

- [ ] Receber o arquivo do livro (ou autorizar outro).
- [ ] Identificar edição, autor, tradutor.
- [ ] Preencher a tabela §3 com páginas impressas e do PDF **verificadas**.
- [ ] Reconciliar a ordem das unidades (§4) com o sumário real.
- [ ] Registrar notas de diferença de versão do Python (§6).
