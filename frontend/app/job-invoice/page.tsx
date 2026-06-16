'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getTailors, createTailor, Tailor,
  getJobInvoices, createJobInvoice, updateJobInvoice, deleteJobInvoice, JobInvoice, getNextInvNo,
  createTailorOrder,
  createPayment,
} from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'

type JobType = 'shop' | 'order' | 'payment'
const today = () => new Date().toISOString().slice(0, 10)
const MODEL_NO_RE = /^[A-Z0-9]{1,7}$/
const PAGE_SIZE = 10

export default function JobInvoicePage() {
  const [activeJob, setActiveJob] = useState<JobType>('shop')
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // ── Records list state ──────────────────────────────────────────────
  const [records, setRecords] = useState<JobInvoice[]>([])
  const [allInvoices, setAllInvoices] = useState<JobInvoice[]>([])   // unpagin. for Order/Payment
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loadingRecords, setLoadingRecords] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Form visibility / edit mode ─────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // ── Shop form fields ────────────────────────────────────────────────
  const [shopInvNo, setShopInvNo] = useState('')
  const [shopModelNo, setShopModelNo] = useState('')
  const [shopModelErr, setShopModelErr] = useState('')
  const [shopDate, setShopDate] = useState(today())
  const [shopPiece, setShopPiece] = useState('')
  const [shopRate, setShopRate] = useState('')
  const [shopTailor, setShopTailor] = useState<number | ''>('')

  // ── Inline tailor creation ──────────────────────────────────────────
  const [showNewTailor, setShowNewTailor] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creatingTailor, setCreatingTailor] = useState(false)

  // ── Order / Payment form state ──────────────────────────────────────
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null)
  const [orderDate, setOrderDate] = useState(today())
  const [orderQty, setOrderQty] = useState('')
  const [orderAmount, setOrderAmount] = useState('')

  const [payInvId, setPayInvId] = useState<number | null>(null)
  const [payDate, setPayDate] = useState(today())
  const [payAmount, setPayAmount] = useState('')
  const [payRemarks, setPayRemarks] = useState('')

  // ── Loaders ──────────────────────────────────────────────────────────
  const loadRecords = useCallback(async (p = page, q = search) => {
    setLoadingRecords(true)
    try {
      const res = await getJobInvoices({ page: p, page_size: PAGE_SIZE, search: q || undefined })
      setRecords(res.data.results)
      setTotalCount(res.data.count)
    } finally {
      setLoadingRecords(false)
    }
  }, [page, search])

  const loadAllInvoices = useCallback(async () => {
    const res = await getJobInvoices({ page_size: 1000 })
    setAllInvoices(res.data.results)
  }, [])

  useEffect(() => {
    getTailors().then(r => setTailors(r.data))
    getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
    loadAllInvoices()
  }, [loadAllInvoices])

  useEffect(() => { loadRecords() }, [loadRecords])

  // ── Helpers ───────────────────────────────────────────────────────────
  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3500) }
  const fail   = (msg: string) => { setError(msg);   setSuccess('') }

  const validateModelNo = (val: string) => {
    if (!val) return 'Required'
    if (val.length > 7) return 'Max 7 characters'
    if (!MODEL_NO_RE.test(val)) return 'Letters and numbers only'
    return ''
  }

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const resetForm = async () => {
    setShopModelNo(''); setShopPiece(''); setShopRate('')
    setShopDate(today()); setShopModelErr('')
    setShopTailor(''); setShowNewTailor(false)
    setIsEditing(false); setEditId(null); setShowForm(false)
    const res = await getNextInvNo()
    setShopInvNo(res.data.next_inv_no)
  }

  const openEditForm = (ji: JobInvoice) => {
    setShopInvNo(ji.inv_no)
    setShopModelNo(ji.model_no)
    setShopDate(ji.date)
    setShopPiece(String(ji.pc_count))
    setShopRate(String(ji.rate))
    setShopTailor(ji.tailor)
    setShopModelErr('')
    setIsEditing(true)
    setEditId(ji.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Shop submit (create or update) ────────────────────────────────────
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateModelNo(shopModelNo)
    if (err) { setShopModelErr(err); return }
    if (!shopTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = {
        inv_no: shopInvNo,
        model_no: shopModelNo,
        date: shopDate,
        pc_count: parseInt(shopPiece),
        rate: parseFloat(shopRate),
        tailor: shopTailor,
      }
      if (isEditing && editId) {
        await updateJobInvoice(editId, payload)
        notify(`${shopInvNo} updated`)
      } else {
        const res = await createJobInvoice(payload)
        notify(`${res.data.inv_no} saved — AED ${res.data.amount}`)
        setSelectedInvId(res.data.id)
        setPayInvId(res.data.id)
      }
      await resetForm()
      setPage(1)
      await Promise.all([loadRecords(1, search), loadAllInvoices()])
    } catch (e: unknown) {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.model_no) {
        setShopModelErr('Model number already exists')
        fail('Model number already exists — use a different one')
      } else {
        fail(data ? Object.values(data).flat().join(' | ') : 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Inline tailor create ──────────────────────────────────────────────
  const handleCreateTailor = async () => {
    if (!newName || !newCode) { fail('Name and Code are required'); return }
    setCreatingTailor(true)
    try {
      const res = await createTailor({ name: newName, code: newCode.toUpperCase(), phone: newPhone })
      setTailors(prev => [...prev, res.data])
      setShopTailor(res.data.id)
      setShowNewTailor(false)
      setNewName(''); setNewCode(''); setNewPhone('')
      notify(`Tailor ${res.data.code} created and selected`)
    } catch { fail('Failed to create tailor') }
    finally { setCreatingTailor(false) }
  }

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this shop entry?')) return
    try {
      await deleteJobInvoice(id)
      if (selectedInvId === id) setSelectedInvId(null)
      if (payInvId === id) setPayInvId(null)
      const newPage = records.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage)
      await Promise.all([loadRecords(newPage, search), loadAllInvoices()])
      getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
    } catch { fail('Failed to delete') }
  }

  // ── Order submit ──────────────────────────────────────────────────────
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const inv = allInvoices.find(j => j.id === selectedInvId)
    if (!inv) { fail('Select a shop invoice to continue'); return }
    setSaving(true)
    try {
      await createTailorOrder({ tailor: inv.tailor, date: orderDate, quantity: parseInt(orderQty), amount: parseFloat(orderAmount), job_invoice: inv.id })
      notify(`Order linked to ${inv.inv_no} saved`)
      setOrderQty(''); setOrderAmount(''); setOrderDate(today())
    } catch { fail('Failed to save order') }
    finally { setSaving(false) }
  }

  // ── Payment submit ────────────────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const inv = allInvoices.find(j => j.id === payInvId)
    if (!inv) { fail('Select a shop invoice to continue'); return }
    setSaving(true)
    try {
      await createPayment({ tailor: inv.tailor, date: payDate, amount: parseFloat(payAmount), remarks: payRemarks, job_invoice: inv.id })
      notify(`Payment for ${inv.inv_no} saved`)
      setPayAmount(''); setPayRemarks(''); setPayDate(today())
    } catch { fail('Failed to save payment') }
    finally { setSaving(false) }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1
  const selectedForOrder = allInvoices.find(j => j.id === selectedInvId)
  const selectedForPay   = allInvoices.find(j => j.id === payInvId)

  const jobs = [
    { id: 'shop' as JobType, num: 1, label: 'Shop',    color: '#D4AF37', rgb: '212,175,55' },
    { id: 'order' as JobType, num: 2, label: 'Order',   color: '#60a5fa', rgb: '96,165,250' },
    { id: 'payment' as JobType, num: 3, label: 'Payment', color: '#4ade80', rgb: '74,222,128' },
  ]

  const labelStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px' }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Job Invoice" subtitle="SHOP → ORDER → PAYMENT FLOW" />

        {success && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {jobs.map(j => (
            <button key={j.id} onClick={() => { setActiveJob(j.id); setError('') }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold"
              style={activeJob === j.id
                ? { background: `rgba(${j.rgb},0.14)`, border: `1.5px solid rgba(${j.rgb},0.45)`, color: j.color }
                : { background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={activeJob === j.id ? { background: j.color, color: '#08080f' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                {j.num}
              </span>
              {j.label}
            </button>
          ))}
        </div>

        {/* ══════════ SHOP TAB ══════════ */}
        {activeJob === 'shop' && (
          <>
            {/* ── Add / Edit form (toggled) ── */}
            <div className="card mb-5" style={showForm ? {} : { borderColor: 'rgba(212,175,55,0.2)' }}>
              {/* Header bar — always visible */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                style={{ borderBottom: showForm ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                onClick={() => { if (!showForm) { setIsEditing(false); setEditId(null); setShowForm(true) } }}
              >
                <span className="text-xs font-bold tracking-widest" style={{ color: '#D4AF37', letterSpacing: '2px' }}>
                  {isEditing ? `EDIT — ${shopInvNo}` : 'SHOP ENTRY'}
                </span>
                {!showForm ? (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setIsEditing(false); setEditId(null); setShowForm(true) }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold transition-all"
                    title="Add new shop entry"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B8962E)', color: '#08080f' }}>
                    +
                  </button>
                ) : (
                  <button type="button" onClick={resetForm}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    ✕ Close
                  </button>
                )}
              </div>

              {/* Form body */}
              {showForm && (
                <form onSubmit={handleShopSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>INVOICE NO</label>
                      <input className="field font-mono" value={shopInvNo} readOnly
                        style={{ color: '#D4AF37', cursor: 'default', background: 'rgba(212,175,55,0.04)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>DATE</label>
                      <input type="date" className="field" value={shopDate} onChange={e => setShopDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>
                      MODEL NO <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>(A-Z, 0-9 · max 7)</span>
                    </label>
                    <input
                      className="field"
                      value={shopModelNo}
                      onChange={e => {
                        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
                        setShopModelNo(v)
                        setShopModelErr(v ? validateModelNo(v) : '')
                      }}
                      placeholder="e.g. MD101"
                      maxLength={7}
                      required
                      style={shopModelErr ? { borderColor: 'rgba(239,68,68,0.6)' } : {}}
                    />
                    {shopModelErr
                      ? <p className="text-xs mt-1" style={{ color: '#f87171' }}>{shopModelErr}</p>
                      : shopModelNo
                        ? <p className="text-xs mt-1" style={{ color: 'rgba(74,222,128,0.7)' }}>{shopModelNo.length}/7 — valid</p>
                        : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>PIECE</label>
                      <input type="number" min="1" className="field" value={shopPiece}
                        onChange={e => setShopPiece(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>RATE (AED)</label>
                      <input type="number" min="0" step="0.01" className="field" value={shopRate}
                        onChange={e => setShopRate(e.target.value)} placeholder="0.00" required />
                    </div>
                  </div>

                  {shopPiece && shopRate && !isNaN(+shopPiece) && !isNaN(+shopRate) && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                      <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>TOTAL AMOUNT</span>
                      <span className="font-bold text-xl" style={{ color: '#D4AF37' }}>
                        AED {(+shopPiece * +shopRate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Tailor select + inline create */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>TAILOR</label>
                    <div className="flex gap-2">
                      <select className="field flex-1" value={shopTailor}
                        onChange={e => setShopTailor(Number(e.target.value))} required>
                        <option value="">— Select tailor —</option>
                        {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowNewTailor(v => !v)}
                        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                        title="Create new tailor"
                        style={showNewTailor
                          ? { background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.5)', color: '#D4AF37' }
                          : { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                        {showNewTailor ? '×' : '+'}
                      </button>
                    </div>

                    {showNewTailor && (
                      <div className="mt-3 p-4 rounded-xl flex flex-col gap-3"
                        style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
                        <p className="text-[11px] font-bold tracking-widest" style={{ color: 'rgba(212,175,55,0.7)' }}>NEW TAILOR</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>CODE *</label>
                            <input className="field text-sm" value={newCode}
                              onChange={e => setNewCode(e.target.value.toUpperCase())}
                              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                              placeholder="e.g. MJ" maxLength={20} />
                          </div>
                          <div>
                            <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>NAME *</label>
                            <input className="field text-sm" value={newName}
                              onChange={e => setNewName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                              placeholder="Full name" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>PHONE (optional)</label>
                          <input className="field text-sm" value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                            placeholder="+971 …" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={creatingTailor} onClick={handleCreateTailor} className="btn-gold text-xs px-4 py-2">
                            {creatingTailor ? 'Saving…' : 'Create & Select'}
                          </button>
                          <button type="button" onClick={() => setShowNewTailor(false)} className="btn-ghost text-xs px-4 py-2">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={saving || !!shopModelErr} className="btn-gold flex-1">
                      {saving ? 'Saving…' : isEditing ? 'Update Entry' : 'Save Shop Entry'}
                    </button>
                    {isEditing && (
                      <button type="button" onClick={resetForm} className="btn-ghost px-5">Cancel</button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* ── Saved records ── */}
            <div>
              {/* Search + count bar */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
                  SAVED SHOP RECORDS
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                  {totalCount}
                </span>
                <input
                  className="field flex-1 text-xs"
                  style={{ padding: '8px 12px' }}
                  placeholder="Search by INV NO, MODEL, DATE (YYYY-MM-DD), TAILOR…"
                  value={searchInput}
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </div>

              {loadingRecords ? (
                <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                  style={{ color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {search ? 'NO RECORDS MATCH YOUR SEARCH' : 'NO RECORDS YET — CLICK + TO ADD FIRST ENTRY'}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
                    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                          {['INV NO', 'MODEL', 'DATE', 'PC', 'RATE', 'AMOUNT', 'TAILOR', ''].map(h => (
                            <th key={h} className="text-left px-3 py-3 font-semibold"
                              style={{ color: 'rgba(212,175,55,0.55)', letterSpacing: '1.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((ji, idx) => (
                          <tr key={ji.id}
                            style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#D4AF37' }}>{ji.inv_no}</td>
                            <td className="px-3 py-2.5 font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{ji.model_no}</td>
                            <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ji.date}</td>
                            <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{ji.pc_count}</td>
                            <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{ji.rate}</td>
                            <td className="px-3 py-2.5 font-bold" style={{ color: '#4ade80' }}>AED {ji.amount}</td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                                {ji.tailor_code}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex gap-1.5">
                                <button onClick={() => openEditForm(ji)}
                                  className="text-[11px] px-2 py-1 rounded transition-all"
                                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', cursor: 'pointer' }}>
                                  ✎
                                </button>
                                <button onClick={() => handleDelete(ji.id)}
                                  className="text-[11px] px-2 py-1 rounded transition-all"
                                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: page <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
                        ← Prev
                      </button>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: page >= totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ══════════ ORDER TAB ══════════ */}
        {activeJob === 'order' && (
          <div className="flex flex-col gap-5">
            <div className="card p-5">
              <p className="text-[11px] font-bold tracking-widest mb-3" style={{ color: 'rgba(96,165,250,0.7)', letterSpacing: '2px' }}>SELECT SHOP INVOICE TO CONTINUE</p>
              {allInvoices.length === 0
                ? <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No shop invoices yet — create one in the Shop tab first.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {allInvoices.map(ji => (
                      <button key={ji.id} type="button" onClick={() => setSelectedInvId(ji.id)}
                        className="flex flex-col items-start px-4 py-3 rounded-xl transition-all"
                        style={selectedInvId === ji.id
                          ? { background: 'rgba(96,165,250,0.12)', border: '1.5px solid rgba(96,165,250,0.45)' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="font-mono font-bold text-sm" style={{ color: selectedInvId === ji.id ? '#60a5fa' : '#D4AF37' }}>{ji.inv_no}</span>
                        <span className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ji.tailor_code} · {ji.model_no}</span>
                        <span className="text-[11px] mt-0.5" style={{ color: '#4ade80' }}>AED {ji.amount}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {selectedForOrder && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-mono font-bold" style={{ color: '#60a5fa' }}>{selectedForOrder.inv_no}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>{selectedForOrder.tailor_code}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedForOrder.tailor_name}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: '#4ade80' }}>AED {selectedForOrder.amount}</span>
                </div>
                <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>DATE</label>
                    <input type="date" className="field" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>NO OF QUANTITY</label>
                      <input type="number" min="0" className="field" value={orderQty} onChange={e => setOrderQty(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>AMOUNT (AED)</label>
                      <input type="number" min="0" step="0.01" className="field" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} placeholder="0.00" required />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-gold" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                    {saving ? 'Saving…' : `Save Order → ${selectedForOrder.inv_no}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ══════════ PAYMENT TAB ══════════ */}
        {activeJob === 'payment' && (
          <div className="flex flex-col gap-5">
            <div className="card p-5">
              <p className="text-[11px] font-bold tracking-widest mb-3" style={{ color: 'rgba(74,222,128,0.7)', letterSpacing: '2px' }}>SELECT SHOP INVOICE TO PAY AGAINST</p>
              {allInvoices.length === 0
                ? <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No shop invoices yet — create one in the Shop tab first.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {allInvoices.map(ji => (
                      <button key={ji.id} type="button" onClick={() => setPayInvId(ji.id)}
                        className="flex flex-col items-start px-4 py-3 rounded-xl transition-all"
                        style={payInvId === ji.id
                          ? { background: 'rgba(74,222,128,0.1)', border: '1.5px solid rgba(74,222,128,0.4)' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="font-mono font-bold text-sm" style={{ color: payInvId === ji.id ? '#4ade80' : '#D4AF37' }}>{ji.inv_no}</span>
                        <span className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ji.tailor_code} · {ji.model_no}</span>
                        <span className="text-[11px] mt-0.5" style={{ color: '#4ade80' }}>AED {ji.amount}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {selectedForPay && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-mono font-bold" style={{ color: '#4ade80' }}>{selectedForPay.inv_no}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>{selectedForPay.tailor_code}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedForPay.tailor_name}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: '#4ade80' }}>AED {selectedForPay.amount}</span>
                </div>
                <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>DATE</label>
                    <input type="date" className="field" value={payDate} onChange={e => setPayDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>AMOUNT (AED)</label>
                    <input type="number" min="0" step="0.01" className="field" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={labelStyle}>REMARKS</label>
                    <input className="field" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional" />
                  </div>
                  <button type="submit" disabled={saving} className="btn-gold" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                    {saving ? 'Saving…' : `Save Payment → ${selectedForPay.inv_no}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
