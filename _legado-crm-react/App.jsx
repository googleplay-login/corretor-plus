import { useState } from 'react'
import { useStore } from './store.jsx'
import { ToastProvider, Icon, useToast } from './ui.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clientes from './pages/Clientes.jsx'
import Leads from './pages/Leads.jsx'
import Cotacao from './pages/Cotacao.jsx'
import Renovacoes from './pages/Renovacoes.jsx'
import Comissoes from './pages/Comissoes.jsx'
import Financeiro from './pages/Financeiro.jsx'
import Conhecimento from './pages/Conhecimento.jsx'
import Propostas from './pages/Propostas.jsx'
import Config from './pages/Config.jsx'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'clientes', label: 'Clientes', icon: 'users' },
  { key: 'leads', label: 'Leads', icon: 'funnel' },
  { key: 'cotacao', label: 'Cotar', icon: 'search' },
  { key: 'renovacoes', label: 'Renovações', icon: 'refresh' },
  { key: 'comissoes', label: 'Comissões', icon: 'coins' },
  { key: 'financeiro', label: 'Financeiro', icon: 'wallet' },
  { key: 'conhecimento', label: 'Base ANS', icon: 'book' },
  { key: 'propostas', label: 'Propostas', icon: 'doc' },
  { key: 'config', label: 'Ajustes', icon: 'gear' },
]
const TITLES = {
  dashboard: ['Dashboard', 'Visão geral do seu negócio'],
  clientes: ['Clientes', 'CRM — carteira e contratos'],
  leads: ['Funil de Leads', 'Acompanhe e converta'],
  cotacao: ['Cotação entre operadoras', 'Compare planos por faixa etária'],
  renovacoes: ['Carteira & Renovações', 'Não perca nenhum prazo'],
  comissoes: ['Comissões', 'Receba o que é seu — sem sustos'],
  financeiro: ['Financeiro & Metas', 'Quanto entrou, quanto falta'],
  conhecimento: ['Base de Conhecimento ANS', 'Regras, prazos e como explicar'],
  propostas: ['Propostas', 'Envie e acompanhe'],
  config: ['Ajustes', 'Perfil, mensagens e dados'],
}

function Login() {
  const { login } = useStore()
  const toast = useToast()
  const [email, setEmail] = useState('carlos@corretor.com')
  const [senha, setSenha] = useState('demo123')
  const [erro, setErro] = useState('')
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ color: 'var(--brand-2)', padding: 0, marginBottom: 8 }}><span className="dot" /> CORRETOR+</div>
        <h2>Painel do corretor</h2>
        <p className="text-sm text-muted">Gestão de comissões, cotações, carteira e leads em um só lugar.</p>
        {erro && <div className="error-banner">{erro}</div>}
        <div className="field"><label>E-mail</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        <button className="btn full" style={{ width: '100%' }} onClick={() => { if (!email.includes('@')) return setErro('Informe um e-mail válido'); setErro(''); login(); toast('Bem-vindo!') }}>Entrar</button>
        <div className="info-banner mt">🔒 Protótipo de demonstração: qualquer e-mail/senha funciona. Os dados ficam salvos no seu navegador.</div>
      </div>
    </div>
  )
}

function Shell({ page, go }) {
  const { db, authed } = useStore()
  const [menu, setMenu] = useState(false)
  const [title, sub] = TITLES[page] || ['', '']

  if (!authed) return <Login />

  const mobileKeys = ['dashboard', 'clientes', 'leads', 'cotacao', 'comissoes', 'propostas']

  return (
    <div className="app">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><span className="dot" /> CORRETOR+</div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => { go(n.key); setMenu(false) }}>
              <Icon name={n.icon} size={18} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div style={{ fontWeight: 700 }}>{db.perfil.nome}</div>
          <div>SUSEP {db.perfil.registro_susep} · {db.perfil.cidade}/{db.perfil.uf}</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="flex">
            <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu"><Icon name="menu" size={24} /></button>
            <div>
              <h1>{title}</h1>
              <div className="sub">{sub}</div>
            </div>
          </div>
          <div className="top-actions">
            <span className="badge blue">{db.perfil.fantasia}</span>
          </div>
        </header>

        <main className="content">
          <section className="page">
            {page === 'dashboard' && <Dashboard go={go} />}
            {page === 'clientes' && <Clientes go={go} />}
            {page === 'leads' && <Leads />}
            {page === 'cotacao' && <Cotacao go={go} />}
            {page === 'renovacoes' && <Renovacoes />}
            {page === 'comissoes' && <Comissoes />}
            {page === 'financeiro' && <Financeiro />}
            {page === 'conhecimento' && <Conhecimento />}
            {page === 'propostas' && <Propostas />}
            {page === 'config' && <Config />}
          </section>
        </main>
      </div>

      <nav className="mobile-nav">
        {mobileKeys.map((k) => { const n = NAV.find((x) => x.key === k); return (
          <button key={k} className={page === k ? 'active' : ''} onClick={() => go(k)}><Icon name={n.icon} size={20} /> {n.label}</button>
        ) })}
      </nav>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  return (
    <ToastProvider>
      <Shell page={page} go={setPage} />
    </ToastProvider>
  )
}
