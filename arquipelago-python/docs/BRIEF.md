# Arquipélago Python — Brief

> Documento de escopo e regras do projeto. Última atualização: 2026-09-21 (Etapa 0).

## 1. O produto

Aplicação web de aprendizagem de Python em um **mundo 3D real, navegável e interativo**: um
arquipélago suspenso onde cada ilha é uma unidade de aprendizagem.

Ciclo principal de aprendizagem, repetido em cada ilha:

**Entrar na ilha → consultar a missão → estudar uma parte identificada do livro → revisar a
explicação original → praticar → realizar a avaliação → obter ≥ 80% → desbloquear a ponte e a
próxima ilha.**

Princípios pedagógicos e de produto:

- O aluno permanece na ilha atual até ser aprovado; pode voltar às ilhas concluídas e ver que as
  futuras existem, mas não estudá-las nem avaliar-se nelas.
- Ver uma ilha futura pela câmera **não** equivale a desbloqueá-la.
- Marcar leitura é autodeclaração; quem comprova aprendizado, dentro dos limites do sistema, é a
  avaliação. A aplicação nunca deve sugerir que marcar leitura prova leitura.
- O objetivo é aprender, não colecionar pontos: sem cronômetro obrigatório, sem punição por erro,
  sem excesso de efeitos.
- A cena 3D **não** contém regras de aprovação. Interface, pontes e navegação consultam a mesma
  fonte de verdade.
- Existe sempre um **modo de estudo em lista**, sem depender do 3D, com as mesmas permissões
  (acessibilidade, hardware limitado, falha de WebGL).
- Idioma da interface: português brasileiro, com rótulos claros para iniciantes.

## 2. Acordo de trabalho (regras do projeto)

1. Executar **somente** a etapa ou subetapa autorizada. Aprovar uma etapa não autoriza as seguintes.
2. Dividir etapas grandes antes de começar; preferir um incremento funcional completo a dezenas de
   arquivos incompletos.
3. O mundo deve ser 3D real, navegável e interativo — nunca substituído por imagem, vídeo, maquete
   estática ou cartões com aparência de ilhas.
4. Não implementar agentes, LLM, geração automática de conteúdo, API de IA, assinatura,
   autenticação, pagamentos, multiplayer ou backend sem autorização. **Nenhuma credencial.**
5. Não inventar conteúdo de anexos, edição do livro, páginas, resultados de testes ou
   funcionalidades já implementadas.
6. Preservar o trabalho existente no repositório (ver §3). Nada fora da pasta deste projeto é
   alterado sem confirmação.
7. Perguntar apenas quando a resposta for necessária para prosseguir. Decisão reversível → propor
   padrão e registrar em `DECISIONS.md`.
8. Entregar código funcional, nunca pseudocódigo apresentado como produto.
9. A conversa não é a memória do projeto: manter a documentação de continuidade no repositório.
10. Ao concluir cada etapa, parar e aguardar autorização.

## 3. Relação com o site existente no repositório

O repositório já contém um produto diferente e em produção: o site estático de captação de leads
"Carlos Consultor" na raiz (`index.html`, `simulacao.html`, `css/`, `js/`, `data/`, `_redirects`,
`.htaccess`, `sitemap.xml`, `robots.txt`, `tests/test.mjs`). Ele é **build-free** (não tem
`package.json`) e é publicado como site estático.

Decisão proposta: o Arquipélago Python vive em uma **pasta independente** na raiz do repositório,
`arquipelago-python/`, com seu próprio `package.json`, build, testes e deploy. Nada na raiz é
alterado. A chave de `localStorage` é exclusiva do projeto, então não há colisão com o site
existente. Ver `DECISIONS.md` (D-001) — **aguardando confirmação**.

Observação de deploy: o `_redirects` do site atual tem uma regra final `/* → /404.html 404` e o
`.htaccess` usa `ErrorDocument 404 /404.html`. Se o arquipélago for publicado no **mesmo domínio e
subpasta**, essas regras precisam de ajuste (fora do escopo até haver autorização). O padrão
proposto é publicar como site separado (subdomínio), sem tocar no site atual.

## 4. Escopo

### 4.1 Protótipo inicial (ponta a ponta) — etapas 1 a 8

