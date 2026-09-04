// Helpers de formatação em padrão brasileiro
export const brl = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const brlCompact = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1000) return (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
  return brl(v)
}

export const pct = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'

export const dateBR = (d) => {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : d
  if (isNaN(dt)) return '—'
  return dt.toLocaleDateString('pt-BR')
}

export const daysUntil = (d) => {
  if (!d) return null
  const dt = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : d
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((dt - today) / 86400000)
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const addMonths = (iso, months) => {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// Faixas etárias ANS (10 faixas)
export const FAIXAS = [
  '0 a 18', '19 a 23', '24 a 28', '29 a 33', '34 a 38',
  '39 a 43', '44 a 48', '49 a 53', '54 a 58', '59+',
]

export const faixaDeIdade = (idade) => {
  if (idade <= 18) return '0 a 18'
  if (idade <= 23) return '19 a 23'
  if (idade <= 28) return '24 a 28'
  if (idade <= 33) return '29 a 33'
  if (idade <= 38) return '34 a 38'
  if (idade <= 43) return '39 a 43'
  if (idade <= 48) return '44 a 48'
  if (idade <= 53) return '49 a 53'
  if (idade <= 58) return '54 a 58'
  return '59+'
}

export const idadeDeNascimento = (nasc) => {
  if (!nasc) return null
  const d = new Date(nasc + 'T00:00:00')
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export const uid = () => 'id-' + Math.random().toString(36).slice(2, 10)
