/* ============================================================
   data/mercado.js - REFERENCIA INTERNA DO CORRETOR.
   Os valores abaixo sao REFERENCIA DE MERCADO, NAO E OFERTA:
   servem apenas para (a) classificar o encaixe do orcamento do lead
   (bom / apertado / fora) e (b) alerta interno no painel do corretor.
   JAMAIS sao exibidos para o lead como preco.
   config.exibirFaixaMercado = false por padrao: a tela de
   confirmacao (8b) nao exibe nenhum valor.
   ============================================================ */
window.DATA_MERCADO = {
  aviso: "referência de mercado, não é oferta",
  /* Piso estimado de mensalidade por FAIXA ETARIA MAXIMA do grupo.
     Chave = faixa etaria (padrao ANS). Valor = reais (numero inteiro). */
  pisoPorFaixa: {
    "0-18": 300,
    "19-23": 350,
    "24-28": 400,
    "29-33": 480,
    "34-38": 550,
    "39-43": 650,
    "44-48": 800,
    "49-53": 1000,
    "54-58": 1200,
    "59+": 1600
  },
  /* Limite do encaixe "apertado": orcamento entre 70% do piso e o piso.
     Abaixo de 70% = "fora". Acima ou igual ao piso = "bom". */
  pctApertado: 0.7
};
