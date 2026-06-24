'use client'
import { useEffect, useState } from 'react'
import { getTailors, createTailor, updateTailor, deleteTailor, Tailor } from '@/lib/api'

const PAGE_SIZE = 10
const lbl = { color: '#64748b', fontSize: '10px', letterSpacing: '1.5px', display: 'block', marginBottom: '6px', fontWeight: 700 } as React.CSSProperties

export default function TailorsPage() {
  const [tailors, setTailors]   = useState<Tailor[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // Add form
  const [form, setForm] = useState({ name: '', code: '', phone: '' })

  // Edit state
  const [editId, setEditId]     = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', code: '', phone: '' })

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const load = async (p = page) => {
    const res = await getTailors({ page: p, page_size: PAGE_SIZE })
    setTailors(res.data.results)
    setTotal(res.data.count)
  }

  useEffect(() => { load(page) }, [page])

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }
  const fail   = (msg: string) => { setError(msg);   setSuccess('') }

  const handleAdd = async () => {
    if (!form.name || !form.code) { fail('Name and Code are required'); return }
    setSaving(true)
    try {
      await createTailor({ ...form, code: form.code.toUpperCase() })
      notify(`Tailor "${form.code.toUpperCase()}" added`)
      setForm({ name: '', code: '', phone: '' })
      load(page)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) fail('Code already exists — use a different code')
      else fail(data ? Object.values(data).flat().join(' | ') : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const openEdit = (t: Tailor) => {
    setEditId(t.id)
    setEditForm({ name: t.name, code: t.code, phone: t.phone || '' })
    setError(''); setSuccess('')
  }

  const handleUpdate = async () => {
    if (!editId) return
    if (!editForm.name || !editForm.code) { fail('Name and Code are required'); return }
    setSaving(true)
    try {
      await updateTailor(editId, { ...editForm, code: editForm.code.toUpperCase() })
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
      setPage(newPage)
      load(newPage)
    } catch {
      fail('Cannot delete — tailor may have existing records')
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <div className="flex items-center gap-4 mb-6">
          <a href="/" className="text-sm font-medium" style={{ color: '#9ca3af', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
            ← Back
          </a>
        </div>

        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Add Form */}
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 py-3.5"
            style={{ background: 'rgba(37,99,235,0.04)', borderBottom: '1.5px solid rgba(37,99,235,0.08)' }}>
            <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '50%' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#2563eb', letterSpacing: '2px' }}>ADD NEW TAILOR</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label style={lbl}>FULL NAME *</label>
              <input className="field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Muhammad Javed" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={lbl}>CODE *</label>
                <input className="field" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="MJ" maxLength={20} />
              </div>
              <div>
                <label style={lbl}>PHONE</label>
                <input className="field" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 000 0000" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving}
              className="text-xs font-bold py-2.5 rounded-xl transition-all"
              style={{ background: saving ? 'rgba(37,99,235,0.15)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: saving ? '#9ca3af' : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 3px 10px rgba(37,99,235,0.3)' }}>
              {saving ? 'Saving…' : '+ ADD TAILOR'}
            </button>
          </div>
        </div>

        {/* Tailor List */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5"
            style={{ background: 'rgba(37,99,235,0.04)', borderBottom: '1.5px solid rgba(37,99,235,0.08)' }}>
            <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '50%' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#2563eb', letterSpacing: '2px' }}>ALL TAILORS</span>
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}>{total}</span>
          </div>

          {tailors.length === 0 ? (
            <p className="text-center py-10 text-sm tracking-widest" style={{ color: '#d1d5db' }}>NO TAILORS YET</p>
          ) : (
            <div>
              {tailors.map((t, idx) => (
                <div key={t.id} style={{ borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                  {editId === t.id ? (
                    /* Edit row */
                    <div className="p-4 flex flex-col gap-3"
                      style={{ background: 'rgba(37,99,235,0.03)' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label style={lbl}>NAME *</label>
                          <input className="field text-sm" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label style={lbl}>CODE *</label>
                          <input className="field text-sm" value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} maxLength={20} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>PHONE</label>
                        <input className="field text-sm" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 000 0000" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleUpdate} disabled={saving}
                          className="flex-1 text-xs font-bold py-2 rounded-xl"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>
                          {saving ? 'Saving…' : 'Update'}
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="text-xs px-4 py-2 rounded-xl font-semibold"
                          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal row */
                    <div className="flex items-center justify-between px-5 py-3.5"
                      style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbff' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(37,99,235,0.08)', border: '1.5px solid rgba(37,99,235,0.2)', color: '#2563eb' }}>
                          {t.code}
                        </span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{t.name}</p>
                          {t.phone && <p className="text-xs" style={{ color: '#9ca3af' }}>{t.phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(t)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(t)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', cursor: 'pointer' }}>
                          Del
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: '1.5px solid rgba(37,99,235,0.08)', background: 'rgba(37,99,235,0.02)' }}>
              <span className="text-xs" style={{ color: '#94a3b8' }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: page <= 1 ? '#cbd5e1' : '#475569', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: page >= totalPages ? '#cbd5e1' : '#475569', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
