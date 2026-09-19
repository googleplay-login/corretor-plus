/* ============================================================
   js/lead.js - NUCLEO DO PRODUTO: montagem do Lead, score,
   mensagem do WhatsApp, canais de coleta, anti-spam, CSV e
   controladores das paginas painel.html e obrigado.html.
   Namespace global: window.Lead
   ============================================================ */
(function (global) {
  "use strict";

  var C = global.SITE_CONFIG;
  var V = global.Validate;

  /* ---------- rotulos ---------- */
  var ROTULOS = {
    relacao: { titular: "titular", conjuge: "cônjuge", filho: "filho(a)", pai_mae: "pai/mãe", outro: "outro familiar" },
    cobertura: {
      ambulatorial: "Somente ambulatorial (consultas e exames)",
      hosp_sem_obst: "Hospitalar sem obstetrícia",
      hosp_com_obst: "Hospitalar com obstetrícia (cobre parto)",
      indefinida: "Não sei, quero a recomendação"
    },
    acomodacao: { enfermaria: "Enfermaria", apartamento: "Apartamento", indiferente: "Indiferente" },
    rede: {
      regional: "Regional (minha cidade e entorno)",
      estadual: "Estadual (RJ)",
      nacional: "Nacional",
      referencia_rio: "Rede de referência no Rio"
    },
    situacao: {
      ativo: "Já tem plano ativo",
      cancelei: "Tinha e cancelou",
      nunca: "Nunca teve plano",
      sus_particular: "Está no SUS ou paga particular"
    },
    motivo: {
      ficou_caro: "ficou caro",
      rede_fraca: "rede de hospitais fraca",
      demora_autorizacao: "demora para autorizar",
      perdeu_empresa: "perdeu o plano da empresa",
      nao_usava: "não usava",
      outro: "outro motivo"
    },
    urgencia: {
      antes: "O quanto antes",
      "30_dias": "Em até 30 dias",
      "2_3_meses": "Nos próximos 2 a 3 meses",
      pesquisando: "Só está pesquisando"
    },
    horario: { manha: "Manhã", tarde: "Tarde", noite: "Noite", whatsapp: "Só por WhatsApp" }
  };

  var ORDEM_FAIXAS = ["0-18", "19-23", "24-28", "29-33", "34-38", "39-43", "44-48", "49-53", "54-58", "59+"];

  /* ---------- leadId: SIM-YYYYMMDD-XXXX ---------- */
  function gerarLeadId() {
    var data = V.isoComFuso(new Date()).slice(0, 10).replace(/-/g, "");
    var sufixo;
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      sufixo = global.crypto.randomUUID().replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
    } else {
      sufixo = V.gerarIdAleatorio(4);
    }
    return "SIM-" + data + "-" + sufixo;
  }

  /* ---------- encaixe de orcamento (interno, nunca exibido como preco) ---------- */
  function faixaMaxima(pessoas) {
    var max = null;
    (pessoas || []).forEach(function (p) {
      if (!p.faixa) { return; }
      if (max === null || ORDEM_FAIXAS.indexOf(p.faixa) > ORDEM_FAIXAS.indexOf(max)) { max = p.faixa; }
    });
    return max;
  }

  function calcularEncaixe(dados) {
    if (dados.orcamentoAberto || dados.orcamento === null) { return "nao_avaliado"; }
    var fm = faixaMaxima(dados.pessoas);
    var piso = fm && global.DATA_MERCADO.pisoPorFaixa[fm];
    if (!piso) { return "nao_avaliado"; } /* idades "a informar" */
    var o = Number(dados.orcamento);
    if (o >= piso) { return "bom"; }
    if (o >= piso * global.DATA_MERCADO.pctApertado) { return "apertado"; }
    return "fora";
  }

  /* ---------- score interno (jamais mostrado ao lead) ---------- */
  function calcularScore(dados, encaixe) {
    var motivos = [];
    var c = false, b = false, a = false;

    if (dados.urgencia === "pesquisando") {
      c = true; motivos.push("urgência: só pesquisando");
    }
    if (encaixe === "fora") {
      c = true; motivos.push("orçamento abaixo da referência de mercado");
    }
    var todasInformadas = (dados.pessoas || []).length > 0 && (dados.pessoas || []).every(function (p) { return !!p.faixa; });
    if (!todasInformadas) {
      c = true; motivos.push("idades a informar");
    }

    if (dados.urgencia === "2_3_meses") {
      b = true; motivos.push("urgência: 2 a 3 meses");
    }
    if (encaixe === "apertado") {
      b = true; motivos.push("orçamento apertado para a faixa etária");
    }
    if (dados.situacaoPlano === "cancelei") {
      b = true; motivos.push("plano anterior cancelado");
    }
    if (!dados.urgencia) {
      b = true; motivos.push("urgência não informada");
    }

    if ((dados.urgencia === "antes" || dados.urgencia === "30_dias") && (encaixe === "bom" || encaixe === "nao_avaliado")) {
      a = true; motivos.push("urgência alta com orçamento compatível");
    }

    var score = c ? "C" : (b ? "B" : (a ? "A" : "B"));
    if (!motivos.length) { motivos.push("sem sinais de alerta"); }
    return { score: score, motivos: motivos };
  }

  /* ---------- Lead (modelo do item 8) ---------- */
  function construir(dados) {
    var attr = State.obterAtribuicao();
    var agora = new Date();
    var encaixe = calcularEncaixe(dados);
    var sc = calcularScore(dados, encaixe);
    var eventIdMeta = (global.crypto && typeof global.crypto.randomUUID === "function")
      ? global.crypto.randomUUID() : "evt-" + V.gerarIdAleatorio(12);
    var obsRedigida = V.redigirObservacao(dados.observacao);

    return {
      leadId: gerarLeadId(),
      criadoEm: V.isoComFuso(agora),
      nome: (dados.nome || "").trim(),
      whatsappNormalizado: (V.validarTelefone(dados.whatsapp).ok ? V.validarTelefone(dados.whatsapp).normalizado : ""),
      whatsappFormatado: (V.validarTelefone(dados.whatsapp).ok ? V.validarTelefone(dados.whatsapp).formatado : ""),
      email: (dados.email || "").trim(),
      melhorHorario: dados.melhorHorario ? ROTULOS.horario[dados.melhorHorario] : null,
      cidade: (dados.cidade || "").trim(),
      uf: (dados.uf || "").trim(),
      bairro: (dados.bairro || "").trim(),
      vidas: dados.vidas || (dados.pessoas || []).length || 1,
      pessoas: (dados.pessoas || []).map(function (p) { return { relacao: p.relacao, faixa: p.faixa }; }),
      cobertura: dados.cobertura,
      acomodacao: dados.acomodacao,
      rede: dados.rede,
      situacaoPlano: dados.situacaoPlano,
      operadoraAtual: (dados.operadoraAtual || "").trim(),
      pagamentoAtual: typeof dados.pagamentoAtual === "number" ? dados.pagamentoAtual : null,
      motivoCancelamento: (dados.motivoCancelamento || []).slice(0),
      orcamento: dados.orcamentoAberto ? null : (typeof dados.orcamento === "number" ? dados.orcamento : null),
      orcamentoAberto: !!dados.orcamentoAberto,
      encaixeOrcamento: encaixe,
      hospitaisPreferidos: (dados.hospitais || []).slice(0),
      urgencia: dados.urgencia,
      contextos: (dados.contextos || []).slice(0),
      observacaoNaoSensivel: obsRedigida,
      score: sc.score,
      scoreMotivos: sc.motivos,
      consentimentos: {
        dadosSensiveis: !!dados.consentSensiveis,
        marketing: !!dados.consentMarketing,
        termos: !!dados.consentTermos,
        ts: V.isoComFuso(agora)
      },
      atribuicao: {
        utm_source: attr.utm_source || "", utm_medium: attr.utm_medium || "",
        utm_campaign: attr.utm_campaign || "", utm_content: attr.utm_content || "",
        utm_term: attr.utm_term || "", gclid: attr.gclid || "", gbraid: attr.gbraid || "",
        wbraid: attr.wbraid || "", fbclid: attr.fbclid || "", ttclid: attr.ttclid || "",
        referrer: attr.referrer || "", landingPage: attr.landingPage || "",
        idioma: attr.idioma || "pt-BR", tela: attr.tela || "", conectividade: attr.conectividade || ""
      },
      tempoSegundos: State.memoria.iniciadoEm ? Math.max(1, Math.round((Date.now() - State.memoria.iniciadoEm) / 1000)) : 0,
      passosVisualizados: Math.max(1, State.memoria.etapa + 1),
      tipoTelefone: V.validarTelefone(dados.whatsapp).ok ? V.validarTelefone(dados.whatsapp).tipo : null,
      faixaMaxima: faixaMaxima(dados.pessoas), /* uso interno do corretor / painel */
      eventIdMeta: eventIdMeta,                 /* deduplicacao futura com Conversions API (item 11.4) */
      pedeLigacao: !!dados.pedeLigacao
    };
  }

  /* ---------- mensagem do WhatsApp (item 9) ---------- */
  var LIMITE_MENSAGEM = 900;

  function linhaPessoas(lead) {
    var partes = (lead.pessoas || []).map(function (p) {
      return ROTULOS.relacao[p.relacao] + " " + (p.faixa || "a informar");
    });
    return "👥 " + lead.vidas + " pessoa(s): " + partes.join(", ");
  }

  function linhaCobertura(lead) {
    var partes = [];
    if (lead.cobertura) { partes.push(ROTULOS.cobertura[lead.cobertura] || lead.cobertura); }
    if (lead.acomodacao) { partes.push(ROTULOS.acomodacao[lead.acomodacao] || lead.acomodacao); }
    if (lead.rede) { partes.push(ROTULOS.rede[lead.rede] || lead.rede); }
    if (!partes.length) { partes.push("a definir com o Carlos"); }
    return "🏥 " + partes.join(" · ");
  }

  function linhaHoje(lead) {
    if (!lead.situacaoPlano) { return null; }
    var partes = [ROTULOS.situacao[lead.situacaoPlano] || lead.situacaoPlano];
    if (lead.situacaoPlano === "ativo" && lead.operadoraAtual) { partes.push(lead.operadoraAtual); }
    if (typeof lead.pagamentoAtual === "number") { partes.push("paga " + V.formatarBRL(lead.pagamentoAtual) + "/mês"); }
    if (lead.motivoCancelamento && lead.motivoCancelamento.length) {
      var ms = lead.motivoCancelamento.map(function (m) { return ROTULOS.motivo[m] || m; });
      partes.push("motivo: " + ms.join(", "));
    }
    return "🔁 Hoje: " + partes.join(" · ");
  }

  /* Constroi as linhas na ordem do template (item 9.2), com prioridade de descarte:
     observacao -> melhorHorario -> hospitais -> linha 'Hoje'. */
  function construirLinhas(lead) {
    var linhas = [];
    linhas.push({ chave: "saudacao", descartavel: false, texto: "Olá, Carlos! Fiz a simulação no site e quero minha proposta. Nº " + lead.leadId });
    linhas.push({ chave: "identificacao", descartavel: false, texto: "🙋 " + lead.nome + " — " + lead.whatsappFormatado });
    linhas.push({ chave: "pessoas", descartavel: false, texto: linhaPessoas(lead) });
    linhas.push({ chave: "cobertura", descartavel: false, texto: linhaCobertura(lead) });
    var local = "📍 " + lead.cidade + "/" + lead.uf + (lead.bairro ? " · " + lead.bairro : "");
    linhas.push({ chave: "cidade", descartavel: false, texto: local });
    if (lead.hospitaisPreferidos && lead.hospitaisPreferidos.length) {
      linhas.push({ chave: "hospitais", descartavel: true, texto: "🏢 Hospitais: " + lead.hospitaisPreferidos.join(", ") });
    }
    var hoje = linhaHoje(lead);
    if (hoje) { linhas.push({ chave: "hoje", descartavel: true, texto: hoje }); }
    linhas.push({
      chave: "orcamento", descartavel: false,
      texto: "💰 Consigo pagar: " + (lead.orcamentoAberto || lead.orcamento === null ? "sem limite definido" : "até " + V.formatarBRL(lead.orcamento) + "/mês")
    });
    if (lead.urgencia) {
      linhas.push({ chave: "quando", descartavel: false, texto: "⏱ Quando: " + (ROTULOS.urgencia[lead.urgencia] || lead.urgencia) });
    }
    if (lead.melhorHorario) {
      linhas.push({ chave: "horario", descartavel: true, texto: "📞 " + lead.melhorHorario });
    }
    if (lead.pedeLigacao) {
      linhas.push({ chave: "ligacao", descartavel: false, texto: "☎️ Pede ligação" });
    }
    if (lead.observacaoNaoSensivel) {
      linhas.push({ chave: "observacao", descartavel: true, texto: "📝 " + lead.observacaoNaoSensivel });
    }
    return linhas;
  }

  /* Corta por linha, de baixo para cima, se estourar 900 caracteres
     (contados por Array.from), preservando nome/telefone, idades,
     cidade e leadId. */
  function montarMensagem(lead) {
    var linhas = construirLinhas(lead);
    function total(arr) { return V.contarCaracteres(arr.map(function (l) { return l.texto; }).join("\n")); }
    var ordemDescarte = ["observacao", "horario", "hospitais", "hoje"];
    ordemDescarte.forEach(function (chave) {
      while (total(linhas) > LIMITE_MENSAGEM) {
        var idx = -1;
        for (var i = linhas.length - 1; i >= 0; i--) {
          if (linhas[i].chave === chave) { idx = i; break; }
        }
        if (idx === -1) { break; }
        linhas.splice(idx, 1);
      }
    });
    return linhas.map(function (l) { return l.texto; }).join("\n");
  }

  function linkWhatsapp(mensagem) {
    var numero = String(C.whatsapp).replace(/\D/g, "");
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
  }

  /* ---------- copia espelho (9.3) ---------- */
  function copiaEspelho(lead) {
    var pessoas = (lead.pessoas || []).map(function (p) {
      return ROTULOS.relacao[p.relacao] + " " + (p.faixa || "?");
    }).join(", ");
    var hoje = linhaHoje(lead) ? linhaHoje(lead).replace("🔁 Hoje: ", "") : "não informado";
    var orc = lead.orcamentoAberto ? "aberto" : (lead.orcamento != null ? V.formatarBRL(lead.orcamento) : "não informado");
    return "LEAD " + lead.leadId + " · " + lead.score + " · " + lead.criadoEm
      + " / " + lead.nome + " - " + lead.whatsappFormatado + " - " + (lead.email || "sem e-mail")
      + " / PESSOAS: " + pessoas
      + " / HOJE: " + hoje
      + " / ORÇAMENTO: " + orc
      + " / ENCAIXE: " + lead.encaixeOrcamento
      + " / ATRIBUIÇÃO: " + (lead.atribuicao.utm_source || "direto") + "/" + (lead.atribuicao.utm_medium || "n/a") + "/" + (lead.atribuicao.utm_campaign || "n/a")
      + " / TEMPO: " + lead.tempoSegundos + "s em " + lead.passosVisualizados + " passos";
  }

  /* ---------- anti-spam local (sem dependencia externa) ---------- */
  function hashEnvio(lead) {
    var base = [lead.nome, lead.whatsappNormalizado, lead.cidade, lead.uf, lead.vidas, lead.orcamento, lead.urgencia].join("|");
    var h = 5381;
    for (var i = 0; i < base.length; i++) { h = ((h << 5) + h + base.charCodeAt(i)) | 0; }
    return "h" + (h >>> 0).toString(36);
  }

  /* pure: recebe registros [{h, ts}], o hash e o agora; diz se o envio passa. */
  function verificarSpam(registros, hash, agora, inicioSimulacao) {
    var limite = 10 * 60 * 1000;
    var recentes = (registros || []).filter(function (r) { return agora - r.ts < limite; });
    var iguais = recentes.filter(function (r) { return r.h === hash; }).length;
    if (iguais >= 3) { return { ok: false, motivo: "repetido" }; }
    if (typeof inicioSimulacao === "number" && agora - inicioSimulacao < 12000) {
      return { ok: false, motivo: "rapido" };
    }
    return { ok: true, motivo: null };
  }

  function registrarEnvio(hash, agora) {
    var registros = State.ler(State.CHAVES.antispam, []);
    registros.push({ h: hash, ts: agora });
    registros = registros.filter(function (r) { return agora - r.ts < 10 * 60 * 1000; });
    State.gravar(State.CHAVES.antispam, registros);
  }

  /* ---------- canais de coleta (9.4) ---------- */
  function salvarLocal(lead) {
    var leads = State.ler(State.CHAVES.leads, []);
    leads.push(lead);
    while (leads.length > 50) { leads.shift(); } /* guarda ate 50 leads */
    State.gravar(State.CHAVES.leads, leads);
    State.statLead();
  }

  function postWebhook(lead, tentativa) {
    if (!C.webhookUrl) { return; } /* modo sem webhook: nenhuma requisicao, nenhum erro */
    tentativa = tentativa || 0;
    var esperas = [0, 2000, 6000, 18000];
    var atraso = esperas[tentativa];
    global.setTimeout(function () {
      global.fetch(C.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }).then(function (resp) {
        if (!resp.ok) { throw new Error("webhook " + resp.status); }
      }).catch(function () {
        if (tentativa < 3) { postWebhook(lead, tentativa + 1); }
        else {
          var outbox = State.ler(State.CHAVES.outbox, []);
          outbox.push({ lead: lead, ts: Date.now() });
          State.gravar(State.CHAVES.outbox, outbox);
        }
      });
    }, atraso);
  }

  function esvaziarOutbox() {
    if (!C.webhookUrl) { return; }
    var outbox = State.ler(State.CHAVES.outbox, []);
    if (!outbox.length) { return; }
    var restantes = [];
    var promessas = outbox.map(function (item) {
      return global.fetch(C.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.lead)
      }).then(function (resp) {
        if (!resp.ok) { restantes.push(item); }
      }).catch(function () { restantes.push(item); });
    });
    global.Promise.all(promessas).then(function () {
      State.gravar(State.CHAVES.outbox, restantes);
    }).catch(function () { });
  }

  /* ---------- area de transferencia ---------- */
  function copiarTexto(texto) {
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(texto);
    }
    return new global.Promise(function (resolve, reject) {
      try {
        var ta = global.document.createElement("textarea");
        ta.value = texto;
        ta.setAttribute("readonly", "readonly");
        ta.className = "sr-only";
        global.document.body.appendChild(ta);
        ta.select();
        global.document.execCommand("copy");
        global.document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  /* ---------- CSV (9.4.2): BOM + protecao contra formula injection ---------- */
  var COLUNAS_CSV = ["leadId", "criadoEm", "score", "nome", "whatsappFormatado", "whatsappNormalizado", "email",
    "melhorHorario", "uf", "cidade", "bairro", "vidas", "pessoas", "cobertura", "acomodacao", "rede",
    "situacaoPlano", "operadoraAtual", "pagamentoAtual", "motivoCancelamento", "orcamento", "orcamentoAberto",
    "encaixeOrcamento", "hospitaisPreferidos", "urgencia", "contextos", "observacaoNaoSensivel", "tipoTelefone",
    "tempoSegundos", "passosVisualizados", "faixaMaxima", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "gclid", "fbclid", "referrer", "landingPage"];

  function valorCsv(lead, coluna) {
    var v = lead[coluna];
    if (coluna === "pessoas") {
      return (lead.pessoas || []).map(function (p) { return p.relacao + ":" + (p.faixa || "?"); }).join(" | ");
    }
    if (Array.isArray(v)) { return v.join(" | "); }
    if (v === null || v === undefined) { return ""; }
    return String(v);
  }

  function gerarCsv(leads) {
    var linhas = [COLUNAS_CSV.map(function (c) { return V.guardarCsv(c); }).join(",")];
    (leads || []).forEach(function (lead) {
      linhas.push(COLUNAS_CSV.map(function (c) { return V.guardarCsv(valorCsv(lead, c)); }).join(","));
    });
    return "\uFEFF" + linhas.join("\r\n"); /* BOM para o Excel respeitar acentos */
  }

  /* ============================================================
     PAGINA: painel.html
     ============================================================ */
  function initPainel() {
    var corpo = global.document.getElementById("painel-conteudo");
    var gate = global.document.getElementById("painel-gate");
    if (!corpo || !gate) { return; }

    if (!C.painelSenhaSha256) {
      gate.hidden = true;
      corpo.innerHTML = "";
      var aviso = global.document.createElement("div");
      aviso.className = "aviso-painel";
      var h = global.document.createElement("h2");
      h.textContent = "Painel desativado";
      var p = global.document.createElement("p");
      p.textContent = "Para ativar o painel neste navegador, preencha painelSenhaSha256 em js/config.js com o hash SHA-256 de uma senha (veja o passo a passo no README). Enquanto estiver vazio, os leads continuam sendo guardados no localStorage do navegador, mas não aparecem aqui.";
      aviso.appendChild(h); aviso.appendChild(p);
      corpo.appendChild(aviso);
      return;
    }

    var okSessao = null;
    try { okSessao = global.sessionStorage.getItem("painel:ok:v1"); } catch (e) { }
    if (okSessao === "1") { renderPainel(); return; }

    gate.hidden = false;
    var form = global.document.getElementById("painel-form");
    var campo = global.document.getElementById("painel-senha");
    var erro = global.document.getElementById("painel-erro");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        V.sha256Hex(campo.value).then(function (hash) {
          if (hash === C.painelSenhaSha256) {
            try { global.sessionStorage.setItem("painel:ok:v1", "1"); } catch (e) { }
            erro.hidden = true;
            gate.hidden = true;
            renderPainel();
          } else {
            erro.hidden = false;
            erro.textContent = "Senha incorreta.";
            campo.value = "";
            campo.focus();
          }
        });
      });
    }
  }

  function renderPainel() {
    var corpo = global.document.getElementById("painel-conteudo");
    corpo.innerHTML = "";
    var leads = State.ler(State.CHAVES.leads, []);
    var stats = State.memoria.stats;

    /* metricas (11.7) */
    var metricas = global.document.createElement("section");
    metricas.className = "painel-metricas";
    var taxa = stats.visits ? Math.round(((stats.leads || 0) / stats.visits) * 100) : 0;
    function card(titulo, valor) {
      var d = global.document.createElement("div");
      d.className = "metrica";
      var h3 = global.document.createElement("h3");
      h3.textContent = titulo;
      var p = global.document.createElement("p");
      p.className = "metrica-valor";
      p.textContent = valor;
      d.appendChild(h3); d.appendChild(p);
      return d;
    }
    metricas.appendChild(card("Visitas (este navegador)", String(stats.visits || 0)));
    metricas.appendChild(card("Leads enviados", String(stats.leads || 0)));
    metricas.appendChild(card("Visita → lead", taxa + "%"));

    var etapas = ["Abertura", "Quem vai usar", "Idades", "Cobertura", "Situação atual", "Orçamento", "Cidade e hospitais", "Urgência e contexto", "Contato"];
    var detalheEtapas = global.document.createElement("div");
    detalheEtapas.className = "painel-etapas";
    var hE = global.document.createElement("h3");
    hE.textContent = "Funil por etapa";
    detalheEtapas.appendChild(hE);
    var ulE = global.document.createElement("ul");
    etapas.forEach(function (nome) {
      var views = (stats.stepViews && stats.stepViews[nome]) || 0;
      var comp = (stats.stepCompletes && stats.stepCompletes[nome]) || 0;
      var skips = (stats.stepSkips && stats.stepSkips[nome]) || 0;
      var tempo = views ? Math.round(((stats.stepTempoMs && stats.stepTempoMs[nome]) || 0) / Math.max(1, comp)) : 0;
      var queda = views ? Math.round(((views - comp) / views) * 100) : 0;
      var pulo = views ? Math.round((skips / views) * 100) : 0;
      var li = global.document.createElement("li");
      li.textContent = nome + " · " + views + " visualizações · " + queda + "% de queda · " + pulo + "% pulos · média " + tempo + "ms";
      ulE.appendChild(li);
    });
    detalheEtapas.appendChild(ulE);
    metricas.appendChild(detalheEtapas);

    /* distribuicoes */
    function distribuicao(titulo, extrator) {
      var contagem = {};
      leads.forEach(function (l) {
        var k = extrator(l) || "—";
        contagem[k] = (contagem[k] || 0) + 1;
      });
      var wrap = global.document.createElement("div");
      wrap.className = "painel-dist";
      var h = global.document.createElement("h3");
      h.textContent = titulo;
      var ul = global.document.createElement("ul");
      Object.keys(contagem).sort(function (a, b) { return contagem[b] - contagem[a]; }).forEach(function (k) {
        var li = global.document.createElement("li");
        li.textContent = k + ": " + contagem[k];
        ul.appendChild(li);
      });
      if (!Object.keys(contagem).length) {
        var li = global.document.createElement("li");
        li.textContent = "sem leads ainda";
        ul.appendChild(li);
      }
      wrap.appendChild(h); wrap.appendChild(ul);
      return wrap;
    }
    metricas.appendChild(distribuicao("Leads por cidade", function (l) { return l.cidade + "/" + l.uf; }));
    metricas.appendChild(distribuicao("Leads por faixa etária máxima", function (l) { return l.faixaMaxima; }));
    metricas.appendChild(distribuicao("Leads por origem (utm_source)", function (l) { return l.atribuicao.utm_source || "direto"; }));
    corpo.appendChild(metricas);

    /* busca + tabela */
    var barra = global.document.createElement("div");
    barra.className = "painel-barra";
    var busca = global.document.createElement("input");
    busca.type = "search";
    busca.id = "painel-busca";
    busca.className = "campo-texto";
    busca.placeholder = "Buscar por nome, WhatsApp, cidade, lead…";
    busca.setAttribute("aria-label", "Buscar leads");
    var btnCsv = global.document.createElement("button");
    btnCsv.type = "button";
    btnCsv.className = "btn btn-secundario";
    btnCsv.textContent = "Exportar CSV";
    var btnApagar = global.document.createElement("button");
    btnApagar.type = "button";
    btnApagar.className = "btn btn-perigo";
    btnApagar.textContent = "Apagar todos";
    barra.appendChild(busca); barra.appendChild(btnCsv); barra.appendChild(btnApagar);
    corpo.appendChild(barra);

    var tabelaWrap = global.document.createElement("div");
    tabelaWrap.className = "painel-tabela";
    var tabela = global.document.createElement("table");
    var thead = global.document.createElement("thead");
    var trh = global.document.createElement("tr");
    ["Quando", "Lead", "Nome", "WhatsApp", "Cidade", "Vidas", "Score", "Origem", "Detalhes", ""].forEach(function (t) {
      var th = global.document.createElement("th");
      th.scope = "col";
      th.textContent = t;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    var tbody = global.document.createElement("tbody");
    tabela.appendChild(thead); tabela.appendChild(tbody);
    tabelaWrap.appendChild(tabela);
    corpo.appendChild(tabelaWrap);

    var vazia = global.document.createElement("p");
    vazia.className = "painel-vazio";
    vazia.textContent = "Nenhum lead guardado neste navegador ainda.";
    corpo.appendChild(vazia);

    var filtroAtual = "";
    function desenhar() {
      tbody.innerHTML = "";
      var visiveis = leads.filter(function (l) {
        if (!filtroAtual) { return true; }
        var alvo = [l.leadId, l.nome, l.whatsappFormatado, l.cidade, l.uf, l.email].join(" ").toLowerCase();
        return alvo.indexOf(filtroAtual) !== -1;
      });
      vazia.hidden = visiveis.length > 0;
      visiveis.forEach(function (l) {
        var tr = global.document.createElement("tr");
        function td(txt) {
          var t = global.document.createElement("td");
          t.textContent = txt == null ? "" : String(txt);
          return t;
        }
        tr.appendChild(td(V.dataHoraCurta(l.criadoEm)));
        tr.appendChild(td(l.leadId));
        tr.appendChild(td(l.nome));
        tr.appendChild(td(l.whatsappFormatado));
        tr.appendChild(td(l.cidade + "/" + l.uf));
        tr.appendChild(td(l.vidas));
        tr.appendChild(td(l.score));
        tr.appendChild(td(l.atribuicao.utm_source || "direto"));

        var tdDet = global.document.createElement("td");
        var det = global.document.createElement("details");
        var sum = global.document.createElement("summary");
        sum.textContent = "Ver";
        var pre = global.document.createElement("pre");
        pre.textContent = copiaEspelho(l) + "\n\n" + copiaEspelhoDetalhado(l);
        det.appendChild(sum); det.appendChild(pre);
        tdDet.appendChild(det);
        tr.appendChild(tdDet);

        var tdAcao = global.document.createElement("td");
        var bDel = global.document.createElement("button");
        bDel.type = "button";
        bDel.className = "btn btn-perigo btn-sm";
        bDel.textContent = "Apagar";
        bDel.setAttribute("aria-label", "Apagar lead " + l.leadId);
        bDel.addEventListener("click", function () {
          if (!global.confirm("Apagar o lead " + l.leadId + " deste navegador?")) { return; }
          leads = leads.filter(function (x) { return x.leadId !== l.leadId; });
          State.gravar(State.CHAVES.leads, leads);
          desenhar();
        });
        tdAcao.appendChild(bDel);
        tr.appendChild(tdAcao);
        tbody.appendChild(tr);
      });
    }

    function copiaEspelhoDetalhado(l) {
      return "COBERTURA: " + (l.cobertura || "—") + " / ACOMODAÇÃO: " + (l.acomodacao || "—") + " / REDE: " + (l.rede || "—")
        + "\nHOSPITAIS: " + (l.hospitaisPreferidos.join(", ") || "sem preferência")
        + "\nURGÊNCIA: " + (l.urgencia || "—") + " / HORÁRIO: " + (l.melhorHorario || "—")
        + "\nCONTEXTO: " + (l.contextos.join(", ") || "—")
        + "\nOBS.: " + (l.observacaoNaoSensivel || "—")
        + "\nMOTIVOS SCORE: " + l.scoreMotivos.join("; ")
        + "\nENCAIXE: " + l.encaixeOrcamento + (l.orcamentoAberto ? " (orçamento aberto)" : "");
    }

    busca.addEventListener("input", function () {
      filtroAtual = busca.value.trim().toLowerCase();
      desenhar();
    });

    btnCsv.addEventListener("click", function () {
      if (!leads.length) { global.alert("Não há leads para exportar ainda."); return; }
      var blob = new Blob([gerarCsv(leads)], { type: "text/csv;charset=utf-8" });
      var a = global.document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "leads-carlos-consultor-" + V.isoComFuso(new Date()).slice(0, 10) + ".csv";
      global.document.body.appendChild(a);
      a.click();
      global.document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });

    btnApagar.addEventListener("click", function () {
      if (!leads.length) { global.alert("Não há leads para apagar."); return; }
      if (!global.confirm("Apagar TODOS os " + leads.length + " leads guardados neste navegador? Isso não pode ser desfeito.")) { return; }
      leads = [];
      State.gravar(State.CHAVES.leads, leads);
      desenhar();
    });

    desenhar();
  }

  /* ============================================================
     PAGINA: obrigado.html
     ============================================================ */
  function initObrigado() {
    var alvo = global.document.getElementById("obrigado-dinamico");
    if (!alvo) { return; }
    var ultimo = State.ler(State.CHAVES.ultimo, null);
    var titulo = global.document.getElementById("obrigado-titulo");
    if (!ultimo) {
      if (titulo) { titulo.textContent = "Sua simulação não foi encontrada neste navegador"; }
      var p = global.document.createElement("p");
      p.textContent = "Se você fechou a página antes de enviar, sem problema: refaz a simulação em 1 minuto, ou me chama direto no WhatsApp.";
      alvo.appendChild(p);
      return;
    }
    var p1 = global.document.createElement("p");
    p1.className = "obrigado-frase";
    p1.textContent = "Sua simulação " + ultimo.leadId + " está pronta. Falta só 1 clique: toque no botão abaixo para abrir o WhatsApp com o resumo já escrito — é só apertar enviar.";
    alvo.appendChild(p1);

    var box = global.document.createElement("div");
    box.className = "obrigado-acoes";
    var a = global.document.createElement("a");
    a.href = ultimo.waUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "btn btn-acao";
    a.textContent = "Abrir o WhatsApp e enviar";
    box.appendChild(a);

    var btnCopiar = global.document.createElement("button");
    btnCopiar.type = "button";
    btnCopiar.className = "btn btn-secundario";
    btnCopiar.textContent = "Copiar resumo";
    btnCopiar.addEventListener("click", function () {
      copiarTexto(ultimo.espelho).then(function () {
        btnCopiar.textContent = "Resumo copiado ✓";
        Analytics.track("copied_summary", { origem: "obrigado" });
        global.setTimeout(function () { btnCopiar.textContent = "Copiar resumo"; }, 2500);
      });
    });
    box.appendChild(btnCopiar);
    alvo.appendChild(box);

    var passos = global.document.createElement("ol");
    passos.className = "obrigado-passos";
    [
      "Você aperta enviar no WhatsApp com o resumo da simulação.",
      "Eu (Carlos) comparo as operadoras que atendem a sua cidade e a sua faixa de idade.",
      "Em " + (C.prazoResposta || "1 dia útil") + ", dentro do horário comercial (" + C.horario + "), eu te mando as condições.",
      "Você decide com calma. Nada é automático e nada é cobrado de você."
    ].forEach(function (t) {
      var li = global.document.createElement("li");
      li.textContent = t;
      passos.appendChild(li);
    });
    alvo.appendChild(passos);

    var aviso = global.document.createElement("p");
    aviso.className = "obrigado-aviso";
    aviso.textContent = "Carlos Consultor é corretor/consultor de planos de saúde. Não somos operadora de plano de saúde; valores, redes e condições dependem de análise de perfil e da tabela vigente de cada operadora.";
    alvo.appendChild(aviso);
  }

  global.Lead = {
    ROTULOS: ROTULOS,
    ORDEM_FAIXAS: ORDEM_FAIXAS,
    LIMITE_MENSAGEM: LIMITE_MENSAGEM,
    gerarLeadId: gerarLeadId,
    faixaMaxima: faixaMaxima,
    calcularEncaixe: calcularEncaixe,
    calcularScore: calcularScore,
    construir: construir,
    montarMensagem: montarMensagem,
    construirLinhas: construirLinhas,
    linkWhatsapp: linkWhatsapp,
    copiaEspelho: copiaEspelho,
    hashEnvio: hashEnvio,
    verificarSpam: verificarSpam,
    registrarEnvio: registrarEnvio,
    salvarLocal: salvarLocal,
    postWebhook: postWebhook,
    esvaziarOutbox: esvaziarOutbox,
    copiarTexto: copiarTexto,
    gerarCsv: gerarCsv,
    initPainel: initPainel,
    initObrigado: initObrigado
  };
})(typeof window !== "undefined" ? window : globalThis);
