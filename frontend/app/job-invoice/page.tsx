'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getTailors, createTailor, patchTailor, Tailor,
  getJobInvoices, createJobInvoice, updateJobInvoice, deleteJobInvoice, JobInvoice, getNextInvNo,
  getTailorOrders, createTailorOrder, updateTailorOrder, deleteTailorOrder, TailorOrder, getNextOrderInvNo,
  getPayments, createPayment, updatePayment, deletePayment, Payment,
  getTailorJobSummary, TailorJobSummary,
  getMaterialIssues, createMaterialIssue, updateMaterialIssue, deleteMaterialIssue, MaterialIssue,
  lookupRateSheet,
} from '@/lib/api'

type JobType = 'shop' | 'order' | 'payment' | 'mat'
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
  const [orderRemarks, setOrderRemarks] = useState('')

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
  const [obDraft, setObDraft] = useState('')
  const [savingOb, setSavingOb] = useState(false)

  // ── MAT ISSUE ────────────────────────────────────────────────────────
  const [matRecords, setMatRecords] = useState<MaterialIssue[]>([])
  const [loadingMat, setLoadingMat] = useState(false)
  const [isEditingMat, setIsEditingMat] = useState(false)
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [matTailor, setMatTailor] = useState<number | ''>('')
  const [matDate, setMatDate] = useState(today())
  const [matDescription, setMatDescription] = useState('')
  const [matAmount, setMatAmount] = useState('')
  const [matRemarks, setMatRemarks] = useState('')

  // ── Daily filters ─────────────────────────────────────────────────────
  const [shopDayFilter, setShopDayFilter] = useState('')
  const [orderDayFilter, setOrderDayFilter] = useState('')
  const [payDayFilter, setPayDayFilter] = useState('')
  const [matDayFilter, setMatDayFilter] = useState('')

  // ── Search ────────────────────────────────────────────────────────────
  const [orderSearch, setOrderSearch] = useState('')
  const [paySearch, setPaySearch] = useState('')
  const [matSearch, setMatSearch] = useState('')

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

  const loadMat = useCallback(async () => {
    setLoadingMat(true)
    try { const res = await getMaterialIssues(); setMatRecords(res.data) }
    finally { setLoadingMat(false) }
  }, [])

  const loadSummary = useCallback(async () => {
    const res = await getTailorJobSummary()
    setTailorSummary(res.data)
  }, [])

  useEffect(() => {
    getTailors({ page_size: 1000 }).then(r => setTailors(r.data.results))
    getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
    getNextOrderInvNo().then(r => setOrderInvNo(r.data.next_inv_no))
    loadSummary()
  }, [loadSummary])

  useEffect(() => { loadShop() }, [loadShop])
  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { loadPays() }, [loadPays])
  useEffect(() => { loadMat() }, [loadMat])


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
    setOrderTailor(''); setOrderDate(today()); setOrderQty(''); setOrderAmount(''); setOrderRemarks('')
    setIsEditingOrder(false); setEditOrderId(null)
    const r = await getNextOrderInvNo(); setOrderInvNo(r.data.next_inv_no)
  }

  const openEditOrder = (o: TailorOrder) => {
    setOrderInvNo(o.inv_no); setOrderTailor(o.tailor); setOrderDate(o.date)
    setOrderQty(String(o.quantity))
    setOrderAmount(String(o.amount)); setOrderRemarks(o.remarks || '')
    setIsEditingOrder(true); setEditOrderId(o.id)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderTailor) { fail('Please select a tailor'); return }
    const amount = parseFloat(orderAmount)
    setSaving(true)
    try {
      const payload = { inv_no: orderInvNo, tailor: orderTailor, date: orderDate, quantity: parseInt(orderQty), amount, remarks: orderRemarks }
      if (isEditingOrder && editOrderId) { await updateTailorOrder(editOrderId, payload); notify('Order updated') }
      else { await createTailorOrder(payload); notify(`${orderInvNo} saved — AED ${amount.toFixed(2)}`) }
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

  // ── MAT ISSUE handlers ────────────────────────────────────────────────
  const resetMatForm = () => {
    setMatTailor(''); setMatDate(today()); setMatDescription(''); setMatAmount(''); setMatRemarks('')
    setIsEditingMat(false); setEditMatId(null)
  }

  const openEditMat = (m: MaterialIssue) => {
    setMatTailor(m.tailor); setMatDate(m.date); setMatDescription(m.description || '')
    setMatAmount(String(m.amount)); setMatRemarks(m.remarks || '')
    setIsEditingMat(true); setEditMatId(m.id)
  }

  const handleMatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { tailor: matTailor, date: matDate, description: matDescription, amount: parseFloat(matAmount), remarks: matRemarks }
      if (isEditingMat && editMatId) { await updateMaterialIssue(editMatId, payload); notify('Material issue updated') }
      else { await createMaterialIssue(payload); notify('Material issue saved') }
      resetMatForm(); await Promise.all([loadMat(), loadSummary()])
    } catch { fail('Failed to save material issue') } finally { setSaving(false) }
  }

  const handleDeleteMat = async (id: number) => {
    if (!confirm('Delete this material issue?')) return
    try { await deleteMaterialIssue(id); await Promise.all([loadMat(), loadSummary()]) } catch { fail('Failed to delete') }
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const shopTotalPages = Math.ceil(shopTotal / PAGE_SIZE) || 1
  const filteredOrders = orderRecords.filter(o => {
    if (orderDayFilter && o.date !== orderDayFilter) return false
    if (orderSearch) {
      const q = orderSearch.toLowerCase()
      return o.inv_no?.toLowerCase().includes(q) || o.tailor_code.toLowerCase().includes(q) ||
             o.tailor_name.toLowerCase().includes(q) || o.date.includes(q) || (o.remarks || '').toLowerCase().includes(q)
    }
    return true
  })
  const filteredPays = payRecords.filter(p => {
    if (payDayFilter && p.date !== payDayFilter) return false
    if (paySearch) {
      const q = paySearch.toLowerCase()
      return p.tailor_code.toLowerCase().includes(q) || p.tailor_name.toLowerCase().includes(q) ||
             p.date.includes(q) || (p.remarks || '').toLowerCase().includes(q)
    }
    return true
  })

  const filteredMats = matRecords.filter(m => {
    if (matDayFilter && m.date !== matDayFilter) return false
    if (matSearch) {
      const q = matSearch.toLowerCase()
      return m.tailor_code.toLowerCase().includes(q) || m.tailor_name.toLowerCase().includes(q) ||
             m.date.includes(q) || (m.description || '').toLowerCase().includes(q) ||
             (m.remarks || '').toLowerCase().includes(q)
    }
    return true
  })

  const jobs = [
    { id: 'shop'    as JobType, num: 1, label: 'Shop',       color: '#2563eb', rgb: '37,99,235'  },
    { id: 'order'   as JobType, num: 2, label: 'Order',      color: '#0891b2', rgb: '8,145,178'  },
    { id: 'payment' as JobType, num: 3, label: 'Payment',    color: '#16a34a', rgb: '22,163,74'  },
    { id: 'mat'     as JobType, num: 4, label: 'Mat Issue',  color: '#d97706', rgb: '217,119,6'  },
  ]

  const lbl: React.CSSProperties = { color: '#374151', fontSize: 12, fontWeight: 500 }

  // ── Re-usable tailor selector with inline create ───────────────────────
  const tailorSelector = ({ ctx, value, onChange }: {
    ctx: JobType; value: number | ''; onChange: (v: number) => void; accentRgb?: string
  }) => (
    <div>
      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Tailor</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select className="field" style={{ flex: 1 }} value={value} onChange={e => onChange(Number(e.target.value))} required>
          <option value="">— Select tailor —</option>
          {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
        </select>
        <button type="button"
          onClick={() => newTailorCtx === ctx ? closeNewTailor() : openNewTailor(ctx)}
          className="btn-ghost" style={{ padding: '6px 12px', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {newTailorCtx === ctx ? '×' : '+'}
        </button>
      </div>
      {newTailorCtx === ctx && (
        <div style={{ marginTop: 10, padding: '12px', background: '#f8f9fb', border: '1px solid #e8ecf0', borderRadius: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>New Tailor</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Code *</label>
              <input className="field" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="MJ" maxLength={20} />
            </div>
            <div>
              <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Name *</label>
              <input className="field" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="Full name" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>Phone (optional)</label>
            <input className="field" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="+971 …" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={creatingTailor} onClick={handleCreateTailor} className="btn-gold" style={{ fontSize: 12, padding: '6px 14px' }}>
              {creatingTailor ? 'Saving…' : 'Create & Select'}
            </button>
            <button type="button" onClick={closeNewTailor} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )

  // ── Re-usable action buttons per table row ─────────────────────────
  const rowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => { onEdit(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        className="btn-ghost" style={{ padding: '3px 10px', fontSize: 12 }}>Edit</button>
      <button onClick={onDelete}
        className="btn-danger" style={{ padding: '3px 10px', fontSize: 12 }}>Del</button>
    </div>
  )

  return (
    <main className="min-h-screen" style={{ padding: '24px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Production</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Job Invoice</h1>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Tabs — Zoho underline style */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e8ecf0', marginBottom: 20, gap: 0 }}>
          {jobs.map(j => (
            <button key={j.id} onClick={() => { setActiveJob(j.id); setError(''); closeNewTailor() }}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: activeJob === j.id ? 600 : 400,
                color: activeJob === j.id ? j.color : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeJob === j.id ? `2px solid ${j.color}` : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}>
              {j.label}
            </button>
          ))}
        </div>

        {/* ══════════ SHOP TAB ══════════ */}
        {activeJob === 'shop' && (
          <>
          {/* ── Search + daily summary ── */}
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

          {/* ── Side-by-side: form (30%) + table (70%) ── */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

            {/* ── Left: Form (30%) ── */}
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
                  {tailorSelector({ ctx: 'shop', value: shopTailor, onChange: setShopTailor })}
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

            {/* ── Right: Records (70%) ── */}
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
                            <td>{rowActions({ onEdit: () => openEditShop(ji), onDelete: () => handleDeleteShop(ji.id) })}</td>
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
        )}

        {/* ══════════ ORDER TAB ══════════ */}
        {activeJob === 'order' && (
          <>
          {/* Search + daily summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
            <span className="badge badge-cyan" style={{ flexShrink: 0 }}>{filteredOrders.length}</span>
            <input className="field" style={{ padding: '7px 12px', flex: '1 1 160px', minWidth: 0, fontSize: 13 }}
              placeholder="Search Inv No, Tailor, Date, Remarks…"
              value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
              disabled={!!orderDayFilter} />
            <input type="date" value={orderDayFilter} onChange={e => { setOrderDayFilter(e.target.value); setOrderSearch('') }}
              className="field" style={{ width: 'auto', padding: '7px 12px', fontSize: 13, flex: '0 0 auto' }} />
            {orderDayFilter && filteredOrders.length > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: '#e8ecf0', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0891b2', flexShrink: 0 }}>
                  {filteredOrders.reduce((s, o) => s + o.quantity, 0)} qty
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', flexShrink: 0 }}>
                  AED {filteredOrders.reduce((s, o) => s + parseFloat(String(o.amount)), 0).toFixed(2)}
                </span>
                <button onClick={() => setOrderDayFilter('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>✕</button>
              </>
            )}
            {orderDayFilter && filteredOrders.length === 0 && (
              <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>No records</span>
            )}
          </div>

          {/* 30/70 split */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditingOrder ? 'Edit Order' : 'New Order'}</span>
                  {isEditingOrder && (
                    <button type="button" onClick={resetOrderForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
                  )}
                </div>
                <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Invoice No</label>
                      <input className="field font-mono" value={orderInvNo} readOnly
                        style={{ color: '#0891b2', cursor: 'default', background: 'rgba(8,145,178,0.04)' }} />
                    </div>
                    <div>
                      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Date</label>
                      <input type="date" className="field" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                    </div>
                  </div>
                  {tailorSelector({ ctx: 'order', value: orderTailor, onChange: setOrderTailor })}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Quantity</label>
                      <input type="number" min="0" className="field" value={orderQty}
                        onChange={e => setOrderQty(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                      <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Amount (AED)</label>
                      <input type="number" min="0" step="0.01" className="field" value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value)} placeholder="0.00" required />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>
                      Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input className="field" value={orderRemarks} onChange={e => setOrderRemarks(e.target.value)}
                      placeholder="e.g. urgent, special order…" />
                  </div>
                  <button type="submit" disabled={saving} className="btn-gold" style={{ width: '100%', background: '#0891b2' }}>
                    {saving ? 'Saving…' : isEditingOrder ? 'Update Order' : 'Save Order'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingOrders ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px', color: '#94a3b8' }}>
                  <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  {orderDayFilter ? 'No order records for this date.' : 'No order records yet.'}
                </div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="z-table">
                    <thead>
                      <tr>
                        {['Inv No', 'Date', 'Tailor', 'Qty', 'Amount', 'Remarks', ''].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td><span className="font-mono" style={{ color: '#0891b2', fontWeight: 600 }}>{o.inv_no || '—'}</span></td>
                          <td>{o.date}</td>
                          <td>
                            <span className="badge badge-cyan">{o.tailor_code}</span>
                            <span style={{ marginLeft: 6, color: '#64748b', fontSize: 12 }}>{o.tailor_name}</span>
                          </td>
                          <td>{o.quantity}</td>
                          <td><span style={{ color: '#16a34a', fontWeight: 600 }}>AED {o.amount}</span></td>
                          <td style={{ color: '#94a3b8' }}>{o.remarks || '—'}</td>
                          <td>{rowActions({ onEdit: () => openEditOrder(o), onDelete: () => handleDeleteOrder(o.id) })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>Total</td>
                        <td />
                        <td>{filteredOrders.reduce((s, o) => s + o.quantity, 0)} qty</td>
                        <td>AED {filteredOrders.reduce((s, o) => s + parseFloat(String(o.amount)), 0).toFixed(2)}</td>
                        <td /><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══════════ PAYMENT TAB ══════════ */}
        {activeJob === 'payment' && (
          <>
          {/* Search + daily summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
            <span className="badge badge-green" style={{ flexShrink: 0 }}>{filteredPays.length}</span>
            <input className="field" style={{ padding: '7px 12px', flex: '1 1 160px', minWidth: 0, fontSize: 13 }}
              placeholder="Search Tailor, Date, Remarks…"
              value={paySearch} onChange={e => setPaySearch(e.target.value)}
              disabled={!!payDayFilter} />
            <input type="date" value={payDayFilter} onChange={e => { setPayDayFilter(e.target.value); setPaySearch('') }}
              className="field" style={{ width: 'auto', padding: '7px 12px', fontSize: 13, flex: '0 0 auto' }} />
            {payDayFilter && filteredPays.length > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: '#e8ecf0', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', flexShrink: 0 }}>
                  AED {filteredPays.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toFixed(2)}
                </span>
                <button onClick={() => setPayDayFilter('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>✕</button>
              </>
            )}
            {payDayFilter && filteredPays.length === 0 && (
              <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>No payments</span>
            )}
          </div>


          {/* 30/70 split */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditingPay ? 'Edit Payment' : 'Release Payment'}</span>
                  {isEditingPay && (
                    <button type="button" onClick={resetPayForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
                  )}
                </div>
                <form onSubmit={handlePaySubmit} className="flex flex-col gap-4 p-5">

                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Date</label>
                    <input type="date" className="field" value={payDate} onChange={e => setPayDate(e.target.value)} required />
                  </div>

                  {/* Tailor */}
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Tailor</label>
                    {tailorSummary.length === 0 ? (
                      <p className="text-xs py-3" style={{ color: '#94a3b8' }}>
                        No tailors have worked yet — add Shop or Order entries first.
                      </p>
                    ) : (
                      <select className="field" value={payTailor}
                        onChange={e => {
                          const id = Number(e.target.value)
                          setPayTailor(id); setPayAmount('')
                          const t = tailors.find(x => x.id === id)
                          setObDraft(t ? String(parseFloat(String(t.opening_balance)) || 0) : '')
                        }} required>
                        <option value="">— Select tailor —</option>
                        {tailorSummary.map(s => (
                          <option key={s.tailor_id} value={s.tailor_id}>
                            {s.tailor_code} — {s.tailor_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Opening balance — editable per tailor */}
                  {payTailor !== '' && (
                    <div className="rounded-xl px-4 py-3 flex items-end gap-2"
                      style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Opening Balance (AED)</label>
                        <input type="number" step="0.01" className="field" value={obDraft}
                          onChange={e => setObDraft(e.target.value)} placeholder="0.00" />
                      </div>
                      <button type="button" disabled={savingOb} className="btn-ghost" style={{ padding: '9px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
                        onClick={async () => {
                          setSavingOb(true)
                          try {
                            const value = parseFloat(obDraft) || 0
                            const res = await patchTailor(Number(payTailor), { opening_balance: value })
                            setTailors(prev => prev.map(t => t.id === res.data.id ? res.data : t))
                            await loadSummary()
                            notify('Opening balance updated')
                          } catch {
                            fail('Failed to update opening balance')
                          } finally { setSavingOb(false) }
                        }}>
                        {savingOb ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}

                  {/* Tailor earnings summary */}
                  {payTailor !== '' && (() => {
                    const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                    if (!s) return null
                    return (
                      <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
                        style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
                        {s.opening_balance !== 0 && (
                          <div className="flex justify-between text-xs" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '2px' }}>
                            <span style={{ color: '#94a3b8' }}>Opening Balance</span>
                            <span style={{ color: s.opening_balance > 0 ? '#0f766e' : '#dc2626', fontWeight: 700 }}>
                              {s.opening_balance > 0 ? '' : '− '}AED {Math.abs(s.opening_balance).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Shop <span style={{ fontWeight: 700, color: '#475569' }}>({s.shop_qty} pc)</span></span>
                          <span style={{ color: '#2563eb' }}>AED {s.shop_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Order <span style={{ fontWeight: 700, color: '#475569' }}>({s.order_qty} qty)</span></span>
                          <span style={{ color: '#0891b2' }}>AED {s.order_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Production <span style={{ fontWeight: 700, color: '#475569' }}>({s.production_qty} pc)</span></span>
                          <span style={{ color: '#7c3aed' }}>AED {s.production_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                          <span style={{ color: '#94a3b8' }}>Total Earned</span>
                          <span className="font-bold" style={{ color: '#1e293b' }}>AED {s.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#94a3b8' }}>Mat Issue</span>
                          <span style={{ color: '#d97706' }}>− AED {s.mat_issue_amount.toFixed(2)}</span>
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
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Release Amount (AED)</label>
                    <input type="number" min="0" step="0.01" className="field" value={payAmount}
                      onChange={e => setPayAmount(e.target.value)} placeholder="0.00" required />
                    {payTailor !== '' && payAmount && !isNaN(+payAmount) && +payAmount > 0 && (() => {
                      const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                      if (!s) return null
                      const remaining = s.balance - parseFloat(payAmount)
                      return (
                        <p className="text-[11px] mt-1.5 font-semibold text-right"
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
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <input className="field" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="e.g. advance, full payment…" />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, background: '#16a34a' }}>
                      {saving ? 'Saving…' : isEditingPay ? 'Update Payment' : 'Release Payment'}
                    </button>
                    {(() => {
                      const tailor = tailors.find(t => t.id === Number(payTailor))
                      const phone = tailor?.phone?.replace(/\D/g, '')
                      const s = tailorSummary.find(x => x.tailor_id === Number(payTailor))
                      const msg = encodeURIComponent(`Payment of AED ${payAmount || '—'} released to ${tailor?.name || ''} on ${payDate}${payRemarks ? ` (${payRemarks})` : ''}. Pending balance: AED ${s ? (s.balance - parseFloat(payAmount || '0')).toFixed(2) : '—'}.`)
                      return phone ? (
                        <a href={`https://wa.me/${phone}?text=${msg}`} target="_blank" rel="noreferrer"
                          title="Send via WhatsApp"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#dcfce7', border: '1.5px solid #86efac', cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      ) : (
                        <span title={payTailor ? 'No phone saved for this tailor' : 'Select a tailor first'}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#f1f5f9', border: '1.5px solid #e2e8f0', flexShrink: 0, opacity: 0.45 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </span>
                      )
                    })()}
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingPays ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px', color: '#94a3b8' }}>
                  <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
                </div>
              ) : filteredPays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  {payDayFilter ? 'No payments for this date.' : 'No payment records yet.'}
                </div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="z-table">
                    <thead>
                      <tr>
                        {['Date', 'Tailor', 'Amount', 'Remarks', ''].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPays.map((p) => (
                        <tr key={p.id}>
                          <td>{p.date}</td>
                          <td>
                            <span className="badge badge-green">{p.tailor_code}</span>
                            <span style={{ marginLeft: 6, color: '#64748b', fontSize: 12 }}>{p.tailor_name}</span>
                          </td>
                          <td><span style={{ color: '#16a34a', fontWeight: 600 }}>AED {p.amount}</span></td>
                          <td style={{ color: '#94a3b8' }}>{p.remarks || '—'}</td>
                          <td>{rowActions({ onEdit: () => openEditPay(p), onDelete: () => handleDeletePay(p.id) })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>Total</td>
                        <td>AED {filteredPays.reduce((s, p) => s + parseFloat(String(p.amount)), 0).toFixed(2)}</td>
                        <td /><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══════════ MAT ISSUE TAB ══════════ */}
        {activeJob === 'mat' && (
          <>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
            <span className="badge badge-amber" style={{ flexShrink: 0 }}>{filteredMats.length}</span>
            <input className="field" style={{ padding: '7px 12px', flex: '1 1 160px', minWidth: 0, fontSize: 13 }}
              placeholder="Search Tailor, Description, Date…"
              value={matSearch} onChange={e => setMatSearch(e.target.value)}
              disabled={!!matDayFilter} />
            <input type="date" value={matDayFilter} onChange={e => { setMatDayFilter(e.target.value); setMatSearch('') }}
              className="field" style={{ width: 'auto', padding: '7px 12px', fontSize: 13, flex: '0 0 auto' }} />
            {matDayFilter && filteredMats.length > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: '#e8ecf0', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', flexShrink: 0 }}>
                  AED {filteredMats.reduce((s, m) => s + parseFloat(String(m.amount)), 0).toFixed(2)}
                </span>
                <button onClick={() => setMatDayFilter('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>✕</button>
              </>
            )}
            {matDayFilter && filteredMats.length === 0 && (
              <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>No records</span>
            )}
          </div>

          {/* 30/70 split */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ width: '30%', flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditingMat ? 'Edit Mat Issue' : 'New Mat Issue'}</span>
                  {isEditingMat && (
                    <button type="button" onClick={resetMatForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
                  )}
                </div>
                <form onSubmit={handleMatSubmit} className="flex flex-col gap-4 p-5">
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Date</label>
                    <input type="date" className="field" value={matDate} onChange={e => setMatDate(e.target.value)} required />
                  </div>
                  {tailorSelector({ ctx: 'mat', value: matTailor, onChange: v => setMatTailor(v) })}
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <input className="field" value={matDescription} onChange={e => setMatDescription(e.target.value)} placeholder="e.g. Fabric, Thread, Buttons…" />
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Amount (AED)</label>
                    <input type="number" min="0" step="0.01" className="field" value={matAmount}
                      onChange={e => setMatAmount(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <input className="field" value={matRemarks} onChange={e => setMatRemarks(e.target.value)} placeholder="Notes…" />
                  </div>
                  <button type="submit" disabled={saving} className="btn-gold" style={{ width: '100%', background: '#d97706' }}>
                    {saving ? 'Saving…' : isEditingMat ? 'Update Issue' : 'Save Issue'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingMat ? (
                <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af' }}>Loading…</div>
              ) : filteredMats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  {matDayFilter ? 'No records for this date.' : 'No material issues yet.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ background: 'rgba(217,119,6,0.04)', borderBottom: '1.5px solid rgba(217,119,6,0.10)' }}>
                        {['DATE','TAILOR','DESCRIPTION','AMOUNT','REMARKS',''].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold tracking-widest"
                            style={{ color: '#94a3b8', letterSpacing: '1.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMats.map((m, idx) => (
                        <tr key={m.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fffbf0', borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-3 py-2.5 text-xs" style={{ color: '#64748b' }}>{m.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                              {m.tailor_code}
                            </span>
                            <span className="ml-2 text-xs" style={{ color: '#64748b' }}>{m.tailor_name}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: '#475569' }}>{m.description || '—'}</td>
                          <td className="px-3 py-2.5 text-xs font-bold" style={{ color: '#d97706' }}>AED {m.amount}</td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: '#94a3b8' }}>{m.remarks || '—'}</td>
                          <td className="px-3 py-2.5">
                            {rowActions({ onEdit: () => openEditMat(m), onDelete: () => handleDeleteMat(m.id) })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(217,119,6,0.04)', borderTop: '1px solid rgba(217,119,6,0.15)' }}>
                        <td colSpan={3} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: '#d97706' }}>TOTAL</td>
                        <td className="px-3 py-2.5 text-xs font-bold" style={{ color: '#d97706' }}>
                          AED {filteredMats.reduce((s, m) => s + parseFloat(String(m.amount)), 0).toFixed(2)}
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
