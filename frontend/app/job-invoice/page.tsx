'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getTailors, createTailor, Tailor,
  getJobInvoices, createJobInvoice, updateJobInvoice, deleteJobInvoice, JobInvoice, getNextInvNo,
  getTailorOrders, createTailorOrder, updateTailorOrder, deleteTailorOrder, TailorOrder, getNextOrderInvNo,
  getPayments, createPayment, updatePayment, deletePayment, Payment,
  getTailorJobSummary, TailorJobSummary,
  lookupRateSheet,
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
  const [isEditingShop, setIsEditingShop] = useState(false)
  const [editShopId, setEditShopId] = useState<number | null>(null)
  const [shopInvNo, setShopInvNo] = useState('')
  const [shopModelNo, setShopModelNo] = useState('')
  const [shopModelErr, setShopModelErr] = useState('')
  const [shopRateAutoFilled, setShopRateAutoFilled] = useState(false)
  const [shopLookupState, setShopLookupState] = useState<'idle'|'loading'|'found'|'notfound'>('idle')
  const [shopDate, setShopDate] = useState(today())
  const [shopPiece, setShopPiece] = useState('')
  const [shopRate, setShopRate] = useState('')
  const [shopTailor, setShopTailor] = useState<number | ''>('')
  const [shopRemarks, setShopRemarks] = useState('')

  // ── ORDER ─────────────────────────────────────────────────────────────
  const [orderRecords, setOrderRecords] = useState<TailorOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
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
  const [isEditingPay, setIsEditingPay] = useState(false)
  const [editPayId, setEditPayId] = useState<number | null>(null)
  const [payTailor, setPayTailor] = useState<number | ''>('')
  const [payDate, setPayDate] = useState(today())
  const [payAmount, setPayAmount] = useState('')
  const [payRemarks, setPayRemarks] = useState('')
  const [tailorSummary, setTailorSummary] = useState<TailorJobSummary[]>([])

  // ── Daily filters ─────────────────────────────────────────────────────
  const [shopDayFilter, setShopDayFilter] = useState('')
  const [orderDayFilter, setOrderDayFilter] = useState('')
  const [payDayFilter, setPayDayFilter] = useState('')

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

  // ── ORDER handlers ────────────────────────────────────────────────────
  const resetOrderForm = async () => {
    setOrderTailor(''); setOrderDate(today()); setOrderQty(''); setOrderAmount('')
    setIsEditingOrder(false); setEditOrderId(null)
    const r = await getNextOrderInvNo(); setOrderInvNo(r.data.next_inv_no)
  }

  const openEditOrder = (o: TailorOrder) => {
    setOrderInvNo(o.inv_no); setOrderTailor(o.tailor); setOrderDate(o.date)
    setOrderQty(String(o.quantity))
    const rate = o.quantity > 0 ? (parseFloat(String(o.amount)) / o.quantity).toFixed(2) : String(o.amount)
    setOrderAmount(rate)
    setIsEditingOrder(true); setEditOrderId(o.id)
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
    setPayTailor(''); setPayDate(today()); setPayAmount(''); setPayRemarks('')
    setIsEditingPay(false); setEditPayId(null)
  }

  const openEditPay = (p: Payment) => {
    setPayTailor(p.tailor); setPayDate(p.date); setPayAmount(String(p.amount)); setPayRemarks(p.remarks || '')
    setIsEditingPay(true); setEditPayId(p.id)
  }

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { tailor: payTailor, date: payDate, amount: parseFloat(payAmount), remarks: payRemarks }
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
  const filteredOrders = orderDayFilter ? orderRecords.filter(o => o.date === orderDayFilter) : orderRecords
  const filteredPays   = payDayFilter   ? payRecords.filter(p => p.date === payDayFilter)     : payRecords

  const jobs = [
    { id: 'shop'    as JobType, num: 1, label: 'Shop',    color: '#2563eb', rgb: '37,99,235'   },
    { id: 'order'   as JobType, num: 2, label: 'Order',   color: '#0891b2', rgb: '8,145,178'   },
    { id: 'payment' as JobType, num: 3, label: 'Payment', color: '#16a34a', rgb: '22,163,74'   },
  ]

  const lbl: React.CSSProperties = { color: '#64748b', letterSpacing: '1.5px' }

  // ── Re-usable tailor selector with inline create ───────────────────────
  const tailorSelector = ({ ctx, value, onChange, accentRgb = '37,99,235' }: {
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
          <p className="text-[11px] font-bold tracking-widest" style={{ color: `rgba(${accentRgb},0.8)` }}>NEW TAILOR</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] tracking-widest mb-1" style={{ color: '#94a3b8' }}>CODE *</label>
              <input className="field text-sm" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="e.g. MJ" maxLength={20} />
            </div>
            <div>
              <label className="block text-[11px] tracking-widest mb-1" style={{ color: '#94a3b8' }}>NAME *</label>
              <input className="field text-sm" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="Full name" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] tracking-widest mb-1" style={{ color: '#94a3b8' }}>PHONE (optional)</label>
            <input className="field text-sm" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="+971 …" />
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={creatingTailor} onClick={handleCreateTailor}
              className="text-xs px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ background: `rgba(${accentRgb},0.1)`, border: `1px solid rgba(${accentRgb},0.3)`, color: `rgb(${accentRgb})` }}>
              {creatingTailor ? 'Saving…' : 'Create & Select'}
            </button>
            <button type="button" onClick={closeNewTailor} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )

  // ── Re-usable action buttons per table row ─────────────────────────
  const rowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="text-[11px] px-2 py-1 rounded transition-all"
        style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', cursor: 'pointer' }}>✎</button>
      <button onClick={onDelete} className="text-[11px] px-2 py-1 rounded transition-all"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', cursor: 'pointer' }}>×</button>
    </div>
  )

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#f0f6ff' }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Shop Entry" subtitle="SHOP · ORDER · PAYMENT" />

        {success && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {jobs.map(j => (
            <button key={j.id} onClick={() => { setActiveJob(j.id); setError(''); closeNewTailor() }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold"
              style={activeJob === j.id
                ? { background: `rgba(${j.rgb},0.12)`, border: `1.5px solid rgba(${j.rgb},0.4)`, color: j.color }
                : { background: '#ffffff', border: '1.5px solid #e2e8f0', color: '#94a3b8' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={activeJob === j.id ? { background: j.color, color: '#ffffff' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                {j.num}
              </span>
              {j.label}
            </button>
          ))}
        </div>

        {/* ══════════ SHOP TAB ══════════ */}
        {activeJob === 'shop' && (
          <>
          {/* ── Search + daily summary — full width above the split ── */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: '#94a3b8', letterSpacing: '2px' }}>RECORDS</span>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>{shopTotal}</span>
            <input className="field flex-1 text-xs" style={{ padding: '8px 12px' }}
              placeholder="Search by INV NO, MODEL, DATE, TAILOR…"
              value={shopSearchInput} onChange={e => handleShopSearchChange(e.target.value)}
              disabled={!!shopDayFilter} />
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ background: 'rgba(37,99,235,0.04)', border: '1.5px solid rgba(37,99,235,0.12)' }}>
            <span className="text-[10px] font-bold tracking-widest shrink-0" style={{ color: '#93c5fd', letterSpacing: '2px' }}>DAILY SUMMARY</span>
            <input type="date" value={shopDayFilter} onChange={e => handleShopDayFilter(e.target.value)}
              className="field" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', flex: '0 0 auto' }} />
            {shopDayFilter && shopRecords.length > 0 && (
              <>
                <div style={{ width: 1, height: 24, background: 'rgba(37,99,235,0.2)', flexShrink: 0 }} />
                <div className="flex gap-5 flex-1">
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>PIECES</p>
                    <p className="text-base font-bold" style={{ color: '#2563eb' }}>{shopRecords.reduce((s, ji) => s + ji.pc_count, 0)} pc</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>AMOUNT</p>
                    <p className="text-base font-bold" style={{ color: '#16a34a' }}>AED {shopRecords.reduce((s, ji) => s + parseFloat(String(ji.amount)), 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>ENTRIES</p>
                    <p className="text-base font-bold" style={{ color: '#1e293b' }}>{shopTotal}</p>
                  </div>
                </div>
                <button onClick={() => handleShopDayFilter('')}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', cursor: 'pointer' }}>
                  ✕ Clear
                </button>
              </>
            )}
            {shopDayFilter && shopRecords.length === 0 && (
              <span className="text-xs" style={{ color: '#d1d5db' }}>No records for this date</span>
            )}
          </div>

          {/* ── Side-by-side: form (30%) + table (70%) ── */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

            {/* ── Left: Form (30%) ── */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'rgba(37,99,235,0.04)', borderBottom: '1.5px solid rgba(37,99,235,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '50%' }} />
                    <span className="text-[11px] font-bold tracking-widest" style={{ color: '#2563eb', letterSpacing: '2px' }}>
                      {isEditingShop ? `EDITING — ${shopInvNo}` : 'NEW SHOP ENTRY'}
                    </span>
                  </div>
                  {isEditingShop && (
                    <button type="button" onClick={resetShopForm}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
                <form onSubmit={handleShopSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>INVOICE NO</label>
                      <input className="field font-mono" value={shopInvNo} readOnly
                        style={{ color: '#2563eb', cursor: 'default', background: 'rgba(37,99,235,0.04)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                      <input type="date" className="field" value={shopDate} onChange={e => setShopDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>
                      MODEL NO <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(A–Z, 0–9 · max 7)</span>
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
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>PIECE</label>
                      <input type="number" min="1" className="field" value={shopPiece}
                        onChange={e => setShopPiece(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>
                        RATE (AED)
                        {shopRateAutoFilled && (
                          <span className="ml-1 normal-case font-normal" style={{ color: '#2563eb', letterSpacing: 0 }}>auto</span>
                        )}
                      </label>
                      <input type="number" min="0" step="0.01" className="field" value={shopRate}
                        onChange={e => { setShopRate(e.target.value); setShopRateAutoFilled(false); setShopLookupState('idle') }}
                        placeholder="0.00" required />
                    </div>
                  </div>
                  {shopPiece && shopRate && !isNaN(+shopPiece) && !isNaN(+shopRate) && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
                      <span className="text-xs tracking-widest" style={{ color: '#94a3b8' }}>TOTAL</span>
                      <span className="font-bold text-base" style={{ color: '#2563eb' }}>AED {(+shopPiece * +shopRate).toFixed(2)}</span>
                    </div>
                  )}
                  {tailorSelector({ ctx: 'shop', value: shopTailor, onChange: setShopTailor })}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>
                      REMARKS <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input className="field" value={shopRemarks} onChange={e => setShopRemarks(e.target.value)}
                      placeholder="e.g. urgent, special stitch…" />
                  </div>
                  <button type="submit" disabled={saving || !!shopModelErr} className="btn-gold w-full">
                    {saving ? 'Saving…' : isEditingShop ? 'Update Entry' : 'Save Entry'}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Right: Records (70%) ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingShop ? (
                <div className="flex items-center justify-center gap-2 py-12" style={{ color: '#94a3b8' }}>
                  <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
                </div>
              ) : shopRecords.length === 0 ? (
                <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                  style={{ color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                  {shopSearch ? 'NO RECORDS MATCH YOUR SEARCH' : 'NO RECORDS YET'}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(37,99,235,0.15)', boxShadow: '0 1px 4px rgba(37,99,235,0.06)' }}>
                    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                          {['INV NO', 'MODEL', 'DATE', 'PC', 'RATE', 'AMOUNT', 'TAILOR', ''].map(h => (
                            <th key={h} className="text-left px-3 py-3 font-semibold"
                              style={{ color: '#2563eb', letterSpacing: '1.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shopRecords.map((ji, idx) => (
                          <tr key={ji.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8faff', borderBottom: '1px solid #f1f5f9' }}>
                            <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#2563eb' }}>{ji.inv_no}</td>
                            <td className="px-3 py-2.5 font-semibold" style={{ color: '#1e293b' }}>{ji.model_no}</td>
                            <td className="px-3 py-2.5" style={{ color: '#64748b' }}>{ji.date}</td>
                            <td className="px-3 py-2.5" style={{ color: '#475569' }}>{ji.pc_count}</td>
                            <td className="px-3 py-2.5" style={{ color: '#475569' }}>{ji.rate}</td>
                            <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>AED {ji.amount}</td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}>
                                {ji.tailor_code}
                              </span>
                              <span className="ml-1.5" style={{ color: '#64748b' }}>{ji.tailor_name}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              {rowActions({ onEdit: () => openEditShop(ji), onDelete: () => handleDeleteShop(ji.id) })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(37,99,235,0.05)', borderTop: '1.5px solid rgba(37,99,235,0.15)' }}>
                          <td colSpan={3} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: '#2563eb' }}>TOTAL</td>
                          <td className="px-3 py-2.5 font-bold" style={{ color: '#2563eb' }}>
                            {shopRecords.reduce((s, ji) => s + ji.pc_count, 0)} pc
                          </td>
                          <td className="px-3 py-2.5" />
                          <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>
                            AED {shopRecords.reduce((s, ji) => s + parseFloat(String(ji.amount)), 0).toFixed(2)}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      Showing {(shopPage - 1) * PAGE_SIZE + 1}–{Math.min(shopPage * PAGE_SIZE, shopTotal)} of {shopTotal}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShopPage(p => p - 1)} disabled={shopPage <= 1}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0',
                          color: shopPage <= 1 ? '#cbd5e1' : '#475569', cursor: shopPage <= 1 ? 'not-allowed' : 'pointer' }}>
                        ← Prev
                      </button>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                        {shopPage} / {shopTotalPages}
                      </span>
                      <button onClick={() => setShopPage(p => p + 1)} disabled={shopPage >= shopTotalPages}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0',
                          color: shopPage >= shopTotalPages ? '#cbd5e1' : '#475569', cursor: shopPage >= shopTotalPages ? 'not-allowed' : 'pointer' }}>
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══════════ ORDER TAB ══════════ */}
        {activeJob === 'order' && (
          <>
          {/* Daily summary — full width */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: '#94a3b8', letterSpacing: '2px' }}>RECORDS</span>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2' }}>{orderRecords.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ background: 'rgba(8,145,178,0.04)', border: '1.5px solid rgba(8,145,178,0.12)' }}>
            <span className="text-[10px] font-bold tracking-widest shrink-0" style={{ color: '#67e8f9', letterSpacing: '2px' }}>DAILY SUMMARY</span>
            <input type="date" value={orderDayFilter} onChange={e => setOrderDayFilter(e.target.value)}
              className="field" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', flex: '0 0 auto' }} />
            {orderDayFilter && filteredOrders.length > 0 && (
              <>
                <div style={{ width: 1, height: 24, background: 'rgba(8,145,178,0.25)', flexShrink: 0 }} />
                <div className="flex gap-5 flex-1">
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#67e8f9' }}>QUANTITY</p>
                    <p className="text-base font-bold" style={{ color: '#0891b2' }}>{filteredOrders.reduce((s, o) => s + o.quantity, 0)} qty</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#67e8f9' }}>AMOUNT</p>
                    <p className="text-base font-bold" style={{ color: '#16a34a' }}>AED {filteredOrders.reduce((s, o) => s + parseFloat(String(o.amount)), 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#67e8f9' }}>ENTRIES</p>
                    <p className="text-base font-bold" style={{ color: '#1e293b' }}>{filteredOrders.length}</p>
                  </div>
                </div>
                <button onClick={() => setOrderDayFilter('')}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', color: '#0891b2', cursor: 'pointer' }}>
                  ✕ Clear
                </button>
              </>
            )}
            {orderDayFilter && filteredOrders.length === 0 && (
              <span className="text-xs" style={{ color: '#d1d5db' }}>No records for this date</span>
            )}
          </div>

          {/* 30/70 split */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'rgba(8,145,178,0.04)', borderBottom: '1.5px solid rgba(8,145,178,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: '50%' }} />
                    <span className="text-[11px] font-bold tracking-widest" style={{ color: '#0891b2', letterSpacing: '2px' }}>
                      {isEditingOrder ? 'EDITING ORDER' : 'NEW ORDER ENTRY'}
                    </span>
                  </div>
                  {isEditingOrder && (
                    <button type="button" onClick={resetOrderForm}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
                <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>INVOICE NO</label>
                      <input className="field font-mono" value={orderInvNo} readOnly
                        style={{ color: '#0891b2', cursor: 'default', background: 'rgba(8,145,178,0.04)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                      <input type="date" className="field" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                    </div>
                  </div>
                  {tailorSelector({ ctx: 'order', value: orderTailor, onChange: setOrderTailor, accentRgb: '8,145,178' })}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>QUANTITY</label>
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
                      style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.2)' }}>
                      <span className="text-xs tracking-widest" style={{ color: '#94a3b8' }}>TOTAL</span>
                      <span className="font-bold text-base" style={{ color: '#0891b2' }}>AED {(+orderQty * +orderAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <button type="submit" disabled={saving}
                    className="w-full py-3 rounded-full font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(8,145,178,0.3)' }}>
                    {saving ? 'Saving…' : isEditingOrder ? 'Update Order' : 'Save Order'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingOrders ? (
                <div className="flex items-center justify-center gap-2 py-12" style={{ color: '#94a3b8' }}>
                  <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                  style={{ color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                  {orderDayFilter ? 'NO ORDER RECORDS FOR THIS DATE' : 'NO ORDER RECORDS YET'}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(8,145,178,0.15)', boxShadow: '0 1px 4px rgba(8,145,178,0.06)' }}>
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#ecfeff', borderBottom: '1px solid #cffafe' }}>
                        {['INV NO', 'DATE', 'TAILOR', 'QTY', 'AMOUNT', ''].map(h => (
                          <th key={h} className="text-left px-3 py-3 font-semibold"
                            style={{ color: '#0891b2', letterSpacing: '1.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, idx) => (
                        <tr key={o.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8faff', borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#0891b2' }}>{o.inv_no || '—'}</td>
                          <td className="px-3 py-2.5" style={{ color: '#64748b' }}>{o.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2', border: '1px solid rgba(8,145,178,0.2)' }}>
                              {o.tailor_code}
                            </span>
                            <span className="ml-2" style={{ color: '#64748b' }}>{o.tailor_name}</span>
                          </td>
                          <td className="px-3 py-2.5" style={{ color: '#475569' }}>{o.quantity}</td>
                          <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>AED {o.amount}</td>
                          <td className="px-3 py-2.5">
                            {rowActions({ onEdit: () => openEditOrder(o), onDelete: () => handleDeleteOrder(o.id) })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(8,145,178,0.05)', borderTop: '1.5px solid rgba(8,145,178,0.15)' }}>
                        <td colSpan={2} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: '#0891b2' }}>TOTAL</td>
                        <td className="px-3 py-2.5" />
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#0891b2' }}>{filteredOrders.reduce((s, o) => s + o.quantity, 0)} qty</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>AED {filteredOrders.reduce((s, o) => s + parseFloat(String(o.amount)), 0).toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══════════ PAYMENT TAB ══════════ */}
        {activeJob === 'payment' && (
          <>
          {/* Daily summary — full width */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold tracking-widest shrink-0" style={{ color: '#94a3b8', letterSpacing: '2px' }}>RECORDS</span>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>{payRecords.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ background: 'rgba(22,163,74,0.04)', border: '1.5px solid rgba(22,163,74,0.12)' }}>
            <span className="text-[10px] font-bold tracking-widest shrink-0" style={{ color: '#86efac', letterSpacing: '2px' }}>DAILY SUMMARY</span>
            <input type="date" value={payDayFilter} onChange={e => setPayDayFilter(e.target.value)}
              className="field" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', flex: '0 0 auto' }} />
            {payDayFilter && filteredPays.length > 0 && (
              <>
                <div style={{ width: 1, height: 24, background: 'rgba(22,163,74,0.25)', flexShrink: 0 }} />
                <div className="flex gap-5 flex-1">
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#86efac' }}>PAYMENTS</p>
                    <p className="text-base font-bold" style={{ color: '#1e293b' }}>{filteredPays.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: '#86efac' }}>TOTAL PAID</p>
                    <p className="text-base font-bold" style={{ color: '#16a34a' }}>AED {filteredPays.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={() => setPayDayFilter('')}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: '#16a34a', cursor: 'pointer' }}>
                  ✕ Clear
                </button>
              </>
            )}
            {payDayFilter && filteredPays.length === 0 && (
              <span className="text-xs" style={{ color: '#d1d5db' }}>No payments for this date</span>
            )}
          </div>

          {/* 30/70 split */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'rgba(22,163,74,0.04)', borderBottom: '1.5px solid rgba(22,163,74,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#16a34a,#15803d)', borderRadius: '50%' }} />
                    <span className="text-[11px] font-bold tracking-widest" style={{ color: '#16a34a', letterSpacing: '2px' }}>
                      {isEditingPay ? 'EDITING PAYMENT' : 'RELEASE PAYMENT'}
                    </span>
                  </div>
                  {isEditingPay && (
                    <button type="button" onClick={resetPayForm}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
                <form onSubmit={handlePaySubmit} className="flex flex-col gap-4 p-5">

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>DATE</label>
                    <input type="date" className="field" value={payDate} onChange={e => setPayDate(e.target.value)} required />
                  </div>

                  {/* Tailor */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>TAILOR</label>
                    {tailorSummary.length === 0 ? (
                      <p className="text-xs py-3" style={{ color: '#94a3b8' }}>
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

                  {/* Tailor earnings summary */}
                  {payTailor !== '' && (() => {
                    const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                    if (!s) return null
                    return (
                      <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
                        style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Shop</span>
                          <span style={{ color: '#2563eb' }}>AED {s.shop_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Order</span>
                          <span style={{ color: '#0891b2' }}>AED {s.order_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                          <span style={{ color: '#94a3b8' }}>Total Earned</span>
                          <span className="font-bold" style={{ color: '#1e293b' }}>AED {s.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Already Paid</span>
                          <span style={{ color: '#dc2626' }}>− AED {s.paid_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid rgba(22,163,74,0.2)' }}>
                          <span style={{ color: '#16a34a' }}>Pending Balance</span>
                          <span style={{ color: s.balance > 0 ? '#16a34a' : '#dc2626' }}>AED {s.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Amount to release */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>RELEASE AMOUNT (AED)</label>
                    <input type="number" min="0" step="0.01" className="field" value={payAmount}
                      onChange={e => setPayAmount(e.target.value)} placeholder="0.00" required />
                    {payTailor !== '' && payAmount && !isNaN(+payAmount) && +payAmount > 0 && (() => {
                      const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                      if (!s) return null
                      const remaining = s.balance - parseFloat(payAmount)
                      return (
                        <p className="text-[11px] mt-1.5 font-semibold"
                          style={{ color: remaining >= 0 ? '#16a34a' : '#dc2626' }}>
                          {remaining >= 0
                            ? `Balance after payment: AED ${remaining.toFixed(2)}`
                            : `Overpayment by AED ${Math.abs(remaining).toFixed(2)}`}
                        </p>
                      )
                    })()}
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={lbl}>REMARKS <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span></label>
                    <input className="field" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="e.g. advance, full payment…" />
                  </div>

                  <button type="submit" disabled={saving}
                    className="w-full py-3 rounded-full font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                    {saving ? 'Saving…' : isEditingPay ? 'Update Payment' : 'Release Payment'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingPays ? (
                <div className="flex items-center justify-center gap-2 py-12" style={{ color: '#94a3b8' }}>
                  <span className="spinner" /><span className="text-xs tracking-widest">LOADING…</span>
                </div>
              ) : filteredPays.length === 0 ? (
                <div className="text-center py-12 text-xs tracking-widest rounded-xl"
                  style={{ color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                  {payDayFilter ? 'NO PAYMENTS FOR THIS DATE' : 'NO PAYMENT RECORDS YET'}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(22,163,74,0.15)', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                        {['DATE', 'TAILOR', 'AMOUNT', 'REMARKS', ''].map(h => (
                          <th key={h} className="text-left px-3 py-3 font-semibold"
                            style={{ color: '#16a34a', letterSpacing: '1.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPays.map((p, idx) => (
                        <tr key={p.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8faff', borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-3 py-2.5" style={{ color: '#64748b' }}>{p.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>
                              {p.tailor_code}
                            </span>
                            <span className="ml-2" style={{ color: '#64748b' }}>{p.tailor_name}</span>
                          </td>
                          <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>AED {p.amount}</td>
                          <td className="px-3 py-2.5" style={{ color: '#94a3b8' }}>{p.remarks || '—'}</td>
                          <td className="px-3 py-2.5">
                            {rowActions({ onEdit: () => openEditPay(p), onDelete: () => handleDeletePay(p.id) })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(22,163,74,0.05)', borderTop: '1px solid rgba(22,163,74,0.15)' }}>
                        <td colSpan={2} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: '#16a34a' }}>TOTAL</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#16a34a' }}>
                          AED {filteredPays.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toFixed(2)}
                        </td>
                        <td /><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    </main>
  )
}
