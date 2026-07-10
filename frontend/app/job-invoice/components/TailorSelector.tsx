'use client'
import { useState } from 'react'
import { createTailor, Tailor } from '@/lib/api'
import { lbl } from '../shared'

export default function TailorSelector({ tailors, value, onChange, onTailorCreated, onError }: {
  tailors: Tailor[]
  value: number | ''
  onChange: (v: number) => void
  onTailorCreated: (t: Tailor) => void
  onError: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)

  const openPanel = () => { setOpen(true); setNewName(''); setNewCode(''); setNewPhone('') }
  const closePanel = () => setOpen(false)

  const handleCreate = async () => {
    if (!newName || !newCode) { onError('Name and Code are required'); return }
    setCreating(true)
    try {
      const res = await createTailor({ name: newName, code: newCode.toUpperCase(), phone: newPhone })
      onTailorCreated(res.data)
      onChange(res.data.id)
      closePanel()
    } catch (e: unknown) {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) onError('Code already exists — use a different code')
      else if (data) onError(Object.values(data).flat().join(' | '))
      else onError('Failed to create tailor — check your connection')
    } finally { setCreating(false) }
  }

  return (
    <div>
      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Tailor</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select className="field" style={{ flex: 1 }} value={value} onChange={e => onChange(Number(e.target.value))} required>
          <option value="">— Select tailor —</option>
          {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
        </select>
        <button type="button"
          onClick={() => open ? closePanel() : openPanel()}
          className="btn-ghost" style={{ padding: '6px 12px', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {open ? '×' : '+'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 10, padding: '12px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>New Tailor</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Code *</label>
              <input className="field" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="MJ" maxLength={20} />
            </div>
            <div>
              <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Name *</label>
              <input className="field" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="Full name" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Phone (optional)</label>
            <input className="field" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="+971 …" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={creating} onClick={handleCreate} className="btn-gold" style={{ fontSize: 12, padding: '6px 14px' }}>
              {creating ? 'Saving…' : 'Create & Select'}
            </button>
            <button type="button" onClick={closePanel} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