- Três ilhas verdadeiramente 3D, com identidades visuais distintas.
- Primeira ilha disponível; as duas seguintes bloqueadas.
- Livro e computador interativos.
- Missão de estudo, explicação original, prática e cinco perguntas objetivas por ilha.
- Quatro acertos em cinco aprovam (≥ 80% real).
- Liberação da ponte, deslocamento até a próxima ilha e possibilidade de retorno.
- Progresso salvo localmente.
- Navegação por mouse e teclado, com alternativas acessíveis na interface.
- Tratamento de falha de armazenamento e de WebGL.

### 4.2 Versão seguinte (após o protótipo)

- Editor de Python com execução local no navegador (Pyodide em Web Worker).
- Exercícios práticos com testes e feedback determinístico.
- Mais unidades do livro, em lotes pequenos e revisados.
- Exportação/importação de progresso, anotações por ilha e polimento visual.
- Melhor adaptação a dispositivos móveis.

### 4.3 Fora de escopo (não implementar sem autorização explícita)

- Mundo gerado por IA, chat inteligente, agente tutor, correção por LLM.
- Conta de usuário, banco remoto, sincronização entre dispositivos, rankings.
- Geração procedural ilimitada, cidades gigantes, mundo aberto extenso.
- Certificação inviolável, proteção contra adulteração de progresso, fiscalização de leitura.
- Garantia de executar qualquer projeto do livro dentro do navegador.
- Leitor de PDF integrado antes de autorização específica (etapa 12).

## 5. Escopo exato das três primeiras ilhas (provisório)

A sequência temática abaixo segue o esboço do pedido (§9). Ela é **provisória**: a ordem
definitiva depende da verificação do livro, que está bloqueada (ver `BOOK_MAP.md`). A terceira
ilha é a mais provável de mudar, porque muitos livros só chegam a listas depois de condicionais e
repetições.

| # | id estável | Título curto | Tema | Objetivos observáveis (rascunho) | Props temáticos |
|---|---|---|---|---|---|
| 1 | `u01-primeiro-programa` | Ilha do Primeiro Programa | Ambiente, execução, `print`, erros, comentários | (a) descrever o que é um programa `.py` e como ele é executado; (b) ler e escrever um programa que exibe texto com `print()` e explicar o papel das aspas; (c) distinguir erro de sintaxe de erro em tempo de execução em exemplos dados; (d) usar comentário e nomear arquivo de forma coerente | computador/terminal grande, placas com mensagens na parede, letreiro "Olá, mundo!" |
| 2 | `u02-variaveis-e-tipos` | Ilha das Caixas Rotuladas | Variáveis, strings, números, conversão de tipo | (a) criar variável e reatribuir valor, prevendo o resultado; (b) diferenciar `int`, `float` e `str`, inclusive `"1"` vs `1`; (c) montar texto com variáveis; (d) prever o resultado de expressões aritméticas simples | recipientes/caixas identificadas, postes com placas de texto, balanças numéricas |
| 3 | `u03-listas` | Ilha das Caixas Enfileiradas | Listas: criação, índice, `len`, adicionar/remover | (a) criar lista e acessar item por índice, explicando a origem em 0; (b) prever o efeito de adicionar/remover itens; (c) usar `len`; (d) prever a saída de um trecho curto que percorre/consulta uma lista | estante indexada, fila de caixas numeradas |

Cada ilha terá: placa da missão, livro, computador e ponte (destino + condição de desbloqueio).
As referências bibliográficas de todas as três estão **pendentes** (`null`) — ver `BOOK_MAP.md`.

## 6. Critério de conclusão do produto combinado

O produto só estará pronto quando: o aluno aprender em ilhas 3D reais (não olhar maquete); conteúdo
e referências estiverem alinhados ao PDF verificado; as regras dos 80% funcionarem de forma
consistente em todas as interfaces; reprovação orientar revisão e aprovação abrir o caminho
seguinte; o progresso persistir ou a falha for comunicada com honestidade; a execução de Python,
quando incluída, for interrompível e testada; houver alternativa acessível ao 3D; não houver
dependência de API de IA nem credenciais; e instalação, uso, limitações e edição do curso estiverem
documentadas.

Não alegar que concluir quizzes garante domínio de Python: a aplicação distingue claramente
avaliação automática de tarefas que exigem revisão humana ou execução local.
