'use client'
import { useEffect, useState } from 'react'
import { getFinishedGoods, updateFinishedGood, deleteFinishedGood, getTailors, getItems, FinishedGood, Tailor, Item } from '@/lib/api'

const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }
const lastOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10) }

type EditForm = { item_name: string; qty: string; cost_price: string; selling_price: string; date: string; remarks: string }

export default function FinishedGoodsPage() {
  const [records, setRecords] = useState<FinishedGood[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [productionItems, setProductionItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState(firstOfMonth())
  const [filterDateTo, setFilterDateTo] = useState(lastOfMonth())
  const [filterTailor, setFilterTailor] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterRefNo, setFilterRefNo] = useState('')
  const [filterMdNo, setFilterMdNo] = useState('')
  const [filterInvNo, setFilterInvNo] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ item_name: '', qty: '', cost_price: '', selling_price: '', date: '', remarks: '' })
  const [saving, setSaving] = useState(false)

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }
  const fail = (msg: string) => { setError(msg); setSuccess('') }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterDateFrom) params.date_from = filterDateFrom
      if (filterDateTo) params.date_to = filterDateTo
      if (filterTailor) params.tailor = filterTailor
      if (filterMaterial) params.material = filterMaterial
      if (filterRefNo) params.ref_no = filterRefNo
      if (filterMdNo) params.md_no = filterMdNo
      if (filterInvNo) params.inv_no = filterInvNo
      const res = await getFinishedGoods(params)
      setRecords(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(t)
  }, [filterDateFrom, filterDateTo, filterTailor, filterMaterial, filterRefNo, filterMdNo, filterInvNo])
  useEffect(() => {
    getTailors({ page_size: 1000 }).then(r => setTailors(r.data.results))
    getItems({ item_type: 'production' }).then(r => setProductionItems(r.data))
  }, [])

  const clearFilters = () => {
    setFilterDateFrom(firstOfMonth()); setFilterDateTo(lastOfMonth()); setFilterTailor('')
    setFilterMaterial(''); setFilterRefNo(''); setFilterMdNo(''); setFilterInvNo('')
  }
  const itemNames = Array.from(new Set(productionItems.map(it => it.name))).sort()

  const startEdit = (g: FinishedGood) => {
    setEditingId(g.id)
    setEditForm({
      item_name: g.item_name, qty: String(g.qty), cost_price: String(g.cost_price),
      selling_price: String(g.selling_price), date: g.date, remarks: g.remarks,
    })
  }
  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: number) => {
    setSaving(true)
    try {
      await updateFinishedGood(id, {
        item_name: editForm.item_name,
        qty: parseFloat(editForm.qty) || 0,
        cost_price: parseFloat(editForm.cost_price) || 0,
        selling_price: parseFloat(editForm.selling_price) || 0,
        date: editForm.date,
        remarks: editForm.remarks,
      })
      notify('Finished good updated')
      setEditingId(null)
      await fetchData()
    } catch { fail('Failed to save changes') } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this finished good record?')) return
    try { await deleteFinishedGood(id); notify('Record deleted'); await fetchData() }
    catch { fail('Failed to delete') }
  }

  const totalQty = records.reduce((s, g) => s + Number(g.qty), 0)
  const totalCost = records.reduce((s, g) => s + Number(g.cost_price) * Number(g.qty), 0)
  const totalSelling = records.reduce((s, g) => s + Number(g.selling_price) * Number(g.qty), 0)

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Finished Goods</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Finished Goods</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Stitching references that have been marked as finished and moved out of production</p>
        </div>

        {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{success}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Total Qty', value: totalQty.toFixed(2), color: '#1e293b' },
            { label: 'Total Cost Value', value: `AED ${totalCost.toFixed(2)}`, color: '#dc2626' },
            { label: 'Total Selling Value', value: `AED ${totalSelling.toFixed(2)}`, color: '#16a34a' },
          ].map(c => (
            <div key={c.label} style={{ background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginRight: 'auto' }}>Finished Goods</span>
              <button onClick={clearFilters} type="button" className="btn-ghost" style={{ fontSize: 12 }}>Clear Filters</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input type="date" className="field" style={{ width: 'auto' }} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} title="Date From" />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>to</span>
              <input type="date" className="field" style={{ width: 'auto' }} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} title="Date To" />
              <select className="field" style={{ width: 'auto' }} value={filterTailor} onChange={e => setFilterTailor(e.target.value)}>
                <option value="">All Tailors</option>
                {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
              </select>
              <input className="field" style={{ width: 140 }} list="fg-item-names" value={filterMaterial}
                onChange={e => setFilterMaterial(e.target.value)} placeholder="Item / Material…" />
              <datalist id="fg-item-names">
                {itemNames.map(n => <option key={n} value={n} />)}
              </datalist>
              <input className="field" style={{ width: 120 }} value={filterRefNo} onChange={e => setFilterRefNo(e.target.value)} placeholder="Ref No…" />
              <input className="field" style={{ width: 120 }} value={filterMdNo} onChange={e => setFilterMdNo(e.target.value)} placeholder="Model No…" />
              <input className="field" style={{ width: 120 }} value={filterInvNo} onChange={e => setFilterInvNo(e.target.value)} placeholder="Invoice No…" />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px', color: '#94a3b8' }}>
              <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="z-table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Ref No</th>
                    <th>MD No</th>
                    <th>Allocation Cut</th>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Cost Price</th>
                    <th>Selling Price</th>
                    <th>Date</th>
                    <th>Remarks</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(g => (
                    <tr key={g.id} style={{ background: editingId === g.id ? '#f0f9ff' : undefined }}>
                      <td style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{g.ref_no}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{g.md_no || '—'}</td>
                      <td><span className="badge badge-blue">{g.tailor_code}</span> <span style={{ color: '#64748b', fontSize: 12 }}>{g.tailor_name}</span></td>

                      {editingId === g.id ? (
                        <>
                          <td><input className="field" style={{ minWidth: 120 }} value={editForm.item_name} onChange={e => setEditForm(f => ({ ...f, item_name: e.target.value }))} /></td>
                          <td><input type="number" min="0" step="0.01" className="field" style={{ width: 80 }} value={editForm.qty} onChange={e => setEditForm(f => ({ ...f, qty: e.target.value }))} /></td>
                          <td><input type="number" min="0" step="0.01" className="field" style={{ width: 90 }} value={editForm.cost_price} onChange={e => setEditForm(f => ({ ...f, cost_price: e.target.value }))} /></td>
                          <td><input type="number" min="0" step="0.01" className="field" style={{ width: 90 }} value={editForm.selling_price} onChange={e => setEditForm(f => ({ ...f, selling_price: e.target.value }))} /></td>
                          <td><input type="date" className="field" style={{ width: 140 }} value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></td>
                          <td><input className="field" style={{ minWidth: 120 }} value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} /></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => saveEdit(g.id)} disabled={saving} className="btn-gold" style={{ background: '#16a34a', padding: '4px 10px', fontSize: 12 }}>✓</button>
                              <button onClick={cancelEdit} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>×</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 600 }}>{g.item_name || '—'}</td>
                          <td>{g.qty}</td>
                          <td style={{ color: '#dc2626' }}>AED {Number(g.cost_price).toFixed(2)}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {Number(g.selling_price).toFixed(2)}</td>
                          <td style={{ color: '#6b7280' }}>{g.date}</td>
                          <td style={{ color: '#9ca3af' }}>{g.remarks || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => startEdit(g)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                              <button onClick={() => handleDelete(g.id)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Del</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && records.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>
              No finished goods yet. Click Finish on a reference in the Stitching Register to move it here.
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
