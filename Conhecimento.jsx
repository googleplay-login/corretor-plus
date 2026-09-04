import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Select } from '../ui.jsx'

const CAT = { CARENCIA: 'Carência', REAJUSTE: 'Reajuste', PORTABILIDADE: 'Portabilidade', COBERTURA_ROL: 'Cobertura / Rol', REEMBOLSO: 'Reembolso', NEGATIVA_COBERTURA: 'Negativa de cobertura', CONTRATOS: 'Contratos', DIREITOS: 'Direitos', COMERCIALIZACAO: 'Comercialização', TEA_TERAPIAS: 'TEA / Terapias' }

export default function Conhecimento() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [open, setOpen] = useState(null)

  const list = useMemo(() => db.artigos.filter((a) => {
    if (q && !(a.titulo.toLowerCase().includes(q.toLowerCase()) || a.conteudo.toLowerCase().includes(q.toLowerCase()))) return false
    if (cat && a.categoria !== cat) return false
    return true
  }), [db.artigos, q, cat])

  const openArt = db.artigos.find((a) => a.id === open)

  return (
    <div>
      <div className="flex wrap mb" style={{ gap: 10 }}>
        <div style={{ flex: 1, minWidth: 220 }}><div className="field"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nas regras e prazos..." /></div></div>
        <div style={{ minWidth: 190 }}><Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>{Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select></div>
      </div>

      <div className="card mb">
        <div className="section-title">Prazos e regras em tabela</div>
        <table className="table">
          <thead><tr><th>Contexto</th><th>Regra</th><th>Detalhe</th><th>Fonte</th></tr></thead>
          <tbody>
            {db.prazos.map((p) => (
              <tr key={p.id}><td><strong>{p.contexto}</strong></td><td><span className="badge blue">{p.regra_texto}</span></td><td className="text-muted">{p.detalhe}</td><td className="text-muted text-sm">{p.fonte}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid cols-3">
        {list.map((a) => (
          <div key={a.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setOpen(a.id)}>
            <div className="flex between"><span className="badge blue">{CAT[a.categoria] || a.categoria}</span><Icon name="chev" size={16} /></div>
            <div style={{ fontWeight: 800, fontSize: 15, margin: '10px 0 6px' }}>{a.titulo}</div>
            <div className="text-sm text-muted">{a.resumo}</div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div className="empty">Nenhum artigo para esses filtros.</div>}

      <div className="card mt">
        <div className="section-title">Suas anotações de estratégia</div>
        <div className="text-sm text-muted">Espaço privado para registrar como você aborda cada cenário (deixe em branco se preferir).</div>
        <textarea className="mt" rows={3} placeholder="Ex: Sempre menciono portabilidade antes de falar de custo..." style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)', padding: 10, fontFamily: 'inherit' }} />
      </div>

      <Modal openArt={openArt} onClose={() => setOpen(null)} alt={openArt} />
    </div>
  )
}

function Modal({ openArt, onClose, alt }) {
  if (!alt) return null
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal wide">
        <div className="m-head"><h3>{alt.titulo}</h3><button className="close" onClick={onClose}>×</button></div>
        <div className="flex wrap mb"><span className="badge blue">{CAT[alt.categoria]}</span><span className="text-sm text-muted">Fonte: {alt.fonte}</span></div>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14.5 }}>{alt.conteudo}</div>
        <div className="card mt" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div className="text-sm" style={{ fontWeight: 800 }}>💬 Como explicar para o cliente</div>
          <div className="text-sm mt">{alt.bloco_como_explicar}</div>
        </div>
      </div>
    </div>
  )
}
