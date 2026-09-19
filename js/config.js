/* ============================================================
   Carlos Consultor - configuracao do site
   Este e o UNICO arquivo que o cliente precisa editar.
   Regra do produto: "so mostrar o que existir".
   Qualquer campo vazio ("") desliga o recurso correspondente:
   sem chave de analytics, sem POST, sem selo SUSEP, sem e-mail.
   Os unicos campos que NAO podem ficar vazios sao:
   whatsapp, whatsappExibicao, cidadeBase, regioesAtendidas,
   operadoras, horario, marca, responsavel.
   ============================================================ */
window.SITE_CONFIG = {
  marca: "Carlos Consultor",
  responsavel: "Carlos",
  registroSusep: "",                     // {{PREENCHER:registroSusep}}
  cnpj: "",
  whatsapp: "5521984479709",             // somente dígitos, com 55 e DDD
  whatsappExibicao: "+55 21 98447-9709",
  instagram: "https://www.instagram.com/carlos_consultor26",
  emailContato: "",
  cidadeBase: "Niterói - RJ",
  regioesAtendidas: ["Niterói","São Gonçalo","Itaboraí","Tanguá","Maricá","Rio de Janeiro","Duque de Caxias","Nova Iguaçu","São João de Meriti","Belford Roxo","Magé","Guapimirim"],
  operadoras: ["Amil","Bradesco Saúde","SulAmérica","Unimed Rio","Hapvida","NotreDame Intermédica","Porto Seguro","Care Plus","PAME","Omint"],
  horario: "Seg a Sex, 9h às 18h · Sáb, 9h às 12h",
  prazoResposta: "até 1 dia útil",
  dominio: "",                           // {{PREENCHER:dominio}} - se vazio, canonical e OG usam caminho relativo
  exibirFaixaMercado: false,
  mensagemWhatsCurta: "Olá, Carlos! Quero simular um plano de saúde.",
  webhookUrl: "",
  turnstileSiteKey: "",
  ga4Id: "", metaPixelId: "", clarityId: "",
  painelSenhaSha256: "",
  dataAtualizacaoAns: "2026-09",
  tetoReajusteIndividual: "5,11% (ciclo maio/2026 a abril/2027)",
  cores: { primaria:"#0B5FFF", acao:"#FF6B2C", sucesso:"#00B894" }
};
