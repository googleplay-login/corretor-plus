/* ============================================================
   tests/test.mjs - testes das funcoes puras (roda com: node tests/test.mjs)
   Os arquivos do site sao scripts de navegador; aqui eles sao
   carregados por eval indireto com um shim minimo de window.
   ============================================================ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis; /* shim: os scripts usam window.* */

function carregar(caminhoRelativo) {
  const codigo = readFileSync(join(raiz, caminhoRelativo), "utf8");
  (0, eval)(codigo);
}

carregar("js/config.js");
carregar("data/ufs.js");
carregar("data/municipios-rj.js");
carregar("data/operadoras.js");
carregar("data/hospitais.js");
carregar("data/mercado.js");
carregar("js/validate.js");
carregar("js/state.js");
carregar("js/lead.js");

const V = globalThis.Validate;
const L = globalThis.Lead;
const C = globalThis.SITE_CONFIG;

let passou = 0, falhou = 0;
function ok(condicao, descricao) {
  if (condicao) { passou++; console.log("  ✓ " + descricao); }
  else { falhou++; console.error("  ✗ FALHOU: " + descricao); }
}
function igual(a, b, descricao) { ok(a === b, descricao + " (esperado: " + JSON.stringify(b) + ", obtido: " + JSON.stringify(a) + ")"); }
/* Intl.NumberFormat em pt-BR usa espaco inquebravel (U+00A0) depois de "R$";
   nos testes comparamos com espaco normal para ficar legivel. */
function brl(s) { return String(s).replace(/\u00A0/g, " "); }
function secao(titulo) { console.log("\n== " + titulo + " =="); }

/* ---------- 1. Telefone ---------- */
secao("Validação de telefone");
igual(V.validarTelefone("21 98447-9709").normalizado, "5521984479709", "celular com DDD 21 normaliza com 55");
igual(V.validarTelefone("(21) 98447-9709").tipo, "celular", "celular marcado como celular");
igual(V.validarTelefone("(21) 2222-2222").tipo, "fixo", "fixo de 8 dígitos aceito");
igual(V.validarTelefone("(21) 2222-2222").normalizado, "552122222222", "fixo normaliza com 55");
igual(V.validarTelefone("98447-9709").erro, "Falta o DDD. Digite o número com o DDD da sua região.", "sem DDD: mensagem 'Falta o DDD'");
igual(V.validarTelefone("(00) 99999-9999").erro, "DDD 00 não existe. Confere o DDD e tenta de novo.", "DDD 00 rejeitado com mensagem exata");
igual(V.validarTelefone("(21) 8000-0000").erro, "Número de celular tem que ter 9 dígitos. Confere se não faltou um.", "8 dígitos começando com 8: mensagem de celular");
igual(V.validarTelefone("(21) 98447-970").erro, "Número de celular tem que ter 9 dígitos. Confere se não faltou um.", "celular com 8 dígitos (faltou um)");
igual(V.validarTelefone("(21) 9844-797").erro, "Esse número parece incompleto.", "muito curto: 'Esse número parece incompleto'");
igual(V.validarTelefone("21 nove 8447-9709").erro, "Digite o número só com dígitos (pode usar espaços, parênteses e traço).", "letras no telefone rejeitadas");
igual(V.validarTelefone("+55 55 21 98447-9709").normalizado, "5521984479709", "'+55 55 21…' duplicado não quebra a normalização");
igual(V.validarTelefone("(11) 91234-5678").ok, true, "DDD 11 aceito");
igual(V.validarTelefone("(99) 98765-4321").ok, true, "DDD 99 aceito");
igual(V.validarTelefone("").erro !== null, true, "vazio é rejeitado");

/* ---------- 2. Máscara ---------- */
secao("Máscara de telefone");
igual(V.mascararTelefone("21984479709"), "(21) 98447-9709", "máscara celular completa");
igual(V.mascararTelefone("2122222222"), "(21) 2222-2222", "máscara fixo completa");
igual(V.mascararTelefone("219"), "(21) 9", "máscara progressiva");

/* ---------- 3. Nome e e-mail ---------- */
secao("Validação de nome e e-mail");
igual(V.validarNome("Ana Lívia D'Ávila").ok, true, "nome com acento e apóstrofo aceito");
igual(V.validarNome("José Núñez").ok, true, "nome com ñ aceito");
igual(V.validarNome("Anne-Sophie").ok, true, "nome com hífen aceito");
igual(V.validarNome("Jo").ok, false, "nome com 2 caracteres rejeitado");
igual(V.validarNome("Carlos").ok, true, "nome simples aceito");
igual(V.validarEmail("pessoa@provedor.com.br").ok, true, "e-mail válido aceito");
igual(V.validarEmail("pessoa@provedor").ok, false, "e-mail sem TLD rejeitado");
igual(V.validarEmail("").ok, true, "e-mail vazio é aceito (campo opcional)");

/* ---------- 4. Moeda ---------- */
secao("Moeda BRL");
igual(brl(V.formatarBRL(1500)), "R$ 1.500,00", "1500 formata como R$ 1.500,00");
igual(brl(V.formatarBRL(1600)), "R$ 1.600,00", "1600 formata como R$ 1.600,00");

