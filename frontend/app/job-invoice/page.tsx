'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getTailors, createTailor, Tailor,
  getJobInvoices, createJobInvoice, updateJobInvoice, deleteJobInvoice, JobInvoice, getNextInvNo,
  getTailorOrders, createTailorOrder, updateTailorOrder, deleteTailorOrder, TailorOrder, getNextOrderInvNo,
  getPayments, createPayment, updatePayment, deletePayment, Payment,
  getTailorJobSummary, TailorJobSummary,
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

  // ── Shared new-tailor panel ─────────────────────────────────────────
  const [newTailorCtx, setNewTailorCtx] = useState<JobType | null>(null)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creatingTailor, setCreatingTailor] = useState(false)

  // ── SHOP ─────────────────────────────────────────────────────────────
  const [shopRecords, setShopRecords] = useState<JobInvoice[]>([])
  const [shopTotal, setShopTotal] = useState(0)
  const [shopPage, setShopPage] = useState(1)
  const [shopSearch, setShopSearch] = useState('')
  const [shopSearchInput, setShopSearchInput] = useState('')
  const [loadingShop, setLoadingShop] = useState(false)
  const shopSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showShopForm, setShowShopForm] = useState(false)
  const [isEditingShop, setIsEditingShop] = useState(false)
  const [editShopId, setEditShopId] = useState<number | null>(null)
  const [shopInvNo, setShopInvNo] = useState('')
  const [shopModelNo, setShopModelNo] = useState('')
  const [shopModelErr, setShopModelErr] = useState('')
  const [shopDate, setShopDate] = useState(today())
  const [shopPiece, setShopPiece] = useState('')
  const [shopRate, setShopRate] = useState('')
  const [shopTailor, setShopTailor] = useState<number | ''>('')

  // ── ORDER ─────────────────────────────────────────────────────────────
  const [orderRecords, setOrderRecords] = useState<TailorOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [editOrderId, setEditOrderId] = useState<number | null>(null)
  const [orderInvNo, setOrderInvNo] = useState('')
  const [orderTailor, setOrderTailor] = useState<number | ''>('')
  const [orderDate, setOrderDate] = useState(today())
  const [orderQty, setOrderQty] = useState('')
  const [orderAmount, setOrderAmount] = useState('')

  // ── PAYMENT ───────────────────────────────────────────────────────────
  const [payRecords, setPayRecords] = useState<Payment[]>([])
  const [loadingPays, setLoadingPays] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [isEditingPay, setIsEditingPay] = useState(false)
  const [editPayId, setEditPayId] = useState<number | null>(null)
  const [payTailor, setPayTailor] = useState<number | ''>('')
  const [payAmount, setPayAmount] = useState('')
  const [payRemarks, setPayRemarks] = useState('')
  const [tailorSummary, setTailorSummary] = useState<TailorJobSummary[]>([])

  // ── Loaders ───────────────────────────────────────────────────────────
  const loadShop = useCallback(async (p = shopPage, q = shopSearch) => {
    setLoadingShop(true)
    try {
      const res = await getJobInvoices({ page: p, page_size: PAGE_SIZE, search: q || undefined })
      setShopRecords(res.data.results)
      setShopTotal(res.data.count)
    } finally { setLoadingShop(false) }
  }, [shopPage, shopSearch])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try { const res = await getTailorOrders(); setOrderRecords(res.data) }
    finally { setLoadingOrders(false) }
  }, [])

  const loadPays = useCallback(async () => {
    setLoadingPays(true)
    try { const res = await getPayments(); setPayRecords(res.data) }
    finally { setLoadingPays(false) }
  }, [])

  const loadSummary = useCallback(async () => {
    const res = await getTailorJobSummary()
    setTailorSummary(res.data)
  }, [])

  useEffect(() => {
    getTailors().then(r => setTailors(r.data))
    getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
    getNextOrderInvNo().then(r => setOrderInvNo(r.data.next_inv_no))
    loadSummary()
  }, [loadSummary])

  useEffect(() => { loadShop() }, [loadShop])
  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { loadPays() }, [loadPays])

  // ── Helpers ───────────────────────────────────────────────────────────
  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3500) }
  const fail   = (msg: string) => { setError(msg); setSuccess('') }

  const handleShopSearchChange = (val: string) => {
    setShopSearchInput(val)
    if (shopSearchTimer.current) clearTimeout(shopSearchTimer.current)
    shopSearchTimer.current = setTimeout(() => { setShopSearch(val); setShopPage(1) }, 400)
  }

  // ── Shared new-tailor creation ────────────────────────────────────────
  const openNewTailor = (ctx: JobType) => {
    setNewTailorCtx(ctx); setNewName(''); setNewCode(''); setNewPhone('')
  }
  const closeNewTailor = () => setNewTailorCtx(null)

  const handleCreateTailor = async () => {
    if (!newName || !newCode) { fail('Name and Code are required'); return }
    setCreatingTailor(true)
    try {
      const res = await createTailor({ name: newName, code: newCode.toUpperCase(), phone: newPhone })
      setTailors(prev => [...prev, res.data])
      if (newTailorCtx === 'shop')    setShopTailor(res.data.id)
      if (newTailorCtx === 'order')   setOrderTailor(res.data.id)
      if (newTailorCtx === 'payment') setPayTailor(res.data.id)
      closeNewTailor()
      notify(`Tailor ${res.data.code} created and selected`)
    } catch (e: unknown) {
      const data = (e as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) fail(`Code already exists — use a different code`)
      else if (data) fail(Object.values(data).flat().join(' | '))
      else fail('Failed to create tailor — check your connection')
    } finally { setCreatingTailor(false) }
  }

  // ── SHOP handlers ─────────────────────────────────────────────────────
  const resetShopForm = async () => {
    setShopModelNo(''); setShopPiece(''); setShopRate(''); setShopDate(today())
    setShopModelErr(''); setShopTailor(''); setIsEditingShop(false); setEditShopId(null); setShowShopForm(false)
    const r = await getNextInvNo(); setShopInvNo(r.data.next_inv_no)
  }

  const openEditShop = (ji: JobInvoice) => {
    setShopInvNo(ji.inv_no); setShopModelNo(ji.model_no); setShopDate(ji.date)
    setShopPiece(String(ji.pc_count)); setShopRate(String(ji.rate)); setShopTailor(ji.tailor)
    setShopModelErr(''); setIsEditingShop(true); setEditShopId(ji.id); setShowShopForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validateModelNo = (val: string) => {
    if (!val) return 'Required'
    if (val.length > 7) return 'Max 7 characters'
    if (!MODEL_NO_RE.test(val)) return 'Letters and numbers only'
    return ''
  }

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateModelNo(shopModelNo)
    if (err) { setShopModelErr(err); return }
    if (!shopTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { inv_no: shopInvNo, model_no: shopModelNo, date: shopDate, pc_count: parseInt(shopPiece), rate: parseFloat(shopRate), tailor: shopTailor }
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

  // ── ORDER handlers ────────────────────────────────────────────────────
  const resetOrderForm = async () => {
    setOrderTailor(''); setOrderDate(today()); setOrderQty(''); setOrderAmount('')
    setIsEditingOrder(false); setEditOrderId(null); setShowOrderForm(false)
    const r = await getNextOrderInvNo(); setOrderInvNo(r.data.next_inv_no)
  }

  const openEditOrder = (o: TailorOrder) => {
    setOrderInvNo(o.inv_no); setOrderTailor(o.tailor); setOrderDate(o.date)
    setOrderQty(String(o.quantity))
    // reverse-calculate rate from stored total amount
    const rate = o.quantity > 0 ? (parseFloat(String(o.amount)) / o.quantity).toFixed(2) : String(o.amount)
    setOrderAmount(rate)
    setIsEditingOrder(true); setEditOrderId(o.id); setShowOrderForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderTailor) { fail('Please select a tailor'); return }
    const total = parseFloat(orderAmount) * parseInt(orderQty)
    setSaving(true)
    try {
      const payload = { inv_no: orderInvNo, tailor: orderTailor, date: orderDate, quantity: parseInt(orderQty), amount: total }
      if (isEditingOrder && editOrderId) { await updateTailorOrder(editOrderId, payload); notify('Order updated') }
      else { await createTailorOrder(payload); notify(`${orderInvNo} saved — AED ${total.toFixed(2)}`) }
      await resetOrderForm(); await loadOrders()
    } catch { fail('Failed to save order') } finally { setSaving(false) }
  }

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Delete this order?')) return
    try { await deleteTailorOrder(id); await loadOrders() } catch { fail('Failed to delete') }
  }

  // ── PAYMENT handlers ──────────────────────────────────────────────────
  const resetPayForm = () => {
    setPayTailor(''); setPayAmount(''); setPayRemarks('')
    setIsEditingPay(false); setEditPayId(null); setShowPayForm(false)
  }

  const openEditPay = (p: Payment) => {
    setPayTailor(p.tailor); setPayAmount(String(p.amount)); setPayRemarks(p.remarks || '')
    setIsEditingPay(true); setEditPayId(p.id); setShowPayForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { tailor: payTailor, date: today(), amount: parseFloat(payAmount), remarks: payRemarks }
      if (isEditingPay && editPayId) { await updatePayment(editPayId, payload); notify('Payment updated') }
      else { await createPayment(payload); notify('Payment saved') }
      resetPayForm(); await Promise.all([loadPays(), loadSummary()])
    } catch { fail('Failed to save payment') } finally { setSaving(false) }
  }

  const handleDeletePay = async (id: number) => {
    if (!confirm('Delete this payment?')) return
    try { await deletePayment(id); await Promise.all([loadPays(), loadSummary()]) } catch { fail('Failed to delete') }
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const shopTotalPages = Math.ceil(shopTotal / PAGE_SIZE) || 1

  const jobs = [
    { id: 'shop'    as JobType, num: 1, label: 'Shop',    color: '#D4AF37', rgb: '212,175,55'  },
    { id: 'order'   as JobType, num: 2, label: 'Order',   color: '#60a5fa', rgb: '96,165,250'  },
    { id: 'payment' as JobType, num: 3, label: 'Payment', color: '#4ade80', rgb: '74,222,128'  },
  ]

  const lbl: React.CSSProperties = { color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px' }

  // ── Re-usable tailor selector with inline create ───────────────────────
  // Called as a function (not JSX element) to avoid remount on parent re-render
  const tailorSelector = ({ ctx, value, onChange, accentRgb = '212,175,55' }: {
    ctx: JobType; value: number | ''; onChange: (v: number) => void; accentRgb?: string
  }) => (
    <div>
      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>TAILOR</label>
      <div className="flex gap-2">
        <select className="field flex-1" value={value} onChange={e => onChange(Number(e.target.value))} required>
          <option value="">— Select tailor —</option>
          {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
        </select>
        <button type="button"
          onClick={() => newTailorCtx === ctx ? closeNewTailor() : openNewTailor(ctx)}
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
          style={newTailorCtx === ctx
            ? { background: `rgba(${accentRgb},0.15)`, border: `1.5px solid rgba(${accentRgb},0.5)`, color: `rgb(${accentRgb})` }
            : { background: `rgba(${accentRgb},0.08)`, border: `1px solid rgba(${accentRgb},0.2)`,   color: `rgb(${accentRgb})` }}>
          {newTailorCtx === ctx ? '×' : '+'}
        </button>
      </div>
      {newTailorCtx === ctx && (
        <div className="mt-3 p-4 rounded-xl flex flex-col gap-3"
          style={{ background: `rgba(${accentRgb},0.04)`, border: `1px solid rgba(${accentRgb},0.15)` }}>
          <p className="text-[11px] font-bold tracking-widest" style={{ color: `rgba(${accentRgb},0.7)` }}>NEW TAILOR</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>CODE *</label>
              <input className="field text-sm" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="e.g. MJ" maxLength={20} />
            </div>
            <div>
              <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>NAME *</label>
              <input className="field text-sm" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="Full name" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>PHONE (optional)</label>
            <input className="field text-sm" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="+971 …" />
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={creatingTailor} onClick={handleCreateTailor}
              className="text-xs px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ background: `rgba(${accentRgb},0.15)`, border: `1px solid rgba(${accentRgb},0.4)`, color: `rgb(${accentRgb})` }}>
              {creatingTailor ? 'Saving…' : 'Create & Select'}
            </button>
            <button type="button" onClick={closeNewTailor} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )

  // ── Re-usable section header with + toggle ─────────────────────────
  const sectionHeader = ({ label, isEditing, editLabel, showForm, onOpen, onClose, accentColor = '#D4AF37' }: {
    label: string; isEditing: boolean; editLabel: string; showForm: boolean
    onOpen: () => void; onClose: () => void; accentColor?: string
  }) => (
    <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
      style={{ borderBottom: showForm ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      onClick={() => !showForm && onOpen()}>
      <span className="text-xs font-bold tracking-widest" style={{ color: accentColor, letterSpacing: '2px' }}>
        {isEditing ? editLabel : label}
      </span>
      {!showForm ? (
        <button type="button" onClick={e => { e.stopPropagation(); onOpen() }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold transition-all"
          style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}aa)`, color: '#08080f' }}>
          +
        </button>
      ) : (
        <button type="button" onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          ✕ Close
        </button>
      )}
    </div>
  )

  // ── Re-usable action buttons per table row ─────────────────────────
  const rowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="text-[11px] px-2 py-1 rounded transition-all"
        style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', cursor: 'pointer' }}>✎</button>
      <button onClick={onDelete} className="text-[11px] px-2 py-1 rounded transition-all"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>×</button>
    </div>
  )

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Job Invoice" subtitle="SHOP · ORDER · PAYMENT" />

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
            <button key={j.id} onClick={() => { setActiveJob(j.id); setError(''); closeNewTailor() }}
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
            <div className="card mb-5" style={showShopForm ? {} : { borderColor: 'rgba(212,175,55,0.2)' }}>
              {sectionHeader({
                label: 'SHOP ENTRY', editLabel: `EDIT — ${shopInvNo}`,
                showForm: showShopForm, isEditing: isEditingShop,
                onOpen: () => { setIsEditingShop(false); setEditShopId(null); setShowShopForm(true) },
                onClose: resetShopForm,
              })}
              {showShopForm && (
                <form onSubmit={handleShopSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>INVOICE NO</label>
                      <input className="field font-mono" value={shopInvNo} readOnly
                        style={{ color: '#D4AF37', cursor: 'default', background: 'rgba(212,175,55,0.04)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                      <input type="date" className="field" value={shopDate} onChange={e => setShopDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>
                      MODEL NO <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>(A–Z, 0–9 · max 7)</span>
                    </label>
                    <input className="field" value={shopModelNo}
                      onChange={e => {
                        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
                        setShopModelNo(v); setShopModelErr(v ? validateModelNo(v) : '')
                      }}
                      placeholder="e.g. MD101" maxLength={7} required
                      style={shopModelErr ? { borderColor: 'rgba(239,68,68,0.6)' } : {}} />
                    {shopModelErr
                      ? <p className="text-xs mt-1" style={{ color: '#f87171' }}>{shopModelErr}</p>
                      : shopModelNo ? <p className="text-xs mt-1" style={{ color: 'rgba(74,222,128,0.7)' }}>{shopModelNo.length}/7 — valid</p>
                      : null}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>PIECE</label>
                      <input type="number" min="1" className="field" value={shopPiece}
                        onChange={e => setShopPiece(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>RATE (AED)</label>
                      <input type="number" min="0" step="0.01" className="field" value={shopRate}
                        onChange={e => setShopRate(e.target.value)} placeholder="0.00" required />
                    </div>
                  </div>
                  {shopPiece && shopRate && !isNaN(+shopPiece) && !isNaN(+shopRate) && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                      <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>TOTAL AMOUNT</span>
                      <span className="font-bold text-xl" style={{ color: '#D4AF37' }}>AED {(+shopPiece * +shopRate).toFixed(2)}</span>
                    </div>
                  )}
                  {tailorSelector({ ctx: 'shop', value: shopTailor, onChange: setShopTailor })}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving || !!shopModelErr} className="btn-gold flex-1">
                      {saving ? 'Saving…' : isEditingShop ? 'Update Entry' : 'Save Shop Entry'}
                    </button>
                    {isEditingShop && <button type="button" onClick={resetShopForm} className="btn-ghost px-5">Cancel</button>}
                  </div>
                </form>
              )}
            </div>

            {/* Shop records */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>SAVED SHOP RECORDS</span>
              <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>{shopTotal}</span>
              <input className="field flex-1 text-xs" style={{ padding: '8px 12px' }}
                placeholder="Search by INV NO, MODEL, DATE (YYYY-MM-DD), TAILOR…"
                value={shopSearchInput} onChange={e => handleShopSearchChange(e.target.value)} />
            </div>

            {loadingShop ? (
              <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
              </div>
            ) : shopRecords.length === 0 ? (
              <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                style={{ color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {shopSearch ? 'NO RECORDS MATCH YOUR SEARCH' : 'NO RECORDS YET — CLICK + TO ADD FIRST ENTRY'}
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
                      {shopRecords.map((ji, idx) => (
                        <tr key={ji.id} style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
                            {rowActions({ onEdit: () => openEditShop(ji), onDelete: () => handleDeleteShop(ji.id) })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4 px-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Showing {(shopPage - 1) * PAGE_SIZE + 1}–{Math.min(shopPage * PAGE_SIZE, shopTotal)} of {shopTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShopPage(p => p - 1)} disabled={shopPage <= 1}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: shopPage <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: shopPage <= 1 ? 'not-allowed' : 'pointer' }}>
                      ← Prev
                    </button>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                      {shopPage} / {shopTotalPages}
                    </span>
                    <button onClick={() => setShopPage(p => p + 1)} disabled={shopPage >= shopTotalPages}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: shopPage >= shopTotalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: shopPage >= shopTotalPages ? 'not-allowed' : 'pointer' }}>
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════ ORDER TAB ══════════ */}
        {activeJob === 'order' && (
          <>
            <div className="card mb-5" style={showOrderForm ? {} : { borderColor: 'rgba(96,165,250,0.2)' }}>
              {sectionHeader({
                label: 'ORDER ENTRY', editLabel: 'EDIT ORDER',
                showForm: showOrderForm, isEditing: isEditingOrder,
                onOpen: () => { setIsEditingOrder(false); setEditOrderId(null); setShowOrderForm(true) },
                onClose: resetOrderForm, accentColor: '#60a5fa',
              })}
              {showOrderForm && (
                <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>INVOICE NO</label>
                      <input className="field font-mono" value={orderInvNo} readOnly
                        style={{ color: '#60a5fa', cursor: 'default', background: 'rgba(96,165,250,0.04)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                      <input type="date" className="field" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                    </div>
                  </div>
                  {tailorSelector({ ctx: 'order', value: orderTailor, onChange: setOrderTailor, accentRgb: '96,165,250' })}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>NO OF QUANTITY</label>
                      <input type="number" min="0" className="field" value={orderQty}
                        onChange={e => setOrderQty(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>RATE (AED)</label>
                      <input type="number" min="0" step="0.01" className="field" value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value)} placeholder="0.00" required />
                    </div>
                  </div>
                  {orderQty && orderAmount && !isNaN(+orderQty) && !isNaN(+orderAmount) && +orderQty > 0 && +orderAmount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}>
                      <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {orderQty} × AED {parseFloat(orderAmount).toFixed(2)}
                      </span>
                      <span className="font-bold text-xl" style={{ color: '#60a5fa' }}>
                        AED {(+orderQty * +orderAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff' }}>
                      {saving ? 'Saving…' : isEditingOrder ? 'Update Order' : 'Save Order'}
                    </button>
                    {isEditingOrder && <button type="button" onClick={resetOrderForm} className="btn-ghost px-5">Cancel</button>}
                  </div>
                </form>
              )}
            </div>

            {/* Order records */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>SAVED ORDER RECORDS</span>
              <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{orderRecords.length}</span>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
              </div>
            ) : orderRecords.length === 0 ? (
              <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                style={{ color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                NO ORDER RECORDS YET — CLICK + TO ADD FIRST ENTRY
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(96,165,250,0.12)' }}>
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(96,165,250,0.15)' }}>
                      {['INV NO', 'DATE', 'TAILOR', 'QTY', 'AMOUNT', ''].map(h => (
                        <th key={h} className="text-left px-3 py-3 font-semibold"
                          style={{ color: 'rgba(96,165,250,0.55)', letterSpacing: '1.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderRecords.map((o, idx) => (
                      <tr key={o.id} style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#60a5fa' }}>{o.inv_no || '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{o.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                            {o.tailor_code}
                          </span>
                          <span className="ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{o.tailor_name}</span>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{o.quantity}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#4ade80' }}>AED {o.amount}</td>
                        <td className="px-3 py-2.5">
                          {rowActions({ onEdit: () => openEditOrder(o), onDelete: () => handleDeleteOrder(o.id) })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#0d0d1a', borderTop: '1px solid rgba(96,165,250,0.15)' }}>
                      <td colSpan={3} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>TOTAL</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: '#4ade80' }}>
                        AED {orderRecords.reduce((s, o) => s + parseFloat(String(o.amount)), 0).toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {/* ══════════ PAYMENT TAB ══════════ */}
        {activeJob === 'payment' && (
          <>
            <div className="card mb-5" style={showPayForm ? {} : { borderColor: 'rgba(74,222,128,0.2)' }}>
              {sectionHeader({
                label: 'RELEASE PAYMENT', editLabel: 'EDIT PAYMENT',
                showForm: showPayForm, isEditing: isEditingPay,
                onOpen: () => { setIsEditingPay(false); setEditPayId(null); setShowPayForm(true) },
                onClose: resetPayForm, accentColor: '#4ade80',
              })}
              {showPayForm && (
                <form onSubmit={handlePaySubmit} className="flex flex-col gap-4 p-5">

                  {/* Date — read only */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                    <input className="field" value={today()} readOnly
                      style={{ color: 'rgba(255,255,255,0.4)', cursor: 'default', background: 'rgba(255,255,255,0.02)' }} />
                  </div>

                  {/* Tailor — only worked tailors, no create */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>TAILOR</label>
                    {tailorSummary.length === 0 ? (
                      <p className="text-xs py-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        No tailors have worked yet — add Shop or Order entries first.
                      </p>
                    ) : (
                      <select className="field" value={payTailor}
                        onChange={e => { setPayTailor(Number(e.target.value)); setPayAmount('') }} required>
                        <option value="">— Select tailor —</option>
                        {tailorSummary.map(s => (
                          <option key={s.tailor_id} value={s.tailor_id}>
                            {s.tailor_code} — {s.tailor_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Tailor earnings summary (appears when tailor selected) */}
                  {payTailor !== '' && (() => {
                    const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                    if (!s) return null
                    return (
                      <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Shop</span>
                          <span style={{ color: '#D4AF37' }}>AED {s.shop_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Order</span>
                          <span style={{ color: '#60a5fa' }}>AED {s.order_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '2px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Total Earned</span>
                          <span className="font-bold" style={{ color: '#fff' }}>AED {s.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Already Paid</span>
                          <span style={{ color: '#f87171' }}>− AED {s.paid_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid rgba(74,222,128,0.2)' }}>
                          <span style={{ color: 'rgba(74,222,128,0.8)' }}>Pending Balance</span>
                          <span style={{ color: s.balance > 0 ? '#4ade80' : '#f87171' }}>AED {s.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Amount to release */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>RELEASE AMOUNT (AED)</label>
                    <input type="number" min="0" step="0.01" className="field" value={payAmount}
                      onChange={e => setPayAmount(e.target.value)} placeholder="0.00" required />
                    {/* Balance after this payment */}
                    {payTailor !== '' && payAmount && !isNaN(+payAmount) && +payAmount > 0 && (() => {
                      const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                      if (!s) return null
                      const remaining = s.balance - parseFloat(payAmount)
                      return (
                        <p className="text-[11px] mt-1.5 font-semibold"
                          style={{ color: remaining >= 0 ? 'rgba(74,222,128,0.7)' : '#f87171' }}>
                          {remaining >= 0
                            ? `Balance after payment: AED ${remaining.toFixed(2)}`
                            : `Overpayment by AED ${Math.abs(remaining).toFixed(2)}`}
                        </p>
                      )
                    })()}
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>REMARKS <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(optional)</span></label>
                    <input className="field" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="e.g. advance, full payment…" />
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={saving}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }}>
                      {saving ? 'Saving…' : isEditingPay ? 'Update Payment' : 'Release Payment'}
                    </button>
                    {isEditingPay && <button type="button" onClick={resetPayForm} className="btn-ghost px-5">Cancel</button>}
                  </div>
                </form>
              )}
            </div>

            {/* Payment records */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>SAVED PAYMENT RECORDS</span>
              <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>{payRecords.length}</span>
            </div>

            {loadingPays ? (
              <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
              </div>
            ) : payRecords.length === 0 ? (
              <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                style={{ color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                NO PAYMENT RECORDS YET — CLICK + TO ADD FIRST ENTRY
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(74,222,128,0.12)' }}>
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(74,222,128,0.15)' }}>
                      {['DATE', 'TAILOR', 'AMOUNT', 'REMARKS', ''].map(h => (
                        <th key={h} className="text-left px-3 py-3 font-semibold"
                          style={{ color: 'rgba(74,222,128,0.55)', letterSpacing: '1.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payRecords.map((p, idx) => (
                      <tr key={p.id} style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                            {p.tailor_code}
                          </span>
                          <span className="ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.tailor_name}</span>
                        </td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#4ade80' }}>AED {p.amount}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.remarks || '—'}</td>
                        <td className="px-3 py-2.5">
                          {rowActions({ onEdit: () => openEditPay(p), onDelete: () => handleDeletePay(p.id) })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#0d0d1a', borderTop: '1px solid rgba(74,222,128,0.15)' }}>
                      <td colSpan={2} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: 'rgba(74,222,128,0.5)' }}>TOTAL</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: '#4ade80' }}>
                        AED {payRecords.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toFixed(2)}
                      </td>
                      <td /><td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
