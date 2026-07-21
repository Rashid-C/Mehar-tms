'use client'
import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getStitchingReferences, createStitchingReference, deleteStitchingReference,
  createStitchingMaterial, updateStitchingMaterial, deleteStitchingMaterial,
  createStitchingWorkLine, updateStitchingWorkLine, deleteStitchingWorkLine,
  getNextStitchingRefNo, getStitchingSummary, getTailors, getItems, finishStitchingReference,
  StitchingReference, AllocationMaterial, StitchingWorkLine, Tailor, Item,
} from '@/lib/api'

const today = () => new Date().toISOString().slice(0, 10)
const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }
const lastOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10) }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }
const DEFAULT_WORK_TYPES = ['Stitching', 'Cutting', 'Finishing', 'Packing', 'Ironing', 'Embroidery']

type MaterialRow = { name: string; qty: string; price: string; priceIsUnit: boolean; remarks: string }
type WorkRow = { tailor: string; rate: string; date: string; work_type: string; remarks: string }

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

export default function StitchingPage() {
  const router = useRouter()
  const [records, setRecords] = useState<StitchingReference[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [productionItems, setProductionItems] = useState<Item[]>([])
  const [summary, setSummary] = useState({ total_amount: 0, total_records: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState(firstOfMonth())
  const [filterDateTo, setFilterDateTo] = useState(lastOfMonth())
  const [filterTailor, setFilterTailor] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterInvNo, setFilterInvNo] = useState('')
  const [filterMdNo, setFilterMdNo] = useState('')
  const [filterRefNo, setFilterRefNo] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ── Entry form (left pane, always visible) ────────────────────────────
  const [refNo, setRefNo] = useState('')
  const [mdNo, setMdNo] = useState('')
  const [invNo, setInvNo] = useState('')
  const [allocationTailor, setAllocationTailor] = useState('')
  const [remarks, setRemarks] = useState('')
  const [materials, setMaterials] = useState<MaterialRow[]>([{ name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
  const [workLines, setWorkLines] = useState<WorkRow[]>([{ tailor: '', rate: '', date: today(), work_type: 'Stitching', remarks: '' }])
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  // ── Inline "add/edit material" and "add/edit work" per expanded row ────
  const [matName, setMatName] = useState('')
  const [matQty, setMatQty] = useState('')
  const [matPrice, setMatPrice] = useState('')
  const [matPriceIsUnit, setMatPriceIsUnit] = useState(false)
  const [matRemarks, setMatRemarks] = useState('')
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [workTailor, setWorkTailor] = useState('')
  const [workType, setWorkType] = useState('Stitching')
  const [workRate, setWorkRate] = useState('')
  const [workDate, setWorkDate] = useState(today())
  const [workRemarks, setWorkRemarks] = useState('')
  const [editWorkId, setEditWorkId] = useState<number | null>(null)
  const [savingMat, setSavingMat] = useState(false)
  const [savingWork, setSavingWork] = useState(false)

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
      if (filterInvNo) params.inv_no = filterInvNo
      if (filterMdNo) params.md_no = filterMdNo
      if (filterRefNo) params.ref_no = filterRefNo
      const [recRes, sumRes] = await Promise.all([getStitchingReferences(params), getStitchingSummary(params)])
      setRecords(recRes.data)
      setSummary(sumRes.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(t)
  }, [filterDateFrom, filterDateTo, filterTailor, filterMaterial, filterInvNo, filterMdNo, filterRefNo])
  useEffect(() => {
    getTailors({ page_size: 1000 }).then(r => setTailors(r.data.results))
    getItems({ item_type: 'production' }).then(r => setProductionItems(r.data))
  }, [])

  const clearFilters = () => {
    setFilterDateFrom(firstOfMonth()); setFilterDateTo(lastOfMonth()); setFilterTailor('')
    setFilterMaterial(''); setFilterInvNo(''); setFilterMdNo(''); setFilterRefNo('')
  }

  // ── Entry form helpers ──────────────────────────────────────────────────
  const resetForm = () => {
    setCreateError('')
    setMdNo(''); setInvNo(''); setAllocationTailor(''); setRemarks('')
    setMaterials([{ name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
    setWorkLines([{ tailor: '', rate: '', date: today(), work_type: 'Stitching', remarks: '' }])
    getNextStitchingRefNo().then(r => setRefNo(r.data.next_ref_no))
  }

  useEffect(() => { getNextStitchingRefNo().then(r => setRefNo(r.data.next_ref_no)) }, [])

  const materialsTotal = materials.reduce((s, m) => s + (parseFloat(m.qty) || 0) * (parseFloat(m.price) || 0), 0)
  const workTotal = workLines.reduce((s, w) => s + (parseFloat(w.rate) || 0), 0)

  const updateMaterial = (i: number, patch: Partial<MaterialRow>) => setMaterials(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  const addMaterial = () => setMaterials(prev => [...prev, { name: '', qty: '', price: '', priceIsUnit: false, remarks: '' }])
  const removeMaterial = (i: number) => setMaterials(prev => prev.filter((_, idx) => idx !== i))

  const updateWork = (i: number, patch: Partial<WorkRow>) => setWorkLines(prev => prev.map((w, idx) => idx === i ? { ...w, ...patch } : w))
  const addWork = () => setWorkLines(prev => [...prev, { tailor: '', rate: '', date: today(), work_type: 'Stitching', remarks: '' }])
  const removeWork = (i: number) => setWorkLines(prev => prev.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    setCreateError('')
    const validWork = workLines.filter(w => w.tailor && w.rate && w.date)
    if (!allocationTailor && validWork.length === 0) {
      setCreateError('Select an Allocation tailor or add at least one stitching work line (Tailor, Rate, Date)')
      return
    }
    const referenceTailor = allocationTailor || validWork[0].tailor
    setSaving(true)
    try {
      await createStitchingReference({
        ref_no: refNo, md_no: mdNo, inv_no: invNo, tailor: parseInt(referenceTailor), remarks,
        materials: materials.filter(m => m.name).map(m => ({ name: m.name, qty: parseFloat(m.qty) || 0, price: parseFloat(m.price) || 0, remarks: m.remarks })),
        work_lines: validWork.map(w => ({ tailor: parseInt(w.tailor), work_type: w.work_type || 'Stitching', rate: parseFloat(w.rate), date: w.date, remarks: w.remarks })),
      })
      notify(`Reference ${refNo} created`)
      resetForm()
      await fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } }
      setCreateError(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to save')
    } finally { setSaving(false) }
  }

  // ── Row expand / delete ─────────────────────────────────────────────────
  const toggleExpand = (r: StitchingReference) => {
    if (expandedId === r.id) { setExpandedId(null); return }
    setExpandedId(r.id)
    setMatName(''); setMatQty(''); setMatPrice(''); setMatPriceIsUnit(false); setMatRemarks(''); setEditMatId(null)
    setWorkTailor(''); setWorkType('Stitching'); setWorkRate(''); setWorkDate(today()); setWorkRemarks(''); setEditWorkId(null)
  }

  const handleDeleteRef = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this stitching reference and all its materials/work lines?')) return
    try { await deleteStitchingReference(id); notify('Reference deleted'); if (expandedId === id) setExpandedId(null); await fetchData() }
    catch { fail('Failed to delete') }
  }

  const handleFinish = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Mark this reference as finished? It will move to Finished Goods.')) return
    try {
      await finishStitchingReference(id)
      if (expandedId === id) setExpandedId(null)
      router.push('/finished-goods')
    } catch { fail('Failed to finish this reference') }
  }

  const handleSaveMaterial = async (referenceId: number, e: React.FormEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!matName) { fail('Material name is required'); return }
    setSavingMat(true)
    try {
      const payload = { reference: referenceId, name: matName, qty: parseFloat(matQty) || 0, price: parseFloat(matPrice) || 0, remarks: matRemarks }
      if (editMatId) { await updateStitchingMaterial(editMatId, payload); notify('Material updated') }
      else { await createStitchingMaterial(payload); notify('Material added') }
      setMatName(''); setMatQty(''); setMatPrice(''); setMatPriceIsUnit(false); setMatRemarks(''); setEditMatId(null); await fetchData()
    } catch { fail('Failed to save material') } finally { setSavingMat(false) }
  }

  const handleEditMaterial = (m: AllocationMaterial, e: React.MouseEvent) => {
    e.stopPropagation()
    setMatName(m.name); setMatQty(String(m.qty)); setMatPrice(String(m.price)); setMatPriceIsUnit(false); setMatRemarks(m.remarks || ''); setEditMatId(m.id)
  }

  const cancelEditMaterial = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMatName(''); setMatQty(''); setMatPrice(''); setMatPriceIsUnit(false); setMatRemarks(''); setEditMatId(null)
  }

  const handleDeleteMaterial = async (matId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Remove this material?')) return
    try {
      await deleteStitchingMaterial(matId)
      if (editMatId === matId) { setMatName(''); setMatQty(''); setMatPrice(''); setMatPriceIsUnit(false); setMatRemarks(''); setEditMatId(null) }
      await fetchData()
    } catch { fail('Failed to delete') }
  }

  const handleSaveWork = async (referenceId: number, e: React.FormEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!workTailor || !workRate || !workDate) { fail('Tailor, Rate and Date are required'); return }
    setSavingWork(true)
    try {
      const payload = { reference: referenceId, tailor: parseInt(workTailor), work_type: workType || 'Stitching', rate: parseFloat(workRate), date: workDate, remarks: workRemarks }
      if (editWorkId) { await updateStitchingWorkLine(editWorkId, payload); notify('Work line updated') }
      else { await createStitchingWorkLine(payload); notify('Work line added') }
      setWorkTailor(''); setWorkType('Stitching'); setWorkRate(''); setWorkDate(today()); setWorkRemarks(''); setEditWorkId(null); await fetchData()
    } catch { fail('Failed to save work line') } finally { setSavingWork(false) }
  }

  const handleEditWork = (w: StitchingWorkLine, e: React.MouseEvent) => {
    e.stopPropagation()
    setWorkTailor(String(w.tailor)); setWorkType(w.work_type || 'Stitching'); setWorkRate(String(w.rate)); setWorkDate(w.date); setWorkRemarks(w.remarks || ''); setEditWorkId(w.id)
  }

  const cancelEditWork = (e: React.MouseEvent) => {
    e.stopPropagation()
    setWorkTailor(''); setWorkType('Stitching'); setWorkRate(''); setWorkDate(today()); setWorkRemarks(''); setEditWorkId(null)
  }

  const handleDeleteWork = async (lineId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this work line?')) return
    try {
      await deleteStitchingWorkLine(lineId)
      if (editWorkId === lineId) { setWorkTailor(''); setWorkType('Stitching'); setWorkRate(''); setWorkDate(today()); setWorkRemarks(''); setEditWorkId(null) }
      await fetchData()
    } catch { fail('Failed to delete') }
  }

  // ── Register (right pane) search + totals ───────────────────────────────
  const itemNames = Array.from(new Set(productionItems.map(it => it.name))).sort()
  const totalAmt = records.reduce((s, r) => s + r.materials_total + r.work_total, 0)
  const handlePrint = () => window.print()
  const workTypeOptions = Array.from(new Set([
    ...DEFAULT_WORK_TYPES,
    ...records.flatMap(r => r.work_lines.map(w => w.work_type)),
  ].filter(Boolean))).sort()

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <datalist id="work-type-options">
        {workTypeOptions.map(t => <option key={t} value={t} />)}
      </datalist>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>

        {/* Header */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Stitching</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Shop Stitching</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Each reference groups a material allocation with one or more tailors&apos; stitching work</p>
        </div>

        {success && <div className="no-print" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{success}</div>}
        {error && <div className="no-print" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">

          {/* ── Left pane: Stitching Entry form (always visible) ──────────── */}
          <div className="no-print card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Production Entry</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: 4, padding: '3px 10px' }}>
                {refNo || '…'}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              {createError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{createError}</div>}

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Model Number</label>
                <input className="field" value={mdNo} onChange={e => setMdNo(e.target.value)} placeholder="Editable model no…" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Inv No</label>
                <input className="field" value={invNo} onChange={e => setInvNo(e.target.value)} placeholder="Optional" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...lbl, fontWeight: 700, color: '#1e293b' }}>ALLOCATION (Tailor / Party) — required if no stitching work is added</label>
                <select className="field" value={allocationTailor} onChange={e => setAllocationTailor(e.target.value)}>
                  <option value="">Select tailor</option>
                  {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Total (Materials + Work)</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>AED {(materialsTotal + workTotal).toFixed(2)}</span>
              </div>

              {/* Materials */}
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Materials</label>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Total: <strong style={{ color: '#7c3aed' }}>{materialsTotal.toFixed(2)}</strong></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {materials.map((m, i) => (
                  <div key={i} style={{ border: '1px solid #eef0f4', borderRadius: 6, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Material {i + 1}</span>
                      <button type="button" onClick={() => removeMaterial(i)} disabled={materials.length === 1}
                        className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12, opacity: materials.length === 1 ? 0.3 : 1 }}>×</button>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <MaterialNameInput value={m.name} items={productionItems} onChange={v => updateMaterial(i, { name: v, priceIsUnit: false })}
                        onPick={it => updateMaterial(i, { price: String(it.purchase_price ?? ''), priceIsUnit: true })}
                        excludeNames={materials.filter((_, idx) => idx !== i).map(mm => mm.name)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                      <input type="number" min="0" step="0.01" className="field" value={m.qty} onChange={e => updateMaterial(i, { qty: e.target.value })} placeholder="Qty" />
                      <input type="number" min="0" step="0.01" className="field"
                        value={m.priceIsUnit ? ((parseFloat(m.qty) || 0) * (parseFloat(m.price) || 0)).toFixed(2) : m.price}
                        onChange={e => updateMaterial(i, { price: e.target.value })} readOnly={m.priceIsUnit}
                        style={{ background: m.priceIsUnit ? '#f8fafc' : undefined }} placeholder="Price" />
                    </div>
                    <input className="field" value={m.remarks} onChange={e => updateMaterial(i, { remarks: e.target.value })} placeholder="Remarks…" />
                  </div>
                ))}
                <button type="button" onClick={addMaterial} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                  + Add Material {materials.length + 1}
                </button>
              </div>

              {/* Work Type */}
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Work Type</label>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Total: <strong style={{ color: '#16a34a' }}>AED {workTotal.toFixed(2)}</strong></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {workLines.map((w, i) => (
                  <div key={i} style={{ border: '1px solid #eef0f4', borderRadius: 6, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Work {i + 1}</span>
                      <button type="button" onClick={() => removeWork(i)} disabled={workLines.length === 1}
                        className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12, opacity: workLines.length === 1 ? 0.3 : 1 }}>×</button>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <select className="field" value={w.tailor} onChange={e => updateWork(i, { tailor: e.target.value })}>
                        <option value="">Select tailor</option>
                        {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <input className="field" list="work-type-options" value={w.work_type} onChange={e => updateWork(i, { work_type: e.target.value })}
                        placeholder="Work type — e.g. Stitching, Cutting…" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                      <input type="number" min="0" step="0.01" className="field" value={w.rate} onChange={e => updateWork(i, { rate: e.target.value })} placeholder="Rate" />
                      <input type="date" className="field" value={w.date} onChange={e => updateWork(i, { date: e.target.value })} />
                    </div>
                    <input className="field" value={w.remarks} onChange={e => updateWork(i, { remarks: e.target.value })} placeholder="Remarks…" />
                  </div>
                ))}
                <button type="button" onClick={addWork} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                  + Add Work {workLines.length + 1}
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Remarks / Notes</label>
                <input className="field" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes…" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={resetForm} type="button" className="btn-ghost" style={{ fontWeight: 700 }}>Clear</button>
                <button onClick={handleCreate} disabled={saving} className="btn-gold" style={{ background: '#16a34a' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right pane: Stitching Register ─────────────────────────────── */}
          <div>
            {/* Summary Cards */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'Total References', value: summary.total_records, color: '#1e293b' },
                { label: 'Total Work Amount', value: `AED ${summary.total_amount}`, color: '#16a34a' },
              ].map(c => (
                <div key={c.label} style={{ background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Filters + Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="no-print" style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginRight: 'auto' }}>Production Register</span>
                  <button onClick={clearFilters} type="button" className="btn-ghost" style={{ fontSize: 12 }}>Clear Filters</button>
                  <button onClick={handlePrint} type="button" className="btn-ghost" style={{ fontWeight: 700 }}>🖶 Print</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <input type="date" className="field" style={{ width: 'auto' }} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} title="Date From" />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>to</span>
                  <input type="date" className="field" style={{ width: 'auto' }} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} title="Date To" />
                  <select className="field" style={{ width: 'auto' }} value={filterTailor} onChange={e => setFilterTailor(e.target.value)} title="Search By Tailor">
                    <option value="">All Tailors</option>
                    {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
                  </select>
                  <input className="field" style={{ width: 140 }} list="stitching-item-names" value={filterMaterial}
                    onChange={e => setFilterMaterial(e.target.value)} placeholder="Material…" />
                  <datalist id="stitching-item-names">
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
                  <table className="z-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Ref No</th>
                        <th>MD No</th>
                        <th style={{ fontWeight: 800 }}>ALLOCATION</th>
                        <th>Materials</th>
                        <th>Materials Total</th>
                        <th>Tailors (Work)</th>
                        <th>Work Total</th>
                        <th>Inv No</th>
                        <th>Remarks</th>
                        <th className="no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <Fragment key={r.id}>
                          <tr onClick={() => toggleExpand(r)} style={{ cursor: 'pointer', background: expandedId === r.id ? '#f8fafc' : undefined }}>
                            <td style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>
                              <span style={{ display: 'inline-block', marginRight: 6, transition: 'transform 0.15s', transform: expandedId === r.id ? 'rotate(90deg)' : 'none' }}>›</span>
                              {r.ref_no}
                            </td>
                            <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{r.md_no || '—'}</td>
                            <td><span className="badge badge-blue">{r.tailor_code}</span> <span style={{ color: '#64748b', fontSize: 12 }}>{r.tailor_name}</span></td>
                            <td style={{ color: '#374151' }}>
                              {r.materials.length === 0 ? <span style={{ color: '#9ca3af' }}>—</span> : r.materials.length}
                            </td>
                            <td style={{ color: '#7c3aed', fontWeight: 600 }}>
                              {r.materials.length === 0 ? <span style={{ color: '#9ca3af' }}>—</span> : r.materials_total.toFixed(2)}
                            </td>
                            <td>
                              {r.work_lines.length === 0 ? <span style={{ color: '#9ca3af' }}>—</span> :
                                Array.from(new Set(r.work_lines.map(w => w.tailor_code))).map(code => (
                                  <span key={code} className="badge badge-cyan" style={{ marginRight: 4 }}>{code}</span>
                                ))}
                            </td>
                            <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {r.work_total.toFixed(2)}</td>
                            <td style={{ color: '#6b7280', fontFamily: 'monospace' }}>{r.inv_no || '—'}</td>
                            <td style={{ color: '#9ca3af' }}>{r.remarks || '—'}</td>
                            <td className="no-print">
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={e => handleFinish(r.id, e)} className="btn-gold" style={{ background: '#0ea5e9', padding: '4px 10px', fontSize: 12 }}>Finish</button>
                                <button onClick={e => handleDeleteRef(r.id, e)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Del</button>
                              </div>
                            </td>
                          </tr>
                          {expandedId === r.id && (
                            <tr className="no-print">
                              <td colSpan={10} style={{ padding: 0, background: '#f8fafc' }}>
                                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} onClick={e => e.stopPropagation()}>

                                  {/* Materials management */}
                                  <div className="card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e8ecf0', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>Materials</span>
                                      {editMatId && expandedId === r.id && (
                                        <button onClick={cancelEditMaterial} className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }}>Cancel edit</button>
                                      )}
                                    </div>
                                    <form onSubmit={e => handleSaveMaterial(r.id, e)} style={{ padding: 12, borderBottom: '1px solid #e8ecf0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'end' }}>
                                        <MaterialNameInput value={matName} items={productionItems} onChange={v => { setMatName(v); setMatPriceIsUnit(false) }}
                                          onPick={it => { setMatPrice(String(it.purchase_price ?? '')); setMatPriceIsUnit(true) }}
                                          excludeNames={r.materials.filter(mm => mm.id !== editMatId).map(mm => mm.name)} />
                                        <input type="number" min="0" step="0.01" className="field" value={matQty} onChange={e => setMatQty(e.target.value)} placeholder="Qty" />
                                        <input type="number" min="0" step="0.01" className="field"
                                          value={matPriceIsUnit ? ((parseFloat(matQty) || 0) * (parseFloat(matPrice) || 0)).toFixed(2) : matPrice}
                                          onChange={e => setMatPrice(e.target.value)} readOnly={matPriceIsUnit}
                                          style={{ background: matPriceIsUnit ? '#f8fafc' : undefined }} placeholder="Price" />
                                        <button type="submit" disabled={savingMat} className="btn-gold" style={{ background: '#7c3aed', padding: '8px 12px', fontSize: 12 }}>
                                          {editMatId ? '✓' : '+'}
                                        </button>
                                      </div>
                                      <input className="field" value={matRemarks} onChange={e => setMatRemarks(e.target.value)} placeholder="Remarks…" />
                                    </form>
                                    {r.materials.length === 0 ? (
                                      <p style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12 }}>No materials yet.</p>
                                    ) : (
                                      <table className="z-table">
                                        <tbody>
                                          {r.materials.map(m => (
                                            <tr key={m.id} style={{ background: editMatId === m.id ? '#f5f3ff' : undefined }}>
                                              <td style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</td>
                                              <td style={{ fontSize: 12 }}>{m.qty}</td>
                                              <td style={{ fontSize: 12 }}>{m.price}</td>
                                              <td style={{ fontSize: 12, color: '#9ca3af' }}>{m.remarks || '—'}</td>
                                              <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                  <button onClick={e => handleEditMaterial(m, e)} className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }}>Edit</button>
                                                  <button onClick={e => handleDeleteMaterial(m.id, e)} className="btn-danger" style={{ padding: '2px 8px', fontSize: 11 }}>Del</button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr>
                                            <td colSpan={2} style={{ fontWeight: 700, fontSize: 12 }}>Total</td>
                                            <td style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed' }}>{r.materials_total}</td>
                                            <td />
                                            <td />
                                          </tr>
                                        </tfoot>
                                      </table>
                                    )}
                                  </div>

                                  {/* Work lines management */}
                                  <div className="card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e8ecf0', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Work Type — add more tailors</span>
                                      {editWorkId && expandedId === r.id && (
                                        <button onClick={cancelEditWork} className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }}>Cancel edit</button>
                                      )}
                                    </div>
                                    <form onSubmit={e => handleSaveWork(r.id, e)} style={{ padding: 12, borderBottom: '1px solid #e8ecf0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr 1fr 1fr auto', gap: 6, alignItems: 'end' }}>
                                        <select className="field" value={workTailor} onChange={e => setWorkTailor(e.target.value)}>
                                          <option value="">Tailor</option>
                                          {tailors.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                                        </select>
                                        <input className="field" list="work-type-options" value={workType} onChange={e => setWorkType(e.target.value)} placeholder="Work type" />
                                        <input type="number" min="0" step="0.01" className="field" value={workRate} onChange={e => setWorkRate(e.target.value)} placeholder="Rate" />
                                        <input type="date" className="field" value={workDate} onChange={e => setWorkDate(e.target.value)} />
                                        <button type="submit" disabled={savingWork} className="btn-gold" style={{ background: '#16a34a', padding: '8px 12px', fontSize: 12 }}>
                                          {editWorkId ? '✓' : '+'}
                                        </button>
                                      </div>
                                      <input className="field" value={workRemarks} onChange={e => setWorkRemarks(e.target.value)} placeholder="Remarks…" />
                                    </form>
                                    {r.work_lines.length === 0 ? (
                                      <p style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12 }}>No work lines yet.</p>
                                    ) : (
                                      <table className="z-table">
                                        <tbody>
                                          {r.work_lines.map(w => (
                                            <tr key={w.id} style={{ background: editWorkId === w.id ? '#f0fdf4' : undefined }}>
                                              <td style={{ fontSize: 12, color: '#6b7280' }}>{w.date}</td>
                                              <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{w.tailor_code}</span></td>
                                              <td style={{ fontSize: 12, color: '#374151' }}>{w.work_type || '—'}</td>
                                              <td style={{ fontSize: 12, color: '#9ca3af' }}>{w.remarks || '—'}</td>
                                              <td style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>AED {w.rate}</td>
                                              <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                  <button onClick={e => handleEditWork(w, e)} className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }}>Edit</button>
                                                  <button onClick={e => handleDeleteWork(w.id, e)} className="btn-danger" style={{ padding: '2px 8px', fontSize: 11 }}>Del</button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr>
                                            <td colSpan={4} style={{ fontWeight: 700, fontSize: 12 }}>Total</td>
                                            <td style={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>AED {r.work_total.toFixed(2)}</td>
                                            <td />
                                          </tr>
                                        </tfoot>
                                      </table>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && records.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>
                  No references match the current search.
                </p>
              )}
              {!loading && records.length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Total Amt: <strong>AED {totalAmt.toFixed(2)}</strong></span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  )
}
