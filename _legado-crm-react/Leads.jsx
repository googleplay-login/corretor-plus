import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Modal, Field, Select, useToast, Empty } from '../ui.jsx'
import { brl, uid, addMonths, todayISO } from '../format.js'

const COLUMNS = [
  { key: 'NOVO', label: 'Novo' },
  { key: 'QUALIFICADO', label: 'Qualificado' },
  { key: 'EM_COTACAO', label: 'Em cotação' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta enviada' },
  { key: 'NEGOCIACAO', label: 'Negociação' },
  { key: 'GANHO', label: 'Ganho' },
  { key: 'PERDIDO', label: 'Perdido' },
]
const emptyLead = { nome_contato: '', telefone_whatsapp: '', email: '', cidade: '', uf: 'SP', tipo: 'PF', origem: 'INSTAGRAM', operadora_interesse: '', orcamento_estimado: '', status: 'NOVO', proximo_passo: '' }

export default function Leads() {
  const { db, set } = useStore()
  const toast = useToast()
  const [drag, setDrag] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyLead)
  const [won, setWon] = useState(null)

  const daysSince = (iso) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null
  const langs = useMemo(() => {
    const byCol = {}
    COLUMNS.forEach((c) => byCol[c.key] = db.leads.filter((l) => l.status === c.key))
    const ganho = db.leads.filter((l) => l.status === 'GANHO').length
    const total = db.leads.length
    const conv = total ? Math.round((ganho / total) * 100) : 0
    const tempo = db.leads.length ? Math.round(db.leads.reduce((s, l) => s + (new Date(l.criado_em).getTime() - 0), 0) / Math.pow(10, 12)) : 0
    return { byCol, ganho, total, conv, tempo }
  }, [db.leads])

  const save = () => {
    if (!form.nome_contato) return toast('Informe o nome do contato', 'error')
    set((p) => ({ ...p, leads: [{ ...form, id: uid(), ultimo_contato: new Date().toISOString(), criado_em: todayISO() }, ...p.leads] }))
    toast('Lead criado'); setForm(emptyLead); setOpen(false)
  }

  const move = (leadId, toStatus) => {
    set((p) => ({ ...p, leads: p.leads.map((l) => (l.id === leadId ? { ...l, status: toStatus } : l)) }))
    if (toStatus === 'GANHO') { const lead = db.leads.find((l) => l.id === leadId); if (lead) { setWon(lead) } }
  }

  const createClient = (lead) => {
    set((p) => {
      const cid = uid()
      const cliente = { id: cid, tipo: lead.tipo, nome_titular: lead.nome_contato, documento: '', email: lead.email || '', whatsapp: lead.telefone_whatsapp, cidade: lead.cidade, uf: lead.uf, data_nascimento_titular: '', status: 'ATIVO', origem: lead.origem, observacoes: `Lead convertido. Interesse: ${lead.operadora_interesse} · orçamento ${brl(lead.orcamento_estimado || 0)}.`, proximo_contato: addMonths(todayISO(), 1), criado_em: todayISO() }
      const benef = lead.tipo === 'PF' ? [{ id: uid(), cliente_id: cid, nome: lead.nome_contato, data_nascimento: '', parentesco: 'TITULAR', sexo: 'M' }] : []
      return { ...p, clientes: [cliente, ...p.clientes], beneficiarios: [...p.beneficiarios, ...benef] }
    })
    set((p) => ({ ...p, leads: p.leads.map((l) => (l.id === lead.id ? { ...l, status: 'GANHO' } : l)) }))
    toast('Lead convertido em cliente'); setWon(null)
  }

  return (
    <div>
      <div className="flex between wrap mb">
        <div className="flex wrap">
          <div className="card" style={{ padding: '10px 16px' }}><div className="text-sm text-muted">Leads abertos</div><div className="text-sm" style={{ fontWeight: 800 }}>{db.leads.filter((l) => l.status !== 'GANHO' && l.status !== 'PERDIDO').length}</div></div>
          <div className="card" style={{ padding: '10px 16px' }}><div className="text-sm text-muted">Conversão</div><div className="text-sm" style={{ fontWeight: 800 }}>{langs.conv}%</div></div>
          <div className="card" style={{ padding: '10px 16px' }}><div className="text-sm text-muted">Ganhos</div><div className="text-sm" style={{ fontWeight: 800 }}>{langs.ganho}</div></div>
        </div>
        <button className="btn" onClick={() => setOpen(true)}><Icon name="plus" size={17}/> Novo lead</button>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => {
          const items = langs.byCol[col.key] || []
          return (
            <div key={col.key} className="kcol"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (drag) move(drag, col.key); setDrag(null) }}>
              <h4>{col.label}<span>{items.length}</span></h4>
              {items.map((l) => {
                const ds = daysSince(l.ultimo_contato)
                const lat = ds !== null && ds >= 5
                return (
                  <div key={l.id} className="kcard" draggable onDragStart={() => setDrag(l.id)} style={{ borderLeft: lat ? '3px solid var(--red)' : '3px solid var(--teal)' }}>
                    <div className="k-title">{l.nome_contato}</div>
                    <div className="k-meta">{l.cidade}/{l.uf} · {l.tipo === 'PJ' ? 'Empresa' : 'PF'}</div>
                    <div className="k-meta">{l.operadora_interesse ? l.operadora_interesse + ' · ' : ''}{l.orcamento_estimado ? brl(l.orcamento_estimado) : ''}</div>
                    <div className="k-tags">
                      {lat && <span className="badge red"><Icon name="clock" size={12}/> sem contato {ds}d</span>}
                      {l.proximo_passo && <span className="badge ink">{l.proximo_passo}</span>}
                      <span className="badge blue">{l.origem.toLowerCase()}</span>
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && <div className="text-sm text-muted" style={{ padding: 8 }}>Arraste leads aqui</div>}
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo lead"
        foot={<><button className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn" onClick={save}><Icon name="check" size={16}/> Criar lead</button></>}>
        <div className="form-grid">
          <Field full label="Nome do contato" value={form.nome_contato} onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} />
          <Select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}><option value="PF">Pessoa física</option><option value="PJ">Empresa</option></Select>
          <Select label="Origem" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}><option value="INSTAGRAM">Instagram</option><option value="WHATASPP">WhatsApp</option><option value="INDICACAO">Indicação</option><option value="SITE">Site</option><option value="GOOGLE">Google</option><option value="EVENTO">Evento</option></Select>
          <Field label="WhatsApp" value={form.telefone_whatsapp} onChange={(e) => setForm({ ...form, telefone_whatsapp: e.target.value })} placeholder="55 11 99999-0000" />
          <Field label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
          <Field label="UF" value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
          <Field label="Operadora de interesse" value={form.operadora_interesse} onChange={(e) => setForm({ ...form, operadora_interesse: e.target.value })} />
          <Field label="Orçamento estimado (R$)" type="number" value={form.orcamento_estimado} onChange={(e) => setForm({ ...form, orcamento_estimado: e.target.value })} />
          <Field full tag="textarea" label="Próximo passo" value={form.proximo_passo} onChange={(e) => setForm({ ...form, proximo_passo: e.target.value })} />
        </div>
      </Modal>

      <Modal open={!!won} onClose={() => setWon(null)} title="Converter lead em cliente?"
        foot={<><button className="btn ghost" onClick={() => setWon(null)}>Agora não</button><button className="btn green" onClick={() => won && createClient(won)}><Icon name="check" size={16}/> Sim, criar cliente</button></>}>
        <p className="text-sm">Vamos criar a ficha de <strong>{won?.nome_contato}</strong> no CRM e marcar o lead como <strong>Ganho</strong>. Você poderá cadastrar contrato e comissão.</p>
        <div className="text-sm text-muted">O lead também é marcado como ganho no funil.</div>
      </Modal>
    </div>
  )
}
