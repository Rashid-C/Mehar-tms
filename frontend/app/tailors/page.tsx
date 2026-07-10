'use client'
import { useEffect, useState } from 'react'
import { getTailors, createTailor, updateTailor, deleteTailor, Tailor } from '@/lib/api'
import RowActions from '@/components/RowActions'

const PAGE_SIZE = 10
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }
const emptyForm = { name: '', code: '', phone: '', opening_balance: '' }

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]       = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId]   = useState<number | null>(null)

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const load = async (p = page) => {
    const res = await getTailors({ page: p, page_size: PAGE_SIZE })
    setTailors(res.data.results)
    setTotal(res.data.count)
  }

  useEffect(() => { load(page) }, [page])

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }
  const fail   = (msg: string) => { setError(msg); setSuccess('') }

  const resetForm = () => { setForm(emptyForm); setIsEditing(false); setEditId(null) }

  const openEdit = (t: Tailor) => {
    setEditId(t.id)
    setForm({ name: t.name, code: t.code, phone: t.phone || '', opening_balance: String(t.opening_balance ?? 0) })
    setIsEditing(true)
    setError(''); setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code) { fail('Name and Code are required'); return }
    setSaving(true)
    try {
      const payload = { ...form, code: form.code.toUpperCase(), opening_balance: form.opening_balance || 0 }
      if (isEditing && editId) {
        await updateTailor(editId, payload)
        notify('Tailor updated')
      } else {
        await createTailor(payload)
        notify(`Tailor "${form.code.toUpperCase()}" added`)
      }
      resetForm()
      load(page)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) fail('Code already exists — use a different code')
      else fail(data ? Object.values(data).flat().join(' | ') : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const handleDelete = async (t: Tailor) => {
    if (!confirm(`Delete tailor "${t.code} — ${t.name}"? This cannot be undone.`)) return
    try {
      await deleteTailor(t.id)
      notify(`Tailor "${t.code}" deleted`)
      if (isEditing && editId === t.id) resetForm()
      const newPage = tailors.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage); load(newPage)
    } catch { fail('Cannot delete — tailor may have existing records') }
  }

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Tailors</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Tailors</h1>
        </div>

        {/* Alerts */}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Count bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <span className="badge badge-blue" style={{ flexShrink: 0 }}>{total}</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>tailors</span>
        </div>

        {/* 30/70 split */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* Left: Form (30%) */}
          <div style={{ width: '30%', flexShrink: 0 }}>
            <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditing ? 'Edit Tailor' : 'Add New Tailor'}</span>
                {isEditing && (
                  <button type="button" onClick={resetForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
                <div>
                  <label style={lbl}>Full Name *</label>
                  <input className="field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Muhammad Javed" />
                </div>
                <div>
                  <label style={lbl}>Code *</label>
                  <input className="field" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="MJ" maxLength={20} />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input className="field" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 000 0000" />
                </div>
                <div>
                  <label style={lbl}>Opening Balance (AED)</label>
                  <input type="number" step="0.01" className="field" value={form.opening_balance}
                    onChange={e => setForm(p => ({ ...p, opening_balance: e.target.value }))} placeholder="0.00" />
                </div>
                <button type="submit" disabled={saving} className="btn-gold" style={{ width: '100%' }}>
                  {saving ? 'Saving…' : isEditing ? 'Update Tailor' : '+ Add Tailor'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Table (70%) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {tailors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                No tailors yet. Add one on the left.
              </div>
            ) : (
              <>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="z-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Opening Balance</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tailors.map(t => {
                          const ob = parseFloat(String(t.opening_balance)) || 0
                          return (
                            <tr key={t.id}>
                              <td><span className="badge badge-blue">{t.code}</span></td>
                              <td style={{ fontWeight: 500, color: '#1e293b' }}>{t.name}</td>
                              <td style={{ color: '#6b7280' }}>{t.phone || '—'}</td>
                              <td style={{ color: ob > 0 ? '#0f766e' : ob < 0 ? '#dc2626' : '#9ca3af', fontWeight: 600 }}>
                                AED {ob.toFixed(2)}
                              </td>
                              <td><RowActions onEdit={() => openEdit(t)} onDelete={() => handleDelete(t)} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>← Prev</button>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: 6 }}>{page} / {totalPages}</span>
                      <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
