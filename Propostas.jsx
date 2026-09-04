import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon, Badge, Modal, Field, Select, useToast, Empty } from '../ui.jsx'
import { brl, pct, dateBR } from '../format.js'

export default function Propostas() {
  const { db, set } = useStore()
  const toast = useToast()
  const [view, setView] = useState(null)

  const list = db.propostas || []

  const openArt = db.propostas.find((x) => x.id === view)

  const print = (p) => {
    // gera link público simulado + janela de impressão
    const w = window.open('', '_blank')
    if (!w) return toast('Permita janelas pop-up para imprimir', 'error')
    w.document.write(renderHTML(p, db))
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 500)
  }

  const copyWhats = (p) => {
    const txt = `Olá! Segue a proposta para ${p.titulo}. Confira as opções abaixo e me chame para detalhar. 😊`
    navigator.clipboard?.writeText(txt).then(() => toast('Texto copiado para mensagem'))
  }

  return (
    <div>
      <div className="flex between wrap mb">
        <div className="text-sm text-muted">Propostas geradas ({list.length}). Use a aba <strong>Cotar</strong> para criar novas.</div>
      </div>

      {list.length === 0 && <div className="card"><Empty icon="doc" title="Nenhuma proposta" sub='Gere a partir de uma cotação na aba "Cotar".' /></div>}

      <div className="grid cols-3">
        {list.map((p) => (
          <div key={p.id} className="card">
            <div className="flex between mb"><Badge status={p.status} /><span className="badge ink">{p.estilo === 'EXECUTIVO' ? 'Executivo' : 'Clean'}</span></div>
            <div style={{ fontWeight: 800 }}>{p.titulo}</div>
            <div className="text-sm text-muted mb">{p.conteudo?.opcoes?.length || 0} opção(ões) · criada em {dateBR(p.criado_em)}</div>
            <div className="flex wrap">
              <button className="btn sm" onClick={() => { navigator.clipboard?.writeText('https://proposta.exemplo.com/' + p.id); toast('Link de proposta copiado (simulado)') }}><Icon name="send" size={15}/> Link público</button>
              <button className="btn sm ghost" onClick={() => setView(p.id)}><Icon name="edit" size={15}/> Ver</button>
              <button className="btn sm ghost" onClick={() => print(p)}><Icon name="down" size={15}/> Imprimir/PDF</button>
              <button className="btn sm ghost" onClick={() => copyWhats(p)}><Icon name="phone" size={15}/> WhatsApp</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title="Prévia da proposta" wide>
        {openArt && <PropostaPreview p={openArt} db={db} onStatus={(s) => { set((x) => ({ ...x, propostas: x.propostas.map((q) => (q.id === openArt.id ? { ...q, status: s } : q)) })); toast('Status atualizado') }} />}
      </Modal>
    </div>
  )
}

function PropostaPreview({ p, db, onStatus }) {
  const perfil = db.perfil
  return (
    <div className="card" style={{ background: '#fbfdfe' }}>
      <div className="flex between">
        <div>
          <div style={{ fontWeight: 800, color: 'var(--brand-2)' }}>{perfil.fantasia}</div>
          <div className="text-sm text-muted">{perfil.nome} · Registro SUSEP {perfil.registro_susep}</div>
        </div>
        <span className="badge blue">{p.estilo === 'EXECUTIVO' ? 'Modelo executivo' : 'Modelo clean'}</span>
      </div>
      <div className="divider" />
      <div className="section-title">Entendemos sua necessidade</div>
      <div className="text-sm text-muted">{p.titulo} — comparativo de opções com valores, carência e rede.</div>
      <div className="mt" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(p.conteudo?.opcoes || []).map((o, i) => (
          <div key={i} className="card" style={{ borderLeft: o.recomendado ? '4px solid var(--teal)' : undefined, padding: 14 }}>
            <div className="flex between"><div style={{ fontWeight: 800 }}>{o.plano}</div>{o.recomendado && <span className="badge teal">Recomendada</span>}</div>
            <div className="text-sm text-muted mb">{o.operadora} · {o.modalidade.toLowerCase()} · {o.abrangencia?.toLowerCase().replace('_',' ')}</div>
            <div className="flex wrap" style={{ gap: 18, fontSize: 13 }}>
              <div><div className="text-muted text-sm">Mensalidade</div><strong>{brl(o.mensalidade)}</strong></div>
              <div><div className="text-muted text-sm">Carência</div><strong>{o.carencia}</strong></div>
              <div><div className="text-muted text-sm">Rede</div><strong>{o.rede}+</strong></div>
              <div><div className="text-muted text-sm">Copartic.</div><strong>{o.coparticipacao}</strong></div>
              <div><div className="text-muted text-sm">Reajuste</div><strong>{pct(o.reajuste)}</strong></div>
            </div>
          </div>
        ))}
      </div>
      <div className="card mt" style={{ background: '#f0fdfa' }}>
        <div style={{ fontWeight: 800 }}>Nosso compromisso de acompanhamento</div>
        <div className="text-sm text-muted mt">Acompanho renovações, reajustes e qualquer negativa de cobertura. Você não fica sozinho.</div>
      </div>
      <div className="divider" />
      <div className="text-sm text-muted">⚠ Valores indicativos — confirme o contrato vigente da operadora.</div>
      <div className="flex mt" style={{ gap: 8 }}>
        <button className="btn green sm" onClick={() => onStatus('ACEITA')}>Marcar aceita</button>
        <button className="btn red sm" onClick={() => onStatus('RECUSADA')}>Marcar recusada</button>
        <button className="btn sm" onClick={() => onStatus('ENVIADA')}>Marcar enviada</button>
        <a className="btn sm" href={`https://wa.me/${(perfil.whatsapp||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer"><Icon name="phone" size={15}/> WhatsApp</a>
      </div>
    </div>
  )
}

// HTML para impressão/PDF
function renderHTML(p, db) {
  const perfil = db.perfil
  const ops = (p.conteudo?.opcoes || []).map((o) => `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:12px;${o.recomendado ? 'border-left:4px solid #14b8a6' : ''}">
      <h3 style="margin:0 0 4px">${o.plano}</h3>
      <p style="margin:0;color:#64748b;font-size:13px">${o.operadora} · ${o.modalidade.toLowerCase()}</p>
      <p style="font-size:15px"><strong>${brl(o.mensalidade)}/mês</strong> · carência ${o.carencia} · rede ${o.rede}+ · copartic. ${o.coparticipacao} · reajuste ${pct(o.reajuste)}</p>
    </div>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${p.titulo}</title></head>
  <body style="font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:0 auto;padding:24px">
    <div style="border-bottom:2px solid #0e7ea6;padding-bottom:10px">
      <h2>${perfil.fantasia}</h2><p style="margin:0;color:#64748b;font-size:13px">${perfil.nome} · Registro SUSEP ${perfil.registro_susep} · ${perfil.whatsapp}</p>
    </div>
    <h3 style="margin-top:22px">Entendemos sua necessidade</h3>
    <p style="color:#64748b">${p.titulo}</p>
    ${ops}
    <div style="border-radius:12px;background:#f0fdfa;padding:12px;font-size:14px"><strong>Nosso compromisso de acompanhamento</strong><br><span style="color:#475569">Acompanho renovações, reajustes e negativas.</span></div>
    <p style="color:#94a3b8;font-size:11px;margin-top:20px">Valores indicativos — confirme o contrato vigente da operadora.</p>
  </body></html>`
}
