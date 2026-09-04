import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Modal, Field, Select, useToast, Empty } from '../ui.jsx'
import { dateBR, brl, idadeDeNascimento, uid, todayISO } from '../format.js'

const emptyCliente = {
  tipo: 'PF', nome_titular: '', documento: '', email: '', whatsapp: '', cidade: '', uf: 'SP',
  data_nascimento_titular: '', status: 'ATIVO', origem: 'INDICACAO', observacoes: '', proximo_contato: '',
}
const emptyBen = { nome: '', data_nascimento: '', parentesco: 'CONJUGE', sexo: 'M' }

export default function Clientes({ go }) {
  const { db, set } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selId, setSelId] = useState(null)
  const [form, setForm] = useState(emptyCliente)
  const [bens, setBens] = useState([])
  const [benForm, setBenForm] = useState(emptyBen)

  const list = useMemo(() => {
    return db.clientes.filter((c) => {
      if (q && !(c.nome_titular.toLowerCase().includes(q.toLowerCase()) || (c.documento || '').includes(q))) return false
      if (status && c.status !== status) return false
      return true
    })
  }, [db.clientes, q, status])

  const openNew = () => { setEditing(null); setForm(emptyCliente); setBens([]); setOpen(true) }
  const openEdit = (c) => {
    setEditing(c.id); setForm({ ...c })
    setBens(db.beneficiarios.filter((b) => b.cliente_id === c.id))
    setOpen(true)
  }
  const save = () => {
    if (!form.nome_titular) return toast('Informe o nome', 'error')
    set((p) => {
      let clientes
      if (editing) clientes = p.clientes.map((x) => (x.id === editing ? { ...x, ...form } : x))
      else clientes = [{ ...form, id: uid(), criado_em: todayISO() }, ...p.clientes]
      const cid = editing || clientes[0].id
      const benef = editing ? p.beneficiarios.filter((b) => b.cliente_id !== editing).concat(bens.map((b) => ({ ...b, id: b.id || uid(), cliente_id: cid }))) : bens.map((b) => ({ ...b, id: uid(), cliente_id: cid }))
      return { ...p, clientes, beneficiarios: benef }
    })
    toast(editing ? 'Cliente atualizado' : 'Cliente criado')
    setOpen(false)
  }
  const addBen = () => { if (!benForm.nome) return toast('Nome do beneficiário', 'error'); setBens((b) => [...b, { ...benForm, id: uid() }]); setBenForm(emptyBen) }

  const sel = db.clientes.find((x) => x.id === selId)
  const selBens = db.beneficiarios.filter((b) => b.cliente_id === selId)
  const selContratos = db.contratos.filter((c) => c.cliente_id === selId)
  const selComiss = db.comissoes.filter((c) => c.cliente_id === selId)
  const money = selComiss.reduce((s, x) => s + (x.valor_pago || 0), 0)

  const whatsMsg = (nome) => encodeURIComponent(`Olá ${nome.split(' ')[0]}, aqui é do Corretor+ 😊`)

  return (
    <div>
      <div className="flex between wrap mb">
        <div className="flex">
          <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome/documento..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="ATIVO">Ativo</option><option value="EM_ANALISE">Em análise</option>
            <option value="CANCELADO">Cancelado</option><option value="PERDIDO">Perdido</option>
          </Select>
        </div>
        <div className="flex">
          <button className="btn ghost" onClick={() => exportCsv(list, db)}><Icon name="down" size={17} /> CSV</button>
          <button className="btn" onClick={openNew}><Icon name="plus" size={17} /> Novo cliente</button>
        </div>
      </div>

      <div className="card">
        {list.length === 0 && <Empty icon="users" title="Nenhum cliente" sub="Cadastre o primeiro cliente." />}
        {list.map((c) => (
          <div key={c.id} className="row" style={{ cursor: 'pointer' }} onClick={() => setSelId(c.id)}>
            <div className="grow">
              <div className="title">{c.nome_titular}</div>
              <div className="meta">{c.tipo === 'PJ' ? 'Empresa' : 'Pessoa física'} · {c.cidade}/{c.uf} · {db.beneficiarios.filter((b) => b.cliente_id === c.id).length} beneficiário(s)</div>
            </div>
            <Badge status={c.status} />
          </div>
        ))}
      </div>

      {/* Form modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar cliente' : 'Novo cliente'}
        foot={<><button className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn" onClick={save}><Icon name="check" size={17}/> Salvar</button></>}>
        <div className="form-grid">
          <Select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="PF">Pessoa física</option><option value="PJ">Empresa</option>
          </Select>
          <Field label="Status" tag="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ATIVO">Ativo</option><option value="EM_ANALISE">Em análise</option><option value="CANCELADO">Cancelado</option><option value="PERDIDO">Perdido</option>
          </Field>
          <Field full label="Nome / Razão social" value={form.nome_titular} onChange={(e) => setForm({ ...form, nome_titular: e.target.value })} placeholder="Ex: Maria Fernandes" />
          <Field label={form.tipo === 'PF' ? 'CPF' : 'CNPJ'} value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
          <Field label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="55 11 99999-0000" />
          <Field label="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
          <Field label="UF" value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
          <Field label="Data de nascimento (titular)" type="date" value={form.data_nascimento_titular} onChange={(e) => setForm({ ...form, data_nascimento_titular: e.target.value })} />
          <Select label="Origem" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}>
            <option value="INDICACAO">Indicação</option><option value="INSTAGRAM">Instagram</option><option value="WHATSAPP">WhatsApp</option>
            <option value="SITE">Site</option><option value="GOOGLE">Google</option><option value="EVENTO">Evento</option><option value="OUTRO">Outro</option>
          </Select>
          <Field full label="Próximo contato" type="date" value={form.proximo_contato} onChange={(e) => setForm({ ...form, proximo_contato: e.target.value })} />
          {form.tipo === 'PF' && (
            <div className="full">
              <div className="flex between mb"><div className="section-title" style={{ margin: 0 }}>Beneficiários</div></div>
              {bens.length === 0 && <div className="text-sm text-muted mb">Adicione o titular e dependentes.</div>}
              {bens.map((b, i) => (
                <div key={b.id} className="row">
                  <div className="grow"><div className="title text-sm">{b.nome}</div><div className="meta">{b.parentesco} · {b.data_nascimento} ({idadeDeNascimento(b.data_nascimento) ?? '?'} anos)</div></div>
                  <button className="btn icon ghost sm" onClick={() => setBens(bens.filter((x) => x.id !== b.id))}><Icon name="trash" size={16}/></button>
                </div>
              ))}
              {form.tipo === 'PF' && bens.length === 0 && (
                <div className="card" style={{ padding: 12 }}>
                  <div className="form-grid">
                    <Field label="Nome" value={benForm.nome} onChange={(e) => setBenForm({ ...benForm, nome: e.target.value })} />
                    <Field label="Data de nascimento" type="date" value={benForm.data_nascimento} onChange={(e) => setBenForm({ ...benForm, data_nascimento: e.target.value })} />
                    <Select label="Parentesco" value={benForm.parentesco} onChange={(e) => setBenForm({ ...benForm, parentesco: e.target.value })}>
                      <option value="TITULAR">Titular</option><option value="CONJUGE">Cônjuge</option><option value="FILHO">Filho</option><option value="DEPENDENTE">Dependente</option>
                    </Select>
                    <Field label="Sexo" tag="select" value={benForm.sexo} onChange={(e) => setBenForm({ ...benForm, sexo: e.target.value })}><option value="M">M</option><option value="F">F</option></Field>
                  </div>
                  <button className="btn sm" onClick={addBen}><Icon name="plus" size={15}/> Adicionar beneficiário</button>
                </div>
              )}
            </div>
          )}
          <Field full tag="textarea" label="Observações" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
      </Modal>

      {/* Detail drawer */}
      <Modal open={!!selId} onClose={() => setSelId(null)} title={sel?.nome_titular || ''} wide
        foot={<>
          <a className="btn green sm" href={`https://wa.me/${(sel?.whatsapp || '').replace(/\D/g, '')}?text=${whatsMsg(sel?.nome_titular || '')}`} target="_blank" rel="noreferrer"><Icon name="phone" size={16}/> WhatsApp</a>
          <button className="btn sm" onClick={() => { openEdit(sel); setSelId(null) }}><Icon name="edit" size={16}/> Editar</button>
          <button className="btn sm" onClick={() => { toast('Disponível na aba Propostas', 'info') }}><Icon name="doc" size={16}/> Gerar proposta</button>
        </>}>
        {sel && (
          <div>
            <div className="flex wrap mb">
              <Badge status={sel.tipo} custom={sel.tipo === 'PJ' ? 'Empresa' : 'Pessoa física'} />
              <Badge status={sel.status} />
              <span className="text-sm text-muted">Origem: {sel.origem.toLowerCase()}</span>
            </div>
            <div className="grid cols-3 mb">
              <div className="text-sm"><div className="text-muted">Contato</div><strong>{sel?.whatsapp || '—'}</strong></div>
              <div className="text-sm"><div className="text-muted">Cidade</div><strong>{sel.cidade}/{sel.uf}</strong></div>
              <div className="text-sm"><div className="text-muted">Último contato</div><strong>{sel.proximo_contato ? dateBR(sel.proximo_contato) : '—'}</strong></div>
            </div>
            <div className="divider" />
            <div className="section-title">Beneficiários ({selBens.length})</div>
            {selBens.map((b) => (
              <div key={b.id} className="row"><div className="grow"><div className="title text-sm">{b.nome}</div><div className="meta">{b.parentesco} · {idadeDeNascimento(b.data_nascimento) ?? '?'} anos</div></div></div>
            ))}
            <div className="divider" />
            <div className="section-title">Contratos</div>
            {selContratos.length === 0 && <div className="text-sm text-muted">Nenhum contrato.</div>}
            {selContratos.map((x) => (
              <div key={x.id} className="row">
                <div className="grow"><div className="title text-sm">{db.operadoras.find((o) => o.id === x.operadora_id)?.nome || ''}</div>
                  <div className="meta">Vigência {dateBR(x.inicio_vigencia)} → {dateBR(x.fim_vigencia)} · {brl(x.mensalidade_total)}/mês</div></div>
                <Badge status={x.status} />
              </div>
            ))}
            <div className="divider" />
            <div className="section-title">Comissões</div>
            {selComiss.length === 0 && <div className="text-sm text-muted">Nenhuma comissão vinculada.</div>}
            {selComiss.map((x) => (
              <div key={x.id} className="row">
                <div className="grow"><div className="title text-sm">{db.operadoras.find((o) => o.id === x.operadora_id)?.nome || ''} · {x.modalidade_comissao.toLowerCase()}</div></div>
                <div className="text-right text-sm"><strong>{brl(x.valor_pago || x.valor_por_parcela)}</strong><div className="meta"><Badge status={x.status} /></div></div>
              </div>
            ))}
            <div className="divider" />
            <div className="flex between"><span className="text-sm text-muted">Total recebido deste cliente</span><strong className="text-sm">{brl(money)}</strong></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function exportCsv(list, db) {
  const rows = [['Nome','Tipo','Documento','Cidade','UF','Status','Beneficiários']]
  list.forEach((c) => rows.push([c.nome_titular, c.tipo, (c.documento||''), c.cidade, c.uf, c.status, db.beneficiarios.filter((b) => b.cliente_id === c.id).length]))
  downloadCsv('clientes.csv', rows)
}
export function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}
