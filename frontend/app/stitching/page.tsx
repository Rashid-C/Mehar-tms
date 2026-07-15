'use client'
import { useEffect, useState } from 'react'
import { getStitchings, createStitching, deleteStitching, getTailors, getStitchingSummary, lookupRateSheet, getNextStitchingRefNo, getItems, ShopStitching, Tailor, Item } from '@/lib/api'

const EMPTY = { md_no: '', tailor: '', date: '', pc_count: '', rate: '', cloth: '', mtr: '', inv_no: '', remarks: '' }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function StitchingPage() {
  const [records, setRecords]     = useState<ShopStitching[]>([])
  const [tailors, setTailors]     = useState<Tailor[]>([])
  const [summary, setSummary]     = useState({ total_pieces: 0, total_amount: 0, total_records: 0 })
  const [form, setForm]           = useState(EMPTY)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [filterMonth, setFilterMonth]   = useState(new Date().getMonth() + 1)
  const [filterTailor, setFilterTailor] = useState('')
  const [refNo, setRefNo]               = useState('')
  const [productionItems, setProductionItems] = useState<Item[]>([])
  const [showClothList, setShowClothList] = useState(false)

  const fetchData = async () => {
    const params: Record<string, string | number> = { month: filterMonth }
    if (filterTailor) params.tailor = filterTailor
    const [recRes, sumRes, tailorRes] = await Promise.all([
      getStitchings(params), getStitchingSummary(params), getTailors({ page_size: 1000 }),
    ])
    setRecords(recRes.data)
    setSummary(sumRes.data)
    setTailors(tailorRes.data.results)
  }

  const fetchNextRefNo = async () => {
    const res = await getNextStitchingRefNo()
    setRefNo(res.data.next_ref_no)
  }

  useEffect(() => { fetchData() }, [filterMonth, filterTailor])
  useEffect(() => {
    fetchNextRefNo()
    getItems({ item_type: 'production' }).then(r => setProductionItems(r.data))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleMdNoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, md_no: value, tailor: '', rate: '', inv_no: '' }))
    if (value.length >= 2) {
      try {
        const res = await lookupRateSheet(value)
        if (res.data) setForm(prev => ({ ...prev, md_no: value, tailor: String(res.data.tailor_id), rate: String(res.data.rate), inv_no: res.data.inv_no || '' }))
      } catch { }
    }
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.md_no || !form.tailor || !form.date || !form.pc_count || !form.rate) {
      setError('MD No, Tailor, Date, Pieces and Rate are required'); return
    }
    setLoading(true)
    try {
      await createStitching({
        ref_no: refNo, md_no: form.md_no, tailor: parseInt(form.tailor), date: form.date,
        pc_count: parseInt(form.pc_count), rate: parseFloat(form.rate),
        cloth: form.cloth, mtr: form.mtr ? parseFloat(form.mtr) : null,
        inv_no: form.inv_no, remarks: form.remarks,
      })
      setSuccess(`Stitching record ${refNo} added for MD ${form.md_no}`)
      setForm(EMPTY); fetchData(); fetchNextRefNo()
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } }
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stitching record?')) return
    await deleteStitching(id); fetchData()
  }

  const autoTotal = form.pc_count && form.rate
    ? (parseFloat(form.pc_count) * parseFloat(form.rate)).toFixed(2) : null

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1150, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Stitching</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Shop Stitching</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Daily stitching work log — MD number auto-fills tailor and rate</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Total Records', value: summary.total_records, color: '#1e293b' },
            { label: 'Total Pieces',  value: summary.total_pieces,  color: '#2563eb' },
            { label: 'Total Amount',  value: `AED ${summary.total_amount}`, color: '#16a34a' },
          ].map(c => (
            <div key={c.label} style={{ background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Add Form */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Add Stitching Record</span>
          </div>
          <div style={{ padding: '16px' }}>
            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Ref No</label>
                <input className="field font-mono" value={refNo} readOnly
                  style={{ color: '#0d9488', cursor: 'default', background: 'rgba(13,148,136,0.06)' }} />
              </div>
              {[
                { name: 'md_no',  label: 'MD No *', placeholder: '787',  type: 'text', onChange: handleMdNoChange },
                { name: 'date',   label: 'Date *',  placeholder: '',     type: 'date', onChange: handleChange },
                { name: 'inv_no', label: 'Inv No',  placeholder: '1165', type: 'text', onChange: handleChange },
              ].map(f => (
                <div key={f.name}>
                  <label style={lbl}>{f.label}</label>
                  <input name={f.name} className="field" value={form[f.name as keyof typeof form]} onChange={f.onChange} placeholder={f.placeholder} type={f.type} />
                </div>
              ))}
              <div>
                <label style={lbl}>Tailor *</label>
                <select name="tailor" className="field" value={form.tailor} onChange={handleChange}>
                  <option value="">Select</option>
                  {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { name: 'pc_count', label: 'Pieces *',    placeholder: '12',      type: 'number' },
                { name: 'rate',     label: 'Rate (AED) *', placeholder: '30',     type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label style={lbl}>{f.label}</label>
                  <input name={f.name} className="field" value={form[f.name as keyof typeof form]} onChange={handleChange} placeholder={f.placeholder} type={f.type} />
                </div>
              ))}
              <div style={{ position: 'relative' }}>
                <label style={lbl}>Cloth</label>
                <input name="cloth" className="field" value={form.cloth} onChange={handleChange}
                  onFocus={() => setShowClothList(true)}
                  onBlur={() => setTimeout(() => setShowClothList(false), 150)}
                  placeholder="Cotton… or click for production items" type="text" autoComplete="off" />
                {showClothList && productionItems.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 200, overflowY: 'auto', zIndex: 20 }}>
                    {productionItems
                      .filter(it => !form.cloth || it.name.toLowerCase().includes(form.cloth.toLowerCase()))
                      .map(it => (
                        <button key={it.id} type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setForm(prev => ({ ...prev, cloth: it.name })); setShowClothList(false) }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#374151', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          {it.name} {it.code && <span style={{ color: '#94a3b8', fontSize: 11 }}>({it.code})</span>}
                        </button>
                      ))}
                    {productionItems.filter(it => !form.cloth || it.name.toLowerCase().includes(form.cloth.toLowerCase())).length === 0 && (
                      <div style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af' }}>No matching production items</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Mtr (Cloth)</label>
                <input name="mtr" className="field" value={form.mtr} onChange={handleChange} placeholder="1.5" type="number" />
              </div>
            </div>

            {autoTotal && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Calculated Total:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>AED {autoTotal}</span>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Remarks</label>
              <input name="remarks" className="field" value={form.remarks} onChange={handleChange} placeholder="Optional notes…" />
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn-gold">
              {loading ? 'Saving…' : '+ Add Record'}
            </button>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginRight: 'auto' }}>Records</span>
            <select className="field" style={{ width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="field" style={{ width: 'auto' }} value={filterTailor} onChange={e => setFilterTailor(e.target.value)}>
              <option value="">All Tailors</option>
              {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
            </select>
          </div>

          <table className="z-table">
            <thead>
              <tr>
                <th>Ref No</th>
                <th>Date</th>
                <th>MD No</th>
                <th>Tailor</th>
                <th>Pieces</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Cloth</th>
                <th>Mtr</th>
                <th>Inv No</th>
                <th>Remarks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>{r.ref_no || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{r.date}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{r.md_no}</td>
                  <td><span className="badge badge-blue">{r.tailor_code}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.pc_count}</td>
                  <td style={{ color: '#6b7280' }}>{r.rate}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {r.total}</td>
                  <td style={{ color: '#6b7280' }}>{r.cloth || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{r.mtr || '—'}</td>
                  <td style={{ color: '#6b7280', fontFamily: 'monospace' }}>{r.inv_no || '—'}</td>
                  <td style={{ color: '#9ca3af' }}>{r.remarks || '—'}</td>
                  <td>
                    <button onClick={() => handleDelete(r.id)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>Total</td>
                  <td>{summary.total_pieces}</td>
                  <td />
                  <td>AED {summary.total_amount}</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
          {records.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>No stitching records for this period.</p>
          )}
        </div>

      </div>
    </main>
  )
}
