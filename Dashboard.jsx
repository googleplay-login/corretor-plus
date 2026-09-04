import { useMemo } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Kpi, Badge } from '../ui.jsx'
import { brl, pct, daysUntil, dateBR } from '../format.js'

export default function Dashboard({ go }) {
  const { db } = useStore()
  const c = useMemo(() => {
    const mo = new Date().getMonth()
    const yr = new Date().getFullYear()
    const isMonth = (d) => { const dt = new Date(d); return dt.getFullYear() === yr && dt.getMonth() === mo }
    const comiss = db.comissoes
    const aReceber = comiss.filter((x) => x.status === 'A_RECEBER' || x.status === 'PREVISTA' || x.status === 'EM_ATRASO')
    const aReceberMes = aReceber.filter((x) => isMonth(x.data_previsao_primeira)).reduce((s, x) => s + x.valor_por_parcela, 0)
    const recebidoMes = comiss.filter((x) => x.status === 'PAGA' && isMonth(x.data_pagamento)).reduce((s, x) => s + (x.valor_pago || 0), 0)
    const recebidoAno = comiss.filter((x) => x.status === 'PAGA' && x.data_pagamento && new Date(x.data_pagamento).getFullYear() === yr).reduce((s, x) => s + (x.valor_pago || 0), 0)
    const ativos = db.clientes.filter((x) => x.status === 'ATIVO')
    const vidas = db.beneficiarios.length
    const renov90 = db.contratos.filter((x) => { const d = daysUntil(x.fim_vigencia); return d !== null && d >= 0 && d <= 90 })
    const leadsAbertos = db.leads.filter((x) => x.status !== 'GANHO' && x.status !== 'PERDIDO')
    const conv = db.leads.length ? Math.round((db.leads.filter((x) => x.status === 'GANHO').length / db.leads.length) * 100) : 0
    const propMes = db.propostas ? db.propostas.filter((x) => isMonth(x.criado_em)).length : 0
    const metaMes = db.metas.find((x) => x.ano === yr && x.mes === mo)
    const metaVal = metaMes ? metaMes.meta_valor : 0
    const metaPct = metaVal ? Math.min(100, Math.round((recebidoMes / metaVal) * 100)) : 0

    const alerts = []
    db.contratos.forEach((x) => { const d = daysUntil(x.fim_vigencia); if (d !== null && d >= 0 && d < 30 && x.status !== 'CANCELADO') alerts.push({ t: 'renovação', msg: `${clienteNome(x.cliente_id)} renova em ${d} dia${d === 1 ? '' : 's'} (${dateBR(x.fim_vigencia)})`, sev: d < 15 ? 'red' : 'amber', page: 'renovacoes' }) })
    db.leads.forEach((x) => { if (x.status !== 'GANHO' && x.status !== 'PERDIDO') { const days = (Date.now() - new Date(x.ultimo_contato).getTime()) / 86400000; if (days >= 5) alerts.push({ t: 'follow-up', msg: `${x.nome_contato} sem contato há ${Math.floor(days)} dias`, sev: 'red', page: 'leads' }) } })
    comiss.filter((x) => x.status === 'EM_ATRASO').forEach(() => alerts.push({ t: 'comissão', msg: 'Há comissão em atraso', sev: 'red', page: 'comissoes' }))
    comiss.filter((x) => x.status === 'PAGA' && x.valor_por_parcela && x.valor_pago < x.valor_por_parcela).forEach((x) => alerts.push({ t: 'glosa', msg: 'Possível glosa em comissão (paga menos que o previsto)', sev: 'amber', page: 'comissoes' }))

    // série mensal
    const meses = []
    for (let i = 11; i >= 0; i--) { const d = new Date(yr, mo - i, 1); meses.push({ label: d.toLocaleDateString('pt-BR', { month: 'short' }), val: 0 }) }
    comiss.forEach((x) => { if (x.status === 'PAGA' && x.data_pagamento) { const dt = new Date(x.data_pagamento); const idx = meses.findIndex((m) => m.label === dt.toLocaleDateString('pt-BR', { month: 'short' })); if (idx >= 0 && dt.getFullYear() === yr) meses[idx].val += (x.valor_pago || 0) } })
    const maxM = Math.max(...meses.map((m) => m.val), 1)

    // por operadora
    const porOp = {}
    comiss.forEach((x) => { if (x.status === 'PAGA') porOp[x.operadora_id] = (porOp[x.operadora_id] || 0) + (x.valor_pago || 0) })
    const opArr = Object.entries(porOp).map(([k, v]) => ({ nome: db.operadoras.find((o) => o.id === k)?.nome || '—', v })).sort((a, b) => b.v - a.v)

    return { aReceberMes, recebidoMes, recebidoAno, ativos, vidas, renov90, leadsAbertos: leadsAbertos.length, conv, propMes, metaVal, metaPct, alerts, meses, maxM, opArr }
  }, [db])

  const clienteNome = (id) => db.clientes.find((x) => x.id === id)?.nome_titular || 'Cliente'

  return (
    <div className="stack">
      <div className="grid kpis">
        <Kpi label="A receber (mês)" value={brl(c.aReceberMes)} delta="comissões previstas" icon={<Icon name="coins" size={18} />} tone="green" />
        <Kpi label="Recebido (mês)" value={brl(c.recebidoMes)} icon={<Icon name="check" size={18} />} />
        <Kpi label="Recebido (ano)" value={brl(c.recebidoAno)} icon={<Icon name="wallet" size={18} />} tone="green" />
        <Kpi label="Clientes / vidas" value={`${c.ativos.length} / ${c.vidas}`} delta={`${c.renov90.length} renovações ≤90d`} icon={<Icon name="users" size={18} />} />
        <Kpi label="Leads abertos" value={c.leadsAbertos} delta={`conversão ${c.conv}%`} icon={<Icon name="funnel" size={18} />} />
        <Kpi label="Meta do mês" value={`${c.metaPct}%`} delta={c.metaVal ? `de ${brl(c.metaVal)}` : 'defina sua meta'} icon={<Icon name="target" size={18} />} />
      </div>

      <div className="grid cols-3 mb">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex between mb">
            <div>
              <div className="section-title">Comissões recebidas — últimos 12 meses</div>
              <div className="text-sm text-muted">em reais, por mês</div>
            </div>
            <div className="text-sm text-right text-muted"><strong className="text-muted">{brl(c.recebidoAno)}</strong><br />no ano</div>
          </div>
          <BarChart data={c.meses} max={c.maxM} />
        </div>
        <div className="card">
          <div className="section-title">Por operadora</div>
          {c.opArr.length === 0 && <div className="empty text-sm">Sem comissões pagas ainda</div>}
          {c.opArr.map((o, i) => (
            <div key={i} className="row">
              <div className="grow"><div className="title text-sm">{o.nome}</div></div>
              <div className="text-right text-sm" style={{ fontWeight: 800 }}>{brl(o.v)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div className="flex between"><div className="section-title">Meta do mês</div><Badge status="ATIVO" custom={c.metaPct >= 100 ? 'Atingida' : 'Em andamento'} /></div>
          <div className="text-sm text-muted mt">{brl(c.recebidoMes)} de {brl(c.metaVal || 0)}</div>
          <div className="progress"><div style={{ width: c.metaPct + '%' }} /></div>
          <div className="text-sm mt text-muted">Recebido este mês</div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="section-title">Precisa da sua atenção</div>
          {c.alerts.length === 0 && <div className="flex text-sm text-muted"><Icon name="check" size={18} /> Tudo em dia por aqui. 🎉</div>}
          {c.alerts.map((a, i) => (
            <div key={i} className="alert-item" style={{ cursor: 'pointer' }} onClick={() => go(a.page)}>
              <div className={`alert-dot ${a.sev}`} />
              <div>
                <div className="text-sm" style={{ fontWeight: 700 }}>{a.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Renovações nos próximos 90 dias</div>
        {c.renov90.length === 0 && <div className="text-sm text-muted">Nenhuma renovação em vista no período.</div>}
        {c.renov90.map((x) => (
          <div key={x.id} className="row" style={{ cursor: 'pointer' }} onClick={() => go('renovacoes')}>
            <div className="grow">
              <div className="title">{clienteNome(x.cliente_id)}</div>
              <div className="meta">{db.operadoras.find((o) => o.id === x.operadora_id)?.nome || ''} · fim em {dateBR(x.fim_vigencia)}</div>
            </div>
            <Badge status={x.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
      {data.map((m, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div title={brl(m.val)} style={{ width: '100%', background: 'var(--teal)', borderRadius: '6px 6px 0 0', height: Math.max(3, (m.val / max) * 120), transition: 'height .3s' }} />
          <div className="text-muted" style={{ fontSize: 9.5, height: 12 }}>{m.label}</div>
        </div>
      ))}
    </div>
  )
}
