import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Select, Field, Modal, useToast, Empty } from '../ui.jsx'
import { brl, pct, faixaDeIdade, idadeDeNascimento, FAIXAS, uid, todayISO, dateBR } from '../format.js'

// calcula mensalidade somando por faixa etária
export function calcularMensalidade(plano, precos, faixas) {
  // faixas: [{faixa, qtd}]
  let tot = 0
  faixas.forEach((f) => {
    const p = precos.find((x) => x.plano_id === plano.id && x.faixa_etaria === f.faixa)
    if (p) tot += p.valor * (f.qtd || 1)
  })
  return tot
}
const faixasDeIdades = (idades) => {
  const counts = {}
  idades.forEach((i) => { const f = faixaDeIdade(idadeDeNascimento(i)); counts[f] = (counts[f] || 0) + 1 })
  return Object.entries(counts).map(([faixa, qtd]) => ({ faixa, qtd }))
}

export default function Cotacao({ go }) {
  const { db, set } = useStore()
  const toast = useToast()
  const [tipo, setTipo] = useState('PF')
  const [idades, setIdades] = useState([])
  const [faixas, setFaixas] = useState([{ faixa: '0 a 18', qtd: 1 }])
  const [nVidas, setNVidas] = useState(1)
  const [cidade, setCidade] = useState('São Paulo')
  const [uf, setUf] = useState('SP')
  const [orcamento, setOrcamento] = useState(1500)
  const [sel, setSel] = useState([])
  const [compare, setCompare] = useState(null)
  const [modoFaixa, setModoFaixa] = useState('idade')

  const results = useMemo(() => {
    let fs
    if (tipo === 'PJ') fs = [{ faixa: '0 a 18', qtd: nVidas }]
    else fs = modoFaixa === 'idade' ? faixasDeIdades(idades) : faixas
    if (fs.length === 0) return []
    return db.planos.filter((p) => p.ativo).map((p) => {
      const tot = calcularMensalidade(p, db.precos, fs)
      const op = db.operadoras.find((o) => o.id === p.operadora_id)
      const dentro = orcamento ? tot <= orcamento : true
      const notaOk = (op?.avaliacao_geral || 0) >= 3.5
      const redeOk = (p.rede_num_hospitais || 0) >= 300 || (p.regiao_atendida || '').includes('SP')
      const recomendo = dentro && notaOk && redeOk
      return { ...p, op, total: tot, dentro, recomendo }
    }).filter((x) => x.total > 0)
  }, [db.planos, db.precos, db.operadoras, tipo, idades, faixas, nVidas, orcamento, modoFaixa])

  const setOrDefault = (id) => {
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : (s.length < 3 ? [...s, id] : (toast('Máx. de 3 para comparar', 'error'), s)))
  }

  const saveCotacao = () => {
    const fs = tipo === 'PJ' ? [{ faixa: '0 a 18', qtd: nVidas }] : (modoFaixa === 'idade' ? faixasDeIdades(idades) : faixas)
    const id = uid()
    const items = results.map((r) => ({ id: uid(), plano_id: r.id, valor_por_vida: Math.round((r.total) / Math.max(1, fs.reduce((s, f) => s + f.qtd, 0))), valor_total: r.total, selecionado_para_comparar: sel.includes(r.id), recomendo: r.recomendo }))
    set((p) => ({ ...p, cotacoes: [{ id, tipo, cidade: `${cidade}/${uf}`, quantidade_vidas: fs.reduce((s, f) => s + f.qtd, 0), faixas_etarias: fs, orcamento_maximo: orcamento, criado_em: todayISO(), status: 'EM_ANALISE' }, ...(p.cotacoes || [])], itens_cotacao: [...(p.itens_cotacao || []), ...items] }))
    toast('Cotação salva')
  }

  const makeProposta = () => {
    const chosen = results.filter((r) => sel.includes(r.id))
    if (chosen.length === 0) return toast('Selecione ao menos 1 plano', 'error')
    set((p) => ({ ...p, propostas: [{ id: uid(), titulo: `Proposta para ${tipo === 'PJ' ? 'empresa' : 'família'} — ${cidade}`, estilo: 'EXECUTIVO', status: 'RASCUNHO', criado_em: todayISO(), conteudo: { tipo, cidade, uf, opcoes: chosen.map((c) => ({ plano: c.nome, operadora: c.op?.nome, modalidade: c.modalidade, mensalidade: c.total, carencia: c.carencia_geral, rede: c.rede_num_hospitais, coparticipacao: c.coparticipacao, reajuste: c.reajuste_estimado_anual, recomendado: c.recomendo })) } }, ...(p.propostas || [])] }))
    toast('Proposta gerada! Veja na aba Propostas')
  }

  const opById = db.operadoras
  const colors = { 'op-unimed': '#0aa5a3', 'op-sulamerica': '#0e7ea6', 'op-amil': '#e11d48', 'op-hapvida': '#0891b2', 'op-bradesco': '#d97706' }

  const comparePlans = results.filter((r) => sel.includes(r.id))

  return (
    <div>
      <div className="flex between wrap mb">
        <div className="card" style={{ padding: '14px 18px' }}>
          <div className="text-sm text-muted">Cotações salvas</div>
          <div className="flex" style={{ gap: 6 }}>
            <div className="text-sm" style={{ fontWeight: 800 }}>{db.cotacoes?.length || 0}</div>
          </div>
        </div>
        <div className="flex">
          <button className="btn ghost" onClick={makeProposta}><Icon name="doc" size={17}/> Gerar proposta {sel.length ? `(${sel.length})` : ''}</button>
          <button className="btn" onClick={saveCotacao}><Icon name="save" size={17}/> Salvar cotação</button>
        </div>
      </div>

      <div className="card mb">
        <div className="section-title">Dados da cotação</div>
        <div className="flex wrap" style={{ gap: 16 }}>
          <div className="pill-toggle">
            <button className={tipo === 'PF' ? 'on' : ''} onClick={() => setTipo('PF')}>Pessoa física / família</button>
            <button className={tipo === 'PJ' ? 'on' : ''} onClick={() => setTipo('PJ')}>Empresa / PME</button>
          </div>
          <Field label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Field label="UF" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} style={{ maxWidth: 80 }} />
          <Field label="Orçamento máx. (R$)" type="number" value={orcamento} onChange={(e) => setOrcamento(Number(e.target.value))} style={{ maxWidth: 150 }} />
        </div>

        {tipo === 'PJ' && <div className="flex mt"><Field label="Nº de vidas" type="number" value={nVidas} onChange={(e) => setNVidas(Number(e.target.value))} style={{ maxWidth: 150 }} /></div>}

        {tipo === 'PF' && (
          <div className="mt">
            <div className="flex between mb">
              <div className="section-title" style={{ margin: 0 }}>Beneficiários</div>
              <button className="btn ghost sm" onClick={() => setIdades([...idades, '1990-01-01'])}><Icon name="plus" size={15}/> Adicionar</button>
            </div>
            {idades.length === 0 && <div className="text-sm text-muted mb">Adicione as idades (ou datas de nascimento) dos beneficiários para calcular a mensalidade por faixa da ANS.</div>}
            {idades.map((i, idx) => (
              <div key={idx} className="row">
                <div className="grow">
                  <Field label={`Beneficiário ${idx + 1} — data de nascimento`} type="date" value={i} onChange={(e) => { const a = [...idades]; a[idx] = e.target.value; setIdades(a) }} />
                  <div className="text-sm text-muted">Faixa: {idadeDeNascimento(i) != null ? faixaDeIdade(idadeDeNascimento(i)) : '?'} · {idadeDeNascimento(i) != null ? idadeDeNascimento(i) + ' anos' : ''}</div>
                </div>
                <button className="btn icon ghost sm" onClick={() => setIdades(idades.filter((_, x) => x !== idx))}><Icon name="trash" size={16}/></button>
              </div>
            ))}
            <div className="text-sm text-muted mt">Ou informe diretamente por faixa:</div>
            <div className="flex wrap mt" style={{ gap: 10 }}>
              <Select label="Faixa" value={faixas[0].faixa} onChange={(e) => setFaixas([{ faixa: e.target.value, qtd: faixas[0].qtd }])}>
                {FAIXAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Field label="Qtd. de vidas" type="number" value={faixas[0].qtd} onChange={(e) => setFaixas([{ faixa: faixas[0].faixa, qtd: Math.max(1, Number(e.target.value)) }])} style={{ maxWidth: 120 }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex between mb">
        <div className="section-title">Planos encontrados ({results.length})</div>
        <div className="text-sm text-muted">Valores indicativos</div>
      </div>

      <div className="grid cols-3">
        {results.map((r) => {
          const isSel = sel.includes(r.id)
          return (
            <div key={r.id} className={`card plan-card ${isSel ? 'sel' : ''} ${r.recomendo ? 'reco' : ''}`} onClick={() => setOrDefault(r.id)}>
              <div className="flex between mb">
                <span className="text-sm" style={{ fontWeight: 800, color: colors[r.operadora_id] }}>{r.op?.nome}</span>
                <div className="flex" style={{ gap: 6 }}>
                  {r.recomendo && <span className="badge teal">Recomendado</span>}
                  {!r.dentro && <span className="badge amber">Acima do orçamento</span>}
                </div>
              </div>
              <div className="section-title" style={{ margin: 0 }}>{r.nome}</div>
              <div className="text-sm text-muted mb">{r.modalidade.toLowerCase()} · {r.abrangencia.toLowerCase().replace('_', ' ')} · {r.regiao_atendida}</div>
              <div className="price">{brl(r.total)}<span className="text-sm text-muted">/mês</span></div>
              <div className="divider" style={{ margin: '10px 0' }} />
              <div className="stack" style={{ fontSize: 13 }}>
                <div className="flex between"><span className="text-muted">Rede</span><span>{r.rede_num_hospitais}+ unidades</span></div>
                <div className="flex between"><span className="text-muted">Carência</span><span>{r.carencia_geral}</span></div>
                <div className="flex between"><span className="text-muted">Coparticipação</span><span>{r.coparticipacao}</span></div>
                <div className="flex between"><span className="text-muted">Reajuste anual</span><span>{pct(r.reajuste_estimado_anual)}</span></div>
                <div className="flex between"><span className="text-muted">Nota operadora</span><span>★ {r.op?.avaliacao_geral} · {r.op?.num_reclamacoes_ano} reclam.</span></div>
              </div>
              <div className="mt flex" style={{ gap: 8 }}>
                {isSel && <span className="badge blue"><Icon name="check" size={13}/> na comparação</span>}
              </div>
            </div>
          )
        })}
      </div>
      {results.length === 0 && <Empty icon="search" title="Nenhum plano" sub="Ajuste os dados da cotação." />}

      <div className="divider" />
      <div className="text-sm text-muted">⚠ Valores indicativos de mercado. Confirme sempre o contrato e a tabela vigente da operadora.</div>

      <Modal open={comparePlans.length >= 2} onClose={() => setCompare(false)} title="Comparar planos" wide>
        <table className="table cmp-table">
          <thead><tr><th></th>{comparePlans.map((r) => <th key={r.id} style={{ textAlign: 'center' }}>{r.nome}</th>)}</tr></thead>
          <tbody>
            <tr><td className="text-muted">Operadora</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.op?.nome}</td>)}</tr>
            <tr><td className="text-muted">Modalidade</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.modalidade.toLowerCase()}</td>)}</tr>
            <tr><td className="text-muted">Abrangência</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.abrangencia.toLowerCase().replace('_', ' ')}</td>)}</tr>
            <tr><td className="text-muted">Mensalidade</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center', fontWeight: 800, color: 'var(--brand-2)' }}>{brl(r.total)}</td>)}</tr>
            <tr><td className="text-muted">Rede</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.rede_num_hospitais}+</td>)}</tr>
            <tr><td className="text-muted">Carência</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.carencia_geral}</td>)}</tr>
            <tr><td className="text-muted">Coparticipação</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.coparticipacao}</td>)}</tr>
            <tr><td className="text-muted">Reajuste anual</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{pct(r.reajuste_estimado_anual)}</td>)}</tr>
            <tr><td className="text-muted">Recomendado</td>{comparePlans.map((r) => <td key={r.id} style={{ textAlign: 'center' }}>{r.recomendo ? '✔' : '—'}</td>)}</tr>
          </tbody>
        </table>
      </Modal>
    </div>
  )
}
