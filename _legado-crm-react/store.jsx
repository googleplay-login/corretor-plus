import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { uid, addMonths } from './format'

// ============================================================
// SEED — dados de exemplo realistas (operadoras, planos, preços,
// clientes, leads, comissões, renovações, artigos ANS, prazos)
// ============================================================

const OP = (id, nome, nota, rec, prazo) => ({
  id, nome, avaliacao_geral: nota, num_reclamacoes_ano: rec,
  prazo_pagamento_comissao: prazo, cor_destaque: '#0e7ea6', ativo: true,
})

const PLANO = (o) => ({ ...o, ativo: true })

// preços base por faixa (plausíveis, valores indicativos)
const PRECO = (planoId, base) => {
  // base = preço da faixa mais barata (0-18); gera progressão realista por idade
  const fatores = [1, 1.06, 1.13, 1.22, 1.34, 1.5, 1.72, 2.02, 2.45, 3.1]
  return FAIXASFB().map((f, i) => ({
    plano_id: planoId, faixa_etaria: f,
    valor: Math.round(base * fatores[i]),
  }))
}
function FAIXASFB(){ return ['0 a 18','19 a 23','24 a 28','29 a 33','34 a 38','39 a 43','44 a 48','49 a 53','54 a 58','59+'] }

function buildSeed() {
  const operadoras = [
    OP('op-unimed', 'Unimed Nacional', 4.4, 210, '30 dias'),
    OP('op-amil', 'Amil Dental/Amil Saúde', 3.6, 980, '45 dias'),
    OP('op-hapvida', 'Hapvida NotreDame', 3.5, 1240, '30 dias'),
    OP('op-sulamerica', 'SulAmérica Saúde', 4.2, 430, '45 dias'),
    OP('op-bradesco', 'Bradesco Saúde', 4.0, 610, '45 dias'),
  ]

  const planos = [
    PLANO({ id: 'pl-uni-nat', operadora_id: 'op-unimed', nome: 'Unimed Nacional Pleno', modalidade: 'INDIVIDUAL', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Consultas 30 / PN 180 (conforme regra ANS)', rede_num_hospitais: 1200, reajuste_estimado_anual: 0.19, publico: 'Famílias' }),
    PLANO({ id: 'pl-uni-conforto', operadora_id: 'op-unimed', nome: 'Unimed Essencial Regional', modalidade: 'INDIVIDUAL', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'SP capital', coparticipacao: '20% consultas/exames', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Consultas 30 / PN 180', rede_num_hospitais: 240, reajuste_estimado_anual: 0.17, publico: 'Individual' }),
    PLANO({ id: 'pl-uni-pme', operadora_id: 'op-unimed', nome: 'Unimed PME Coletivo', modalidade: 'PME', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: 'None (sem carência em algumas)', carencia_partos: 'Conforme RN', rede_num_hospitais: 900, reajuste_estimado_anual: 0.22, publico: 'PME' }),
    PLANO({ id: 'pl-amil-ess', operadora_id: 'op-amil', nome: 'Amil Essencial', modalidade: 'INDIVIDUAL', abrangencia: 'AMBULATORIAL', regiao_atendida: 'SP capital', coparticipacao: '30% exames', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Conforme RN', rede_num_hospitais: 180, reajuste_estimado_anual: 0.2, publico: 'Individual' }),
    PLANO({ id: 'pl-hap-vida', operadora_id: 'op-hapvida', nome: 'Hapvida Essencial', modalidade: 'INDIVIDUAL', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Conforme RN', rede_num_hospitais: 420, reajuste_estimado_anual: 0.21, publico: 'Famílias' }),
    PLANO({ id: 'pl-sul-pleno', operadora_id: 'op-sulamerica', nome: 'SulAmérica Pleno', modalidade: 'INDIVIDUAL', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Consultas 30 / PN 180', rede_num_hospitais: 760, reajuste_estimado_anual: 0.18, publico: 'Famílias' }),
    PLANO({ id: 'pl-sul-pme', operadora_id: 'op-sulamerica', nome: 'SulAmérica PME Plus', modalidade: 'PME', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: 'None', carencia_partos: 'Conforme RN', rede_num_hospitais: 700, reajuste_estimado_anual: 0.24, publico: 'PME' }),
    PLANO({ id: 'pl-brd-esp', operadora_id: 'op-bradesco', nome: 'Bradesco Saúde Especial', modalidade: 'INDIVIDUAL', abrangencia: 'HOSPITALAR_AMBULATORIAL', regiao_atendida: 'Nacional', coparticipacao: 'Sem', franquia: 'Sem', carencia_geral: '30 dias', carencia_partos: 'Consultas 30 / PN 180', rede_num_hospitais: 500, reajuste_estimado_anual: 0.19, publico: 'Famílias' }),
  ]

  const precos = []
  const bases = { 'pl-uni-nat': 380, 'pl-uni-conforto': 250, 'pl-uni-pme': 220, 'pl-amil-ess': 180, 'pl-hap-vida': 210, 'pl-sul-pleno': 330, 'pl-sul-pme': 260, 'pl-brd-esp': 310 }
  Object.entries(bases).forEach(([k, b]) => precos.push(...PRECO(k, b)))

  const hoje = new Date()
  const iso = (addM) => { const d = new Date(); d.setMonth(d.getMonth() + addM); return d.toISOString().slice(0, 10) }

  const clientes = [
    { id: uid(), tipo: 'PF', nome_titular: 'Maria Fernandes', documento: '123.456.789-01', email: 'maria.f@gmail.com', whatsapp: '5511999990001', cidade: 'São Paulo', uf: 'SP', data_nascimento_titular: '1978-05-12', status: 'ATIVO', origem: 'INDICACAO', observacoes: 'Prefere rede perto de casa, zona leste.', proximo_contato: iso(1), criado_em: iso(-8) },
    { id: uid(), tipo: 'PJ', nome_titular: 'Padaria Pão Dourado Ltda', documento: '12.345.678/0001-90', email: 'contato@paodourado.com', whatsapp: '5511988880002', cidade: 'Campinas', uf: 'SP', data_nascimento_titular: null, status: 'ATIVO', origem: 'SITE', observacoes: '15 vidas; analisando PME.', proximo_contato: iso(0.2), criado_em: iso(-2) },
    { id: uid(), tipo: 'PF', nome_titular: 'João Pereira', documento: '987.654.321-00', email: 'joao.p@yahoo.com', whatsapp: '5511977770003', cidade: 'Osasco', uf: 'SP', data_nascimento_titular: '1985-11-02', status: 'EM_ANALISE', origem: 'GOOGLE', observacoes: 'Pediu opção com coparticipação.', proximo_contato: iso(0.6), criado_em: iso(-0.5) },
  ]

  const beneficiarios = [
    { id: uid(), cliente_id: clientes[0].id, nome: 'Maria Fernandes', data_nascimento: '1978-05-12', parentesco: 'TITULAR', sexo: 'F' },
    { id: uid(), cliente_id: clientes[0].id, nome: 'Carlos Fernandes', data_nascimento: '1976-01-20', parentesco: 'CONJUGE', sexo: 'M' },
    { id: uid(), cliente_id: clientes[0].id, nome: 'Ana Fernandes', data_nascimento: '2005-09-15', parentesco: 'FILHO', sexo: 'F' },
  ]

  const contratos = [
    { id: uid(), cliente_id: clientes[0].id, operadora_id: 'op-unimed', plano_id: 'pl-uni-nat', numero_apolice: 'UNI-22331', inicio_vigencia: iso(-10), fim_vigencia: iso(2), mensalidade_total: 1180, modalidade: 'INDIVIDUAL', coparticipacao: 'Sem', status: 'ATIVO', valor_reajuste_ultimo: 0.17, data_reajuste_ultimo: iso(-6), observacoes: 'Cliente satisfeito, mas comparando.' },
    { id: uid(), cliente_id: clientes[1].id, operadora_id: 'op-sulamerica', plano_id: 'pl-sul-pme', numero_apolice: 'SUL-77120', inicio_vigencia: iso(-4), fim_vigencia: iso(3), mensalidade_total: 3400, modalidade: 'PME', coparticipacao: 'Sem', status: 'ATIVO', valor_reajuste_ultimo: 0.24, data_reajuste_ultimo: iso(-1), observacoes: 'PME 15 vidas.' },
    { id: uid(), cliente_id: clientes[2].id, operadora_id: 'op-amil', plano_id: 'pl-amil-ess', numero_apolice: 'AMI-44509', inicio_vigencia: iso(-3), fim_vigencia: iso(0.9), mensalidade_total: 540, modalidade: 'INDIVIDUAL', coparticipacao: '30% exames', status: 'EM_RENOVACAO', valor_reajuste_ultimo: 0.2, data_reajuste_ultimo: iso(-2), observacoes: 'Comparando opções para não renovar.' },
  ]

  const leads = [
    { id: uid(), nome_contato: 'Roberto Alves', telefone_whatsapp: '5511966660004', email: 'r.alves@hotmail.com', cidade: 'São Paulo', uf: 'SP', tipo: 'PF', origem: 'INSTAGRAM', operadora_interesse: 'Unimed', orcamento_estimado: 900, rede_preferida: 'Próximo à Paulista', status: 'QUALIFICADO', ultimo_contato: new Date(Date.now() - 3 * 86400000).toISOString(), proximo_contato: new Date(Date.now() + 1 * 86400000).toISOString(), proximo_passo: 'Enviar comparativo de 2 planos', criado_em: iso(-0.4) },
    { id: uid(), nome_contato: 'Fernanda Souza', telefone_whatsapp: '5511955550005', email: 'fe.souza@gmail.com', cidade: 'Guarulhos', uf: 'SP', tipo: 'PF', origem: 'INDICACAO', operadora_interesse: 'SulAmérica', orcamento_estimado: 1200, status: 'EM_COTACAO', ultimo_contato: new Date(Date.now() - 6 * 86400000).toISOString(), proximo_contato: null, proximo_passo: 'Enviar valores', criado_em: iso(-1) },
    { id: uid(), nome_contato: 'Paulo Mendes', telefone_whatsapp: '5511944440006', email: 'paulo.m@outlook.com', cidade: 'Campinas', uf: 'SP', tipo: 'PJ', origem: 'SITE', operadora_interesse: 'Hapvida', orcamento_estimado: 5000, status: 'NOVO', ultimo_contato: new Date(Date.now() - 8 * 86400000).toISOString(), proximo_contato: null, proximo_passo: 'Qualificar (8 vidas)', criado_em: iso(-0.3) },
    { id: uid(), nome_contato: 'Luciana Costa', telefone_whatsapp: '5511933330007', email: 'lu.costa@gmail.com', cidade: 'São Paulo', uf: 'SP', tipo: 'PF', origem: 'GOOGLE', status: 'PROPOSTA_ENVIADA', ultimo_contato: new Date(Date.now() - 1 * 86400000).toISOString(), proximo_contato: new Date(Date.now() + 2 * 86400000).toISOString(), proximo_passo: 'Acompanhar resposta da proposta', criado_em: iso(-0.7) },
  ]

  const comissoes = [
    { id: uid(), cliente_id: clientes[0].id, contrato_id: contratos[0].id, operadora_id: 'op-unimed', plano_id: 'pl-uni-nat', modalidade_comissao: 'RECORRENTE', percentual: 2.5, valor_por_parcela: Math.round(1180 * 0.025), quantidade_parcelas: 12, periodicidade: 'MENSAL', data_previsao_primeira: iso(0), status: 'A_RECEBER', criado_em: iso(-10) },
    { id: uid(), cliente_id: clientes[0].id, contrato_id: contratos[0].id, operadora_id: 'op-unimed', plano_id: 'pl-uni-nat', modalidade_comissao: 'RECORRENTE', percentual: 2.5, valor_por_parcela: Math.round(1180 * 0.025), quantidade_parcelas: 12, periodicidade: 'MENSAL', data_previsao_primeira: iso(-1), status: 'PAGA', valor_pago: Math.round(1180 * 0.025), data_pagamento: iso(-0.8) },
    { id: uid(), cliente_id: clientes[1].id, contrato_id: contratos[1].id, operadora_id: 'op-sulamerica', plano_id: 'pl-sul-pme', modalidade_comissao: 'AGENCIAMENTO', percentual: 8, valor_por_parcela: 272, quantidade_parcelas: 24, periodicidade: 'MENSAL', data_previsao_primeira: iso(0), status: 'PREVISTA', criado_em: iso(-4) },
    { id: uid(), cliente_id: clientes[2].id, contrato_id: contratos[2].id, operadora_id: 'op-amil', plano_id: 'pl-amil-ess', modalidade_comissao: 'RECORRENTE', percentual: 3, valor_por_parcela: Math.round(540 * 0.03), quantidade_parcelas: 12, periodicidade: 'MENSAL', data_previsao_primeira: iso(-1), status: 'PAGA', valor_pago: 13, // glosa (esperado 16)
    data_pagamento: iso(-0.8), observacoes: 'Possível glosa: valor menor que o previsto.' },
  ]

  const artigos = [
    { id: uid(), titulo: 'Carências: o que é e como explicar', categoria: 'CARENCIA', resumo: 'Conceito de carência, tipos e prazos comuns.', conteudo: 'Carência é o período que o beneficiário espera antes de usar determinadas coberturas. As mais comuns: 24h/urgência-emergência, 30 dias para planos com rede, 180 dias para parto (após o período de carência), conforme regras da ANS. Planos coletivos/PME costumam ter carência reduzida.', bloco_como_explicar: 'Diga: "o título da carência é o tempo que você precisa esperar para usar. Na emergência é praticamente imediata; para parto são alguns meses."', fonte: 'ANS RN 465' },
    { id: uid(), titulo: 'Portabilidade de carência', categoria: 'PORTABILIDADE', resumo: 'Trocar de plano sem perder carência.', conteudo: 'A portabilidade permite mudar de operadora mantendo o tempo de carência já cumprido, desde que o plano de destino seja compatível e haja regra de compatibilidade definida pela ANS. Vale para quem cumpre prazos mínimos.', bloco_como_explicar: '"Você pode trocar de plano mantendo o que já cumpriu, se o novo plano tiver nível igual ou superior."', fonte: 'ANS RN 465' },
    { id: uid(), titulo: 'Reajuste anual: individual, coletivo e PME', categoria: 'REAJUSTE', resumo: 'Diferenças entre os tipos de reajuste.', conteudo: 'Planos individuais/familiares têm reajuste com teto definido pela ANS (por faixa etária e índice). Planos coletivos (empresariais e PME) negociam livremente, mas recentemente a regulamentação tem alterado regras, com limites por procedimento e tetos. Por isso sempre confirme no contrato.', bloco_como_explicar: '"No individual a ANS limita o percentual. No coletivo, negocie — qualquer aumento passa de 15% ao ano merece revisão."', fonte: 'ANS' },
    { id: uid(), titulo: 'Coparticipação e franquia', categoria: 'REAJUSTE', resumo: 'Como funciona o fator moderador.', conteudo: 'Coparticipação é um percentual que o beneficiário paga em cada uso (ex: 30% de um exame). Franquia é um valor anual a partir do qual o plano passa a cobrir integralmente. Reduzem a mensalidade, mas aumentam o custo no uso.', bloco_como_explicar: '"É mais barato por mês, mas você paga um pedaço em cada consulta. Funciona se você não usa muito."', fonte: 'ANS' },
    { id: uid(), titulo: 'Rol de cobertura ANS', categoria: 'COBERTURA_ROL', resumo: 'O que o plano é obrigado a cobrir.', conteudo: 'O rol é a lista de procedimentos, exames e tratamentos que os planos devem cobrir. Foi ampliado ao longo dos anos (incluindo vacinas, terapias e casos de TEA). Negativa fora dessa lista é irregularidade grave, cabendo reclamação e, se preciso, judicialização.', bloco_como_explicar: '"O plano é obrigado a cobrir o que está no rol da ANS. Se negar indevidamente, a gente reclama no canal oficial da ANS."', fonte: 'ANS' },
    { id: uid(), titulo: 'Negativa de cobertura e como contestar', categoria: 'NEGATIVA_COBERTURA', resumo: 'Passo a passo para reclamar na ANS.', conteudo: 'Registre a negativa (nova regra exige reduzir a termo). Primeiro conteste na ouvidoria da operadora; depois acione a ANS via canal oficial (NIP). Se nada resolver, há caminho judicial. O corretor pode orientar e documentar.', bloco_como_explicar: '"Antes de tudo, a negativa tem que estar por escrito. Depois reclamamos e, se precisar, nós acionamos a ANS."', fonte: 'ANS / RN 465' },
    { id: uid(), titulo: 'Reembolso', categoria: 'REEMBOLSO', resumo: 'Como solicitar devolução de despesas fora da rede.', conteudo: 'Quando não há atendimento credenciado, o beneficiário pode pagar e pedir reembolso conforme o contrato. Demora e burocracia são as reclamações mais comuns. Documente tudo e acompanhe os prazos contratuais.', bloco_como_explicar: '"Você paga e a operadora devolve, mas guarde todos os comprovantes; a demora é o ponto fraco."', fonte: 'Contrato / ANS' },
    { id: uid(), titulo: 'Contrato individual e familiar', categoria: 'CONTRATOS', resumo: 'Regras específicas de contratos pessoa física.', conteudo: 'Contratos individuais/familiares têm mais proteção (reajuste limitado pela ANS, direito de permanência). Não podem ser cancelados unilateralmente sem justa causa grave. O corretor deve explicar as vantagens do vínculo individual.', bloco_como_explicar: '"No individual você tem mais garantias, e a ANS limita o aumento — bom para quem quer segurança."', fonte: 'ANS' },
    { id: uid(), titulo: 'Venda online de planos', categoria: 'COMERCIALIZACAO', resumo: 'Regras e cuidados na venda digital.', conteudo: 'A ANS regulamentou a venda online com regras de transparência, contrato eletrônico e direito de arrependimento em certos casos. O corretor que atua de forma online deve seguir a mesma legislação e reforçar a comunicação clara.', bloco_como_explicar: '"Dá para contratar pelo celular com as mesmas garantias, só confira se o canal é autorizado."', fonte: 'ANS' },
    { id: uid(), titulo: 'Suspensão e cancelamento', categoria: 'DIREITOS', resumo: 'Quando o plano pode ser suspenso ou cancelado.', conteudo: 'O plano pode ser suspenso por inadimplemento em condições definidas, e cancelado unilateralmente apenas em casos graves (fraude), salvo coletivos no fim da vigência. Beneficiário pode pedir portabilidade e suspensão com regras próprias.', bloco_como_explicar: '"O plano não pode te largar sem motivo. Se quer cancelar, me avisa com antecedência para não perder carência."', fonte: 'ANS' },
    { id: uid(), titulo: 'TEA e terapias', categoria: 'TEA_TERAPIAS', resumo: 'Cobertura de tratamentos para autismo.', conteudo: 'O rol passou a incluir tratamentos multidisciplinares de TEA (Transtorno do Espectro Autista): psicólogo, fono, T.O. e terapias. É um dos maiores motivos de reclamação recente, com impacto de custos elevados.', bloco_como_explicar: '"As terapias de apoio para autismo são cobertas; verifique a quantidade e o limite no seu plano."', fonte: 'ANS' },
    { id: uid(), titulo: 'Direitos do beneficiário', categoria: 'DIREITOS', resumo: 'Síntese dos direitos principais.', conteudo: 'Rede credenciada, cobertura do rol, reajuste regulado (individual), escolha de médico (com regras), atendimento de urgência/emergência 24h, atendimento fora da cidade em viagem, entre outros. O corretor é peça-chave para informar.', bloco_como_explicar: '"Você tem rede, rol, 24h emergência e limitação de reajuste. A gente garante que você não seja passado para trás."', fonte: 'ANS' },
  ]

  const prazos = [
    { id: uid(), contexto: 'Carência urgência/emergência', regra_texto: '24h', detalhe: 'Cobertura de urgência e emergência é imediata (salvo situações específicas).', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Carência planos com rede', regra_texto: '30 dias', detalhe: 'Prazo comum para usar serviços credenciados.', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Carência parto', regra_texto: '180 dias', detalhe: 'Para parto (contado após cumprimento do período de carência).', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Carência cirurgia', regra_texto: '180 dias', detalhe: 'Cirurgias eletivas e procedimentos de alta complexidade.', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Carência consulta/exame simples', regra_texto: '30 dias', detalhe: 'Consultas e exames simples, conforme plano.', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Portabilidade de carência', regra_texto: 'Prazos mínimos', detalhe: 'Mantém carência cumprida ao trocar para plano compatível.', fonte: 'ANS RN 465' },
    { id: uid(), contexto: 'Reajuste individual', regra_texto: 'Teto ANS', detalhe: 'Reajuste por faixa etária/anual limitado pela ANS.', fonte: 'ANS' },
    { id: uid(), contexto: 'Reajuste coletivo/PME', regra_texto: 'Negociado', detalhe: 'Livre negociação entre as partes; confirme no contrato.', fonte: 'ANS' },
  ]

  const templates = [
    { id: uid(), nome: 'Primeiro contato', texto: 'Olá {{nome}}, sou corretor de planos de saúde. Vi seu interesse e gostaria de entender melhor sua necessidade. Posso te ajudar a economizar e encontrar o plano ideal? 😊' },
    { id: uid(), nome: 'Follow-up', texto: 'Olá {{nome}}, tudo bem? Estou acompanhando sua cotação do plano {{plano}}. Posso te enviar os valores? Disponibilidade hoje?' },
    { id: uid(), nome: 'Proposta', texto: 'Olá {{nome}}, segui com o comparativo. A opção {{plano}} ficou com mensalidade {{valor}} e rede bem próxima de você. Quer que eu detalhe?' },
    { id: uid(), nome: 'Reajuste', texto: 'Olá {{nome}}, chegou o reajuste do seu plano. Vejo que dá para negociar uma opção melhor. Podemos conversar?' },
    { id: uid(), nome: 'Renovação', texto: 'Olá {{nome}}, seu plano renova em breve. Posso verificar se ainda está valendo a pena ou se há uma opção melhor? 🚀' },
  ]

  return {
    perfil: { nome: 'Carlos Souza', email: 'carlos@corretor.com', registro_susep: 'COR-125487', whatsapp: '5511987650000', cidade: 'São Paulo', uf: 'SP', fantasia: 'Carlos Souza Corretor', corretora: '' },
    operadoras, planos, precos, clientes, beneficiarios, contratos, leads, comissoes, artigos, prazos, templates,
    renovacoes: [], metas: [{ id: uid(), ano: 2026, mes: 9, meta_valor: 6000 }], interacoes: [],
  }
}

const KEY = 'corretor_mais_v1'
const AUTH_KEY = 'corretor_mais_auth'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  const seed = buildSeed()
  try { localStorage.setItem(KEY, JSON.stringify(seed)) } catch (e) {}
  return seed
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load)
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === '1')

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) {}
  }, [db])

  const set = (fn) => setDb((p) => (typeof fn === 'function' ? fn(p) : fn))
  const login = () => { localStorage.setItem(AUTH_KEY, '1'); setAuthed(true) }
  const logout = () => { localStorage.removeItem(AUTH_KEY); setAuthed(false) }
  const resetDemo = () => { const s = buildSeed(); setDb(s) }

  const value = useMemo(() => ({ db, set, authed, login, logout, resetDemo }), [db, authed])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
