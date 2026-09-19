/* ============================================================
   js/analytics.js - medicao 100% condicionada ao consentimento.
   - Antes do consentimento: Consent Mode NEGADO por padrao e
     NENHUM script de terceiros e inserido no DOM.
   - track(nome, payload): empurra para o dataLayer quando gtag
     existe, chama fbq quando existe e grava abandono com
     navigator.sendBeacon no pagehide. Tudo no-op silencioso
     (sem erro no console) quando o consentimento esta negado.
   - IDs vazios em js/config.js = recurso desligado.
   Namespace global: window.Analytics | window.__reabrirConsentimento()
   ============================================================ */
(function (global) {
  "use strict";

  var C = global.SITE_CONFIG;
  var CHAVE = "consentimento:v1";

  global.dataLayer = global.dataLayer || [];
  if (typeof global.gtag !== "function") {
    global.gtag = function () { global.dataLayer.push(arguments); };
  }

  /* 11.1 - Consent Mode negado por padrao, antes de qualquer script. */
  global.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  var carregados = { ga4: false, pixel: false, clarity: false };
  var consentimento = null;

  function obterConsentimento() {
    if (consentimento) { return consentimento; }
    consentimento = State.ler(CHAVE, null);
    return consentimento;
  }

  function salvarConsentimento(decisao) {
    consentimento = {
      status: decisao.status,               /* 'todos' | 'essencial' | 'custom' */
      medicao: !!decisao.medicao,           /* medicao / analytics */
      anuncios: !!decisao.anuncios,         /* personalizacao de anuncio */
      ts: Validate.isoComFuso(new Date())
    };
    State.gravar(CHAVE, consentimento);
    aplicarConsentimento();
  }

  function aplicarConsentimento() {
    var c = obterConsentimento();
    if (!c) { return; }
    global.gtag("consent", "update", {
      analytics_storage: c.medicao ? "granted" : "denied",
      ad_storage: c.anuncios ? "granted" : "denied",
      ad_user_data: c.anuncios ? "granted" : "denied",
      ad_personalization: c.anuncios ? "granted" : "denied"
    });
    carregarTerceiros();
  }

  /* Insere scripts de terceiros SO depois do consentimento correspondente
     e SO quando a chave existir em js/config.js. Chave vazia = desligado. */
  function carregarTerceiros() {
    var c = obterConsentimento();
    if (!c) { return; }
    if (c.medicao && C.ga4Id && !carregados.ga4) {
      carregados.ga4 = true;
      var s = global.document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4Id);
      global.document.head.appendChild(s);
      global.gtag("js", new Date());
      global.gtag("config", C.ga4Id, { anonymize_ip: true });
    }
    if (c.medicao && C.clarityId && !carregados.clarity) {
      carregados.clarity = true;
      global["clarity"] = global["clarity"] || function () {
        (global.clarity.q = global.clarity.q || []).push(arguments);
      };
      global.clarity.q = global.clarity.q || [];
      var sc = global.document.createElement("script");
      sc.async = true;
      sc.src = "https://www.clarity.ms/tag/" + encodeURIComponent(C.clarityId);
      global.document.head.appendChild(sc);
    }
    if (c.anuncios && C.metaPixelId && !carregados.pixel) {
      carregados.pixel = true;
      if (!global.fbq) {
        var n = global.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      }
      var sp = global.document.createElement("script");
      sp.async = true;
      sp.src = "https://connect.facebook.net/en_US/fbevents.js";
      global.document.head.appendChild(sp);
      global.fbq("init", C.metaPixelId);
    }
  }

  /* ---------- track generico (11.6) ---------- */
  function track(nome, payload) {
    var c = obterConsentimento();
    var p = payload || {};
    /* estatistica local e anonima (alimenta o painel do corretor) */
    registrarEstatisticaLocal(nome, p);
    if (!c || (!c.medicao && !c.anuncios)) { return; } /* no-op silencioso */
    global.dataLayer.push(Object.assign({ event: nome }, p));
    if (typeof global.gtag === "function") { global.gtag("event", nome, p); }
  }

  function registrarEstatisticaLocal(nome, p) {
    if (nome === "step_view" && p.step_name) { State.statVisitaEtapa(p.step_name); }
    if (nome === "step_complete" && p.step_name) {
      State.statCompletaEtapa(p.step_name);
      if (typeof p.tempo_ms === "number") { State.statTempoEtapa(p.step_name, p.tempo_ms); }
    }
    if (nome === "step_skip" && p.step_name) { State.statPulaEtapa(p.step_name); }
  }

  /* 11.4 - Pixel dispara DEPOIS do sucesso, nunca no clique de "comecar". */
  function trackLeadPixel(lead) {
    var c = obterConsentimento();
    if (!c || !c.anuncios || !C.metaPixelId || typeof global.fbq !== "function") { return; }
    global.fbq("track", "Lead", {
      content_name: lead.leadId,
      content_category: "plano_de_saude",
      value: 0,
      currency: "BRL"
    }, { eventID: lead.eventIdMeta });
  }

  /* Abandono de etapa no pagehide: sendBeacon para o webhook do cliente
     (se configurado E consentido) - payload sem dado pessoal. */
  function beaconAbandono(stepName) {
    State.statAbandonaEtapa(stepName);
    track("abandon_etapa", { step_name: stepName });
    var c = obterConsentimento();
    if (c && c.medicao && C.webhookUrl && typeof global.navigator.sendBeacon === "function") {
      try {
        global.navigator.sendBeacon(C.webhookUrl, JSON.stringify({
          evento: "abandon_etapa",
          step_name: stepName,
          ts: Validate.isoComFuso(new Date())
        }));
      } catch (e) { }
    }
  }

  /* ---------- Painel de consentimento (10.2) ---------- */
  var raiz = null;

  function renderBanner() {
    if (raiz) { raiz.innerHTML = ""; }
    raiz = global.document.getElementById("consent-root");
    if (!raiz) { return; }
    var box = global.document.createElement("div");
    box.className = "consent-banner";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Preferências de privacidade e cookies");

    var txt = global.document.createElement("div");
    txt.className = "consent-texto";
    var t1 = global.document.createElement("strong");
    t1.textContent = "Sobre a sua privacidade";
    var t2 = global.document.createElement("p");
    t2.textContent = "Eu uso armazenamento local para guardar o rascunho da sua simulação neste navegador. Ferramentas de medição e anúncios (Google, Meta, Clarity) só entram se você permitir. Nada de dado seu vai para operadora sem o seu OK.";
    txt.appendChild(t1); txt.appendChild(t2);

    var acoes = global.document.createElement("div");
    acoes.className = "consent-acoes";

    function botao(rotulo, classe, aoClicar) {
      var b = global.document.createElement("button");
      b.type = "button";
      b.className = classe;
      b.textContent = rotulo;
      b.addEventListener("click", aoClicar);
      return b;
    }

    var painel = null;
    function alternarPersonalizar() {
      if (painel) { painel.hidden = !painel.hidden; return; }
      painel = global.document.createElement("div");
      painel.className = "consent-personalizar";
      function opcao(rotulo, marcado) {
        var lab = global.document.createElement("label");
        lab.className = "consent-opcao";
        var inp = global.document.createElement("input");
        inp.type = "checkbox";
        inp.checked = !!marcado;
        inp.dataset.papel = rotulo;
        var sp = global.document.createElement("span");
        sp.textContent = rotulo;
        lab.appendChild(inp); lab.appendChild(sp);
        return lab;
      }
      painel.appendChild(opcao("Medição (Google Analytics, Clarity)", false));
      painel.appendChild(opcao("Personalização de anúncios (Meta Pixel)", false));
      var salvar = global.document.createElement("button");
      salvar.type = "button";
      salvar.className = "btn btn-secundario";
      salvar.textContent = "Salvar escolhas";
      salvar.addEventListener("click", function () {
        var checks = painel.querySelectorAll("input[type=checkbox]");
        salvarConsentimento({
          status: "custom",
          medicao: checks[0] && checks[0].checked,
          anuncios: checks[1] && checks[1].checked
        });
        fecharBanner();
      });
      painel.appendChild(salvar);
      box.insertBefore(painel, acoes);
      painel.hidden = false;
    }

    acoes.appendChild(botao("Aceitar", "btn btn-acao", function () {
      salvarConsentimento({ status: "todos", medicao: true, anuncios: true });
      fecharBanner();
    }));
    acoes.appendChild(botao("Somente o necessário", "btn btn-secundario", function () {
      salvarConsentimento({ status: "essencial", medicao: false, anuncios: false });
      fecharBanner();
    }));
    acoes.appendChild(botao("Personalizar", "btn btn-link", alternarPersonalizar));

    box.appendChild(txt);
    box.appendChild(acoes);
    raiz.appendChild(box);
    global.document.body.classList.add("consent-aberto");
  }

  function fecharBanner() {
    global.document.body.classList.remove("consent-aberto");
    if (raiz) { raiz.innerHTML = ""; }
  }

  function reabrirConsentimento() {
    renderBanner();
    var b = raiz && raiz.querySelector("button");
    if (b) { b.focus(); }
  }

  global.__reabrirConsentimento = reabrirConsentimento;

  function init() {
    raiz = global.document.getElementById("consent-root");
    var c = obterConsentimento();
    if (!c) { renderBanner(); } else { carregarTerceiros(); }
  }

  global.Analytics = {
    track: track,
    trackLeadPixel: trackLeadPixel,
    beaconAbandono: beaconAbandono,
    obterConsentimento: obterConsentimento,
    salvarConsentimento: salvarConsentimento,
    reabrirConsentimento: reabrirConsentimento,
    init: init
  };

  if (global.document) {
    var disparar = function () { init(); };
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", disparar);
    } else { disparar(); }
  }
})(typeof window !== "undefined" ? window : globalThis);
