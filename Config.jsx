import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Field, useToast } from '../ui.jsx'

export default function Config() {
  const { db, set, resetDemo, logout } = useStore()
  const toast = useToast()
  const [f, setF] = useState(db.perfil)

  const save = () => { set((p) => ({ ...p, perfil: f })); toast('Perfil salvo') }

  return (
    <div className="grid cols-3">
      <div className="card">
        <div className="section-title">Seu perfil</div>
        <Field label="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <Field label="Nome fantasia / logo" value={f.fantasia} onChange={(e) => setF({ ...f, fantasia: e.target.value })} />
        <Field label="Registro SUSEP" value={f.registro_susep} onChange={(e) => setF({ ...f, registro_susep: e.target.value })} />
        <Field label="Corretora (opcional)" value={f.corretora} onChange={(e) => setF({ ...f, corretora: e.target.value })} />
        <Field label="WhatsApp" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
        <Field label="Cidade/UF" value={`${f.cidade}/${f.uf}`} onChange={(e) => { const [c, u] = e.target.value.split('/'); setF({ ...f, cidade: c || '', uf: (u || '').toUpperCase() }) }} />
        <button className="btn mt" onClick={save}><Icon name="check" size={16}/> Salvar perfil</button>
      </div>

      <div className="card">
        <div className="section-title">Templates de mensagem (WhatsApp)</div>
        <div className="text-sm text-muted mb">Prontos para enviar, com os campos marcados com {"{{...}}"}.</div>
        {db.templates.map((t) => (
          <div key={t.id} className="row">
            <div className="grow"><div className="title text-sm">{t.nome}</div><div className="meta text-sm">{t.texto}</div></div>
            <button className="btn icon ghost sm" onClick={() => { navigator.clipboard?.writeText(t.texto); toast(`${t.nome} copiado`) }}><Icon name="doc" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">Dados e conta</div>
        <div className="text-sm text-muted">Os dados ficam salvos neste navegador (protótipo).</div>
        <button className="btn amber mt" onClick={() => { resetDemo(); toast('Dados de exemplo restaurados') }}><Icon name="refresh" size={16}/> Restaurar dados de exemplo</button>
        <button className="btn red mt" onClick={logout}><Icon name="x" size={16}/> Sair</button>
      </div>
    </div>
  )
}
