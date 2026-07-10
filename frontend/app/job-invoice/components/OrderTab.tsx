'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  getTailorOrders, createTailorOrder, updateTailorOrder, deleteTailorOrder, TailorOrder, getNextOrderInvNo,
  Tailor,
} from '@/lib/api'
import { lbl, today } from '../shared'
import TailorSelector from './TailorSelector'
import RowActions from '@/components/RowActions'

export default function OrderTab({ tailors, onTailorCreated, notify, fail }: {
  tailors: Tailor[]
  onTailorCreated: (t: Tailor) => void
  notify: (msg: string) => void
  fail: (msg: string) => void
}) {
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
  const [orderDayFilter, setOrderDayFilter] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try { const res = await getTailorOrders(); setOrderRecords(res.data) }
    finally { setLoadingOrders(false) }
  }, [])

  useEffect(() => {
    getNextOrderInvNo().then(r => setOrderInvNo(r.data.next_inv_no))
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

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

  const filteredOrders = orderRecords.filter(o => {
    if (orderDayFilter && o.date !== orderDayFilter) return false
    if (orderSearch) {
      const q = orderSearch.toLowerCase()
      return o.inv_no?.toLowerCase().includes(q) || o.tailor_code.toLowerCase().includes(q) ||
             o.tailor_name.toLowerCase().includes(q) || o.date.includes(q) || (o.remarks || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
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
              <TailorSelector tailors={tailors} value={orderTailor} onChange={setOrderTailor}
                onTailorCreated={onTailorCreated} onError={fail} />
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
                      <td><RowActions onEdit={() => openEditOrder(o)} onDelete={() => handleDeleteOrder(o.id)} /></td>
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
  )
}
