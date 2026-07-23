import type { CSSProperties } from 'react'

export type JobType = 'shop' | 'order' | 'payment' | 'mat' | 'stitching'

export const today = () => new Date().toISOString().slice(0, 10)
export const MODEL_NO_RE = /^[A-Z0-9]{1,7}$/
export const PAGE_SIZE = 10

export const lbl: CSSProperties = { color: '#374151', fontSize: 12, fontWeight: 500 }

export const jobs: { id: JobType; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'shop',      label: 'Shop',      color: '#2563eb', icon: '🛍️', desc: 'Shop invoices' },
  { id: 'order',     label: 'Order',     color: '#0891b2', icon: '📦', desc: 'Tailor orders' },
  { id: 'payment',   label: 'Payment',   color: '#16a34a', icon: '💳', desc: 'Release payments' },
  { id: 'mat',       label: 'Mat Issue', color: '#d97706', icon: '🧵', desc: 'Material issues' },
  { id: 'stitching', label: 'Stitching', color: '#7c3aed', icon: '✂️', desc: 'Production entries' },
]
