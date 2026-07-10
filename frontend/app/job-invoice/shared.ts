import type { CSSProperties } from 'react'

export type JobType = 'shop' | 'order' | 'payment' | 'mat'

export const today = () => new Date().toISOString().slice(0, 10)
export const MODEL_NO_RE = /^[A-Z0-9]{1,7}$/
export const PAGE_SIZE = 10

export const lbl: CSSProperties = { color: '#374151', fontSize: 12, fontWeight: 500 }
