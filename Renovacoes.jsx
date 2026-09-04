import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Select, Field, Modal, useToast, Empty } from '../ui.jsx'
import { dateBR, brl, pct, daysUntil, todayISO } from '../format.js'

export default function Renovacoes() {
  const { db, set } = useStore()
  const toast = useToast()
  const [windowDays, setWindowDays] = useState(90)
  const [selId, setSelId] = useState(null)

  const list = useMemo(() => db.contratos
    .map((x) => ({ ...x, dias: daysUntil(x.fim_vigencia) }))
    .sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999)), [db.contratos])

  const sel = db.contratos.find((x) => x.id === selId)
  const clienteNome = (id) => db.clientes.find((x) => x.id === id)?.nome_titular || 'Cliente'

  const setStatus = (id, st) => {
    set((p) => ({ ...p, contratos: p.contratos.map((x) => (x.id === id ? { ...x, status: st } : x)) }))
    toast('Renovação atualizada')
  }

  const update = (k, v) => set((p) => ({ ...p, contratos: p.contratos.map((x) => (x.id === selId ? { ...x, [k]: v } : x)) }))

  const windowList = list.filter((x) => x.dias !== null && x.dias <= windowDays && x.status !== 'CANCELADO')

  return (
    <div>
      <div className="flex between wrap mb">
        <div className="flex wrap">
          {[30, 60, 90].map((d) => <button key={d} className={`btn ${windowDays === d ? '' : 'ghost'} sm`} onClick={() => setWindowDays(d)}>≤ {d} dias</button>)}
        </div>
        <div className="text-sm text-muted">{windowList.length} contrato(s) renovam nesse prazo</div>
      </div>

      <div className="card">
        {windowList.length === 0 && <Empty icon="refresh" title="Sem renovações neste prazo" sub="Ajuste o filtro ou deslize." />}
        {windowList.map((x) => (
          <div key={x.id} className="row" style={{ cursor: 'pointer' }} onClick={() => setSelId(x.id)}>
            <div className="grow">
              <div className="title">{clienteNome(x.cliente_id)}</div>
              <div className="meta">{db.operadoras.find((o) => o.id === x.operadora_id)?.nome || ''} · fim em {dateBR(x.fim_vigencia)}</div>
            </div>
            <span className={`badge ${x.dias < 15 ? 'red' : x.dias < 30 ? 'amber' : 'blue'}`}>{x.dias >= 0 ? `${x.dias} dias` : 'venceu'}</span>
            <Badge status={x.status} />
          </div>
        ))}
      </div>

      <Modal open={!!selId} onClose={() => setSelId(null)} title={`Renovação — ${clienteNome(sel?.cliente_id || '')}`} wide
        foot={<>
          <button className="btn green" onClick={() => setStatus(selId, 'RENOVADA')}><Icon name="check" size={16}/> Marcar renovada</button>
          <button className="btn ghost" onClick={() => setStatus(selId, 'EM_NEGOCIACAO')}>Em negociação</button>
        </>}>
        {sel && (
          <div>
            <div className="grid cols mb">
              <div className="text-sm"><div className="text-muted">Operadora / plano</div><strong>{db.operadoras.find((o) => o.id === sel.operadora_id)?.nome}</strong></div>
              <div className="text-sm"><div className="text-muted">Mensalidade atual</div><strong>{brl(sel.mensalidade_total)}</strong></div>
            </div>
            <div className="divider" />
            <div className="section-title">Reajuste</div>
            <div className="form-grid">
              <Select label="Status da renovação" value={sel.status} onChange={(e) => setStatus(selId, e.target.value)}>
                <option value="ATIVO">A renovar</option><option value="EM_NEGOCIACAO">Em negociação</option><option value="EM_RENOVACAO">Proposta enviada</option><option value="RENOVADA">Renovada</option><option value="CANCELADO">Perdida</option>
              </Select>
              <Field label="Reajuste anunciado (%)" type="number" step="0.1" value={sel.valor_reajuste_ultimo ? sel.valor_reajuste_ultimo * 100 : ''} onChange={(e) => update('valor_reajuste_ultimo', Number(e.target.value) / 100)} />
              <Field label="Reajuste negociado (%)" type="number" step="0.1" placeholder="0" onChange={(e) => { if (selId) set((p) => ({ ...p, contratos: p.contratos.map((x) => (x.id === selId ? { ...x, reajuste_negociado: Number(e.target.value) / 100 } : x)) })) }} />
              <Field label="Valor depois (R$)" type="number" value={sel.mensalidade_total} onChange={(e) => update('mensalidade_total', Number(e.target.value))} />
            </div>
            <div className="text-sm text-muted mt">Prazo de aviso prévio (conforme contrato): <strong>30 dias</strong> — confirme na apólice.</div>
            <div className="flex mt"><label className="text-sm flex"><input type="checkbox" defaultChecked onChange={(e) => set((p) => ({ ...p, contratos: p.contratos.map((x) => (x.id === selId ? { ...x, aviso_confirmado: e.target.checked } : x)) }))} /> Cliente confirmou aviso prévio</label></div>
            <Field full tag="textarea" label="Observações da negociação" rows={3} value={sel.observacoes || ''} onChange={(e) => update('observacoes', e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  )
}
