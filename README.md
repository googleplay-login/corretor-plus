# Carlos Consultor — Site de captação de leads (planos de saúde)

Site 100% estático (HTML5 + CSS3 + JavaScript nativo, sem framework, sem build, sem CDN) para captar leads qualificados de plano de saúde em Niterói - RJ e região e entregá-los no WhatsApp **já com a simulação escrita**, para o Carlos só apertar "enviar".

Regra do produto: **"só mostrar o que existir"**. Todo campo vazio em `js/config.js` desliga o recurso correspondente (analytics, webhook, selo SUSEP, e-mail, painel). Os únicos campos que **não** podem ficar vazios são: `whatsapp`, `whatsappExibicao`, `cidadeBase`, `regioesAtendidas`, `operadoras`, `horario`, `marca` e `responsavel`.

---

## 1. Estrutura de arquivos

```
index.html ........... Landing completa + wizard em overlay de tela cheia
simulacao.html ....... O mesmo wizard em página própria (rota indexável, destino de anúncios)
obrigado.html ........ Tela de sucesso com o link do WhatsApp e o botão "Copiar resumo"
painel.html .......... Leitura dos leads no navegador (senha local, CSV, métricas)
privacidade.html ..... Política de Privacidade LGPD (11 seções)
termos.html .......... Termos de uso + aviso regulatório
404.html ............. Erro 404 com CTA da simulação (link de anúncio quebrado não vira lead perdido)
css/styles.css ....... Único CSS (tokens + componentes)
js/config.js ......... ⭐ ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR
js/validate.js ....... Validações puras (telefone/DDD, nome, e-mail, BRL, CSV, SHA-256)
js/state.js .......... Rascunho (localStorage), atribuição de campanha (UTM), estatísticas locais
js/lead.js ........... Lead, score, mensagem do WhatsApp, webhook/outbox, CSV, painel, obrigado
js/wizard.js ......... Motor do wizard (9 telas), overlay, banner "Retomar simulação"
js/analytics.js ...... Consentimento (Consent Mode), GA4/Pixel/Clarity sob aceite, track()
data/*.js ............ UFs, municípios, operadoras, hospitais, referência de mercado (interna)
tests/test.mjs ....... 78 testes das funções puras (rode com: node tests/test.mjs)
favicon.svg · robots.txt · sitemap.xml · llms.txt · humans.txt
site.webmanifest · .htaccess (Apache) · _redirects (Netlify/Cloudflare)
.well-known/security.txt
```

O app React antigo que estava na raiz do repositório foi preservado em `_legado-crm-react/` (nada foi apagado; ele não faz parte do site estático).

## 2. O que editar: sempre só `js/config.js`

| Quero trocar… | Campo em `js/config.js` |
|---|---|
| Número do WhatsApp (recebe os leads) | `whatsapp` (só dígitos, com 55 e DDD) e `whatsappExibicao` |
| Cidade/região atendidas | `cidadeBase` e `regioesAtendidas` (lista) |
| Operadoras da faixa da landing | `operadoras` (lista de texto puro, sem logo) |
| Horário de atendimento | `horario` |
| Prazo de resposta prometido | `prazoResposta` |
| Cores | `cores` (e os tokens `--azul`, `--laranja-acao`, `--verde` em `css/styles.css`) |
| Registro SUSEP (liga o selo) | `registroSusep` |
| Domínio (canonical/OG absolutos) | `dominio` (ex.: `https://carlosconsultor.com.br`) |
| Mensagem curta dos botões | `mensagemWhatsCurta` |
| Instagram | `instagram` |

Nada mais precisa ser tocado: os textos das páginas, o FAQ, os avisos legais e o wizard se ajustam sozinhos à configuração.

## 3. Como publicar

