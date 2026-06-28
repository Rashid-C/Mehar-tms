'use client'
import { useEffect, useState } from 'react'
import { getRateSheets, createRateSheet, deleteRateSheet, getTailors, lookupRateSheet, RateSheet, Tailor } from '@/lib/api'

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }

export default function RateSheetPage() {
  const [ratesheets, setRatesheets] = useState<RateSheet[]>([])
  const [tailors, setTailors]       = useState<Tailor[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [form, setForm]             = useState({ md_no: '', tailor: '', rate: '', work_type: 'regular', notes: '' })

  const fetchData = async () => {
    const [rsRes, tailorRes] = await Promise.all([getRateSheets(), getTailors({ page_size: 1000 })])
    setRatesheets(rsRes.data)
    setTailors(tailorRes.data.results)
  }

  useEffect(() => { fetchData() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleMdNoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, md_no: value, tailor: '', rate: '' }))
    if (value.length >= 2) {
      try {
        const res = await lookupRateSheet(value)
        if (res.data) setForm(prev => ({ ...prev, md_no: value, tailor: String(res.data.tailor_id), rate: String(res.data.rate) }))
      } catch { }
    }
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.md_no || !form.tailor || !form.rate) { setError('MD Number, Tailor and Rate are required'); return }
    setLoading(true)
    try {
      await createRateSheet({ md_no: form.md_no, tailor: parseInt(form.tailor), rate: parseFloat(form.rate), work_type: form.work_type, notes: form.notes })
      setSuccess(`Rate for MD ${form.md_no} added`)
      setForm({ md_no: '', tailor: '', rate: '', work_type: 'regular', notes: '' })
      fetchData()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: unknown } }
        setError(JSON.stringify(e.response?.data))
      } else { setError('Something went wrong') }
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number, md_no: string) => {
    if (!confirm(`Delete rate sheet for MD ${md_no}?`)) return
    await deleteRateSheet(id)
    fetchData()
  }

  const workTypes = ['regular', 'new_design', 'special', 'alteration']

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Rate Sheet</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Rate Sheet</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Set rate per MD number — auto-fills in invoice</p>
        </div>

        {/* Add Form */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Add New Rate</span>
          </div>
          <div style={{ padding: '16px' }}>
            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>MD Number *</label>
                <input name="md_no" className="field" value={form.md_no} onChange={handleMdNoChange} placeholder="787" />
              </div>
              <div>
                <label style={lbl}>Tailor *</label>
                <select name="tailor" className="field" value={form.tailor} onChange={handleChange}>
                  <option value="">Select Tailor</option>
                  {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Rate (AED) *</label>
                <input name="rate" className="field" value={form.rate} onChange={handleChange} type="number" placeholder="70" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Work Type</label>
                <select name="work_type" className="field" value={form.work_type} onChange={handleChange}>
                  {workTypes.map(w => <option key={w} value={w}>{w.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <input name="notes" className="field" value={form.notes} onChange={handleChange} placeholder="Optional notes…" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="btn-gold">
              {loading ? 'Saving…' : '+ Add Rate'}
            </button>
          </div>
        </div>

        {/* Rate Sheet Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>All Rates</span>
            <span className="badge badge-blue">{ratesheets.length}</span>
          </div>
          <table className="z-table">
            <thead>
              <tr>
                <th>MD No</th>
                <th>Tailor</th>
                <th>Rate</th>
                <th>Work Type</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ratesheets.map(rs => (
                <tr key={rs.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{rs.md_no}</td>
                  <td><span className="badge badge-blue">{rs.tailor_code}</span></td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {rs.rate}</td>
                  <td style={{ color: '#6b7280' }}>{rs.work_type.replace('_', ' ')}</td>
                  <td style={{ color: '#9ca3af' }}>{rs.notes || '—'}</td>
                  <td>
                    <span className={rs.is_active ? 'badge badge-green' : 'badge badge-red'}>
                      {rs.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(rs.id, rs.md_no)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ratesheets.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>No rates configured yet.</p>
          )}
        </div>

      </div>
    </main>
  )
}
