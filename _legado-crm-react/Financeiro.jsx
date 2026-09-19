import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Field, useToast } from '../ui.jsx'
import { brl } from '../format.js'

export default function Financeiro() {
  const { db, set } = useStore()
  const toast = useToast()
  const yr = new Date().getFullYear()
  const mo = new Date().getMonth() + 1
  const [metaForm, setMetaForm] = useState({ ano: yr, mes: mo, valor: (db.metas.find((m) => m.ano === yr && m.mes === mo)?.meta_valor) || '' })

  const c = useMemo(() => {
    const cs = db.comissoes
    const byStatus = (st, period) => cs.filter((x) => x.status === st && (!period || (x.data_pagamento && new Date(x.data_pagamento).getMonth() + 1 === mo)))
    const previsto = cs.filter((x) => ['A_RECEBER','PREVISTA','EM_ATRASO'].includes(x.status)).reduce((s, x) => s + x.valor_por_parcela, 0)
    const pago = cs.filter((x) => x.status === 'PAGA').reduce((s, x) => s + (x.valor_pago || 0), 0)
    const emAtraso = cs.filter((x) => x.status === 'EM_ATRASO').reduce((s, x) => s + x.valor_por_parcela, 0)
    const glosado = cs.filter((x) => x.status === 'GLOSADA').reduce((s, x) => s + x.valor_por_parcela, 0)
    // por operadora (pago)
    const porOp = {}
    cs.filter((x) => x.status === 'PAGA').forEach((x) => porOp[x.operadora_id] = (porOp[x.operadora_id] || 0) + (x.valor_pago || 0))
    return { previsto, pago, emAtraso, glosado, porOp }
  }, [db.comissoes, mo])

  const saveMeta = () => {
    const v = Number(metaForm.valor)
    if (!v) return toast('Informe o valor da meta', 'error')
    set((p) => {
      const exists = p.metas.find((m) => m.ano === metaForm.ano && m.mes === metaForm.mes)
      if (exists) return { ...p, metas: p.metas.map((m) => (m.ano === metaForm.ano && m.mes === metaForm.mes ? { ...m, meta_valor: v } : m)) }
      return { ...p, metas: [...p.metas, { id: 'meta-' + metaForm.ano + '-' + metaForm.mes, ano: metaForm.ano, mes: metaForm.mes, meta_valor: v }] }
    })
    toast('Meta salva')
  }

  const totalOp = Object.values(c.porOp).reduce((s, x) => s + x, 0) || 1

  return (
    <div>
      <div className="grid kpis mb">
        <div className="card kpi"><div className="label">Previsto a receber</div><div className="value">{brl(c.previsto)}</div></div>
        <div className="card kpi green"><div className="label">Recebido (pago)</div><div className="value">{brl(c.pago)}</div></div>
        <div className="card kpi amber"><div className="label">Em atraso</div><div className="value">{brl(c.emAtraso)}</div></div>
        <div className="card kpi red"><div className="label">Glosado</div><div className="value">{brl(c.glosado)}</div></div>
      </div>

      <div className="grid cols">
        <div className="card">
          <div className="section-title">Meta do mês ({mo}/{yr})</div>
          <div className="flex" style={{ gap: 8 }}>
            <div className="flex" style={{ flex: 1 }}>
              <Field label="Ano" type="number" value={metaForm.ano} onChange={(e) => setMetaForm({ ...metaForm, ano: Number(e.target.value) })} />
              <Field label="Mês" type="number" min="1" max="12" value={metaForm.mes} onChange={(e) => setMetaForm({ ...metaForm, mes: Number(e.target.value) })} />
              <Field label="Meta (R$)" type="number" value={metaForm.valor} onChange={(e) => setMetaForm({ ...metaForm, valor: e.target.value })} />
            </div>
            <button className="btn sm" style={{ alignSelf: 'flex-end', marginBottom: 12 }} onClick={saveMeta}><Icon name="check" size={15}/> Salvar</button>
          </div>
          {(() => {
            const m = db.metas.find((x) => x.ano === yr && x.mes === mo)
            const pctv = m && m.meta_valor ? Math.min(100, Math.round((c.pago / m.meta_valor) * 100)) : 0
            return m ? (<div className="mt"><div className="flex between text-sm"><span>Recebido {brl(c.pago)} de {brl(m.meta_valor)}</span><strong>{pctv}%</strong></div><div className="progress"><div style={{ width: pctv + '%' }} /></div></div>) : <div className="text-sm text-muted mt">Defina sua meta mensal para acompanhar o progresso.</div>
          })()}
        </div>

        <div className="card">
          <div className="section-title">Comissões por operadora (recebido)</div>
          {Object.keys(c.porOp).length === 0 && <div className="text-sm text-muted">Sem dados ainda.</div>}
          {Object.entries(c.porOp).map(([k, v]) => (
            <div key={k} className="row">
              <div className="grow"><div className="title text-sm">{db.operadoras.find((o) => o.id === k)?.nome || '—'}</div></div>
              <div className="text-right text-sm" style={{ fontWeight: 800 }}>{brl(v)}</div>
              <div style={{ width: 90 }} className="progress"><div style={{ width: Math.round((v / totalOp) * 100) + '%' }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt">
        <div className="section-title">Recebidos por mês (visão geral)</div>
        <div className="text-sm text-muted">Resumo do ano {yr}</div>
        <ComissaoTimeline comissoes={db.comissoes} yr={yr} />
      </div>
    </div>
  )
}

function ComissaoTimeline({ comissoes, yr }) {
  const months = []
  for (let i = 1; i <= 12; i++) months.push({ m: i })
  const by = {}
  comissoes.filter((x) => x.status === 'PAGA' && x.data_pagamento && new Date(x.data_pagamento).getFullYear() === yr).forEach((x) => {
    const mm = new Date(x.data_pagamento).getMonth() + 1; by[mm] = (by[mm] || 0) + (x.valor_pago || 0)
  })
  const max = Math.max(...Object.values(by).map((x) => x), 1)
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140, marginTop: 10 }}>
      {months.map((mo) => (
        <div key={mo.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div title={brl(by[mo.m] || 0)} style={{ width: '100%', background: by[mo.m] ? 'var(--teal)' : '#e2e8f0', borderRadius: '6px 6px 0 0', height: Math.max(3, ((by[mo.m] || 0) / max) * 110) }} />
          <div className="text-muted" style={{ fontSize: 9.5 }}>{names[mo.m - 1]}</div>
        </div>
      ))}
    </div>
  )
}