### Netlify (arrastar a pasta)
1. Acesse app.netlify.com → **Add new site → Deploy manually**.
2. Arraste a pasta inteira do site (com `index.html` na raiz). Pronto: HTTPS sai automático.
3. Para o domínio próprio: **Domain management → Add domain**, siga as instruções de DNS (registros `A`/`CNAME` mostrados na tela) e aguarde o certificado (Let's Encrypt automático).
4. O arquivo `_redirects` já entrega o 404 com CTA e as rotas amigáveis.

### Cloudflare Pages
1. Dash → **Workers & Pages → Create → Pages → Upload assets** e suba a pasta.
2. Domínio próprio: **Custom domains → Set up a custom domain**, aponte o `CNAME` para `seu-projeto.pages.dev` e aguarde o certificado.
3. HTTPS e HTTP/2 são automáticos; o `_redirects` é respeitado.

### GitHub Pages
1. Suba a pasta para um repositório e ative **Pages** (branch `main`, pasta raiz).
2. O `.htaccess` é ignorado (é só para Apache/cPanel); o 404.html funciona nativamente no GitHub Pages.

### Apache/cPanel
Suba a pasta para `public_html/`. O `.htaccess` força HTTPS, define cache e aponta a página de erro 404.

## 4. Ligar os recursos opcionais (tudo em `js/config.js`)

### GA4 (medição)
1. `ga4Id: "G-XXXXXXXXXX"`.
2. Antes do consentimento **nada** é carregado; o `gtag('consent','default',…)` fica negado. O script só entra no DOM quando o visitante aceita no banner. Eventos: `simulation_start`, `step_view`, `step_complete`, `step_skip`, `step_error`, `lead_submitted` (evento-chave), `whatsapp_open`, `copied_summary`, `resume_draft`, `cta_click`, `abandon_etapa`. Nenhum dado pessoal vai nos parâmetros.

### Meta Pixel
1. `metaPixelId: "1234567890"`.
2. O `fbq('track','Lead')` dispara **depois** do envio concluído (nunca no clique de "começar"), com `event_id` gerado no navegador e gravado dentro do Lead (campo `eventIdMeta`) para deduplicação futura com a Conversions API.

### Microsoft Clarity
`clarityId: "xxxxxxxx"` — carrega somente após consentimento de medição.

### Webhook (n8n / Make / Zapier / Formspree / Apps Script)
1. `webhookUrl: "https://seu-n8n.exemplo.com/webhook/leads"`.
2. O corpo do POST é o **Lead completo em JSON** (`application/json`), incluindo `leadId`, `nome`, `whatsappNormalizado`, `pessoas[]`, `cobertura`, `cidade/uf`, `orcamento`, `encaixeOrcamento`, `score`, `consentimentos` e `atribuicao` (UTMs). Exemplo de endpoint n8n: método POST, sem cabeçalho extra (o navegador envia `Content-Type: application/json`).
3. Falha de rede: 3 tentativas com backoff de **2s, 6s e 18s**; persistindo, o Lead vai para `localStorage['outbox:v1']` e reenvia sozinho na próxima visita.
4. `webhookUrl: ""` = nenhuma requisição é feita e nada de erro no console.

### Cloudflare Turnstile (anti-spam)
1. Crie o widget em dash.cloudflare.com (modo *Managed*), copie a **Site Key**.
2. `turnstileSiteKey: "0x4AAA..."`. O script só carrega com chave preenchida; sem chave, o site segue 100% funcional (honeypot + tempo mínimo de 12s + trava de repetição continuam ativos).

### Painel de leads (`painel.html`)
1. Gere o hash da senha: abra o site, pressione F12 → Console e rode:
   `crypto.subtle.digest('SHA-256', new TextEncoder().encode('sua-senha')).then(r => console.log([...new Uint8Array(r)].map(b => b.toString(16).padStart(2,'0')).join('')))`
2. Cole o resultado em `painelSenhaSha256: "<hash>"`. Vazio = painel mostra "painel desativado" (os leads continuam sendo guardados no navegador).
3. No painel: busca, exportar **CSV com BOM** (abre no Excel com acentos corretos) e proteção contra fórmula injetada; métricas de funil, tempo por etapa, pulos, cidade, faixa etária e origem.

## 5. Atualização anual dos dados da ANS (maio/junho)

1. `js/config.js` → atualize `dataAtualizacaoAns` (ex.: `"2027-06"`) e `tetoReajusteIndividual` (ex.: `"X,XX% (ciclo maio/2027 a abril/2028)"`).
2. `index.html` → no FAQ (pergunta 3) e no JSON-LD (`FAQPage`), troque o percentual e o ciclo; a frase do rodapé do FAQ se atualiza sozinha pela config.
3. `privacidade.html`/`termos.html` → se quiser, ajuste "Última revisão".
4. Rode `node tests/test.mjs` e publique.

## 6. Testes

```
node tests/test.mjs
```
Cobrem: telefone (DDD 00, 8 dígitos iniciando 6-9, letras, "+55 55 21…" duplicado), nomes com acento/apóstrofo/hífen, e-mail, moeda BRL, encaixe de orçamento, score, **tamanho da mensagem wa.me ≤ 900 caracteres**, integridade de `encodeURIComponent` (&, #, acentos, quebras de linha), corte da mensagem preservando nome/telefone/idades/cidade/leadId, copia espelho, anti-spam (12s e 3 envios iguais/10 min), CSV (BOM + anti fórmula), sanitização (`<img src=x onerror=alert(1)>`), contagem de emojis e SHA-256 com o vetor oficial.

## 7. Onde ficam os dados do lead

- **Canal principal**: WhatsApp do Carlos (o lead aperta "enviar" — nada trafega por servidor do site).
- **Cópia local**: `localStorage['leads:v1']` (máx. 50) — alimenta `painel.html`.
- **Webhook**: só se `webhookUrl` estiver preenchido, com fila `outbox:v1` em caso de falha.
- **Rascunho**: `localStorage['simulacao:draft:v1']`, apagado do navegador após o envio.
- Sem consentimento, nada de GA4/Pixel/Clarity é carregado (Consent Mode negado por padrão).
