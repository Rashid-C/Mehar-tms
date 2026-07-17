'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  getPayments, createPayment, updatePayment, deletePayment, Payment,
  getTailorJobSummary, TailorJobSummary, patchTailor, Tailor,
} from '@/lib/api'
import { lbl, today } from '../shared'
import RowActions from '@/components/RowActions'

export default function PaymentTab({ tailors, onTailorUpdated, notify, fail }: {
  tailors: Tailor[]
  onTailorUpdated: (t: Tailor) => void
  notify: (msg: string) => void
  fail: (msg: string) => void
}) {
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
  const [payDayFilter, setPayDayFilter] = useState('')
  const [paySearch, setPaySearch] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPays = useCallback(async () => {
    setLoadingPays(true)
    try { const res = await getPayments(); setPayRecords(res.data) }
    finally { setLoadingPays(false) }
  }, [])

  const loadSummary = useCallback(async () => {
    const res = await getTailorJobSummary()
    setTailorSummary(res.data)
  }, [])

  useEffect(() => { loadPays() }, [loadPays])
  useEffect(() => { loadSummary() }, [loadSummary])

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

  const filteredPays = payRecords.filter(p => {
    if (payDayFilter && p.date !== payDayFilter) return false
    if (paySearch) {
      const q = paySearch.toLowerCase()
      return p.tailor_code.toLowerCase().includes(q) || p.tailor_name.toLowerCase().includes(q) ||
             p.date.includes(q) || (p.remarks || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
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
                        onTailorUpdated(res.data)
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
                      <span style={{ color: '#94a3b8' }}>Production <span style={{ fontWeight: 700, color: '#475569' }}>({s.production_qty} entries)</span></span>
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
                      <td><RowActions onEdit={() => openEditPay(p)} onDelete={() => handleDeletePay(p.id)} /></td>
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
  )
}
