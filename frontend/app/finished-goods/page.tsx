'use client'
import { useEffect, useState } from 'react'
import {
  getFinishedGoods, updateFinishedGood, deleteFinishedGood, getTailors, getItems,
  createStitchingReference, getNextStitchingRefNo, finishStitchingReference,
  FinishedGood, Tailor, Item,
} from '@/lib/api'

const today = () => new Date().toISOString().slice(0, 10)
const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }
const lastOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10) }
const DEFAULT_WORK_TYPES = ['Stitching', 'Cutting', 'Finishing', 'Packing', 'Ironing', 'Embroidery']
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }

type EditForm = { item_name: string; qty: string; cost_price: string; selling_price: string; date: string; remarks: string }
type MaterialRow = { name: string; qty: string; price: string; priceIsUnit: boolean; remarks: string }
type WorkRow = { tailor: string; work_type: string; rate: string; date: string; remarks: string }

function MaterialNameInput({ value, items, onChange, onPick, excludeNames = [] }: { value: string; items: Item[]; onChange: (v: string) => void; onPick?: (item: Item) => void; excludeNames?: string[] }) {
  const [showList, setShowList] = useState(false)
  const excluded = new Set(excludeNames.filter(Boolean).map(n => n.toLowerCase()))
  const matches = items.filter(it => (!value || it.name.toLowerCase().includes(value.toLowerCase())) && !excluded.has(it.name.toLowerCase()))
  return (
    <div style={{ position: 'relative' }}>
      <input className="field" value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        placeholder="e.g. Shawl, Nida…" autoComplete="off" />
      {showList && matches.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 180, overflowY: 'auto', zIndex: 20 }}>
          {matches.map(it => (
            <button key={it.id} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(it.name); onPick?.(it); setShowList(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 12, color: '#374151', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {it.name} {it.code && <span style={{ color: '#94a3b8', fontSize: 10 }}>({it.code})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

  // ── Manufacture modal (create + finish a new reference directly here) ──
  const [manufactureOpen, setManufactureOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [manuRefNo, setManuRefNo] = useState('')
  const [manuMdNo, setManuMdNo] = useState('')
  const [manuQty, setManuQty] = useState('1')
  const [manuTailor, setManuTailor] = useState('')
  const [manuRemarks, setManuRemarks] = useState('')
  const [manuMaterials, setManuMaterials] = useState<MaterialRow[]>([{ name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
  const [manuWorkLines, setManuWorkLines] = useState<WorkRow[]>([{ tailor: '', work_type: 'Stitching', rate: '', date: today(), remarks: '' }])
  const [manuSaving, setManuSaving] = useState(false)
  const [manuError, setManuError] = useState('')

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

  const openManufacture = (bulk: boolean = false) => {
    setManuError('')
    setManuMdNo(''); setManuQty('1'); setManuTailor(''); setManuRemarks('')
    setManuMaterials([{ name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
    setManuWorkLines([{ tailor: '', work_type: 'Stitching', rate: '', date: today(), remarks: '' }])
    getNextStitchingRefNo().then(r => setManuRefNo(r.data.next_ref_no))
    setBulkMode(bulk)
    setManufactureOpen(true)
  }
  const closeManufacture = () => setManufactureOpen(false)

  const manuMaterialsTotal = manuMaterials.reduce((s, m) => s + (parseFloat(m.qty) || 0) * (parseFloat(m.price) || 0), 0)
  const manuWorkTotal = manuWorkLines.reduce((s, w) => s + (parseFloat(w.rate) || 0), 0)

  const updateManuMaterial = (i: number, patch: Partial<MaterialRow>) => setManuMaterials(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  const addManuMaterial = () => setManuMaterials(prev => [...prev, { name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
  const removeManuMaterial = (i: number) => setManuMaterials(prev => prev.filter((_, idx) => idx !== i))

  const updateManuWork = (i: number, patch: Partial<WorkRow>) => setManuWorkLines(prev => prev.map((w, idx) => idx === i ? { ...w, ...patch } : w))
  const addManuWork = () => setManuWorkLines(prev => [...prev, { tailor: '', work_type: 'Stitching', rate: '', date: today(), remarks: '' }])
  const removeManuWork = (i: number) => setManuWorkLines(prev => prev.filter((_, idx) => idx !== i))

  const handleManufacture = async () => {
    setManuError('')
    const validWork = manuWorkLines.filter(w => w.tailor && w.rate && w.date)
    if (!manuTailor && validWork.length === 0) {
      setManuError('Select an Allocation tailor or add at least one stitching work line (Tailor, Rate, Date)')
      return
    }
    const referenceTailor = manuTailor || validWork[0].tailor
    const bulkQtyNum = parseInt(manuQty) || 1
    setManuSaving(true)
    try {
      const created = await createStitchingReference({
        ref_no: manuRefNo, md_no: manuMdNo, inv_no: '', qty: bulkQtyNum, tailor: parseInt(referenceTailor), remarks: manuRemarks,
        materials: manuMaterials.filter(m => m.name).map(m => ({
          name: m.name,
          qty: (parseFloat(m.qty) || 0) * (bulkMode ? bulkQtyNum : 1),
          price: parseFloat(m.price) || 0,
          remarks: m.remarks,
        })),
        work_lines: validWork.map(w => ({
          tailor: parseInt(w.tailor), work_type: w.work_type || 'Stitching',
          rate: (parseFloat(w.rate) || 0) * (bulkMode ? bulkQtyNum : 1),
          date: w.date, remarks: w.remarks,
        })),
      })
      await finishStitchingReference(created.data.id)
      notify(bulkMode ? `Reference ${manuRefNo} manufactured (×${bulkQtyNum})` : `Reference ${manuRefNo} manufactured`)
      setManufactureOpen(false)
      await fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } }
      setManuError(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to save')
    } finally { setManuSaving(false) }
  }

  const totalQty = records.reduce((s, g) => s + Number(g.qty), 0)
  const totalCost = records.reduce((s, g) => s + Number(g.cost_price) * Number(g.qty), 0)
  const totalSelling = records.reduce((s, g) => s + Number(g.selling_price) * Number(g.qty), 0)

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: 20, gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Finished Goods</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Finished Goods</h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Stitching references that have been marked as finished and moved out of production</p>
          </div>
          <div className="flex flex-col sm:flex-row" style={{ gap: 8 }}>
            <button onClick={() => openManufacture(true)} className="btn-gold w-full sm:w-auto" style={{ background: '#0ea5e9' }}>BULK MANUFACTURE</button>
            <button onClick={manufactureOpen ? closeManufacture : () => openManufacture(false)} className="btn-gold w-full sm:w-auto" style={{ background: '#7c3aed' }}>
              {manufactureOpen ? '× Cancel' : '+ Manufacture'}
            </button>
          </div>
        </div>

        {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{success}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* ── Production Entry — modal overlay, opens on demand ───────────── */}
        {manufactureOpen && (
          <div onClick={closeManufacture}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 960, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: bulkMode ? '#eff6ff' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: bulkMode ? '#0ea5e9' : '#7c3aed' }}>{bulkMode ? 'Bulk Manufacture' : 'Production Entry'}</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: bulkMode ? '#0ea5e9' : '#7c3aed', background: '#ffffff', border: `1px solid ${bulkMode ? '#bae6fd' : '#ddd6fe'}`, borderRadius: 4, padding: '3px 10px' }}>
                {manuRefNo || '…'}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              {manuError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{manuError}</div>}
              {bulkMode && (
                <div style={{ background: '#eff6ff', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: 6, padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
                  Enter Materials Qty and Work Rate <strong>per unit</strong> below — they&apos;ll be multiplied by Bulk Qty automatically when saved.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Model Number</label>
                  <input className="field" value={manuMdNo} onChange={e => setManuMdNo(e.target.value)} placeholder="Editable model no…" />
                </div>
                <div>
                  <label style={{ ...lbl, fontWeight: bulkMode ? 700 : 500, color: bulkMode ? '#0ea5e9' : '#374151' }}>{bulkMode ? 'Bulk Qty (units)' : 'Qty'}</label>
                  <input type="number" min="1" step="1" className="field" value={manuQty} onChange={e => setManuQty(e.target.value)} placeholder="1" />
                </div>
                <div>
                  <label style={{ ...lbl, fontWeight: 700, color: '#1e293b' }}>ALLOCATION — required if no work added</label>
                  <select className="field" value={manuTailor} onChange={e => setManuTailor(e.target.value)}>
                    <option value="">Select tailor</option>
                    {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  Total (Materials + Work){bulkMode && ` × ${parseInt(manuQty) || 1} units`}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
                  AED {((manuMaterialsTotal + manuWorkTotal) * (bulkMode ? (parseInt(manuQty) || 1) : 1)).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  {/* Materials */}
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Materials</label>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Total: <strong style={{ color: '#7c3aed' }}>{manuMaterialsTotal.toFixed(2)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {manuMaterials.map((m, i) => (
                      <div key={i} style={{ border: '1px solid #eef0f4', borderRadius: 6, padding: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Material {i + 1}</span>
                          <button type="button" onClick={() => removeManuMaterial(i)} disabled={manuMaterials.length === 1}
                            className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12, opacity: manuMaterials.length === 1 ? 0.3 : 1 }}>×</button>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <MaterialNameInput value={m.name} items={productionItems} onChange={v => updateManuMaterial(i, { name: v, priceIsUnit: false })}
                            onPick={it => updateManuMaterial(i, { price: String(it.purchase_price ?? ''), priceIsUnit: true })}
                            excludeNames={manuMaterials.filter((_, idx) => idx !== i).map(mm => mm.name)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                          <input type="number" min="0" step="0.01" className="field" value={m.qty} onChange={e => updateManuMaterial(i, { qty: e.target.value })} placeholder="Qty" />
                          <input type="number" min="0" step="0.01" className="field"
                            value={m.priceIsUnit ? ((parseFloat(m.qty) || 0) * (parseFloat(m.price) || 0)).toFixed(2) : m.price}
                            onChange={e => updateManuMaterial(i, { price: e.target.value })} readOnly={m.priceIsUnit}
                            style={{ background: m.priceIsUnit ? '#f8fafc' : undefined }} placeholder="Price" />
                        </div>
                        <input className="field" value={m.remarks} onChange={e => updateManuMaterial(i, { remarks: e.target.value })} placeholder="Remarks…" />
                      </div>
                    ))}
                    <button type="button" onClick={addManuMaterial} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                      + Add Material {manuMaterials.length + 1}
                    </button>
                  </div>
                </div>

                <div>
                  {/* Work Type */}
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Work Type</label>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Total: <strong style={{ color: '#16a34a' }}>AED {manuWorkTotal.toFixed(2)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {manuWorkLines.map((w, i) => (
                      <div key={i} style={{ border: '1px solid #eef0f4', borderRadius: 6, padding: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Work {i + 1}</span>
                          <button type="button" onClick={() => removeManuWork(i)} disabled={manuWorkLines.length === 1}
                            className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12, opacity: manuWorkLines.length === 1 ? 0.3 : 1 }}>×</button>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <select className="field" value={w.tailor} onChange={e => updateManuWork(i, { tailor: e.target.value })}>
                            <option value="">Select tailor</option>
                            {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <input className="field" list="fg-work-type-options" value={w.work_type} onChange={e => updateManuWork(i, { work_type: e.target.value })}
                            placeholder="Work type — e.g. Stitching, Cutting…" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                          <input type="number" min="0" step="0.01" className="field" value={w.rate} onChange={e => updateManuWork(i, { rate: e.target.value })} placeholder="Rate" />
                          <input type="date" className="field" value={w.date} onChange={e => updateManuWork(i, { date: e.target.value })} />
                        </div>
                        <input className="field" value={w.remarks} onChange={e => updateManuWork(i, { remarks: e.target.value })} placeholder="Remarks…" />
                      </div>
                    ))}
                    <datalist id="fg-work-type-options">
                      {DEFAULT_WORK_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                    <button type="button" onClick={addManuWork} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                      + Add Work {manuWorkLines.length + 1}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Remarks / Notes</label>
                <input className="field" value={manuRemarks} onChange={e => setManuRemarks(e.target.value)} placeholder="Optional notes…" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => openManufacture(bulkMode)} type="button" className="btn-ghost" style={{ fontWeight: 700 }}>Clear</button>
                <button onClick={handleManufacture} disabled={manuSaving} className="btn-gold" style={{ background: '#16a34a' }}>
                  {manuSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ── Finished Goods Register ──────────────────────────────────────── */}
        <div>

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
                    <th style={{ fontWeight: 800 }}>ALLOCATION</th>
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
              No finished goods yet. Click Finish on a reference in the Stitching Register, or + Manufacture to add one directly here.
            </p>
          )}
        </div>

        </div>

      </div>
    </main>
  )
}