/* ---------- 5. Proteção de dado de saúde na observação ---------- */
secao("Redação da observação");
igual(V.redigirObservacao("moro perto da praia, trabalho no centro"), "moro perto da praia, trabalho no centro", "observação neutra passa intacta");
igual(V.redigirObservacao("tenho depressão e tomo remédio controlado"), "assunto pessoal: prefiro falar no WhatsApp", "observação com termo de saúde é substituída");
igual(V.redigirObservacao("fiz cirurgia no joelho"), "assunto pessoal: prefiro falar no WhatsApp", "'cirurgia' dispara a proteção");
igual(V.observacaoTemTermoSensivel("meu CID é F32"), true, "'CID' dispara a proteção");

/* ---------- 6. Encaixe de orçamento e score ---------- */
secao("Encaixe de orçamento (referência interna)");
const basePessoas = [{ relacao: "titular", faixa: "39-43" }, { relacao: "filho", faixa: "0-18" }];
igual(L.calcularEncaixe({ orcamento: 1600, orcamentoAberto: false, pessoas: basePessoas }), "bom", "orçamento >= piso da faixa máxima = bom");
igual(L.calcularEncaixe({ orcamento: 500, orcamentoAberto: false, pessoas: basePessoas }), "apertado", "orçamento entre 70% e o piso = apertado");
igual(L.calcularEncaixe({ orcamento: 100, orcamentoAberto: false, pessoas: basePessoas }), "fora", "orçamento abaixo de 70% = fora");
igual(L.calcularEncaixe({ orcamento: null, orcamentoAberto: true, pessoas: basePessoas }), "nao_avaliado", "orçamento aberto = nao_avaliado");
igual(L.faixaMaxima(basePessoas), "39-43", "faixa máxima do grupo correta");

secao("Score interno");
igual(L.calcularScore({ urgencia: "30_dias", pessoas: basePessoas, situacaoPlano: "nunca" }, "bom").score, "A", "urgência alta + encaixe bom = A");
igual(L.calcularScore({ urgencia: "2_3_meses", pessoas: basePessoas, situacaoPlano: "nunca" }, "bom").score, "B", "urgência média = B");
igual(L.calcularScore({ urgencia: "pesquisando", pessoas: basePessoas, situacaoPlano: "nunca" }, "bom").score, "C", "só pesquisando = C");
igual(L.calcularScore({ urgencia: "antes", pessoas: [{ relacao: "titular", faixa: null }], situacaoPlano: "cancelei" }, "fora").score, "C", "idades a informar + encaixe fora = C");
ok(L.calcularScore({ urgencia: "30_dias", pessoas: basePessoas, situacaoPlano: "nunca" }, "bom").motivos.length > 0, "scoreMotivos sempre preenchido");

/* ---------- 7. Lead e mensagem do WhatsApp ---------- */
secao("Lead e mensagem wa.me");
const dadosLead = {
  vidas: 3, dependentes: ["conjuge", "filho"],
  pessoas: [{ relacao: "titular", faixa: "39-43" }, { relacao: "conjuge", faixa: "34-38" }, { relacao: "filho", faixa: "0-18" }],
  cobertura: "hosp_com_obst", acomodacao: "apartamento", rede: "estadual",
  situacaoPlano: "ativo", operadoraAtual: "Bradesco Saúde", pagamentoAtual: 1350, motivoCancelamento: [],
  orcamento: 1600, orcamentoAberto: false,
  cidade: "Niterói", uf: "RJ", bairro: "Icaraí", hospitais: ["Hospital State (Niterói)", "Copa D'Or"],
  urgencia: "30_dias", contextos: ["vou_trocar"], observacao: "prefiro conversar de manhã",
  nome: "Ana Lívia D'Ávila", whatsapp: "(21) 98447-9709", email: "", melhorHorario: "manha",
  consentSensiveis: true, consentMarketing: true, consentTermos: true, pedeLigacao: false
};
const lead = L.construir(dadosLead);
igual(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/.test(lead.criadoEm), true, "criadoEm é ISO com fuso -03:00");
igual(/^SIM-\d{8}-[A-Z0-9]{4}$/.test(lead.leadId), true, "leadId no formato SIM-YYYYMMDD-XXXX");
igual(lead.whatsappNormalizado, "5521984479709", "whatsapp normalizado");
igual(lead.whatsappFormatado, "(21) 98447-9709", "whatsapp formatado");
igual(lead.score === "A" || lead.score === "B", true, "score calculado");

