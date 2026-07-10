'use client'
import { useEffect, useState } from 'react'
import { getTailors, createTailor, updateTailor, deleteTailor, Tailor } from '@/lib/api'

const PAGE_SIZE = 10
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]       = useState({ name: '', code: '', phone: '', opening_balance: '' })
  const [editId, setEditId]   = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', code: '', phone: '', opening_balance: '' })

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const load = async (p = page) => {
    const res = await getTailors({ page: p, page_size: PAGE_SIZE })
    setTailors(res.data.results)
    setTotal(res.data.count)
  }

  useEffect(() => { load(page) }, [page])

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }
  const fail   = (msg: string) => { setError(msg); setSuccess('') }

  const handleAdd = async () => {
    if (!form.name || !form.code) { fail('Name and Code are required'); return }
    setSaving(true)
    try {
      await createTailor({ ...form, code: form.code.toUpperCase(), opening_balance: form.opening_balance || 0 })
      notify(`Tailor "${form.code.toUpperCase()}" added`)
      setForm({ name: '', code: '', phone: '', opening_balance: '' })
      load(page)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) fail('Code already exists — use a different code')
      else fail(data ? Object.values(data).flat().join(' | ') : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const openEdit = (t: Tailor) => {
    setEditId(t.id)
    setEditForm({ name: t.name, code: t.code, phone: t.phone || '', opening_balance: String(t.opening_balance ?? 0) })
    setError(''); setSuccess('')
  }

  const handleUpdate = async () => {
    if (!editId) return
    if (!editForm.name || !editForm.code) { fail('Name and Code are required'); return }
    setSaving(true)
    try {
      await updateTailor(editId, { ...editForm, code: editForm.code.toUpperCase(), opening_balance: editForm.opening_balance || 0 })
      notify('Tailor updated')
      setEditId(null)
      load(page)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) fail('Code already exists')
      else fail(data ? Object.values(data).flat().join(' | ') : 'Update failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (t: Tailor) => {
    if (!confirm(`Delete tailor "${t.code} — ${t.name}"? This cannot be undone.`)) return
    try {
      await deleteTailor(t.id)
      notify(`Tailor "${t.code}" deleted`)
      const newPage = tailors.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage); load(newPage)
    } catch { fail('Cannot delete — tailor may have existing records') }
  }

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

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

        {/* Add Form */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Add New Tailor</span>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
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
            </div>
            <button onClick={handleAdd} disabled={saving} className="btn-gold">
              {saving ? 'Saving…' : '+ Add Tailor'}
            </button>
          </div>
        </div>

        {/* Tailor List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>All Tailors</span>
            <span className="badge badge-blue">{total}</span>
          </div>

          {tailors.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>No tailors yet. Add one above.</p>
          ) : (
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
                  return editId === t.id ? (
                    <tr key={t.id}>
                      <td colSpan={5} style={{ padding: '12px 14px', background: '#f5f8ff' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                          <div>
                            <label style={lbl}>Name *</label>
                            <input className="field" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div>
                            <label style={lbl}>Code *</label>
                            <input className="field" value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} maxLength={20} />
                          </div>
                          <div>
                            <label style={lbl}>Phone</label>
                            <input className="field" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                          </div>
                          <div>
                            <label style={lbl}>Opening Balance</label>
                            <input type="number" step="0.01" className="field" value={editForm.opening_balance} onChange={e => setEditForm(p => ({ ...p, opening_balance: e.target.value }))} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleUpdate} disabled={saving} className="btn-gold" style={{ whiteSpace: 'nowrap' }}>
                              {saving ? 'Saving…' : 'Update'}
                            </button>
                            <button onClick={() => setEditId(null)} className="btn-ghost">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={t.id}>
                      <td><span className="badge badge-blue">{t.code}</span></td>
                      <td style={{ fontWeight: 500, color: '#1e293b' }}>{t.name}</td>
                      <td style={{ color: '#6b7280' }}>{t.phone || '—'}</td>
                      <td style={{ color: ob > 0 ? '#0f766e' : ob < 0 ? '#dc2626' : '#9ca3af', fontWeight: 600 }}>
                        AED {ob.toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => openEdit(t)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                          <button onClick={() => handleDelete(t)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #e8ecf0', background: '#f8f9fb' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>← Prev</button>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', padding: '4px 10px', background: '#eff6ff', borderRadius: 4 }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Next →</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
