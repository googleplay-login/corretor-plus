import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Modal, Field, Select, useToast, Empty } from '../ui.jsx'
import { brl, pct, uid, todayISO, addMonths } from '../format.js'
import { downloadCsv } from './Clientes.jsx'

// tabela de estorno default (decrescente)
const ESTORNO_DEFAULT = [
  { ateMes: 12, pct: 0.75 }, { ateMes: 18, pct: 0.5 }, { ateMes: 24, pct: 0.35 }, { ateMes: 30, pct: 0.25 }, { ateMes: 36, pct: 0.15 },
]

const STATUS_OPT = ['PREVISTA', 'A_RECEBER', 'PAGA', 'EM_ATRASO', 'GLOSADA', 'ESTORNADA']
const empty = { cliente_id: '', operadora_id: '', plano_id: '', modalidade_comissao: 'RECORRENTE', percentual: '', valor_por_parcela: '', quantidade_parcelas: 12, periodicidade: 'MENSAL', status: 'A_RECEBER', observacoes: '' }

export default function Comissoes() {
  const { db, set } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [calcPercent, setCalcPercent] = useState(2.5)
  const [calcMensal, setCalcMensal] = useState(1000)
  const [estMeses, setEstMeses] = useState(12)

  const calcValorParcela = (mensal, pct) => Math.round(mensal * (pct / 100))

  const list = useMemo(() => db.comissoes, [db.comissoes])
  const totalPrevisto = list.reduce((s, x) => s + x.valor_por_parcela * x.quantidade_parcelas, 0)
  const totalPago = list.filter((x) => x.status === 'PAGA').reduce((s, x) => s + (x.valor_pago || 0), 0)
  const aReceber = list.filter((x) => x.status === 'A_RECEBER' || x.status === 'EM_ATRASO').reduce((s, x) => s + x.valor_por_parcela, 0)

  const save = () => {
    if (!form.cliente_id || !form.operadora_id) return toast('Escolha cliente e operadora', 'error')
    set((p) => ({ ...p, comissoes: [{ ...form, id: uid(), valor_por_parcela: form.valor_por_parcela || calcValorParcela(calcMensal, form.percentual), data_previsao_primeira: todayISO(), criado_em: todayISO() }, ...p.comissoes] }))
    toast('Comissão registrada'); setForm(empty); setOpen(false)
  }

  const setS = (id, st) => set((p) => ({ ...p, comissoes: p.comissoes.map((x) => (x.id === id ? { ...x, status: st, data_pagamento: (st === 'PAGA' ? todayISO() : x.data_pagamento), valor_pago: st === 'PAGA' ? (x.valor_pago || x.valor_por_parcela) : x.valor_pago } : x)) }))

  // simulação de estorno
  const estornoSim = useMemo(() => {
    const rule = ESTORNO_DEFAULT.find((e) => estMeses <= e.ateMes)
    const pctE = rule ? rule.pct : 0.15
    return { pctE, valor: Math.round(calcValorParcela(calcMensal, calcPercent) * pctE) }
  }, [estMeses, calcPercent, calcMensal])

  return (
    <div>
      <div className="grid kpis mb">
        <div className="card kpi"><div className="label">A receber</div><div className="value" style={{ color: 'var(--green)' }}>{brl(aReceber)}</div></div>
        <div className="card kpi"><div className="label">Pago (histórico)</div><div className="value">{brl(totalPago)}</div></div>
        <div className="card kpi"><div className="label">Previsto total</div><div className="value">{brl(totalPrevisto)}</div></div>
      </div>

      <div className="flex between wrap mb">
        <button className="btn ghost" onClick={() => downloadCsv('comissoes.csv', [['Cliente','Operadora','Modalidade','%','Parcela','Parcelas','Status'], ...list.map((x) => [db.clientes.find((c) => c.id === x.cliente_id)?.nome_titular || '', db.operadoras.find((o) => o.id === x.operadora_id)?.nome || '', x.modalidade_comissao, x.percentual, x.valor_por_parcela, x.quantidade_parcelas, x.status])])}><Icon name="down" size={17}/> CSV</button>
        <button className="btn" onClick={() => setOpen(true)}><Icon name="plus" size={17}/> Registrar comissão</button>
      </div>

      <div className="card">
        {list.length === 0 && <Empty icon="coins" title="Nenhuma comissão" sub="Registre a primeira." />}
        <table className="table">
          <thead><tr><th>Cliente</th><th>Operadora</th><th>Modalidade</th><th className="num">%</th><th className="num">Parcela</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((x) => {
              const glosa = x.status === 'PAGA' && x.valor_por_parcela && x.valor_pago < x.valor_por_parcela
              return (
                <tr key={x.id}>
                  <td><strong>{db.clientes.find((c) => c.id === x.cliente_id)?.nome_titular || '—'}</strong></td>
                  <td>{db.operadoras.find((o) => o.id === x.operadora_id)?.nome || '—'}</td>
                  <td>{x.modalidade_comissao.toLowerCase()} · {x.periodicidade.toLowerCase()} · {x.quantidade_parcelas}x</td>
                  <td className="num">{x.percentual}%</td>
                  <td className="num">{brl(x.valor_pago || x.valor_por_parcela)}</td>
                  <td>{glosa ? <span className="badge amber"><Icon name="clock" size={12}/> verificar glosa</span> : <Badge status={x.status} />}</td>
                  <td className="text-right">
                    <button className="btn ghost sm" onClick={() => setS(x.id, 'PAGA')}>Marcar paga</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Calculadora + estorno */}
      <div className="grid cols mt">
        <div className="card">
          <div className="section-title">Calculadora de comissão</div>
          <div className="form-grid">
            <Field label="Mensalidade do plano (R$)" type="number" value={calcMensal} onChange={(e) => setCalcMensal(Number(e.target.value))} />
            <Field label="Percentual (%)" type="number" value={calcPercent} onChange={(e) => setCalcPercent(Number(e.target.value))} />
          </div>
          <div className="card mt" style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}>
            <div className="text-sm text-muted">Valor por parcela</div>
            <div className="text-sm" style={{ fontSize: 26, fontWeight: 800, color: '#0f766e' }}>{brl(calcValorParcela(calcMensal, calcPercent))}</div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Simulação de estorno</div>
          <div className="text-sm text-muted mb">Se o cliente cancelar, a operadora pode estornar parte da comissão. Escolha o mês de referência.</div>
          <Select label="Cancelou após" value={estMeses} onChange={(e) => setEstMeses(Number(e.target.value))}>
            {[6, 12, 18, 24, 30, 36].map((m) => <option key={m} value={m}>{m} meses</option>)}
          </Select>
          <div className="card mt" style={{ background: '#fef3c7', borderColor: '#fde68a' }}>
            <div className="text-sm text-muted">% de estorno (regra)</div>
            <div className="text-sm" style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>{pct(estornoSim.pctE)}</div>
            <div className="text-sm text-muted mt">Valor que seria estornado</div>
            <div className="text-sm" style={{ fontWeight: 800 }}>{brl(estornoSim.valor)}</div>
          </div>
          <div className="text-sm text-muted mt">⚠ Tabela decrescente de mercado (12m=75% … 36m=15%). Varia por operadora — confirme no contrato.</div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar comissão"
        foot={<><button className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn" onClick={save}><Icon name="check" size={16}/> Salvar</button></>}>
        <div className="form-grid">
          <Select label="Cliente" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
            <option value="">Selecione</option>{db.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome_titular}</option>)}
          </Select>
          <Select label="Operadora" value={form.operadora_id} onChange={(e) => setForm({ ...form, operadora_id: e.target.value })}>
            <option value="">Selecione</option>{db.operadoras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </Select>
          <Select label="Modalidade" value={form.modalidade_comissao} onChange={(e) => setForm({ ...form, modalidade_comissao: e.target.value })}>
            <option value="AGENCIAMENTO">Agenciamento</option><option value="RECORRENTE">Recorrente</option><option value="VITALICIA">Vitalícia</option>
          </Select>
          <Select label="Periodicidade" value={form.periodicidade} onChange={(e) => setForm({ ...form, periodicidade: e.target.value })}>
            <option value="MENSAL">Mensal</option><option value="UNICA">Única</option><option value="SEMESTRAL">Semestral</option>
          </Select>
          <Field label="Percentual (%)" type="number" value={form.percentual} onChange={(e) => setForm({ ...form, percentual: e.target.value })} />
          <Field label="Mensalidade (base p/ cálculo)" type="number" value={calcMensal} disabled placeholder="Dé o valor p/ auto" />
          <Field full label="Quantidade de parcelas" type="number" value={form.quantidade_parcelas} onChange={(e) => setForm({ ...form, quantidade_parcelas: Number(e.target.value) })} />
          <Select full label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPT.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </Select>
          <Field full tag="textarea" label="Observações" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
