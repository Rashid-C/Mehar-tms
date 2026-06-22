'use client'
import { useEffect, useState } from 'react'
import { getStitchings, createStitching, deleteStitching, getTailors, getStitchingSummary, lookupRateSheet, ShopStitching, Tailor } from '@/lib/api'

const EMPTY = {
  md_no: '', tailor: '', date: '', pc_count: '', rate: '',
  cloth: '', mtr: '', inv_no: '', remarks: '',
}

export default function StitchingPage() {
  const [records, setRecords] = useState<ShopStitching[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [summary, setSummary] = useState({ total_pieces: 0, total_amount: 0, total_records: 0 })
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterTailor, setFilterTailor] = useState('')

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const fetchData = async () => {
    const params: Record<string, string | number> = { month: filterMonth }
    if (filterTailor) params.tailor = filterTailor
    const [recRes, sumRes, tailorRes] = await Promise.all([
      getStitchings(params),
      getStitchingSummary(params),
      getTailors(),
    ])
    setRecords(recRes.data)
    setSummary(sumRes.data)
    setTailors(tailorRes.data)
  }

  useEffect(() => { fetchData() }, [filterMonth, filterTailor])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleMdNoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, md_no: value, tailor: '', rate: '', inv_no: '' }))
    if (value.length >= 2) {
      try {
        const res = await lookupRateSheet(value)
        if (res.data) {
          setForm(prev => ({
            ...prev, md_no: value,
            tailor: String(res.data.tailor_id),
            rate: String(res.data.rate),
            inv_no: res.data.inv_no || '',
          }))
        }
      } catch { }
    }
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.md_no || !form.tailor || !form.date || !form.pc_count || !form.rate) {
      setError('MD No, Tailor, Date, Pieces and Rate are required')
      return
    }
    setLoading(true)
    try {
      await createStitching({
        md_no: form.md_no, tailor: parseInt(form.tailor), date: form.date,
        pc_count: parseInt(form.pc_count), rate: parseFloat(form.rate),
        cloth: form.cloth, mtr: form.mtr ? parseFloat(form.mtr) : null,
        inv_no: form.inv_no, remarks: form.remarks,
      })
      setSuccess(`Stitching record added for MD ${form.md_no}`)
      setForm(EMPTY)
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } }
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stitching record?')) return
    await deleteStitching(id)
    fetchData()
  }

  const autoTotal = form.pc_count && form.rate
    ? (parseFloat(form.pc_count) * parseFloat(form.rate)).toFixed(2)
    : null

  const inputStyle = {
    width: '100%', background: '#ffffff',
    border: '1.5px solid #e5e7eb', borderRadius: '12px',
    padding: '10px 14px', color: '#1e1b4b', fontSize: '13px',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    color: '#6b7280', fontSize: '10px',
    letterSpacing: '1.5px', display: 'block', marginBottom: '6px', fontWeight: 600,
  }

  return (
    <main style={{ minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Title */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#1e1b4b', fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>Shop Stitching</h2>
          <p style={{ color: '#a5b4fc', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }}>
            DAILY STITCHING WORK LOG — MD NUMBER AUTO-FILLS TAILOR AND RATE
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'TOTAL RECORDS', value: summary.total_records, color: '#1e1b4b' },
            { label: 'TOTAL PIECES',  value: summary.total_pieces,  color: '#4f46e5' },
            { label: 'TOTAL AMOUNT',  value: `AED ${summary.total_amount}`, color: '#4f46e5' },
          ].map(c => (
            <div key={c.label} style={{ background: '#ffffff', border: '1.5px solid rgba(79,70,229,0.1)', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
              <p style={{ color: '#a5b4fc', fontSize: '10px', letterSpacing: '2px', marginBottom: '10px', fontWeight: 700 }}>{c.label}</p>
              <p style={{ color: c.color, fontSize: '26px', fontWeight: 700 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Add Form */}
        <div style={{ background: '#ffffff', border: '1.5px solid rgba(79,70,229,0.12)', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
          <div style={{ background: 'rgba(79,70,229,0.04)', borderBottom: '1.5px solid rgba(79,70,229,0.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '50%' }} />
            <span style={{ color: '#4f46e5', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>ADD STITCHING RECORD</span>
          </div>

          <div style={{ padding: '24px' }}>
            {error && <div style={{ background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#16a34a', fontSize: '13px' }}>{success}</div>}

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { name: 'md_no',  label: 'MD NO *',   placeholder: '787',    type: 'text',   onChange: handleMdNoChange },
                { name: 'date',   label: 'DATE *',    placeholder: '',       type: 'date',   onChange: handleChange },
                { name: 'inv_no', label: 'INV NO',    placeholder: '1165',   type: 'text',   onChange: handleChange },
              ].map(f => (
                <div key={f.name}>
                  <label style={labelStyle}>{f.label}</label>
                  <input name={f.name} value={form[f.name as keyof typeof form]} onChange={f.onChange}
                    placeholder={f.placeholder} type={f.type}
                    style={f.type === 'date' ? { ...inputStyle, colorScheme: 'light' } : inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 4px rgba(79,70,229,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>TAILOR *</label>
                <select name="tailor" value={form.tailor} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 4px rgba(79,70,229,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}>
                  <option value="">Select</option>
                  {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { name: 'pc_count', label: 'PIECES *',      placeholder: '12',    type: 'number' },
                { name: 'rate',     label: 'RATE (AED) *',  placeholder: '30',    type: 'number' },
                { name: 'cloth',    label: 'CLOTH',          placeholder: 'Cotton…', type: 'text' },
                { name: 'mtr',      label: 'MTR (CLOTH)',    placeholder: '1.5',   type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label style={labelStyle}>{f.label}</label>
                  <input name={f.name} value={form[f.name as keyof typeof form]} onChange={handleChange}
                    placeholder={f.placeholder} type={f.type} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 4px rgba(79,70,229,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }} />
                </div>
              ))}
            </div>

            {/* Auto Total */}
            {autoTotal && (
              <div style={{ background: 'rgba(79,70,229,0.05)', border: '1.5px solid rgba(79,70,229,0.15)', borderRadius: '14px', padding: '14px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#a5b4fc', fontSize: '10px', letterSpacing: '1.5px', marginBottom: '4px', fontWeight: 700 }}>CALCULATED TOTAL</p>
                  <p style={{ color: '#4f46e5', fontSize: '22px', fontWeight: 700 }}>AED {autoTotal}</p>
                </div>
                <span style={{ color: '#4f46e5', fontSize: '24px' }}>✓</span>
              </div>
            )}

            {/* Remarks */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>REMARKS</label>
              <input name="remarks" value={form.remarks} onChange={handleChange}
                placeholder="Optional notes..." style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 4px rgba(79,70,229,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }} />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? 'rgba(79,70,229,0.15)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: loading ? '#9ca3af' : '#ffffff', padding: '12px 32px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.3)' }}>
              {loading ? 'SAVING...' : '+ ADD RECORD'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}
            style={{ background: '#ffffff', border: '1.5px solid rgba(79,70,229,0.15)', borderRadius: '12px', padding: '10px 16px', color: '#4b5563', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterTailor} onChange={e => setFilterTailor(e.target.value)}
            style={{ background: '#ffffff', border: '1.5px solid rgba(79,70,229,0.15)', borderRadius: '12px', padding: '10px 16px', color: '#4b5563', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Tailors</option>
            {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
          </select>
        </div>

        {/* Records Table */}
        <div style={{ border: '1.5px solid rgba(79,70,229,0.12)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#ede9fe', borderBottom: '1px solid #ddd6fe' }}>
                {['DATE','MD NO','TAILOR','PC','RATE','TOTAL','CLOTH','MTR','INV NO','REMARKS',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 14px', color: '#4f46e5', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.id}
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#faf9ff', borderBottom: '1px solid rgba(79,70,229,0.05)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#ede9fe')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#faf9ff')}>
                  <td style={{ padding: '11px 14px', color: '#6b7280' }}>{r.date}</td>
                  <td style={{ padding: '11px 14px', color: '#4f46e5', fontWeight: 700, fontFamily: 'monospace' }}>{r.md_no}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', color: '#4f46e5', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                      {r.tailor_code}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#1e1b4b', fontWeight: 600 }}>{r.pc_count}</td>
                  <td style={{ padding: '11px 14px', color: '#4b5563' }}>{r.rate}</td>
                  <td style={{ padding: '11px 14px', color: '#16a34a', fontWeight: 700 }}>AED {r.total}</td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '12px' }}>{r.cloth || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '12px' }}>{r.mtr || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>{r.inv_no || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#9ca3af', fontSize: '12px' }}>{r.remarks || '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => handleDelete(r.id)}
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      Del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(79,70,229,0.05)', borderTop: '1.5px solid rgba(79,70,229,0.12)' }}>
                  <td colSpan={3} style={{ padding: '13px 14px', color: '#4f46e5', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}>TOTAL</td>
                  <td style={{ padding: '13px 14px', color: '#4f46e5', fontWeight: 700 }}>{summary.total_pieces}</td>
                  <td style={{ padding: '13px 14px' }} />
                  <td style={{ padding: '13px 14px', color: '#16a34a', fontWeight: 700 }}>AED {summary.total_amount}</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
          {records.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#d1d5db', fontSize: '13px', letterSpacing: '1px' }}>
              NO STITCHING RECORDS FOR THIS PERIOD
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
