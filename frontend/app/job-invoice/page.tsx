'use client'
import { useEffect, useState } from 'react'
import {
  getTailors, Tailor,
  createStitching, getNextInvNo,
  createTailorOrder,
  createPayment,
} from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'

type JobType = 'shop' | 'order' | 'payment'

const today = () => new Date().toISOString().slice(0, 10)

export default function JobInvoicePage() {
  const [activeJob, setActiveJob] = useState<JobType>('shop')
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Shared context — tailor carries across tabs
  const [sharedTailor, setSharedTailor] = useState<number | ''>('')

  // Shop form
  const [shopInvNo, setShopInvNo] = useState('')
  const [shopMd, setShopMd] = useState('')
  const [shopDate, setShopDate] = useState(today())
  const [shopPiece, setShopPiece] = useState('')
  const [shopRate, setShopRate] = useState('')
  const [shopTailor, setShopTailor] = useState<number | ''>('')

  // Order form
  const [orderTailor, setOrderTailor] = useState<number | ''>('')
  const [orderDate, setOrderDate] = useState(today())
  const [orderQty, setOrderQty] = useState('')
  const [orderAmount, setOrderAmount] = useState('')

  // Payment form
  const [payTailor, setPayTailor] = useState<number | ''>('')
  const [payDate, setPayDate] = useState(today())
  const [payAmount, setPayAmount] = useState('')
  const [payRemarks, setPayRemarks] = useState('')

  useEffect(() => {
    getTailors().then(r => setTailors(r.data))
    getNextInvNo().then(r => setShopInvNo(r.data.next_inv_no))
  }, [])

  // Sync shared tailor to other tabs when shop tailor changes
  useEffect(() => {
    if (shopTailor !== '') {
      setSharedTailor(shopTailor)
      setOrderTailor(shopTailor)
      setPayTailor(shopTailor)
    }
  }, [shopTailor])

  // When switching to order/payment tabs, pre-fill from shared tailor
  useEffect(() => {
    if (activeJob === 'order' && sharedTailor !== '') {
      setOrderTailor(sharedTailor)
    }
    if (activeJob === 'payment' && sharedTailor !== '') {
      setPayTailor(sharedTailor)
    }
  }, [activeJob, sharedTailor])

  const notify = (msg: string) => {
    setSuccess(msg)
    setError('')
    setTimeout(() => setSuccess(''), 3500)
  }

  const fail = (msg: string) => {
    setError(msg)
    setSuccess('')
  }

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopTailor) return fail('Please select a tailor')
    setSaving(true)
    try {
      await createStitching({
        tailor: shopTailor,
        md_no: shopMd,
        date: shopDate,
        pc_count: parseInt(shopPiece),
        rate: parseFloat(shopRate),
        inv_no: shopInvNo,
      })
      notify(`Shop entry ${shopInvNo} saved`)
      // Reset shop fields and get next inv_no
      setShopMd('')
      setShopPiece('')
      setShopRate('')
      setShopDate(today())
      const next = await getNextInvNo()
      setShopInvNo(next.data.next_inv_no)
    } catch {
      fail('Failed to save shop entry')
    } finally {
      setSaving(false)
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderTailor) return fail('Please select a tailor')
    setSaving(true)
    try {
      await createTailorOrder({
        tailor: orderTailor,
        date: orderDate,
        quantity: parseInt(orderQty),
        amount: parseFloat(orderAmount),
      })
      notify('Order entry saved')
      setOrderQty('')
      setOrderAmount('')
      setOrderDate(today())
      // carry tailor over
      setSharedTailor(orderTailor)
      setPayTailor(orderTailor)
    } catch {
      fail('Failed to save order entry')
    } finally {
      setSaving(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payTailor) return fail('Please select a tailor')
    setSaving(true)
    try {
      await createPayment({
        tailor: payTailor,
        date: payDate,
        amount: parseFloat(payAmount),
        remarks: payRemarks,
      })
      notify('Payment saved')
      setPayAmount('')
      setPayRemarks('')
      setPayDate(today())
    } catch {
      fail('Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  const jobs: { id: JobType; label: string; num: number; color: string }[] = [
    { id: 'shop', num: 1, label: 'Shop', color: '#D4AF37' },
    { id: 'order', num: 2, label: 'Order', color: '#60a5fa' },
    { id: 'payment', num: 3, label: 'Payment', color: '#4ade80' },
  ]

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Job Invoice" subtitle="SELECT JOB TYPE AND FILL DETAILS" />

        {/* Alert */}
        {success && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-5">
          {/* Left — Job Type List */}
          <div className="md:w-52 flex-shrink-0">
            <div className="card p-3 flex flex-row md:flex-col gap-2">
              <p className="hidden md:block text-[10px] font-semibold tracking-widest mb-1 px-2" style={{ color: 'rgba(255,255,255,0.3)' }}>JOB TYPES</p>
              {jobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => { setActiveJob(j.id); setError('') }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full"
                  style={activeJob === j.id ? {
                    background: `rgba(${j.id === 'shop' ? '212,175,55' : j.id === 'order' ? '96,165,250' : '74,222,128'},0.12)`,
                    border: `1px solid rgba(${j.id === 'shop' ? '212,175,55' : j.id === 'order' ? '96,165,250' : '74,222,128'},0.35)`,
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                >
                  <span
                    className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                    style={activeJob === j.id
                      ? { background: j.color, color: '#08080f' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    {j.num}
                  </span>
                  <span className="text-sm font-semibold hidden sm:block" style={{ color: activeJob === j.id ? j.color : 'rgba(255,255,255,0.5)' }}>
                    {j.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="flex-1">
            {/* ── SHOP ── */}
            {activeJob === 'shop' && (
              <div className="card p-6">
                <h2 className="text-sm font-bold tracking-widest mb-5" style={{ color: '#D4AF37' }}>SHOP ENTRY</h2>
                <form onSubmit={handleShopSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>INVOICE NO</label>
                      <input
                        className="field font-mono"
                        value={shopInvNo}
                        onChange={e => setShopInvNo(e.target.value)}
                        placeholder="Auto"
                        readOnly
                        style={{ color: '#D4AF37', cursor: 'default' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>DATE</label>
                      <input
                        type="date"
                        className="field"
                        value={shopDate}
                        onChange={e => setShopDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>MODEL (MD NO)</label>
                    <input
                      className="field"
                      value={shopMd}
                      onChange={e => setShopMd(e.target.value)}
                      placeholder="e.g. MD-101"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>PIECE</label>
                      <input
                        type="number"
                        min="1"
                        className="field"
                        value={shopPiece}
                        onChange={e => setShopPiece(e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>RATE (AED)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="field"
                        value={shopRate}
                        onChange={e => setShopRate(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Amount preview */}
                  {shopPiece && shopRate && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>TOTAL AMOUNT</span>
                      <span className="font-bold text-lg" style={{ color: '#D4AF37' }}>
                        AED {(parseFloat(shopPiece || '0') * parseFloat(shopRate || '0')).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>SELECT TAILOR</label>
                    <select
                      className="field"
                      value={shopTailor}
                      onChange={e => setShopTailor(Number(e.target.value))}
                      required
                    >
                      <option value="">— Choose tailor —</option>
                      {tailors.map(t => (
                        <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" disabled={saving} className="btn-gold mt-1">
                    {saving ? 'Saving...' : 'Save Shop Entry'}
                  </button>
                </form>
              </div>
            )}

            {/* ── ORDER ── */}
            {activeJob === 'order' && (
              <div className="card p-6">
                <h2 className="text-sm font-bold tracking-widest mb-5" style={{ color: '#60a5fa' }}>ORDER ENTRY</h2>
                <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>TAILOR</label>
                    <select
                      className="field"
                      value={orderTailor}
                      onChange={e => { setOrderTailor(Number(e.target.value)); setSharedTailor(Number(e.target.value)) }}
                      required
                    >
                      <option value="">— Choose tailor —</option>
                      {tailors.map(t => (
                        <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                      ))}
                    </select>
                    {sharedTailor && orderTailor === sharedTailor && (
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(96,165,250,0.7)' }}>Pre-filled from Shop selection</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>DATE</label>
                    <input
                      type="date"
                      className="field"
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>NO OF QUANTITY</label>
                    <input
                      type="number"
                      min="0"
                      className="field"
                      value={orderQty}
                      onChange={e => setOrderQty(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>AMOUNT (AED)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="field"
                      value={orderAmount}
                      onChange={e => setOrderAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <button type="submit" disabled={saving} className="btn-gold mt-1" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                    {saving ? 'Saving...' : 'Save Order Entry'}
                  </button>
                </form>
              </div>
            )}

            {/* ── PAYMENT ── */}
            {activeJob === 'payment' && (
              <div className="card p-6">
                <h2 className="text-sm font-bold tracking-widest mb-5" style={{ color: '#4ade80' }}>PAYMENT ENTRY</h2>
                <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>TAILOR</label>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <select
                          className="field"
                          value={payTailor}
                          disabled
                        >
                          <option value="">— Auto from previous —</option>
                          {tailors.map(t => (
                            <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {payTailor && (
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(74,222,128,0.7)' }}>
                        Auto-filled: {tailors.find(t => t.id === payTailor)?.code} — {tailors.find(t => t.id === payTailor)?.name}
                      </p>
                    )}
                    {!payTailor && (
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Complete Shop or Order tab first to auto-fill tailor</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>DATE</label>
                    <input
                      type="date"
                      className="field"
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>AMOUNT (AED)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="field"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>REMARKS</label>
                    <input
                      className="field"
                      value={payRemarks}
                      onChange={e => setPayRemarks(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !payTailor}
                    className="btn-gold mt-1"
                    style={{ background: payTailor ? 'linear-gradient(135deg,#22c55e,#16a34a)' : undefined }}
                  >
                    {saving ? 'Saving...' : 'Save Payment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
