/* ============================================================
   js/wizard.js - motor do wizard de simulacao (9 telas),
   overlay de tela cheia no index, pagina propria no
   simulacao.html, e "cola" comum de todas as paginas
   (selo condicional, operadoras, links de WhatsApp, CTAs).
   Namespace global: window.Wizard
   ============================================================ */
(function (global) {
  "use strict";

  var C = global.SITE_CONFIG;
  var V = global.Validate;
  var S = global.State;
  var L = global.Lead;
  var A = global.Analytics;
  var D = global.document;

  var TOTAL_ETAPAS = 9;

  var FAIXAS = ["0-18", "19-23", "24-28", "29-33", "34-38", "39-43", "44-48", "49-53", "54-58", "59+"];

  var ETAPAS = [
    { id: "abertura", nome: "Abertura", pulavel: false, pergunta: "Faça sua simulação e descubra sua condição em até 1 dia útil" },
    { id: "quem", nome: "Quem vai usar", pulavel: false, pergunta: "Quantas pessoas vão usar o plano?" },
    { id: "idades", nome: "Idades", pulavel: false, pergunta: "Qual a faixa de idade de cada pessoa?" },
    { id: "cobertura", nome: "Cobertura", pulavel: true, pergunta: "Como você quer usar o plano?" },
    { id: "situacao", nome: "Situação atual", pulavel: true, pergunta: "Você já tem plano de saúde hoje?" },
    { id: "orcamento", nome: "Orçamento", pulavel: true, pergunta: "Quanto você consegue pagar por mês, no total, sem aperto?" },
    { id: "cidade", nome: "Cidade e hospitais", pulavel: false, pergunta: "Em que cidade você mora?" },
    { id: "urgencia", nome: "Urgência e contexto", pulavel: true, pergunta: "Quando você quer estar com o plano ativo?" },
    { id: "contato", nome: "Contato", pulavel: false, pergunta: "Para onde eu mando sua proposta?" }
  ];

  var CONTEXTO_OPCOES = [
    { v: "vou_trocar", t: "Vou trocar de plano" },
    { v: "plano_empresa_acaba", t: "Plano da empresa vai acabar" },
    { v: "mei_cnpj", t: "Sou MEI ou tenho CNPJ" },
    { v: "familiar_idade_avancada", t: "Quero incluir familiar com idade avançada" },
    { v: "gestante", t: "Estou gestante" },
    { v: "rede_rio", t: "Preciso de rede no Rio" },
    { v: "sem_preferencia", t: "Não tenho preferência" }
  ];

  var RELACAO_OPCOES = [
    { v: "conjuge", t: "Cônjuge/companheiro(a)" },
    { v: "filho", t: "Filho(a)" },
    { v: "pai_mae", t: "Pai/Mãe" },
    { v: "outro", t: "Outro familiar" }
  ];

  /* ---------- estado do wizard em memoria ---------- */
  var w = {
    aberto: false,
    modo: "overlay",        /* overlay | pagina */
    etapa: 0,
    faseContato: "form",    /* form | resumo */
    leadAtual: null,
    iniciadoEmEtapa: 0,
    openger: null,          /* botao que abriu o overlay */
    scrollAntes: 0,
    turnstilePronto: false,
    turnstileToken: "",
    enviando: false
  };

  /* ---------- utilidades de DOM ---------- */
  function el(tag, attrs, kids) {
    var n = D.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { return; }
        if (k === "class") { n.className = v; }
        else if (k === "text") { n.textContent = v; }
        else if (k === "html") { n.innerHTML = v; } /* somente strings estaticas nossas (SVG) */
        else if (k.slice(0, 2) === "on") { n.addEventListener(k.slice(2), v); }
        else { n.setAttribute(k, v === true ? "" : v); }
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) { return; }
      n.appendChild(typeof c === "string" ? D.createTextNode(c) : c);
    });
    return n;
  }

  var ICONES = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>',
    comparar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 6h6z"/><path d="M19 7l-3 6h6z"/><path d="M2 13c0 2 1.5 3 3 3s3-1 3-3"/><path d="M16 13c0 2 1.5 3 3 3s3-1 3-3"/></svg>',
    whatsapp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 9.5c0 4 2.5 6 6 6.5l1-2-2-1.2-1 .7c-1-.5-1.5-1-2-2l.7-1L10.5 8z"/></svg>',
    escudo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/></svg>',
    pessoa: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    idade: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    hospital: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 21V8l8-5 8 5v13"/><path d="M10 21v-6h4v6"/><path d="M12 7v4M10 9h4"/></svg>',
    cama: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7v13"/><path d="M3 16h18v4"/><path d="M3 12h18v4"/><circle cx="7.5" cy="9.5" r="1.8"/><path d="M12 12V9h6a3 3 0 0 1 3 3"/></svg>',
    carteira: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M6 15h4"/></svg>',
    pin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    relogio: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    ok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12l6 6L20 6"/></svg>',
    alerta: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/></svg>',
    familia: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="8" cy="7" r="3"/><circle cx="16.5" cy="8.5" r="2.4"/><path d="M2.5 20c0-3.4 2.6-5.4 5.5-5.4S13.5 16.6 13.5 20"/><path d="M14.5 20c.2-2.8 2-4.6 4.2-4.6 2 0 3.8 1.6 3.8 4.6"/></svg>',
    heroi: '<svg width="170" height="170" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="56" class="heroi-circulo"/><circle cx="60" cy="42" r="14" class="heroi-pessoa"/><path d="M34 92c0-16 12-24 26-24s26 8 26 24" class="heroi-pessoa"/><path d="M86 34l14 5v10c0 11-7 17.5-14 21-7-3.5-14-10-14-21V39z" class="heroi-escudo"/><path d="M80 49l4 4 7-8" class="heroi-check"/></svg>'
  };

  /* ---------- rascunho ---------- */
  var dados = null;

  function syncPessoas() {
    var alvo = Math.max(1, Math.min(10, dados.vidas || 1));
    var pessoas = dados.pessoas || [];
    while (pessoas.length < alvo) {
      var rel = pessoas.length === 0 ? "titular" : (dados.dependentes[pessoas.length - 1] || "outro");
      pessoas.push({ relacao: rel, faixa: null });
    }
    while (pessoas.length > alvo) { pessoas.pop(); }
    dados.pessoas = pessoas;
    if (dados.linhasIdadesVisiveis > alvo) { dados.linhasIdadesVisiveis = alvo; }
    if (dados.linhasIdadesVisiveis < 1) { dados.linhasIdadesVisiveis = 1; }
  }

  function salvar() { S.persistir(); }

  function iniciarSimulacao() {
    if (!S.memoria.existe || S.memoria.enviado) { S.rascunhoNovo(); }
    dados = S.memoria.dados;
    if (!S.memoria.iniciadoEm) {
      S.memoria.iniciadoEm = Date.now();
      salvar();
      A.track("simulation_start", {});
    }
  }

  /* ---------- progresso / cabecalho ---------- */
  function progressoPct(etapa) {
    var pct = Math.round(((etapa + 1) / TOTAL_ETAPAS) * 100);
    return Math.min(pct, 96); /* nunca chega a 100% antes do envio */
  }

  function atualizarCabecalho(refs) {
    var n = w.etapa + 1;
    var restam = TOTAL_ETAPAS - 1 - w.etapa;
    refs.etapa.textContent = "Etapa " + n + " de " + TOTAL_ETAPAS;
    refs.faltam.textContent = restam > 1 ? "faltam " + restam + " perguntas" : (restam === 1 ? "falta 1 pergunta" : "última etapa");
    refs.fill.style.width = progressoPct(w.etapa) + "%";
    refs.barra.setAttribute("aria-valuenow", String(progressoPct(w.etapa)));
    refs.barra.setAttribute("aria-valuetext", "Etapa " + n + " de " + TOTAL_ETAPAS);
    refs.anuncio.textContent = "Etapa " + n + " de " + TOTAL_ETAPAS + ": " + ETAPAS[w.etapa].pergunta;
  }

  /* ---------- erros inline ---------- */
  function limparErro(campo) {
    if (!campo) { return; }
    var holder = campo.closest(".campo-grupo") || campo.closest(".mini-fieldset") || campo.closest(".consent-box") || campo.parentNode;
    if (!holder) { return; }
    var e = holder.querySelector(".erro");
    if (e) { e.remove(); }
    campo.removeAttribute("aria-invalid");
    campo.removeAttribute("aria-describedby");
  }

  function mostrarErro(campo, msg) {
    var holder = campo.closest(".campo-grupo") || campo.closest(".mini-fieldset") || campo.closest(".consent-box") || campo.parentNode;
    var antigo = holder.querySelector(".erro");
    if (antigo) { antigo.remove(); }
    var id = "erro-" + (campo.id || Math.random().toString(36).slice(2, 8));
    var div = el("p", { class: "erro", id: id });
    div.appendChild(el("span", { class: "erro-icone", html: ICONES.alerta }));
    div.appendChild(el("span", { text: msg }));
    holder.appendChild(div);
    campo.setAttribute("aria-invalid", "true");
    campo.setAttribute("aria-describedby", id);
  }

  function validarCampoInline(campo) {
    if (!campo || !campo.id) { return true; }
    if (campo.id === "f-whatsapp") {
      var r = V.validarTelefone(campo.value);
      limparErro(campo);
      if (!r.ok) { mostrarErro(campo, r.erro); return false; }
      return true;
    }
    if (campo.id === "f-nome") {
      var rn = V.validarNome(campo.value);
      limparErro(campo);
      if (!rn.ok) { mostrarErro(campo, rn.erro); return false; }
      return true;
    }
    if (campo.id === "f-email") {
      var re = V.validarEmail(campo.value);
      limparErro(campo);
      if (!re.ok) { mostrarErro(campo, re.erro); return false; }
      return true;
    }
    return true;
  }

  /* ============================================================
     CONSTRUTORES DE TELA
     ============================================================ */

  /* TELA 0 - ABERTURA */
  function telaAbertura() {
    var box = el("div", { class: "wz-abertura" });
    box.appendChild(el("p", { class: "wz-selo", text: C.cidadeBase + " · " + C.horario }));
    box.appendChild(el("h2", { class: "wz-titulo", text: ETAPAS[0].pergunta }));
    box.appendChild(el("p", { class: "wz-sub", text: "Responda 7 perguntinhas rápidas. Eu monto a proposta com as operadoras que atendem Niterói e a sua rotina de uso." }));
    var bullets = el("ul", { class: "wz-bullets" });
    ["Sem custo", "Seus dados não vão para a operadora sem o seu OK", "Quem te responde é o Carlos, não um robô"].forEach(function (t) {
      var li = el("li", {});
      li.appendChild(el("span", { class: "bullet-ok", html: ICONES.ok, "aria-hidden": "true" }));
      li.appendChild(el("span", { text: t }));
      bullets.appendChild(li);
    });
    box.appendChild(bullets);
    box.appendChild(el("button", { type: "submit", class: "btn btn-acao btn-grande", text: "Começar simulação (60s)" }));
    return box;
  }

  /* TELA 1 - QUEM VAI USAR */
  function telaQuem() {
    var box = el("div", { class: "wz-corpo-etapa" });

    var grupo = el("div", { class: "campo-grupo" });
    var stepper = el("div", { class: "stepper", role: "group", "aria-label": "Quantidade de pessoas" });
    var input = el("input", {
      type: "number", id: "f-vidas", name: "vidas", min: "1", max: "10", step: "1",
      inputmode: "numeric", value: String(dados.vidas || 1), "aria-label": "Quantas pessoas vão usar o plano"
    });
    function aplicarVidas(v) {
      var n = Math.max(1, Math.min(10, Math.round(Number(v) || 1)));
      dados.vidas = n;
      input.value = String(n);
      syncPessoas();
      montarDependentes();
      salvar();
    }
    stepper.appendChild(el("button", {
      type: "button", class: "stepper-btn", "aria-label": "Menos uma pessoa",
      onclick: function () { aplicarVidas((dados.vidas || 1) - 1); }
    }, ["−"]));
    stepper.appendChild(input);
    stepper.appendChild(el("button", {
      type: "button", class: "stepper-btn", "aria-label": "Mais uma pessoa",
      onclick: function () { aplicarVidas((dados.vidas || 1) + 1); }
    }, ["+"]));
    input.addEventListener("change", function () { aplicarVidas(input.value); });
    grupo.appendChild(stepper);

    var atalhos = el("div", { class: "chips", role: "group", "aria-label": "Atalhos" });
    [["eu", "Eu sozinho", 1], ["2", "2", 2], ["3", "3", 3], ["4", "4", 4], ["5mais", "5+", 5]].forEach(function (a) {
      atalhos.appendChild(el("button", {
        type: "button", class: "chip" + (dados.vidas === a[2] ? " chip-ativo" : ""),
        "aria-pressed": dados.vidas === a[2] ? "true" : "false",
        onclick: function () {
          aplicarVidas(a[2]);
          atalhos.querySelectorAll(".chip").forEach(function (c) {
            var ativo = c.textContent === a[1];
            c.classList.toggle("chip-ativo", ativo);
            c.setAttribute("aria-pressed", ativo ? "true" : "false");
          });
        }
      }, [a[1]]));
    });
    grupo.appendChild(atalhos);
    box.appendChild(grupo);

    var blocoDep = el("div", { id: "bloco-dependentes" });
    box.appendChild(blocoDep);

    function montarDependentes() {
      blocoDep.innerHTML = "";
      if ((dados.vidas || 1) < 2) { return; }
      blocoDep.appendChild(el("h3", { class: "wz-grupo-titulo", text: "Quem são?" }));
      var chips = el("div", { class: "chips" });
      RELACAO_OPCOES.forEach(function (op) {
        var qtd = dados.dependentes.filter(function (d) { return d === op.v; }).length;
        var b = el("button", {
          type: "button", class: "chip" + (qtd ? " chip-ativo" : ""),
          "aria-pressed": qtd ? "true" : "false",
          onclick: function () {
            var idx = dados.dependentes.indexOf(op.v);
            if (idx === -1) {
              if (dados.dependentes.length >= 9) { return; }
              dados.dependentes.push(op.v);
            } else {
              dados.dependentes.splice(idx, 1);
            }
            dados.vidas = dados.dependentes.length + 1;
            input.value = String(dados.vidas);
            syncPessoas();
            montarDependentes();
            salvar();
          }
        }, [(qtd > 1 ? op.t + " (" + qtd + ")" : op.t)]);
        chips.appendChild(b);
      });
      blocoDep.appendChild(chips);
      blocoDep.appendChild(el("p", { class: "ajuda", text: "Toque para incluir ou remover. Se precisar, ajuste o número em cima." }));
    }
    montarDependentes();
    return box;
  }

  /* TELA 2 - IDADES */
  function telaIdades() {
    var box = el("div", { class: "wz-corpo-etapa" });
    box.appendChild(el("p", { class: "ajuda ajuda-destaque", text: "A idade define a maior parte do valor. É só a faixa: não preciso da data de nascimento." }));

    var grupo = el("div", { class: "campo-grupo", id: "grupo-idades" });
    var lista = el("div", { class: "linhas-idade", id: "linhas-idade" });
    grupo.appendChild(lista);
    var btnMais = el("button", {
      type: "button", class: "btn btn-link", text: "+ Adicionar outra pessoa",
      onclick: function () {
        if (dados.linhasIdadesVisiveis < dados.pessoas.length) {
          dados.linhasIdadesVisiveis++;
          salvar();
          montarLinhas();
        }
      }
    });
    grupo.appendChild(btnMais);
    box.appendChild(grupo);

    function rotuloPessoa(p, i) {
      var rel = L.ROTULOS.relacao[p.relacao] || "pessoa";
      return i === 0 ? "Você (titular)" : "Pessoa " + (i + 1) + " — " + rel;
    }

    function montarLinhas() {
      lista.innerHTML = "";
      var visiveis = Math.max(dados.linhasIdadesVisiveis, 1);
      for (var i = 0; i < dados.pessoas.length; i++) {
        if (i >= visiveis) { break; }
        var p = dados.pessoas[i];
        var linha = el("div", { class: "linha-idade" });
        var sid = "faixa-" + i;
        var sel = el("select", { id: sid, name: sid });
        sel.appendChild(el("option", { value: "", text: "Selecione a faixa" }));
        FAIXAS.forEach(function (f) {
          var o = el("option", { value: f, text: f });
          if (p.faixa === f) { o.setAttribute("selected", "selected"); }
          sel.appendChild(o);
        });
        sel.value = p.faixa || "";
        sel.setAttribute("aria-label", "Faixa de idade de " + rotuloPessoa(p, i));
        sel.addEventListener("change", function (pessoa) {
          return function () {
            pessoa.faixa = sel.value || null;
            dados.linhasIdadesVisiveis = Math.max(dados.linhasIdadesVisiveis, dados.pessoas.filter(function (x) { return x.faixa; }).length);
            limparErro(sel);
            salvar();
          };
        }(p));
        linha.appendChild(el("label", { class: "linha-idade-rotulo", for: sid, text: rotuloPessoa(p, i) }));
        linha.appendChild(sel);
        lista.appendChild(linha);
      }
      btnMais.hidden = dados.linhasIdadesVisiveis >= dados.pessoas.length;
    }
    montarLinhas();
    return box;
  }

  /* TELA 3 - COBERTURA */
  function radioGrupo(nome, opcoes, valorAtual, aoEscolher, rotuloLegenda) {
    var wrap = el("fieldset", { class: "mini-fieldset" });
    wrap.appendChild(el("legend", { class: "wz-grupo-titulo", text: rotuloLegenda }));
    var opts = el("div", { class: "chips chips-radio", role: "radiogroup", "aria-label": rotuloLegenda });
    opcoes.forEach(function (op) {
      var id = nome + "-" + op.v;
      var inp = el("input", { type: "radio", id: id, name: nome, value: op.v });
      inp.checked = valorAtual === op.v;
      inp.addEventListener("change", function () { aoEscolher(op.v); });
      var lab = el("label", { class: "chip chip-selecionavel", for: id });
      lab.appendChild(inp);
      lab.appendChild(el("span", { text: op.t }));
      opts.appendChild(lab);
    });
    wrap.appendChild(opts);
    return wrap;
  }

  function telaCobertura() {
    var box = el("div", { class: "wz-corpo-etapa" });

    var g1 = radioGrupo("cobertura", [
      { v: "ambulatorial", t: "Somente ambulatorial (consultas e exames)" },
      { v: "hosp_sem_obst", t: "Hospitalar sem obstetrícia" },
      { v: "hosp_com_obst", t: "Hospitalar com obstetrícia (cobre parto)" },
      { v: "indefinida", t: "Não sei, quero a recomendação" }
    ], dados.cobertura, function (v) { dados.cobertura = v; salvar(); atualizarNota(); }, "1) Cobertura");

    var g2 = radioGrupo("acomodacao", [
      { v: "enfermaria", t: "Enfermaria" },
      { v: "apartamento", t: "Apartamento" },
      { v: "indiferente", t: "Indiferente" }
    ], dados.acomodacao, function (v) { dados.acomodacao = v; salvar(); }, "2) Acomodação");

    var g3 = radioGrupo("rede", [
      { v: "regional", t: "Regional (minha cidade e entorno)" },
      { v: "estadual", t: "Estadual (RJ)" },
      { v: "nacional", t: "Nacional" },
      { v: "referencia_rio", t: "Quero rede de referência no Rio" }
    ], dados.rede, function (v) { dados.rede = v; salvar(); }, "3) Rede de atendimento");

    box.appendChild(g1);
    box.appendChild(g2);
    box.appendChild(g3);

    var nota = el("p", { class: "aviso-neutro", id: "nota-obstetricia", hidden: true });
    box.appendChild(nota);
    function atualizarNota() {
      var temBebe = (dados.pessoas || []).some(function (p) { return p.faixa === "0-18"; });
      var gestante = (dados.contextos || []).indexOf("gestante") !== -1;
      var mostrar = dados.cobertura === "hosp_com_obst" && (temBebe || gestante);
      nota.hidden = !mostrar;
      if (mostrar) {
        nota.textContent = "Para parto, o prazo máximo previsto é 300 dias de carência; pré-natal, 180 dias; urgência e emergência, 24 horas. Confirmo a condição exata na proposta.";
      }
    }
    atualizarNota();

    box.appendChild(el("p", { class: "ajuda ajuda-fim", text: "Isso muda muito o preço. Escolher “não sei” é OK, eu recomendo." }));
    return box;
  }

  /* TELA 4 - SITUACAO ATUAL */
  function telaSituacao() {
    var box = el("div", { class: "wz-corpo-etapa" });
    var g = radioGrupo("situacao", [
      { v: "ativo", t: "Sim, ativo" },
      { v: "cancelei", t: "Tive e cancelei" },
      { v: "nunca", t: "Nunca tive" },
      { v: "sus_particular", t: "Estou no SUS ou pago particular" }
    ], dados.situacaoPlano, function (v) { dados.situacaoPlano = v; salvar(); montarCondicional(); }, "Situação atual");
    box.appendChild(g);

    var cond = el("div", { id: "cond-situacao" });
    box.appendChild(cond);

    function montarCondicional() {
      cond.innerHTML = "";
      if (dados.situacaoPlano === "ativo") {
        var grupoQ = el("div", { class: "campo-grupo" });
        grupoQ.appendChild(el("h3", { class: "wz-grupo-titulo", text: "Quanto você paga por mês hoje?" }));
        var linha = el("div", { class: "slider-linha" });
        var range = el("input", { type: "range", id: "pg-range", min: "100", max: "5000", step: "50", "aria-label": "Quanto paga por mês hoje, em reais" });
        var num = el("input", { type: "number", id: "pg-num", min: "0", step: "10", inputmode: "numeric", "aria-label": "Valor em reais que paga hoje" });
        var saida = el("output", { class: "slider-valor", for: "pg-num" });
        function refletir(v, tocar) {
          var n = Math.round(Number(v));
          if (!isFinite(n) || n <= 0) {
            saida.textContent = "—";
            num.value = "";
            return;
          }
          if (tocar) {
            dados.pagamentoAtual = n;
            salvar();
          }
          range.value = String(Math.min(5000, Math.max(100, n)));
          num.value = String(n);
          saida.textContent = V.formatarBRL(n);
        }
        refletir(dados.pagamentoAtual || 400, false);
        range.value = dados.pagamentoAtual ? String(Math.min(5000, Math.max(100, dados.pagamentoAtual))) : "400";
        range.addEventListener("input", function () { refletir(range.value, true); });
        num.addEventListener("input", function () { refletir(num.value, true); });
        linha.appendChild(range); linha.appendChild(num); linha.appendChild(saida);
        grupoQ.appendChild(linha);
        var atalhos = el("div", { class: "chips" });
        [200, 400, 600, 800, 1200, 1800, 2000].forEach(function (v) {
          atalhos.appendChild(el("button", {
            type: "button", class: "chip",
            onclick: function () { refletir(v === 2000 ? 2000 : v, true); }
          }, [v === 2000 ? "2000+" : String(v)]));
        });
        grupoQ.appendChild(atalhos);
        cond.appendChild(grupoQ);

        var grupoOp = el("div", { class: "campo-grupo" });
        grupoOp.appendChild(el("label", { class: "wz-grupo-titulo", for: "pg-operadora", text: "Qual a operadora?" }));
        var dl = el("datalist", { id: "dl-operadoras" });
        global.DATA_OPERADORAS.forEach(function (o) { dl.appendChild(el("option", { value: o })); });
        var inpOp = el("input", { type: "text", id: "pg-operadora", name: "operadoraAtual", list: "dl-operadoras", autocomplete: "off", value: dados.operadoraAtual || "" });
        inpOp.addEventListener("input", function () { dados.operadoraAtual = inpOp.value; salvar(); });
        grupoOp.appendChild(inpOp);
        grupoOp.appendChild(dl);
        cond.appendChild(grupoOp);
      }
      if (dados.situacaoPlano === "cancelei") {
        var grupoM = el("div", { class: "campo-grupo" });
        grupoM.appendChild(el("h3", { class: "wz-grupo-titulo", text: "Qual foi o motivo?" }));
        var chips = el("div", { class: "chips" });
        [["ficou_caro", "Ficou caro"], ["rede_fraca", "Rede de hospitais fraca"], ["demora_autorizacao", "Demora para autorizar"], ["perdeu_empresa", "Perdi o plano da empresa"], ["nao_usava", "Não usava"], ["outro", "Outro"]].forEach(function (m) {
          var ativo = (dados.motivoCancelamento || []).indexOf(m[0]) !== -1;
          chips.appendChild(el("button", {
            type: "button", class: "chip" + (ativo ? " chip-ativo" : ""), "aria-pressed": ativo ? "true" : "false",
            onclick: function () {
              var i = dados.motivoCancelamento.indexOf(m[0]);
              if (i === -1) { dados.motivoCancelamento.push(m[0]); } else { dados.motivoCancelamento.splice(i, 1); }
              if (m[0] === "outro" && i === -1) { var t = cond.querySelector("#motivo-outro-campo"); if (t) { t.hidden = false; t.querySelector("input").focus(); } }
              salvar();
              montarCondicional();
            }
          }, [m[1]]));
        });
        grupoM.appendChild(chips);
        if ((dados.motivoCancelamento || []).indexOf("outro") !== -1) {
          var campoOutro = el("div", { class: "campo-grupo", id: "motivo-outro-campo" });
          var inpOutro = el("input", { type: "text", id: "motivo-outro", maxlength: "120", value: dados.motivoOutroTexto || "" });
          inpOutro.addEventListener("input", function () { dados.motivoOutroTexto = inpOutro.value.slice(0, 120); salvar(); });
          campoOutro.appendChild(el("label", { for: "motivo-outro", class: "ajuda", text: "Conta em uma frase (até 120 caracteres)" }));
          campoOutro.appendChild(inpOutro);
          grupoM.appendChild(campoOutro);
        }
        cond.appendChild(grupoM);
      }
    }
    montarCondicional();
    return box;
  }

  /* TELA 5 - ORCAMENTO */
  function telaOrcamento() {
    var box = el("div", { class: "wz-corpo-etapa" });
    var grupo = el("div", { class: "campo-grupo", id: "grupo-orcamento" });
    var linha = el("div", { class: "slider-linha" });
    var range = el("input", { type: "range", id: "orc-range", min: "150", max: "4000", step: "100", "aria-label": "Orçamento mensal em reais" });
    var num = el("input", { type: "number", id: "orc-num", min: "0", step: "100", inputmode: "numeric", "aria-label": "Orçamento mensal em reais" });
    var saida = el("output", { class: "slider-valor", for: "orc-num" });

    function refletir(v, tocar) {
      var n = Math.round(Number(v) / 100) * 100;
      if (!isFinite(n) || n <= 0) { return; }
      n = Math.max(150, Math.min(4000, n));
      range.value = String(n);
      num.value = String(n);
      saida.textContent = V.formatarBRL(n);
      if (tocar) {
        dados.orcamento = n;
        dados.orcamentoAberto = false;
        salvar();
      }
    }
    refletir(dados.orcamento || 800, false);
    if (dados.orcamentoAberto) { saida.textContent = "Sem limite definido"; num.value = ""; }
    range.value = String(dados.orcamento || 800);
    range.addEventListener("input", function () { refletir(range.value, true); });
    num.addEventListener("input", function () { refletir(num.value, true); });

    linha.appendChild(range); linha.appendChild(num); linha.appendChild(saida);
    grupo.appendChild(linha);

    var btnAberto = el("button", {
      type: "button", class: "btn btn-link", text: "Prefiro não limitar",
      onclick: function () {
        dados.orcamentoAberto = true;
        dados.orcamento = null;
        saida.textContent = "Sem limite definido";
        num.value = "";
        limparErro(range);
        salvar();
      }
    });
    grupo.appendChild(btnAberto);
    grupo.appendChild(el("p", { class: "ajuda", text: "Assim eu busco o que cabe no seu bolso, em vez de te apresentar o que não cabe." }));
    box.appendChild(grupo);
    return box;
  }

  /* TELA 6 - CIDADE E HOSPITAIS */
  function telaCidade() {
    var box = el("div", { class: "wz-corpo-etapa" });

    /* UF em chips (não <select>: em iOS, select dentro de modal some atrás do teclado) */
    var grupoUf = el("div", { class: "campo-grupo" });
    grupoUf.appendChild(el("h3", { class: "wz-grupo-titulo", id: "titulo-uf", text: "Estado (UF)" }));
    var chipsUf = el("div", { class: "chips chips-radio chips-uf", role: "radiogroup", "aria-labelledby": "titulo-uf" });
    global.DATA_UFS.forEach(function (uf) {
      var id = "uf-" + uf.sigla;
      var inp = el("input", { type: "radio", id: id, name: "uf", value: uf.sigla });
      inp.checked = dados.uf === uf.sigla;
      inp.addEventListener("change", function () {
        dados.uf = uf.sigla;
        dados.bairro = dados.uf === "RJ" ? dados.bairro : "";
        montarCidade();
        salvar();
      });
      var lab = el("label", { class: "chip chip-selecionavel chip-uf", for: id, title: uf.nome });
      lab.appendChild(inp);
      lab.appendChild(el("span", { text: uf.sigla }));
      chipsUf.appendChild(lab);
    });
    grupoUf.appendChild(chipsUf);
    box.appendChild(grupoUf);

    var zonaCidade = el("div", { id: "zona-cidade" });
    box.appendChild(zonaCidade);

    function norm(s) { return V.normalizarTexto(s); }
    function cidadeAtendida(nome) {
      if (!nome) { return true; }
      var alvo = norm(nome);
      var nasRegioes = (C.regioesAtendidas || []).some(function (r) { return norm(r) === alvo; });
      if (nasRegioes) { return true; }
      var m = global.DATA_MUNICIPIOS.filter(function (x) { return norm(x.nome) === alvo; })[0];
      if (m) { return !!m.atendida; }
      /* cidade fora das listas: tratada como fora da regiao so para exibir a
         frase neutra de atendimento a distancia; o envio JAMAIS e bloqueado */
      return false;
    }

    function montarCidade() {
      zonaCidade.innerHTML = "";
      if (!dados.uf) { return; }

      var gc = el("div", { class: "campo-grupo" });
      gc.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-cidade", text: "Cidade" }));
      var dl = el("datalist", { id: "dl-cidades" });
      global.DATA_MUNICIPIOS.forEach(function (m) { dl.appendChild(el("option", { value: m.nome })); });
      var inpCid = el("input", { type: "text", id: "f-cidade", name: "cidade", autocomplete: "address-level2", list: "dl-cidades", value: dados.cidade || "" });
      var sug = el("div", { class: "sugestoes", id: "sugestoes-cidade", hidden: true });
      inpCid.addEventListener("input", function () {
        dados.cidade = inpCid.value;
        limparErro(inpCid);
        atualizarNotaRegiao();
        salvar();
        montarSugestoes();
      });
      inpCid.addEventListener("blur", function () { global.setTimeout(function () { sug.hidden = true; }, 150); });
      function montarSugestoes() {
        sug.innerHTML = "";
        var q = norm(inpCid.value || "");
        if (!q) { sug.hidden = true; return; }
        var cand = global.DATA_MUNICIPIOS.filter(function (m) {
          return m.uf === dados.uf && norm(m.nome).indexOf(q) !== -1;
        }).slice(0, 6);
        if (!cand.length) { sug.hidden = true; return; }
        cand.forEach(function (m) {
          sug.appendChild(el("button", {
            type: "button", class: "sugestao",
            onclick: function () {
              inpCid.value = m.nome;
              dados.cidade = m.nome;
              sug.hidden = true;
              atualizarNotaRegiao();
              salvar();
            }
          }, [m.nome]));
        });
        sug.hidden = false;
      }
      inpCid.addEventListener("focus", montarSugestoes);
      gc.appendChild(inpCid);
      gc.appendChild(dl);
      gc.appendChild(sug);
      zonaCidade.appendChild(gc);

      var notaRegiao = el("p", { class: "aviso-neutro", id: "nota-regiao", hidden: true });
      zonaCidade.appendChild(notaRegiao);
      function atualizarNotaRegiao() {
        var temNome = !!(dados.cidade && dados.cidade.trim().length >= 2);
        var ok = temNome && cidadeAtendida(dados.cidade);
        notaRegiao.hidden = !(temNome && !ok);
        if (!notaRegiao.hidden) {
          notaRegiao.textContent = "Atendo sua região também; nesse caso o atendimento é por WhatsApp ou vídeo.";
        }
      }
      atualizarNotaRegiao();

      if (dados.uf === "RJ") {
        var gb = el("div", { class: "campo-grupo" });
        gb.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-bairro", text: "Bairro/região (opcional)" }));
        var inpB = el("input", { type: "text", id: "f-bairro", name: "bairro", autocomplete: "address-level3", value: dados.bairro || "" });
        inpB.addEventListener("input", function () { dados.bairro = inpB.value; salvar(); });
        gb.appendChild(inpB);
        zonaCidade.appendChild(gb);
      }

      /* hospitais */
      var gh = el("div", { class: "campo-grupo" });
      gh.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-hospitais", text: "Tem hospital que você faz questão de ter na rede? (opcional)" }));
      var dlh = el("datalist", { id: "dl-hospitais" });
      global.DATA_HOSPITAIS.forEach(function (h) { dlh.appendChild(el("option", { value: h })); });
      var inpH = el("input", { type: "text", id: "f-hospitais", list: "dl-hospitais", autocomplete: "off" });
      inpH.setAttribute("aria-describedby", "ajuda-hospitais");
      var chipsH = el("div", { class: "chips chips-removiveis", id: "chips-hospitais" });
      function montarChipsH() {
        chipsH.innerHTML = "";
        (dados.hospitais || []).forEach(function (h, i) {
          chipsH.appendChild(el("span", { class: "chip chip-fixo" }, [
            el("span", { text: h }),
            el("button", {
              type: "button", class: "chip-remover", "aria-label": "Remover " + h,
              onclick: function () { dados.hospitais.splice(i, 1); salvar(); montarChipsH(); }
            }, ["×"])
          ]));
        });
      }
      inpH.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          var v = inpH.value.trim();
          if (!v) { return; }
          if (v === "Sem preferência") { dados.hospitais = ["Sem preferência"]; }
          else {
            dados.hospitais = (dados.hospitais || []).filter(function (x) { return x !== "Sem preferência"; });
            if (dados.hospitais.indexOf(v) === -1 && dados.hospitais.length < 6) { dados.hospitais.push(v); }
          }
          inpH.value = "";
          salvar();
          montarChipsH();
        }
      });
      gh.appendChild(inpH);
      gh.appendChild(dlh);
      gh.appendChild(chipsH);
      gh.appendChild(el("p", { class: "ajuda", id: "ajuda-hospitais", text: "Digite e aperte Enter para adicionar (até 6). Você pode escolher “Sem preferência”." }));
      zonaCidade.appendChild(gh);
      montarChipsH();
    }
    montarCidade();
    return box;
  }

  /* TELA 7 - URGENCIA E CONTEXTO */
  function telaUrgencia() {
    var box = el("div", { class: "wz-corpo-etapa" });
    box.appendChild(radioGrupo("urgencia", [
      { v: "antes", t: "O quanto antes" },
      { v: "30_dias", t: "Em até 30 dias" },
      { v: "2_3_meses", t: "Nos próximos 2 a 3 meses" },
      { v: "pesquisando", t: "Só estou pesquisando" }
    ], dados.urgencia, function (v) { dados.urgencia = v; salvar(); }, "Quando você quer estar com o plano ativo?"));

    var gc = el("div", { class: "campo-grupo" });
    gc.appendChild(el("h3", { class: "wz-grupo-titulo", text: "Algum desses é o seu caso? (opcional)" }));
    var chips = el("div", { class: "chips" });
    function remontarChips() {
      chips.innerHTML = "";
      CONTEXTO_OPCOES.forEach(function (op) {
        var ativo = (dados.contextos || []).indexOf(op.v) !== -1;
        chips.appendChild(el("button", {
          type: "button", class: "chip" + (ativo ? " chip-ativo" : ""), "aria-pressed": ativo ? "true" : "false",
          onclick: function () {
            var i = dados.contextos.indexOf(op.v);
            if (i === -1) {
              if (op.v === "sem_preferencia") { dados.contextos = ["sem_preferencia"]; }
              else {
                var sp = dados.contextos.indexOf("sem_preferencia");
                if (sp !== -1) { dados.contextos.splice(sp, 1); }
                dados.contextos.push(op.v);
              }
            } else { dados.contextos.splice(i, 1); }
            salvar();
            remontarChips();
          }
        }, [op.t]));
      });
    }
    remontarChips();
    gc.appendChild(chips);
    box.appendChild(gc);

    var go = el("div", { class: "campo-grupo" });
    go.appendChild(el("p", { class: "aviso-neutro", text: "Não escreva diagnóstico, CID nem nome de remédio. Se preferir, me conta isso direto no WhatsApp." }));
    var ta = el("textarea", { id: "f-observacao", maxlength: "240", rows: "3", "aria-describedby": "contador-obs" });
    var contador = el("p", { class: "contador", id: "contador-obs", text: (dados.observacao || "").length + " de 240 caracteres" });
    ta.value = dados.observacao || "";
    ta.addEventListener("input", function () {
      dados.observacao = ta.value.slice(0, 240);
      contador.textContent = dados.observacao.length + " de 240 caracteres";
      salvar();
    });
    go.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-observacao", text: "Tem mais alguma coisa que eu deva saber? (opcional)" }));
    go.appendChild(ta);
    go.appendChild(contador);
    box.appendChild(go);
    return box;
  }

  /* TELA 8 - CONTATO (+ RESUMO 8B) */
  function telaContato() {
    return w.faseContato === "resumo" ? telaResumo() : telaFormContato();
  }

  function telaFormContato() {
    var box = el("div", { class: "wz-corpo-etapa" });
    box.appendChild(el("p", { class: "wz-sub", text: "Em até " + (C.prazoResposta || "1 dia útil") + ", no horário comercial. Quem responde é o Carlos, pessoalmente." }));

    /* honeypot invisivel anti-spam */
    var hp = el("div", { class: "hp", "aria-hidden": "true" });
    hp.appendChild(el("label", { for: "hp-website", class: "hp-rotulo", text: "Não preencha este campo" }));
    hp.appendChild(el("input", { type: "text", id: "hp-website", name: "website", tabindex: "-1", autocomplete: "off" }));
    box.appendChild(hp);

    var gn = el("div", { class: "campo-grupo" });
    gn.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-nome", text: "Seu nome" }));
    var inpNome = el("input", { type: "text", id: "f-nome", name: "nome", autocomplete: "name", value: dados.nome || "" });
    inpNome.addEventListener("blur", function () {
      if (inpNome.value.trim()) { validarCampoInline(inpNome); }
    });
    inpNome.addEventListener("input", function () { dados.nome = inpNome.value; limparErro(inpNome); salvar(); });
    gn.appendChild(inpNome);
    box.appendChild(gn);

    var gw = el("div", { class: "campo-grupo" });
    gw.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-whatsapp", text: "WhatsApp" }));
    var inpZap = el("input", { type: "tel", id: "f-whatsapp", name: "whatsapp", inputmode: "tel", autocomplete: "tel", placeholder: "(21) 98447-9709", value: dados.whatsapp || "" });
    inpZap.addEventListener("input", function () {
      var pos = inpZap.value.length;
      inpZap.value = V.mascararTelefone(inpZap.value);
      pos = inpZap.value.length; /* reposiciona no fim: mascaras simples */
      limparErro(inpZap);
      dados.whatsapp = inpZap.value;
      salvar();
    });
    inpZap.addEventListener("blur", function () { if (inpZap.value.trim()) { validarCampoInline(inpZap); } });
    gw.appendChild(inpZap);
    box.appendChild(gw);

    var ge = el("div", { class: "campo-grupo" });
    ge.appendChild(el("label", { class: "wz-grupo-titulo", for: "f-email", text: "E-mail (opcional)" }));
    var inpEmail = el("input", { type: "email", id: "f-email", name: "email", inputmode: "email", autocomplete: "email", value: dados.email || "" });
    inpEmail.addEventListener("blur", function () { if (inpEmail.value.trim()) { validarCampoInline(inpEmail); } });
    inpEmail.addEventListener("input", function () { dados.email = inpEmail.value; limparErro(inpEmail); salvar(); });
    ge.appendChild(inpEmail);
    box.appendChild(ge);

    var gh = el("div", { class: "campo-grupo" });
    gh.appendChild(el("h3", { class: "wz-grupo-titulo", id: "titulo-horario", text: "Melhor horário para contato" }));
    var chipsH = el("div", { class: "chips", role: "group", "aria-labelledby": "titulo-horario" });
    [["manha", "Manhã"], ["tarde", "Tarde"], ["noite", "Noite"], ["whatsapp", "Só por WhatsApp"]].forEach(function (h) {
      chipsH.appendChild(el("button", {
        type: "button", class: "chip" + (dados.melhorHorario === h[0] ? " chip-ativo" : ""),
        "aria-pressed": dados.melhorHorario === h[0] ? "true" : "false",
        onclick: function () {
          dados.melhorHorario = dados.melhorHorario === h[0] ? null : h[0];
          salvar();
          chipsH.querySelectorAll(".chip").forEach(function (c, i) {
            var ativo = ["manha", "tarde", "noite", "whatsapp"][i] === dados.melhorHorario;
            c.classList.toggle("chip-ativo", ativo);
            c.setAttribute("aria-pressed", ativo ? "true" : "false");
          });
        }
      }, [h[1]]));
    });
    gh.appendChild(chipsH);
    box.appendChild(gh);

    /* consentimento sensivel - caixa destacada, NUNCA pre-marcada */
    var cs = el("div", { class: "consent-box consent-sensivel" });
    var inpCs = el("input", { type: "checkbox", id: "consent-sensiveis" });
    inpCs.checked = false; /* nunca pre-marcada */
    inpCs.addEventListener("change", function () {
      dados.consentSensiveis = inpCs.checked;
      limparErro(inpCs);
      salvar();
    });
    var labCs = el("label", { for: "consent-sensiveis" });
    labCs.appendChild(inpCs);
    labCs.appendChild(el("span", { text: "Autorizo o uso dos meus dados de contato e das informações de saúde que eu informar para receber cotação e contato do Carlos (LGPD, art. 11, I). Posso revogar quando quiser." }));
    cs.appendChild(labCs);
    var linksCs = el("p", { class: "consent-links" });
    linksCs.appendChild(el("a", { href: "privacidade.html", target: "_blank", rel: "noopener noreferrer", text: "Política de Privacidade" }));
    linksCs.appendChild(D.createTextNode(" · "));
    linksCs.appendChild(el("a", { href: "termos.html", target: "_blank", rel: "noopener noreferrer", text: "Termos de uso" }));
    cs.appendChild(linksCs);
    box.appendChild(cs);

    var cm = el("div", { class: "consent-box" });
    var inpCm = el("input", { type: "checkbox", id: "consent-marketing" });
    inpCm.checked = !!dados.consentMarketing;
    inpCm.addEventListener("change", function () { dados.consentMarketing = inpCm.checked; salvar(); });
    var labCm = el("label", { for: "consent-marketing" });
    labCm.appendChild(inpCm);
    labCm.appendChild(el("span", { text: "Quero receber dicas e oportunidades de planos pelo WhatsApp." }));
    cm.appendChild(labCm);
    box.appendChild(cm);

    var lt = el("p", { class: "linha-termos" });
    lt.appendChild(D.createTextNode("Li e aceito a "));
    lt.appendChild(el("a", { href: "privacidade.html", target: "_blank", rel: "noopener noreferrer", text: "Política de Privacidade" }));
    lt.appendChild(D.createTextNode(" e os "));
    lt.appendChild(el("a", { href: "termos.html", target: "_blank", rel: "noopener noreferrer", text: "Termos de uso" }));
    lt.appendChild(D.createTextNode("."));
    box.appendChild(lt);

    if (C.turnstileSiteKey) { box.appendChild(montarTurnstile()); }

    box.appendChild(el("p", { class: "frase-confianca", text: "Seus dados vão direto para o WhatsApp do Carlos. Nada é vendido." }));
    return box;
  }

  function montarTurnstile() {
    var wrap = el("div", { class: "campo-grupo", id: "wz-turnstile" });
    if (C.turnstileSiteKey && global.turnstile && typeof global.turnstile.render === "function") {
      try {
        global.turnstile.render(wrap, {
          sitekey: C.turnstileSiteKey,
          callback: function (token) { w.turnstileToken = token; w.turnstilePronto = true; },
          "error-callback": function () { w.turnstilePronto = false; }
        });
        w.turnstileRenderizado = true;
      } catch (e) { /* Turnstile falhou: o site continua funcional */ }
    }
    return wrap;
  }

  /* TELA 8B - RESUMO ANTES DO ENVIO */
  function telaResumo() {
    var box = el("div", { class: "wz-corpo-etapa" });
    box.appendChild(el("h2", { class: "wz-titulo wz-titulo-resumo", text: "Sua simulação está pronta" }));

    var lead = w.leadAtual;
    var itens = [];
    function item(texto, etapaDestino) {
      var li = el("div", { class: "resumo-item" });
      li.appendChild(el("p", { class: "resumo-texto", text: texto }));
      if (etapaDestino !== null) {
        li.appendChild(el("button", {
          type: "button", class: "resumo-editar",
          "aria-label": "Editar: " + texto,
          onclick: function () {
            w.faseContato = "form";
            ir(etapaDestino);
          }
        }, ["editar"]));
      }
      return li;
    }

    var pessoasTxt = lead.vidas + (lead.vidas === 1 ? " pessoa: " : " pessoas: ") + lead.pessoas.map(function (p) {
      return (L.ROTULOS.relacao[p.relacao] || p.relacao) + " " + (p.faixa || "a informar");
    }).join(", ");
    itens.push(item(pessoasTxt, 1));

    var cob = L.construirLinhas(lead).filter(function (l) { return l.chave === "cobertura"; })[0];
    itens.push(item(cob ? cob.texto.replace("🏥 ", "") : "—", 3));

    var cidTxt = "Mora em " + lead.cidade + "/" + lead.uf + (lead.bairro ? " (" + lead.bairro + ")" : "")
      + " - hospitais: " + (lead.hospitaisPreferidos.length ? lead.hospitaisPreferidos.join(", ") : "sem preferência");
    itens.push(item(cidTxt, 6));

    if (lead.situacaoPlano) {
      var hojeTxt = L.construirLinhas(lead).filter(function (l) { return l.chave === "hoje"; })[0];
      itens.push(item(hojeTxt ? hojeTxt.texto.replace("🔁 Hoje: ", "") : "—", 4));
    }

    itens.push(item(lead.orcamentoAberto || lead.orcamento === null ? "Prefiro não limitar o orçamento" : "Posso pagar até " + V.formatarBRL(lead.orcamento) + "/mês", 5));
    itens.push(item(lead.urgencia ? "Quero ativar: " + (L.ROTULOS.urgencia[lead.urgencia] || lead.urgencia) : "Quando ativar: a combinar", 7));
    itens.push(item("Nº da sua simulação: " + lead.leadId, null));

    var lista = el("div", { class: "resumo-lista" });
    itens.forEach(function (i) { lista.appendChild(i); });
    box.appendChild(lista);

    var msg = L.montarMensagem(lead);
    var url = L.linkWhatsapp(msg);

    var acoes = el("div", { class: "resumo-acoes" });
    var btnEnviar = el("button", { type: "button", class: "btn btn-acao btn-grande", id: "btn-enviar-zap", text: "Receber no WhatsApp" });
    btnEnviar.addEventListener("click", function () { enviar(lead, btnEnviar); });
    acoes.appendChild(btnEnviar);

    acoes.appendChild(el("button", {
      type: "button", class: "btn btn-secundario",
      onclick: function () { w.faseContato = "form"; render(); }
    }, ["Corrigir alguma coisa"]));

    var btnCopiar = el("button", { type: "button", class: "btn btn-link", text: "Copiar resumo" });
    btnCopiar.addEventListener("click", function () {
      L.copiarTexto(L.copiaEspelho(lead)).then(function () {
        btnCopiar.textContent = "Resumo copiado ✓";
        A.track("copied_summary", { lead_id: lead.leadId, origem: "resumo" });
        global.setTimeout(function () { btnCopiar.textContent = "Copiar resumo"; }, 2500);
      }).catch(function () { });
    });
    acoes.appendChild(btnCopiar);
    acoes.appendChild(el("a", {
      class: "btn btn-link", href: L.linkWhatsappAlternativo(msg),
      target: "_blank", rel: "noopener noreferrer",
      text: "O WhatsApp não abriu? Use o link alternativo"
    }));
    box.appendChild(acoes);

    box.appendChild(el("p", { class: "frase-confianca", text: "Seus dados vão direto para o WhatsApp do Carlos. Nada é vendido." }));
    return box;
  }

  /* ---------- envio (item 9) ---------- */
  function enviar(lead, botao) {
    if (w.enviando) { return; }

    /* honeypot: se veio preenchido, descarta silenciosamente */
    var hp = D.getElementById("hp-website");
    if (hp && hp.value) { return; }

    var agora = Date.now();
    var registros = S.ler(S.CHAVES.antispam, []);
    var h = L.hashEnvio(lead);
    var chk = L.verificarSpam(registros, h, agora, S.memoria.iniciadoEm);
    if (!chk.ok) {
      var zona = D.querySelector(".wz-corpo");
      if (zona) {
        var av = zona.querySelector(".erro-spam");
        if (av) { av.remove(); }
        var p = el("p", { class: "erro erro-spam", role: "alert" });
        p.appendChild(el("span", { class: "erro-icone", html: ICONES.alerta }));
        p.appendChild(el("span", {
          text: chk.motivo === "repetido"
            ? "Recebi uma simulação igual há pouco. Dá uma olhada no seu WhatsApp — se a mensagem não abriu, me chama direto: " + C.whatsappExibicao + "."
            : "Calma lá! Fecha e abre de novo em alguns segundos que eu recebo do mesmo jeito."
        }));
        zona.insertBefore(p, zona.firstChild);
        p.focus && p.setAttribute("tabindex", "-1");
        p.focus();
      }
      return;
    }

    /* estado carregando + trava de duplo envio */
    w.enviando = true;
    if (botao) {
      botao.disabled = true;
      botao.setAttribute("aria-busy", "true");
      var txtOriginal = botao.textContent;
      botao.textContent = "Abrindo o WhatsApp…";
      global.setTimeout(function () {
        botao.disabled = false;
        botao.removeAttribute("aria-busy");
        botao.textContent = txtOriginal;
        w.enviando = false;
      }, 3000);
    }

    /* grava tudo ANTES de abrir a aba */
    L.registrarEnvio(h, agora);
    L.salvarLocal(lead);
    var msg = L.montarMensagem(lead);
    var url = L.linkWhatsapp(msg);
    S.gravar(S.CHAVES.ultimo, {
      leadId: lead.leadId,
      waUrl: url,
      waUrlAlt: L.linkWhatsappAlternativo(msg),
      espelho: L.copiaEspelho(lead),
      criadoEm: lead.criadoEm,
      ts: agora
    });
    S.memoria.enviado = true;
    S.persistir();

    /* window.open SINCRONO dentro do handler do clique (iOS abre aba em branco se houver await antes) */
    var win = null;
    try { win = global.open(url, "_blank", "noopener"); } catch (e) { win = null; }

    A.track("lead_submitted", {
      lead_id: lead.leadId, score: lead.score, vidas: lead.vidas,
      faixa_maxima: lead.faixaMaxima || "", cidade: lead.cidade, uf: lead.uf,
      orcamento: lead.orcamentoAberto ? "aberto" : lead.orcamento, encaixe: lead.encaixeOrcamento, moeda: "BRL"
    });
    A.track("whatsapp_open", { lead_id: lead.leadId, origem: w.modo === "overlay" ? "index" : "simulacao" });
    A.trackLeadPixel(lead);
    L.postWebhook(lead); /* fire-and-forget; sem webhookUrl nao faz nada */

    /* rascunho enviado: apaga dado pessoal do localStorage */
    S.rascunhoNovo();

    if (win) {
      global.location.href = "obrigado.html";
    } else if (global.top && global.self && global.top !== global.self) {
      /* Rodando dentro de um iframe (ex.: preview embutido): navegar o
         proprio frame ate wa.me seria recusado pelo sandbox. Mostra um
         painel com o link clicavel, o alternativo e o botao copiar. */
      mostrarFallbackPosEnvio(url, L.linkWhatsappAlternativo(msg), L.copiaEspelho(lead), lead.leadId);
      w.enviando = false;
      if (botao) {
        botao.disabled = false;
        botao.removeAttribute("aria-busy");
      }
    } else {
      /* popup bloqueado: navega direto; o link continua visivel no obrigado */
      global.location.href = url;
    }
  }

  /* Painel de resgate quando o WhatsApp nao abre (iframe/bloqueador/rede). */
  function mostrarFallbackPosEnvio(url, urlAlt, espelho, leadId) {
    var raiz = D.getElementById("wizard-montagem");
    if (!raiz) { return; }
    var zona = raiz.querySelector(".wz-corpo");
    if (!zona) { return; }
    var antigo = D.getElementById("fallback-zap");
    if (antigo) { antigo.remove(); }
    var box = el("div", { class: "fallback-zap", id: "fallback-zap", role: "alert" });
    box.appendChild(el("strong", { text: "O WhatsApp não abriu automaticamente." }));
    box.appendChild(el("p", { text: "Sem problema: toque em um dos botões abaixo (abrem em nova aba) ou copie o resumo e me mande por lá." }));
    var acoes = el("div", { class: "fallback-zap-acoes" });
    var a1 = el("a", { class: "btn btn-acao", href: url, target: "_blank", rel: "noopener noreferrer" }, ["Abrir o WhatsApp"]);
    a1.addEventListener("click", function () {
      A.track("whatsapp_open", { lead_id: leadId || "", origem: "fallback" });
    });
    acoes.appendChild(a1);
    acoes.appendChild(el("a", { class: "btn btn-secundario", href: urlAlt, target: "_blank", rel: "noopener noreferrer", text: "Link alternativo" }));
    var bCopiar = el("button", { type: "button", class: "btn btn-volta", text: "Copiar resumo" });
    bCopiar.addEventListener("click", function () {
      L.copiarTexto(espelho).then(function () {
        bCopiar.textContent = "Resumo copiado ✓";
        A.track("copied_summary", { lead_id: leadId || "", origem: "fallback" });
        global.setTimeout(function () { bCopiar.textContent = "Copiar resumo"; }, 2500);
      }).catch(function () { });
    });
    acoes.appendChild(bCopiar);
    box.appendChild(acoes);
    box.setAttribute("tabindex", "-1");
    zona.insertBefore(box, zona.firstChild);
    box.focus();
  }

  /* ---------- validacao por etapa ---------- */
  function validarEtapa(i) {
    falhaGlobal = null;
    var etapa = ETAPAS[i];
    var falhaPrimeira = null;
    function falha(descricao, nodo, tipoErro) {
      if (!falhaPrimeira) { falhaPrimeira = { nodo: nodo, msg: descricao, tipo: tipoErro }; }
      return false;
    }
    if (etapa.id === "quem") {
      if (!dados.vidas || dados.vidas < 1) {
        var inp = D.getElementById("f-vidas");
        mostrarErro(inp, "Preciso de pelo menos 1 pessoa.");
        return falha("Preciso de pelo menos 1 pessoa.", inp, "vidas_minimo");
      }
      syncPessoas();
    }
    if (etapa.id === "idades") {
      var faltam = dados.pessoas.filter(function (p) { return !p.faixa; }).length;
      if (faltam > 0) {
        var alvo = null;
        D.querySelectorAll("#linhas-idade select").forEach(function (s) { if (!s.value && !alvo) { alvo = s; } });
        var msgIdades = "Falta informar a idade de " + (faltam === 1 ? "1 pessoa" : faltam + " pessoas") + ".";
        mostrarErro(alvo || D.getElementById("grupo-idades"), msgIdades);
        return falha(msgIdades, alvo || D.getElementById("grupo-idades"), "faixa_faltando");
      }
    }
    if (etapa.id === "cobertura") {
      if (!dados.cobertura || !dados.acomodacao || !dados.rede) {
        var alvo2 = null;
        if (!dados.cobertura) { alvo2 = D.getElementById("cobertura-ambulatorial").closest(".mini-fieldset"); }
        else if (!dados.acomodacao) { alvo2 = D.getElementById("acomodacao-enfermaria").closest(".mini-fieldset"); }
        else { alvo2 = D.getElementById("rede-regional").closest(".mini-fieldset"); }
        mostrarErro(alvo2.querySelector("input"), "Escolha uma opção em cada grupo, ou use “Pular esta pergunta”.");
        return falha("grupos de cobertura incompletos", alvo2.querySelector("input"), "cobertura_incompleta");
      }
    }
    if (etapa.id === "situacao") {
      if (!dados.situacaoPlano) {
        var inpS = D.querySelector('input[name="situacao"]');
        mostrarErro(inpS, "Escolha uma opção, ou use “Pular esta pergunta”.");
        return falha("situação vazia", inpS, "situacao_vazia");
      }
    }
    if (etapa.id === "orcamento") {
      if (!dados.orcamentoAberto && typeof dados.orcamento !== "number") {
        var alvo4 = D.getElementById("orc-range");
        mostrarErro(alvo4, "Arraste o valor ou toque em “Prefiro não limitar”.");
        return falha("orçamento vazio", alvo4, "orcamento_vazio");
      }
    }
    if (etapa.id === "cidade") {
      if (!dados.uf) {
        var inpUf = D.querySelector('input[name="uf"]');
        mostrarErro(inpUf, "Escolha o estado (UF).");
        return falha("UF vazia", inpUf, "uf_vazia");
      }
      var inpCid = D.getElementById("f-cidade");
      if (!inpCid || !dados.cidade || dados.cidade.trim().length < 2) {
        mostrarErro(inpCid, "Digite sua cidade (pode ser fora da lista, texto livre).");
        return falha("cidade vazia", inpCid, "cidade_vazia");
      }
    }
    if (etapa.id === "urgencia") {
      if (!dados.urgencia) {
        var inpU = D.querySelector('input[name="urgencia"]');
        mostrarErro(inpU, "Escolha uma opção, ou use “Pular esta pergunta”.");
        return falha("urgência vazia", inpU, "urgencia_vazia");
      }
    }
    if (etapa.id === "contato" && w.faseContato === "form") {
      var okNome = V.validarNome(dados.nome);
      var inpNome = D.getElementById("f-nome");
      if (!okNome.ok) {
        limparErro(inpNome); mostrarErro(inpNome, okNome.erro);
        return falha("nome invalido", inpNome, "nome_invalido");
      }
      var okZap = V.validarTelefone(dados.whatsapp);
      var inpZap = D.getElementById("f-whatsapp");
      if (!okZap.ok) {
        limparErro(inpZap); mostrarErro(inpZap, okZap.erro);
        return falha("telefone invalido", inpZap, "telefone_" + resumoTipoErro(okZap.erro));
      }
      var okEmail = V.validarEmail(dados.email);
      var inpEmail = D.getElementById("f-email");
      if (!okEmail.ok) {
        limparErro(inpEmail); mostrarErro(inpEmail, okEmail.erro);
        return falha("email invalido", inpEmail, "email_invalido");
      }
      var inpCs = D.getElementById("consent-sensiveis");
      if (!dados.consentSensiveis) {
        mostrarErro(inpCs, "Para eu montar e te mandar a proposta, preciso do seu OK aqui em cima.");
        return falha("consentimento ausente", inpCs, "consentimento_ausente");
      }
      /* Turnstile: exigido somente se a chave existir E o widget renderizar;
         se o script estiver bloqueado, o site continua funcional. */
      if (C.turnstileSiteKey && w.turnstileRenderizado && global.turnstile && !w.turnstileToken) {
        var wrapTs = D.getElementById("wz-turnstile");
        mostrarErro(wrapTs.querySelector("input, iframe") || wrapTs, "Confirme a verificação anti-robô acima.");
        return falha("turnstile pendente", wrapTs, "turnstile_pendente");
      }
    }
    return true;
  }

  function resumoTipoErro(msgErro) {
    if (msgErro.indexOf("não existe") !== -1) { return "ddd_inexistente"; }
    if (msgErro.indexOf("9 dígitos") !== -1) { return "celular_8_digitos"; }
    if (msgErro.indexOf("incompleto") !== -1) { return "incompleto"; }
    if (msgErro.indexOf("só com dígitos") !== -1) { return "letras"; }
    if (msgErro.indexOf("Falta o DDD") !== -1) { return "sem_ddd"; }
    return "invalido";
  }

  /* ---------- navegacao ---------- */
  function marcarTempoEtapa() {
    var nome = ETAPAS[w.etapa].nome;
    var ms = Date.now() - w.iniciadoEmEtapa;
    if (ms > 0) { State.statTempoEtapa(nome, ms); }
    w.iniciadoEmEtapa = Date.now();
  }

  function ir(novaEtapa) {
    w.etapa = Math.max(0, Math.min(TOTAL_ETAPAS - 1, novaEtapa));
    S.memoria.etapa = w.etapa;
    salvar();
    render();
  }

  function avancar() {
    var etapa = ETAPAS[w.etapa];
    if (etapa.id === "abertura") {
      iniciarSimulacao();
      marcarTempoEtapa();
      A.track("step_complete", { step_index: 0, step_name: etapa.nome, tempo_ms: 0 });
      ir(1);
      return;
    }
    var valido = validarEtapa(w.etapa);
    if (valido !== true) {
      if (falhaGlobal) {
        A.track("step_error", { step_name: etapa.nome, campo: falhaGlobal.tipo, tipo_erro: falhaGlobal.tipo });
        var alvo = falhaGlobal.nodo;
        if (alvo && alvo.focus) {
          global.setTimeout(function () { alvo.focus({ preventScroll: false }); }, 30);
        }
      }
      return;
    }
    /* honeypot: se o campo invisivel veio preenchido, descarta silenciosamente */
    if (etapa.id === "contato") {
      var hpCheck = D.getElementById("hp-website");
      if (hpCheck && hpCheck.value) { return; }
    }
    var ms = Date.now() - w.iniciadoEmEtapa;
    A.track("step_complete", { step_index: w.etapa, step_name: etapa.nome, tempo_ms: ms });

    if (etapa.id === "contato") {
      if (w.faseContato === "form") {
        w.leadAtual = L.construir(dados);
        w.faseContato = "resumo";
        render();
        return;
      }
      return; /* no resumo o botao principal e o de WhatsApp */
    }
    marcarTempoEtapa();
    ir(w.etapa + 1);
  }

  var falhaGlobal = null;

  function voltar() {
    if (w.faseContato === "resumo") { w.faseContato = "form"; render(); return; }
    if (w.etapa === 0) { return; }
    marcarTempoEtapa();
    ir(w.etapa - 1);
  }

  function pular() {
    var etapa = ETAPAS[w.etapa];
    A.track("step_skip", { step_name: etapa.nome });
    if (etapa.id === "cobertura") {
      dados.cobertura = dados.cobertura || "indefinida";
      dados.acomodacao = dados.acomodacao || "indiferente";
    }
    if (etapa.id === "orcamento") { dados.orcamentoAberto = true; dados.orcamento = null; }
    salvar();
    marcarTempoEtapa();
    ir(w.etapa + 1);
  }

  /* ---------- render ---------- */
  function render() {
    var raiz = D.getElementById("wizard-montagem");
    if (!raiz) { return; }
    raiz.innerHTML = "";

    var etapa = ETAPAS[w.etapa];
    var form = el("form", { class: "wz", novalidate: true, id: "wz-form" });

    /* topo */
    var topo = el("div", { class: "wz-topo" });
    topo.appendChild(el("p", { class: "wz-marca", text: C.marca }));
    if (w.modo === "overlay") {
      topo.appendChild(el("button", {
        type: "button", class: "wz-fechar", "aria-label": "Fechar a simulação (sua resposta fica salva)",
        onclick: fecharOverlay
      }, ["×"]));
    }
    var meta = el("p", { class: "wz-meta" });
    var etapaEl = el("strong", { text: "" });
    var faltamEl = el("span", { class: "wz-faltam", text: "" });
    meta.appendChild(etapaEl); meta.appendChild(D.createTextNode(" · ")); meta.appendChild(faltamEl);
    topo.appendChild(meta);
    var barra = el("div", { class: "wz-progresso", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": "Progresso da simulação" });
    var fill = el("div", { class: "wz-progresso-fill" });
    barra.appendChild(fill);
    topo.appendChild(barra);
    form.appendChild(topo);

    /* corpo */
    var corpo = el("div", { class: "wz-corpo" });
    var fieldset = el("fieldset", { class: "wz-etapa wz-anim" });
    var textoLegend = (etapa.id === "contato" && w.faseContato === "resumo") ? "Sua simulação está pronta" : etapa.pergunta;
    var legend = el("legend", { class: "wz-pergunta", tabindex: "-1", text: textoLegend });
    fieldset.appendChild(legend);
    var builder = [telaAbertura, telaQuem, telaIdades, telaCobertura, telaSituacao, telaOrcamento, telaCidade, telaUrgencia, telaContato][w.etapa];
    fieldset.appendChild(builder());
    corpo.appendChild(fieldset);
    var anuncio = el("p", { class: "sr-only", "aria-live": "polite", id: "wz-anuncio" });
    corpo.appendChild(anuncio);
    form.appendChild(corpo);

    /* rodape */
    var rodape = el("div", { class: "wz-rodape" });
    if (etapa.id !== "abertura") {
      var btnVoltar = el("button", { type: "button", class: "btn btn-volta", text: "< Voltar", onclick: voltar });
      rodape.appendChild(btnVoltar);
      if (etapa.pulavel) {
        rodape.appendChild(el("button", { type: "button", class: "btn btn-link", text: "Pular esta pergunta", onclick: pular }));
      }
      var rotuloAvancar = etapa.id === "contato" ? "Receber minha simulação no WhatsApp" : "Continuar →";
      rodape.appendChild(el("button", { type: "submit", class: "btn btn-acao", id: "btn-continuar", text: rotuloAvancar }));
    }
    form.appendChild(rodape);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      avancar();
    });

    raiz.appendChild(form);

    atualizarCabecalho({ etapa: etapaEl, faltam: faltamEl, fill: fill, barra: barra, anuncio: anuncio });

    /* foco na pergunta da etapa (leitor de tela nao reinicia no body) */
    global.setTimeout(function () { try { legend.focus({ preventScroll: true }); } catch (e) { legend.focus(); } }, 30);
  }

  /* ---------- overlay (index) ---------- */
  function abrirOverlay(botaoOpener) {
    w.openger = botaoOpener || null;
    w.scrollAntes = global.scrollY || 0;
    var raiz = D.getElementById("wizard-root");
    raiz.innerHTML = "";
    var overlay = el("div", { class: "wz-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Simulação de plano de saúde", id: "wz-overlay" });
    var montagem = el("div", { class: "wz-montagem", id: "wizard-montagem" });
    overlay.appendChild(montagem);
    raiz.appendChild(overlay);
    D.body.classList.add("wz-aberto");
    w.aberto = true;
    w.modo = "overlay";

    var jaTem = S.memoria.existe && !S.memoria.enviado && S.memoria.etapa > 0;
    if (jaTem) {
      w.etapa = Math.min(S.memoria.etapa, 8);
      A.track("resume_draft", { etapa: S.memoria.etapa });
    } else {
      w.etapa = 0;
      w.faseContato = "form";
      w.leadAtual = null;
    }
    w.iniciadoEmEtapa = Date.now();
    render();
    /* focus trap */
    overlay.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); fecharOverlay(); return; }
      if (ev.key !== "Tab") { return; }
      var focaveis = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focaveis.length) { return; }
      var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (ev.shiftKey && D.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && D.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    });
    primeiroFoco(overlay);
  }

  function primeiroFoco(overlay) {
    var alvo = overlay.querySelector(".wz-fechar") || overlay.querySelector("button, input, select, textarea");
    if (alvo) { alvo.focus(); }
  }

  function fecharOverlay() {
    var raiz = D.getElementById("wizard-root");
    if (raiz) { raiz.innerHTML = ""; }
    D.body.classList.remove("wz-aberto");
    w.aberto = false;
    w.faseContato = "form";
    w.leadAtual = null;
    /* restaura o scrollTop salvo ao fechar */
    global.scrollTo(0, w.scrollAntes);
    if (w.openger && w.openger.focus) { w.openger.focus(); }
  }

  /* ---------- banner "Retomar simulacao" ---------- */
  function montarBannerRetomar() {
    var zona = D.getElementById("banner-retomar");
    if (!zona) { return; }
    zona.innerHTML = "";
    var m = S.memoria;
    if (!m.existe || m.enviado || m.etapa === 0) { return; }

    var contatoOk = m.dados.nome && m.dados.nome.trim().length >= 3
      && V.validarTelefone(m.dados.whatsapp).ok
      && m.dados.consentSensiveis;

    var box = el("div", { class: "banner-retomar", role: "status" });
    var txt = el("div", { class: "banner-retomar-texto" });
    txt.appendChild(el("strong", { text: contatoOk ? "Falta só 1 clique para receber sua proposta" : "Você tem uma simulação pela metade" }));
    txt.appendChild(el("span", {
      text: contatoOk
        ? "Seus dados estão guardados neste navegador. Abra, confira o resumo e mande no WhatsApp."
        : "Guardei suas respostas neste navegador. Quer continuar de onde parou?"
    }));
    box.appendChild(txt);

    var acoes = el("div", { class: "banner-retomar-acoes" });
    acoes.appendChild(el("button", {
      type: "button", class: "btn btn-acao",
      text: contatoOk ? "Abrir e enviar" : "Retomar simulação",
      onclick: function () {
        A.track("resume_draft", { etapa: m.etapa });
        abrirOverlay(null);
      }
    }));
    acoes.appendChild(el("button", {
      type: "button", class: "btn btn-link",
      text: "Começar do zero",
      onclick: function () {
        if (global.confirm("Apagar o rascunho salvo e começar uma simulação nova?")) {
          S.rascunhoNovo();
          montarBannerRetomar();
        }
      }
    }));
    box.appendChild(acoes);
    zona.appendChild(box);
  }

  /* ============================================================
     COLA COMUM DE TODAS AS PAGINAS
     ============================================================ */
  var MESES = { "01": "janeiro", "02": "fevereiro", "03": "março", "04": "abril", "05": "maio", "06": "junho", "07": "julho", "08": "agosto", "09": "setembro", "10": "outubro", "11": "novembro", "12": "dezembro" };

  function renderizarSelo() {
    D.querySelectorAll("[data-selo-susep]").forEach(function (n) {
      if (C.registroSusep) {
        n.hidden = false;
        n.textContent = "Corretor(a) de Seguros — SUSEP nº " + C.registroSusep;
      } else {
        n.hidden = true;
      }
    });
    D.querySelectorAll("[data-susep-rodape]").forEach(function (n) {
      n.textContent = C.registroSusep
        ? "Registro SUSEP nº " + C.registroSusep + " — Corretor(a) de Seguros, habilitado perante a SUSEP."
        : C.marca + " — Corretor de Planos de Saúde";
    });
    D.querySelectorAll("[data-cred-registrado]").forEach(function (n) {
      n.hidden = !C.registroSusep;
    });
  }

  function renderizarConfig() {
    D.querySelectorAll("[data-config-prazo]").forEach(function (n) { n.textContent = C.prazoResposta; });
    D.querySelectorAll("[data-config-horario]").forEach(function (n) { n.textContent = C.horario; });
    D.querySelectorAll("[data-config-whatsapp]").forEach(function (n) { n.textContent = C.whatsappExibicao; });
    D.querySelectorAll("[data-config-marca]").forEach(function (n) { n.textContent = C.marca; });
    D.querySelectorAll("[data-config-cidade]").forEach(function (n) { n.textContent = C.cidadeBase; });
    var partesData = String(C.dataAtualizacaoAns || "").split("-");
    var rotuloData = partesData.length === 2 ? (MESES[partesData[1]] || "") + " de " + partesData[0] : C.dataAtualizacaoAns;
    D.querySelectorAll("[data-faq-atualizacao]").forEach(function (n) {
      n.textContent = "Informações regulatórias de caráter educativo, atualizadas em " + rotuloData + ". Valem as normas vigentes na data da sua contratação.";
    });
    /* faixa de operadoras (texto puro, sem logo) */
    D.querySelectorAll("[data-operadoras-lista]").forEach(function (n) {
      n.innerHTML = "";
      (C.operadoras || []).forEach(function (op) {
        n.appendChild(el("span", { class: "operadora-nome", text: op }));
      });
    });
    /* links de WhatsApp com a mensagem curta da config */
    D.querySelectorAll("a[data-wa]").forEach(function (a) {
      a.href = L.linkWhatsapp(C.mensagemWhatsCurta);
    });
    /* canonical / OG absolutos quando o dominio existir */
    if (C.dominio) {
      var base = C.dominio.replace(/\/$/, "") + (global.location && global.location.pathname || "/");
      var canonical = D.querySelector('link[rel="canonical"]');
      if (canonical) { canonical.href = base; }
      var ogUrl = D.querySelector('meta[property="og:url"]');
      if (ogUrl) { ogUrl.setAttribute("content", base); }
    }
  }

  function boot() {
    S.init();
    L.esvaziarOutbox();
    dados = S.memoria.dados;
    syncPessoas();

    renderizarSelo();
    renderizarConfig();

    D.querySelectorAll("[data-cta]").forEach(function (b) {
      b.addEventListener("click", function () {
        A.track("cta_click", { local: b.getAttribute("data-cta") || "" });
      });
    });

    D.querySelectorAll("[data-rever-consentimento]").forEach(function (b) {
      b.addEventListener("click", function () { global.__reabrirConsentimento(); });
    });

    var pagina = D.body.getAttribute("data-page") || "";

    if (pagina === "home") {
      w.modo = "overlay";
      montarBannerRetomar();
      D.querySelectorAll("[data-abrir-wizard]").forEach(function (b) {
        b.addEventListener("click", function () { abrirOverlay(b); });
      });
    }

    /* Cloudflare Turnstile: script so quando ha chave configurada */
    if (C.turnstileSiteKey && !D.getElementById("cf-turnstile-script")) {
      var ts = D.createElement("script");
      ts.id = "cf-turnstile-script";
      ts.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      ts.defer = true;
      ts.async = true;
      D.head.appendChild(ts);
    }

    if (pagina === "simulacao") {
      w.modo = "pagina";
      D.body.classList.add("wz-pagina"); /* esconde o botao flutuante na pagina do wizard */
      var jaTem = S.memoria.existe && !S.memoria.enviado && S.memoria.etapa > 0;
      if (jaTem) {
        w.etapa = Math.min(S.memoria.etapa, 8);
        A.track("resume_draft", { etapa: S.memoria.etapa });
      } else {
        w.etapa = 0;
      }
      w.iniciadoEmEtapa = Date.now();
      render();
      montarBannerRetomar();
    }

    if (pagina === "obrigado") { L.initObrigado(); }
    if (pagina === "painel") { L.initPainel(); }

    /* abandono de etapa no pagehide (sem dado pessoal no payload) */
    global.addEventListener("pagehide", function () {
      if (w.aberto || (D.body.getAttribute("data-page") === "simulacao")) {
        if (!S.memoria.enviado && S.memoria.iniciadoEm) {
          A.beaconAbandono(ETAPAS[w.etapa].nome);
        }
      }
    });
  }

  if (D.readyState === "loading") {
    D.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.Wizard = {
    abrir: abrirOverlay,
    fechar: fecharOverlay,
    ir: ir,
    render: render,
    validarEtapa: validarEtapa,
    montarBannerRetomar: montarBannerRetomar
  };
})(typeof window !== "undefined" ? window : globalThis);
