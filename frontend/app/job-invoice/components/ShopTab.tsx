'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getJobInvoices, createJobInvoice, updateJobInvoice, deleteJobInvoice, JobInvoice, getNextInvNo,
  lookupRateSheet, Tailor,
} from '@/lib/api'
import { lbl, today, MODEL_NO_RE, PAGE_SIZE } from '../shared'
import TailorSelector from '@/components/TailorSelector'
import RowActions from '@/components/RowActions'

export default function ShopTab({ tailors, onTailorCreated, notify, fail }: {
  tailors: Tailor[]
  onTailorCreated: (t: Tailor) => void
  notify: (msg: string) => void
  fail: (msg: string) => void
}) {
  const [shopRecords, setShopRecords] = useState<JobInvoice[]>([])
  const [shopTotal, setShopTotal] = useState(0)
  const [shopPage, setShopPage] = useState(1)
  const [shopSearch, setShopSearch] = useState('')
  const [shopSearchInput, setShopSearchInput] = useState('')
  const [loadingShop, setLoadingShop] = useState(false)
  const shopSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isEditingShop, setIsEditingShop] = useState(false)
  const [editShopId, setEditShopId] = useState<number | null>(null)
  const [shopInvNo, setShopInvNo] = useState('')
  const [shopModelNo, setShopModelNo] = useState('')
  const [shopModelErr, setShopModelErr] = useState('')
  const [shopRateAutoFilled, setShopRateAutoFilled] = useState(false)
  const [shopLookupState, setShopLookupState] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle')
  const [shopDate, setShopDate] = useState(today())
  const [shopPiece, setShopPiece] = useState('')
  const [shopRate, setShopRate] = useState('')
  const [shopTailor, setShopTailor] = useState<number | ''>('')
  const [shopRemarks, setShopRemarks] = useState('')
  const [shopDayFilter, setShopDayFilter] = useState('')
  const [saving, setSaving] = useState(false)

  const loadShop = useCallback(async (p = shopPage, q = shopSearch) => {
    setLoadingShop(true)
    try {
      const res = await getJobInvoices({ page: p, page_size: PAGE_SIZE, search: q || undefined })
      setShopRecords(res.data.results)
      setShopTotal(res.data.count)
    } finally { setLoadingShop(false) }
  }, [shopPage, shopSearch])

  useEffect(() => {
    getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
  }, [])

  useEffect(() => { loadShop() }, [loadShop])

  const handleShopSearchChange = (val: string) => {
    setShopSearchInput(val)
    if (shopSearchTimer.current) clearTimeout(shopSearchTimer.current)
    shopSearchTimer.current = setTimeout(() => { setShopSearch(val); setShopPage(1) }, 400)
  }

  const handleShopDayFilter = (date: string) => {
    setShopDayFilter(date)
    setShopPage(1)
    if (date) {
      setShopSearchInput(''); setShopSearch('')
      loadShop(1, date)
    } else {
      loadShop(1, '')
    }
  }

  const resetShopForm = async () => {
    setShopModelNo(''); setShopPiece(''); setShopRate(''); setShopDate(today())
    setShopModelErr(''); setShopTailor(''); setShopRateAutoFilled(false); setShopLookupState('idle'); setShopRemarks('')
    setIsEditingShop(false); setEditShopId(null)
    const r = await getNextInvNo(); setShopInvNo(r.data.next_inv_no)
  }

  const openEditShop = (ji: JobInvoice) => {
    setShopInvNo(ji.inv_no); setShopModelNo(ji.model_no); setShopDate(ji.date)
    setShopPiece(String(ji.pc_count)); setShopRate(String(ji.rate)); setShopTailor(ji.tailor); setShopRemarks(ji.remarks || '')
    setShopModelErr(''); setShopLookupState('idle'); setIsEditingShop(true); setEditShopId(ji.id)
  }

  const validateModelNo = (val: string) => {
    if (!val) return 'Required'
    if (val.length > 7) return 'Max 7 characters'
    if (!MODEL_NO_RE.test(val)) return 'Letters and numbers only'
    return ''
  }

  const handleShopModelNo = async (raw: string) => {
    const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
    setShopModelNo(v)
    setShopModelErr(v ? validateModelNo(v) : '')
    setShopRateAutoFilled(false)
    setShopLookupState('idle')
    if (v.length >= 2) {
      setShopLookupState('loading')
      try {
        const res = await lookupRateSheet(v)
        if (res.data && res.data.rate) {
          setShopRate(String(res.data.rate))
          setShopTailor(res.data.tailor_id)
          setShopRateAutoFilled(true)
          setShopLookupState('found')
        } else {
          setShopLookupState('notfound')
        }
      } catch {
        setShopLookupState('notfound')
      }
    }
  }

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateModelNo(shopModelNo)
    if (err) { setShopModelErr(err); return }
    if (!shopTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { inv_no: shopInvNo, model_no: shopModelNo, date: shopDate, pc_count: parseInt(shopPiece), rate: parseFloat(shopRate), tailor: shopTailor, remarks: shopRemarks }
      if (isEditingShop && editShopId) {
        await updateJobInvoice(editShopId, payload); notify(`${shopInvNo} updated`)
      } else {
        const res = await createJobInvoice(payload); notify(`${res.data.inv_no} saved — AED ${res.data.amount}`)
      }
      await resetShopForm(); setShopPage(1); await loadShop(1, shopSearch)
    } catch (e: unknown) {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.model_no) { setShopModelErr('Model number already exists'); fail('Model number already exists') }
      else { fail(data ? Object.values(data).flat().join(' | ') : 'Failed to save') }
    } finally { setSaving(false) }
  }

  const handleDeleteShop = async (id: number) => {
    if (!confirm('Delete this shop entry?')) return
    try {
      await deleteJobInvoice(id)
      const newPage = shopRecords.length === 1 && shopPage > 1 ? shopPage - 1 : shopPage
      setShopPage(newPage); await loadShop(newPage, shopSearch)
      getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
    } catch { fail('Failed to delete') }
  }

  const shopTotalPages = Math.ceil(shopTotal / PAGE_SIZE) || 1

  return (
    <>
      {/* Search + daily summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
        <span className="badge badge-blue" style={{ flexShrink: 0 }}>{shopTotal}</span>
        <input className="field" style={{ padding: '7px 12px', flex: '1 1 160px', minWidth: 0, fontSize: 13 }}
          placeholder="Search Inv No, Model, Date, Tailor…"
          value={shopSearchInput} onChange={e => handleShopSearchChange(e.target.value)}
          disabled={!!shopDayFilter} />
        <input type="date" value={shopDayFilter} onChange={e => handleShopDayFilter(e.target.value)}
          className="field" style={{ width: 'auto', padding: '7px 12px', fontSize: 13, flex: '0 0 auto' }} />
        {shopDayFilter && shopRecords.length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: '#e8ecf0', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', flexShrink: 0 }}>
              {shopRecords.reduce((s, ji) => s + ji.pc_count, 0)} pc
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', flexShrink: 0 }}>
              AED {shopRecords.reduce((s, ji) => s + parseFloat(String(ji.amount)), 0).toFixed(2)}
            </span>
            <button onClick={() => handleShopDayFilter('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>✕</button>
          </>
        )}
        {shopDayFilter && shopRecords.length === 0 && (
          <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>No records</span>
        )}
      </div>

      {/* Side-by-side: form (30%) + table (70%) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Left: Form (30%) */}
        <div style={{ width: '30%', flexShrink: 0 }}>
          <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditingShop ? 'Edit Entry' : 'New Shop Entry'}</span>
              {isEditingShop && (
                <button type="button" onClick={resetShopForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
              )}
            </div>
            <form onSubmit={handleShopSubmit} className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Invoice No</label>
                  <input className="field font-mono" value={shopInvNo} readOnly
                    style={{ color: '#2563eb', cursor: 'default', background: 'rgba(37,99,235,0.04)' }} />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Date</label>
                  <input type="date" className="field" value={shopDate} onChange={e => setShopDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>
                  Model No <span style={{ color: '#9ca3af', fontWeight: 400 }}>(A–Z, 0–9 · max 7)</span>
                </label>
                <input className="field" value={shopModelNo}
                  onChange={e => handleShopModelNo(e.target.value)}
                  placeholder="e.g. MD101" maxLength={7} required
                  style={shopModelErr ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                {shopModelErr
                  ? <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{shopModelErr}</p>
                  : shopLookupState === 'loading'
                    ? <p className="text-xs mt-1 font-semibold" style={{ color: '#93c5fd' }}>⟳ Looking up...</p>
                    : shopLookupState === 'found'
                      ? <p className="text-xs mt-1 font-semibold" style={{ color: '#2563eb' }}>✓ Rate auto-filled</p>
                      : shopLookupState === 'notfound'
                        ? <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>⚠ Not in rate sheet — enter manually</p>
                        : shopModelNo ? <p className="text-xs mt-1" style={{ color: '#16a34a' }}>{shopModelNo.length}/7</p>
                        : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Pieces</label>
                  <input type="number" min="1" className="field" value={shopPiece}
                    onChange={e => setShopPiece(e.target.value)} placeholder="0" required />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>
                    Rate (AED){shopRateAutoFilled && (
                      <span style={{ color: '#2563eb', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>auto</span>
                    )}
                  </label>
                  <input type="number" min="0" step="0.01" className="field" value={shopRate}
                    onChange={e => { setShopRate(e.target.value); setShopRateAutoFilled(false); setShopLookupState('idle') }}
                    placeholder="0.00" required />
                </div>
              </div>
              {shopPiece && shopRate && !isNaN(+shopPiece) && !isNaN(+shopRate) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#2563eb' }}>AED {(+shopPiece * +shopRate).toFixed(2)}</span>
                </div>
              )}
              <TailorSelector tailors={tailors} value={shopTailor} onChange={setShopTailor}
                onTailorCreated={onTailorCreated} onError={fail} />
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>
                  Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                </label>
                <input className="field" value={shopRemarks} onChange={e => setShopRemarks(e.target.value)}
                  placeholder="e.g. urgent, special stitch…" />
              </div>
              <button type="submit" disabled={saving || !!shopModelErr} className="btn-gold" style={{ width: '100%' }}>
                {saving ? 'Saving…' : isEditingShop ? 'Update Entry' : 'Save Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Records (70%) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loadingShop ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px', color: '#94a3b8' }}>
              <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : shopRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              {shopSearch ? 'No records match your search.' : 'No records yet.'}
            </div>
          ) : (
            <>
              <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="z-table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      {['Inv No', 'Model', 'Date', 'Pc', 'Rate', 'Amount', 'Tailor', 'Remarks', ''].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shopRecords.map((ji) => (
                      <tr key={ji.id}>
                        <td><span className="font-mono" style={{ color: '#2563eb', fontWeight: 600 }}>{ji.inv_no}</span></td>
                        <td style={{ fontWeight: 600 }}>{ji.model_no}</td>
                        <td>{ji.date}</td>
                        <td>{ji.pc_count}</td>
                        <td>{ji.rate}</td>
                        <td><span style={{ color: '#16a34a', fontWeight: 600 }}>AED {ji.amount}</span></td>
                        <td>
                          <span className="badge badge-blue">{ji.tailor_code}</span>
                          <span style={{ marginLeft: 6, color: '#64748b', fontSize: 12 }}>{ji.tailor_name}</span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{ji.remarks || '—'}</td>
                        <td><RowActions onEdit={() => openEditShop(ji)} onDelete={() => handleDeleteShop(ji.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td>{shopRecords.reduce((s, ji) => s + ji.pc_count, 0)} pc</td>
                      <td />
                      <td>AED {shopRecords.reduce((s, ji) => s + parseFloat(String(ji.amount)), 0).toFixed(2)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Showing {(shopPage - 1) * PAGE_SIZE + 1}–{Math.min(shopPage * PAGE_SIZE, shopTotal)} of {shopTotal}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setShopPage(p => p - 1)} disabled={shopPage <= 1}
                    className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                    ← Prev
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: 6 }}>
                    {shopPage} / {shopTotalPages}
                  </span>
                  <button onClick={() => setShopPage(p => p + 1)} disabled={shopPage >= shopTotalPages}
                    className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
