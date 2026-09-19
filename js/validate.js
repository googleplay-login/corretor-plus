/* ============================================================
   js/validate.js - funcoes PURAS de validacao e utilitarios.
   Sem dependencia de DOM: cada funcao e testavel isoladamente
   (veja tests/test.mjs). Namespace global: window.Validate
   ============================================================ */
(function (global) {
  "use strict";

  /* Lista fechada dos 67 DDDs validos no Brasil (exatamente a lista do briefing). */
  var DDDS_VALIDOS = [
    "11","12","13","14","15","16","17","18","19","21","22","24","27","28",
    "31","32","33","34","35","37","38","41","42","43","44","45","46","47",
    "48","49","51","53","54","55","61","62","63","64","65","66","67","68",
    "69","71","73","74","75","77","79","81","82","83","84","85","86","87",
    "88","89","91","92","93","94","95","96","97","98","99"
  ];

  function escapeHtml(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Conta caracteres por pontos de codigo (emojis contam 1), nunca por .length */
  function contarCaracteres(texto) {
    return Array.from(String(texto == null ? "" : texto)).length;
  }

  function normalizarTexto(texto) {
    return String(texto == null ? "" : texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  /* ---------- Telefone ---------- */

  /* Mascara progressiva (NN) NNNNN-NNNN | (NN) NNNN-NNNN */
  function mascararTelefone(valor) {
    var d = String(valor == null ? "" : valor).replace(/\D/g, "");
    if (d.startsWith("55") && d.length > 11) { d = d.slice(2); }
    if (d.length > 11) { d = d.slice(0, 11); }
    if (d.length <= 2) { return d.length ? "(" + d : ""; }
    if (d.length <= 6) { return "(" + d.slice(0, 2) + ") " + d.slice(2); }
    if (d.length <= 10) {
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    }
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function falha(erro) {
    return { ok: false, erro: erro, tipo: null, normalizado: null, formatado: null };
  }

  /*
    valida e normaliza telefone brasileiro.
    Regras do briefing (item 7):
    - normalizar removendo tudo que nao for digito;
    - prefixar 55 se faltar;
    - rejeitar DDD fora da lista fechada;
    - aceitar 8 digitos (fixo) marcando tipo_telefone = "fixo";
    - aceitar 9 digitos iniciados por 6-9 como celular.
    Mensagens exatas: "Falta o DDD", "DDD 00 nao existe",
    "Numero de celular tem que ter 9 digitos", "Esse numero parece incompleto".
  */
  function validarTelefone(entrada) {
    var bruto = String(entrada == null ? "" : entrada).trim();
    if (!bruto) { return falha("Digite seu WhatsApp com DDD."); }
    if (/[^\d\s()+\-.]/.test(bruto)) {
      return falha("Digite o número só com dígitos (pode usar espaços, parênteses e traço).");
    }
    var d = bruto.replace(/\D/g, "");
    if (!d) { return falha("Digite seu WhatsApp com DDD."); }

    /* remove prefixo de pais 55, inclusive colado em dobro (+55 55 21...) */
    var guardas = 0;
    while (d.startsWith("55") && d.length > 11 && guardas < 2) {
      var candidato = d.slice(2);
      if (candidato.startsWith("55")) {
        var candidato2 = candidato.slice(2);
        if (candidato2.length >= 10 && DDDS_VALIDOS.indexOf(candidato2.slice(0, 2)) !== -1) {
          d = candidato2;
        } else {
          d = candidato;
        }
      } else if (candidato.length >= 10 && DDDS_VALIDOS.indexOf(candidato.slice(0, 2)) !== -1) {
        d = candidato;
      }
      guardas++;
    }

    if (d.length >= 8 && d.length <= 9) {
      /* Se o texto digitado sugere que a pessoa JA colocou o DDD (parenteses,
         mais ou espacos separando o DDD), a mensagem certa e "incompleto". */
      var pareceComDdd = /\(|\)/.test(bruto) || /^\d{2,3}[\s\-]/.test(bruto);
      if (pareceComDdd) {
        return falha("Esse número parece incompleto.");
      }
      return falha("Falta o DDD. Digite o número com o DDD da sua região.");
    }
    if (d.length < 8) {
      return falha("Esse número parece incompleto.");
    }
    if (d.length !== 10 && d.length !== 11) {
      return falha("Esse número está comprido demais. Confere os dígitos e tenta de novo.");
    }

    var ddd = d.slice(0, 2);
    if (DDDS_VALIDOS.indexOf(ddd) === -1) {
      return falha("DDD " + ddd + " não existe. Confere o DDD e tenta de novo.");
    }
    var resto = d.slice(2);
    if (d.length === 10) {
      if (/^[6-9]/.test(resto)) {
        return falha("Número de celular tem que ter 9 dígitos. Confere se não faltou um.");
      }
      if (!/^[2-5]/.test(resto)) {
        return falha("Esse número parece incompleto.");
      }
      return okTelefone(d, "fixo");
    }
    /* 11 digitos = celular */
    if (!/^[6-9]/.test(resto)) {
      if (/^[2-5]/.test(resto)) {
        return falha("Número fixo tem 8 dígitos. Confere se sobrou um dígito a mais.");
      }
      return falha("Esse número parece incompleto.");
    }
    return okTelefone(d, "celular");
  }

  function okTelefone(digitos, tipo) {
    var ddd = digitos.slice(0, 2);
    var resto = digitos.slice(2);
    var corpo = digitos.length === 11 ? resto.slice(0, 5) + "-" + resto.slice(5) : resto.slice(0, 4) + "-" + resto.slice(4);
    return {
      ok: true,
      erro: null,
      tipo: tipo,
      normalizado: "55" + digitos,
      formatado: "(" + ddd + ") " + corpo
    };
  }

  /* ---------- Nome / e-mail ---------- */

  var REGEX_NOME = /^[\p{L}][\p{L}\s'’.\-]{2,}$/u;

  function validarNome(nome) {
    var t = String(nome == null ? "" : nome).trim();
    if (!t) { return { ok: false, erro: "Digite seu nome." }; }
    if (!REGEX_NOME.test(t)) {
      return { ok: false, erro: "Digite seu nome completo (mínimo de 3 letras, só letras)." };
    }
    return { ok: true, erro: null, valor: t };
  }

  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function validarEmail(email) {
    var t = String(email == null ? "" : email).trim();
    if (!t) { return { ok: true, erro: null, valor: "" }; } /* opcional */
    if (!REGEX_EMAIL.test(t)) {
      return { ok: false, erro: "Esse e-mail parece incompleto. Confere e tenta de novo (ou deixe vazio)." };
    }
    return { ok: true, erro: null, valor: t };
  }

  /* ---------- Moeda (BRL) ---------- */
  /* O estado guarda SEMPRE inteiro em reais; formata so na exibicao.
     Nunca usar toFixed em centavos. */
  var fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function formatarBRL(inteiroReais) {
    var n = Number(inteiroReais);
    if (!isFinite(n)) { return ""; }
    return fmtBRL.format(n);
  }

  /* ---------- Observacao: protecao de dado de saude ---------- */
  var TERMOS_SAUDE = [
    "cid", "diagnostic", "cancer", "tumor", "hiv", "aids", "depress",
    "esquizofr", "tratamento", "medicamento", "remedio", "cirurgia",
    "internaca", "exame de", "sedar", "gestante"
  ];

  function observacaoTemTermoSensivel(texto) {
    var t = normalizarTexto(texto);
    for (var i = 0; i < TERMOS_SAUDE.length; i++) {
      if (t.indexOf(TERMOS_SAUDE[i]) !== -1) { return true; }
    }
    return false;
  }

  /* Se houver termo de saude, substitui por frase neutra e NUNCA envia o texto original. */
  function redigirObservacao(texto) {
    var t = String(texto == null ? "" : texto).trim();
    if (!t) { return ""; }
    if (observacaoTemTermoSensivel(t)) {
      return "assunto pessoal: prefiro falar no WhatsApp";
    }
    return t;
  }

  /* ---------- CSV ---------- */
  /* Neutraliza formula injection: campo comecando com = + - @ recebe apostrofo. */
  function guardarCsv(valor) {
    var s = String(valor == null ? "" : valor);
    if (/^[=+\-@]/.test(s)) { s = "'" + s; }
    return '"' + s.replace(/"/g, '""') + '"';
  }

  /* ---------- SHA-256 (painel local) ---------- */
  function sha256Hex(texto) {
    if (global.crypto && global.crypto.subtle && typeof global.crypto.subtle.digest === "function") {
      var bytes = new TextEncoder().encode(String(texto));
      return global.crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        }).join("");
      });
    }
    return Promise.resolve(sha256HexSync(String(texto)));
  }

  /* Fallback sincrono e compacto de SHA-256 (sem dependencia externa). */
  function sha256HexSync(ascii) {
    function rr(v, c) { return (v >>> c) | (v << (32 - c)); }
    var maxWord = Math.pow(2, 32);
    var result = "";
    var words = [];
    var asciiBitLength = ascii.length * 8;
    var hash = [];
    var k = [];
    var primeCounter = 0;
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (var i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\u0080";
    while (ascii.length % 64 - 56) { ascii += "\u0000"; }
    for (i = 0; i < ascii.length; i++) {
      var j = ascii.charCodeAt(i);
      if (j >> 8) { return ""; }
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : "") + b.toString(16);
      }
    }
    return result;
  }

  /* ---------- IDs e datas ---------- */
  function gerarIdAleatorio(n) {
    var alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "";
    try {
      var arr = new Uint32Array(n);
      (global.crypto || { getRandomValues: function (a) { for (var i = 0; i < a.length; i++) { a[i] = Math.floor(Math.random() * 4294967296); } } }).getRandomValues(arr);
      for (var i = 0; i < n; i++) { out += alfabeto[arr[i] % alfabeto.length]; }
      return out;
    } catch (e) {
      for (var k = 0; k < n; k++) { out += alfabeto[Math.floor(Math.random() * alfabeto.length)]; }
      return out;
    }
  }

  function _doisDigitos(n) { return (n < 10 ? "0" : "") + n; }

  /* ISO com fuso America/Sao_Paulo (ex.: 2026-09-18T14:03:22-03:00). */
  function isoComFuso(data) {
    var d = data instanceof Date ? data : new Date(data || Date.now());
    var tz = "America/Sao_Paulo";
    try {
      var fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
      var p = {};
      fmt.formatToParts(d).forEach(function (part) { p[part.type] = part.value; });
      var hora = p.hour === "24" ? "00" : p.hour;
      return p.year + "-" + p.month + "-" + p.day + "T" + hora + ":" + p.minute + ":" + p.second + "-03:00";
    } catch (e) {
      return d.getFullYear() + "-" + _doisDigitos(d.getMonth() + 1) + "-" + _doisDigitos(d.getDate())
        + "T" + _doisDigitos(d.getHours()) + ":" + _doisDigitos(d.getMinutes()) + ":" + _doisDigitos(d.getSeconds()) + "-03:00";
    }
  }

  function dataHoraCurta(iso) {
    /* 18/09/2026 14:03 */
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ""));
    if (!m) { return String(iso || ""); }
    return m[3] + "/" + m[2] + "/" + m[1] + " " + m[4] + ":" + m[5];
  }

  global.Validate = {
    DDDS_VALIDOS: DDDS_VALIDOS,
    escapeHtml: escapeHtml,
    contarCaracteres: contarCaracteres,
    normalizarTexto: normalizarTexto,
    mascararTelefone: mascararTelefone,
    validarTelefone: validarTelefone,
    validarNome: validarNome,
    validarEmail: validarEmail,
    formatarBRL: formatarBRL,
    observacaoTemTermoSensivel: observacaoTemTermoSensivel,
    redigirObservacao: redigirObservacao,
    guardarCsv: guardarCsv,
    sha256Hex: sha256Hex,
    sha256HexSync: sha256HexSync,
    gerarIdAleatorio: gerarIdAleatorio,
    isoComFuso: isoComFuso,
    dataHoraCurta: dataHoraCurta
  };
})(typeof window !== "undefined" ? window : globalThis);