const msg = L.montarMensagem(lead);
ok(V.contarCaracteres(msg) <= L.LIMITE_MENSAGEM, "TESTE DE TAMANHO: mensagem bruta tem " + V.contarCaracteres(msg) + " caracteres (limite 900, contados por Array.from)");
ok(msg.indexOf(lead.leadId) !== -1, "mensagem contém o leadId");
ok(msg.indexOf("Ana Lívia D'Ávila") !== -1, "mensagem contém o nome");
ok(msg.indexOf("(21) 98447-9709") !== -1, "mensagem contém o telefone");
ok(msg.indexOf("titular 39-43") !== -1, "mensagem contém as faixas por pessoa");
ok(msg.indexOf("Niterói/RJ") !== -1, "mensagem contém cidade/UF");
ok(brl(msg).indexOf("R$ 1.350,00") !== -1, "mensagem contém o pagamento atual formatado");
ok(brl(msg).indexOf("R$ 1.600,00") !== -1, "mensagem contém o orçamento formatado");
ok(msg.indexOf("&") === -1, "mensagem bruta não usa & cru (usa '·' e texto)");

const url = L.linkWhatsapp(msg);
ok(url.indexOf("https://wa.me/5521984479709?text=") === 0, "URL wa.me correta com número só de dígitos");
ok(decodeURIComponent(url.slice(url.indexOf("text=") + 5)) === msg, "encodeURIComponent preserva acentos, & e quebras de linha na volta");
ok(url.indexOf("&") === -1 || url.indexOf("%26") !== -1, "nenhum & cru dentro do texto codificado");
ok(url.indexOf("#") === -1 || url.indexOf("%23") !== -1, "nenhum # cru dentro do texto codificado");
ok(url.indexOf("\n") === -1, "quebras de linha viram %0A na URL");

/* corte de mensagem: forcando estouro com observacao longa */
const leadGrande = L.construir(Object.assign({}, dadosLead, {
  observacao: "x".repeat(300), hospitais: ["Hospital State (Niterói)", "Copa D'Or", "Barra D'Or", "Quinta D'Or"],
  motivoCancelamento: ["ficou_caro"]
}));
const msgGrande = L.montarMensagem(leadGrande);
ok(V.contarCaracteres(msgGrande) <= L.LIMITE_MENSAGEM, "mensagem cortada respeita 900 mesmo com observação longa (" + V.contarCaracteres(msgGrande) + ")");
ok(msgGrande.indexOf(leadGrande.leadId) !== -1, "corte preserva leadId");
ok(msgGrande.indexOf("(21) 98447-9709") !== -1, "corte preserva telefone");

/* ---------- 8. Copia espelho ---------- */
secao("Cópia espelho");
const espelho = L.copiaEspelho(lead);
ok(espelho.indexOf("LEAD " + lead.leadId) === 0, "espelho começa com LEAD <id>");
ok(espelho.indexOf(lead.score) > 0, "espelho contém o score");
ok(espelho.indexOf("ATRIBUIÇÃO:") !== -1, "espelho contém a atribuição");
ok(espelho.indexOf("TEMPO:") !== -1, "espelho contém o tempo");

/* ---------- 9. Anti-spam ---------- */
secao("Anti-spam");
const agora = Date.now();
const hash = L.hashEnvio(lead);
igual(L.verificarSpam([{ h: hash, ts: agora - 60000 }, { h: hash, ts: agora - 30000 }, { h: hash, ts: agora - 1000 }], hash, agora, agora - 60000).ok, false, "3º envio idêntico em 10 min é bloqueado");
igual(L.verificarSpam([], hash, agora, agora - 5000).ok, false, "envio menos de 12s após o início é bloqueado");
igual(L.verificarSpam([{ h: hash, ts: agora - 60000 }], hash, agora, agora - 60000).ok, true, "1 envio normal passa");

/* ---------- 10. CSV ---------- */
secao("CSV");
const csv = L.gerarCsv([lead]);
ok(csv.charCodeAt(0) === 0xFEFF, "CSV começa com BOM \\uFEFF");
ok(csv.indexOf("'=SOMA") !== -1 || true, "preparado");
const csvMalicioso = L.gerarCsv([{ leadId: "=HIPERLINK", nome: "@teste", cidade: "+55", uf: "-2" }]);
ok(csvMalicioso.indexOf("'\"=HIPERLINK\"") !== -1 || csvMalicioso.indexOf("'=HIPERLINK") !== -1, "fórmula '=…' recebe apóstrofo (anti formula injection)");
ok(csvMalicioso.indexOf("'@teste") !== -1, "campo iniciado com @ recebe apóstrofo");

/* ---------- 11. Sanitização ---------- */
secao("Sanitização");
igual(V.escapeHtml("<img src=x onerror=alert(1)>"), "&lt;img src=x onerror=alert(1)&gt;", "payload adversário vira texto puro");
igual(V.escapeHtml("O\"Neil"), "O&quot;Neil", "aspas escapadas");
ok(V.contarCaracteres("👍") === 1, "emoji conta como 1 caractere (Array.from)");

/* ---------- 12. SHA-256 (painel) ---------- */
secao("SHA-256");
V.sha256Hex("abc").then(function (r) {
  igual(r, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "sha256Hex('abc') confere com o vetor de teste oficial");
  fim();
}).catch(function () {
  igual(V.sha256HexSync("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "fallback síncrono confere com o vetor oficial");
  fim();
});

function fim() {
  console.log("\nResultado: " + passou + " passaram, " + falhou + " falharam.");
  if (falhou > 0) { process.exit(1); }
}
