/* ============================================================
   js/state.js - estado do rascunho, atribuicao de campanha e
   estatisticas locais (para o painel do corretor).
   localStorage e lido UMA vez por pagina (nunca dentro de
   listener de input); gravacoes acontecem a cada mudanca.
   Namespace global: window.State
   ============================================================ */
(function (global) {
  "use strict";

  var CHAVES = {
    rascunho: "simulacao:draft:v1",
    attr: "attr:v1",
    leads: "leads:v1",
    outbox: "outbox:v1",
    stats: "stats:v1",
    antispam: "antispam:v1",
    ultimo: "simulacao:ultimo:v1",
    consentimento: "consentimento:v1"
  };

  function ler(chave, padrao) {
    try {
      var bruto = global.localStorage.getItem(chave);
      if (bruto == null) { return padrao; }
      return JSON.parse(bruto);
    } catch (e) { return padrao; }
  }

  function gravar(chave, valor) {
    try { global.localStorage.setItem(chave, JSON.stringify(valor)); }
    catch (e) { /* modo privado / cota cheia: o site continua funcionando em memoria */ }
  }

  function remover(chave) {
    try { global.localStorage.removeItem(chave); } catch (e) { }
  }

  function dadosNovos() {
    return {
      vidas: null,
      dependentes: [],        /* ['conjuge','filho','pai_mae','outro'] */
      pessoas: [{ relacao: "titular", faixa: null }],
      cobertura: null,        /* ambulatorial | hosp_sem_obst | hosp_com_obst | indefinida */
      acomodacao: null,       /* enfermaria | apartamento | indiferente */
      rede: null,             /* regional | estadual | nacional | referencia_rio */
      situacaoPlano: null,    /* ativo | cancelei | nunca | sus_particular */
      pagamentoAtual: null,
      operadoraAtual: "",
      motivoCancelamento: [],
      orcamento: null,
      orcamentoAberto: false,
      cidade: "",
      uf: "",
      bairro: "",
      hospitais: [],
      urgencia: null,         /* antes | 30_dias | 2_3_meses | pesquisando */
      contextos: [],
      observacao: "",
      nome: "",
      whatsapp: "",
      email: "",
      melhorHorario: null,    /* manha | tarde | noite | whatsapp */
      consentSensiveis: false,
      consentMarketing: false,
      consentTermos: false,
      pedeLigacao: false,
      linhasIdadesVisiveis: 1
    };
  }

  var memoria = {
    /* rascunho (lido uma unica vez por pagina) */
    existe: false,
    etapa: 0,
    dados: dadosNovos(),
    iniciadoEm: null,
    enviado: false,
    /* estatisticas locais */
    stats: { visits: 0, leads: 0, stepViews: {}, stepCompletes: {}, stepSkips: {}, stepTempoMs: {}, stepAbandons: {} }
  };

  function rascunhoNovo() {
    memoria.existe = true;
    memoria.etapa = 0;
    memoria.dados = dadosNovos();
    memoria.iniciadoEm = null;
    memoria.enviado = false;
    persistir();
  }

  function persistir() {
    gravar(CHAVES.rascunho, {
      v: 1,
      etapa: memoria.etapa,
      dados: memoria.dados,
      iniciadoEm: memoria.iniciadoEm,
      enviado: memoria.enviado,
      atualizadoEm: Date.now()
    });
  }

  function init() {
    var r = ler(CHAVES.rascunho, null);
    if (r && r.v === 1 && r.dados) {
      memoria.existe = true;
      memoria.etapa = typeof r.etapa === "number" ? r.etapa : 0;
      memoria.dados = Object.assign(dadosNovos(), r.dados);
      memoria.iniciadoEm = r.iniciadoEm || null;
      memoria.enviado = !!r.enviado;
    }
    memoria.stats = Object.assign(memoria.stats, ler(CHAVES.stats, memoria.stats));

    /* contagem de visita: 1 por sessao de navegador */
    var sessao = null;
    try { sessao = global.sessionStorage.getItem("visita:contada:v1"); } catch (e) { }
    if (!sessao) {
      memoria.stats.visits = (memoria.stats.visits || 0) + 1;
      gravar(CHAVES.stats, memoria.stats);
      try { global.sessionStorage.setItem("visita:contada:v1", "1"); } catch (e) { }
    }

    capturarAtribuicao();
    return memoria;
  }

  /* ---------- Atribuicao (attr:v1) ---------- */
  /* Na primeira visita grava todos os parametros de campanha, o referrer
     e a URL de entrada; o lead costuma voltar dias depois sem os parametros
     na URL, por isso o bloco salvo e relido no envio. */
  function capturarAtribuicao() {
    var atual = ler(CHAVES.attr, null);
    var params = new URLSearchParams((global.location && global.location.search) || "");
    var temCampanha = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid", "fbclid", "ttclid"]
      .some(function (k) { return params.get(k); });
    if (atual && !temCampanha) { return atual; }

    var nav = global.navigator || {};
    var attr = {
      utm_source: params.get("utm_source") || (atual && atual.utm_source) || "",
      utm_medium: params.get("utm_medium") || (atual && atual.utm_medium) || "",
      utm_campaign: params.get("utm_campaign") || (atual && atual.utm_campaign) || "",
      utm_content: params.get("utm_content") || (atual && atual.utm_content) || "",
      utm_term: params.get("utm_term") || (atual && atual.utm_term) || "",
      gclid: params.get("gclid") || (atual && atual.gclid) || "",
      gbraid: params.get("gbraid") || (atual && atual.gbraid) || "",
      wbraid: params.get("wbraid") || (atual && atual.wbraid) || "",
      fbclid: params.get("fbclid") || (atual && atual.fbclid) || "",
      ttclid: params.get("ttclid") || (atual && atual.ttclid) || "",
      referrer: (atual && atual.referrer) || (global.document && global.document.referrer) || "",
      landingPage: (atual && atual.landingPage) || ((global.location && global.location.pathname + global.location.search) || ""),
      idioma: (nav.language || "pt-BR"),
      tela: ((global.screen && global.screen.width) || 0) + "x" + ((global.screen && global.screen.height) || 0),
      conectividade: (nav.connection && nav.connection.effectiveType) || "desconhecida",
      primeiraVisitaEm: (atual && atual.primeiraVisitaEm) || Validate.isoComFuso(new Date())
    };
    gravar(CHAVES.attr, attr);
    return attr;
  }

  function obterAtribuicao() {
    return capturarAtribuicao();
  }

  /* ---------- Estatisticas locais (painel do corretor) ---------- */
  function statIncrementa(mapa, chave, valor) {
    if (valor === undefined) { valor = 1; }
    mapa[chave] = (mapa[chave] || 0) + valor;
    gravar(CHAVES.stats, memoria.stats);
  }

  function statVisitaEtapa(nomeEtapa) { statIncrementa(memoria.stats.stepViews, nomeEtapa); }
  function statCompletaEtapa(nomeEtapa) { statIncrementa(memoria.stats.stepCompletes, nomeEtapa); }
  function statPulaEtapa(nomeEtapa) { statIncrementa(memoria.stats.stepSkips, nomeEtapa); }
  function statAbandonaEtapa(nomeEtapa) { statIncrementa(memoria.stats.stepAbandons, nomeEtapa); }
  function statTempoEtapa(nomeEtapa, ms) { statIncrementa(memoria.stats.stepTempoMs, nomeEtapa, ms); }
  function statLead() {
    memoria.stats.leads = (memoria.stats.leads || 0) + 1;
    gravar(CHAVES.stats, memoria.stats);
  }

  global.State = {
    CHAVES: CHAVES,
    memoria: memoria,
    init: init,
    persistir: persistir,
    rascunhoNovo: rascunhoNovo,
    dadosNovos: dadosNovos,
    obterAtribuicao: obterAtribuicao,
    statVisitaEtapa: statVisitaEtapa,
    statCompletaEtapa: statCompletaEtapa,
    statPulaEtapa: statPulaEtapa,
    statAbandonaEtapa: statAbandonaEtapa,
    statTempoEtapa: statTempoEtapa,
    statLead: statLead,
    ler: ler,
    gravar: gravar,
    remover: remover
  };
})(typeof window !== "undefined" ? window : globalThis);
