import { createContext, useContext, useState } from 'react'
import { uid } from './format'

// ---------- Ícones (SVG inline) ----------
export const Icon = ({ name, size = 19 }) => {
  const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" {...P}/><rect x="14" y="3" width="7" height="5" rx="1.5" {...P}/><rect x="14" y="12" width="7" height="9" rx="1.5" {...P}/><rect x="3" y="16" width="7" height="5" rx="1.5" {...P}/></>,
    users: <><path {...P} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle {...P} cx="9" cy="7" r="4"/><path {...P} d="M22 21v-2a4 4 0 0 0-3-3.87"/><path {...P} d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    funnel: <><path {...P} d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/></>,
    search: <><circle {...P} cx="11" cy="11" r="7"/><path {...P} d="m21 21-4.3-4.3"/></>,
    calc: <><rect {...P} x="4" y="2" width="16" height="20" rx="2"/><path {...P} d="M8 6h8"/><path {...P} d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></>,
    refresh: <><path {...P} d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path {...P} d="M21 3v5h-5"/><path {...P} d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path {...P} d="M3 21v-5h5"/></>,
    book: <><path {...P} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path {...P} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    doc: <><path {...P} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path {...P} d="M14 2v6h6"/><path {...P} d="M9 13h6M9 17h6"/></>,
    coins: <><circle {...P} cx="8" cy="8" r="6"/><path {...P} d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path {...P} d="M7 6h1v4"/><path {...P} d="m16.71 13.88.7.71-2.82 2.82"/></>,
    gear: <><circle {...P} cx="12" cy="12" r="3"/><path {...P} d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>,
    plus: <><path {...P} d="M12 5v14M5 12h14"/></>,
    check: <><path {...P} d="M20 6 9 17l-5-5"/></>,
    clock: <><circle {...P} cx="12" cy="12" r="9"/><path {...P} d="M12 7v5l3 2"/></>,
    phone: <><path {...P} d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.6 2.8a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.8.6a2 2 0 0 1 1.7 2z"/></>,
    bell: <><path {...P} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path {...P} d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    chev: <><path {...P} d="m9 18 6-6-6-6"/></>,
    trash: <><path {...P} d="M3 6h18"/><path {...P} d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path {...P} d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    edit: <><path {...P} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path {...P} d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    send: <><path {...P} d="M22 2 11 13"/><path {...P} d="M22 2 15 22l-4-9-9-4z"/></>,
    down: <><path {...P} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path {...P} d="M7 10l5 5 5-5"/><path {...P} d="M12 15V3"/></>,
    up: <><path {...P} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path {...P} d="M7 9l5-5 5 5"/><path {...P} d="M12 4v12"/></>,
    wallet: <><path {...P} d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path {...P} d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path {...P} d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
    target: <><circle {...P} cx="12" cy="12" r="9"/><circle {...P} cx="12" cy="12" r="5"/><circle {...P} cx="12" cy="12" r="1"/></>,
    menu: <><path {...P} d="M3 6h18M3 12h18M3 18h18"/></>,
    x: <><path {...P} d="M18 6 6 18M6 6l12 12"/></>,
  }
  return <svg className="ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden>{paths[name] || paths.dashboard}</svg>
}

// ---------- Badge ----------
const badgeMap = {
  ATIVO: ['green', 'Ativo'], EM_ANALISE: ['blue', 'Em análise'], CANCELADO: ['red', 'Cancelado'], PERDIDO: ['ink', 'Perdido'],
  NOVO: ['blue', 'Novo'], QUALIFICADO: ['amber', 'Qualificado'], EM_COTACAO: ['teal', 'Em cotação'], PROPOSTA_ENVIADA: ['blue', 'Proposta enviada'], NEGOCIACAO: ['amber', 'Negociação'], GANHO: ['green', 'Ganho'],
  PREVISTA: ['amber', 'Prevista'], A_RECEBER: ['blue', 'A receber'], PAGA: ['green', 'Paga'], EM_ATRASO: ['red', 'Em atraso'], GLOSADA: ['red', 'Glosada'], ESTORNADA: ['amber', 'Estornada'],
  A_RENOVAR: ['amber', 'A renovar'], RENOVADA: ['green', 'Renovada'], EM_NEGOCIACAO: ['amber', 'Em negociação'],
  RASCUNHO: ['ink', 'Rascunho'], ENVIADA: ['blue', 'Enviada'], VISTA: ['teal', 'Vista'], ACEITA: ['green', 'Aceita'], RECUSADA: ['red', 'Recusada'],
  EM_ANALISE_QT: ['blue', 'Em análise'], PF: ['ink', 'Pessoa física'], PJ: ['ink', 'Empresa'],
  INDIVIDUAL: ['blue', 'Individual'], FAMILIAR: ['teal', 'Familiar'], PME: ['amber', 'PME'], ADESAO: ['ink', 'Adesão'],
}
export const Badge = ({ status, custom }) => {
  const [color, label] = badgeMap[status] || ['ink', status]
  return <span className={`badge ${color}`}>{custom || label}</span>
}

// ---------- Modal ----------
export const Modal = ({ open, onClose, title, children, wide, foot }) => {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="m-head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {children}
        {foot && <div className="foot">{foot}</div>}
      </div>
    </div>
  )
}

// ---------- Field ----------
export const Field = ({ label, ...props }) => (
  <div className={`field ${props.full ? 'full' : ''}`}>
    {label && <label>{label}</label>}
    {props.tag === 'textarea'
      ? <textarea {...props} rows={props.rows || 3} />
      : <input {...props} />}
  </div>
)
export const Select = ({ label, children, ...props }) => (
  <div className="field">
    {label && <label>{label}</label>}
    <select {...props}>{children}</select>
  </div>
)

// ---------- Toast ----------
const ToastCtx = createContext(null)
export const ToastProvider = ({ children }) => {
  const [list, setList] = useState([])
  const toast = (msg, type = 'success') => {
    const id = uid()
    setList((l) => [...l, { id, msg, type }])
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200)
  }
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {list.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// ---------- KPI ----------
export const Kpi = ({ label, value, delta, tone, icon }) => (
  <div className={`card kpi ${tone || ''}`}>
    {icon && <div className="flex between"><span className="label">{label}</span>{icon}</div>}
    {!icon && <div className="label">{label}</div>}
    <div className="value">{value}</div>
    {delta && <div className="delta text-muted">{delta}</div>}
  </div>
)

// ---------- Empty ----------
export const Empty = ({ icon = 'doc', title, sub }) => (
  <div className="empty">
    <div style={{ fontSize: 40, opacity: .4 }}><Icon name={icon} size={40} /></div>
    <div style={{ fontWeight: 700, marginTop: 8, color: '#334155' }}>{title}</div>
    {sub && <div className="text-sm">{sub}</div>}
  </div>
)
