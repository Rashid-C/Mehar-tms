'use client'
import { useEffect, useState } from 'react'
import { getOrders, createOrder, deleteOrder, updateOrder, getOrderSummary, lookupRateSheet, OrderReadymade } from '@/lib/api'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const EMPTY = {
    md_no: '', date: '', ord_date: '', ord_no: '', inv_no: '',
    barcode: '', size: '', rate: '', qty_sm: '', qty_a1: '', qty_f2: '',
    status: 'pending', remarks: '',
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderReadymade[]>([])
    const [summary, setSummary] = useState({ total_orders: 0, total_qty: 0, total_amount: 0 })
    const [form, setForm] = useState(EMPTY)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
    const [filterStatus, setFilterStatus] = useState('')

    const fetchData = async () => {
        const params: Record<string, string | number> = { month: filterMonth }
        if (filterStatus) params.status = filterStatus
        const [ordRes, sumRes] = await Promise.all([
            getOrders(params),
            getOrderSummary(params),
        ])
        setOrders(ordRes.data)
        setSummary(sumRes.data)
    }

    useEffect(() => { fetchData() }, [filterMonth, filterStatus])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
    const handleMdNoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setForm(prev => ({ ...prev, md_no: value, inv_no: '' }))
        if (value.length >= 2) {
            try {
                const res = await lookupRateSheet(value)
                if (res.data) {
                    setForm(prev => ({
                        ...prev,
                        md_no: value,
                        inv_no: res.data.inv_no || '',
                        rate: String(res.data.rate),
                    }))
                }
            } catch { }
        }
    }
    const autoTotal = () => {
        const qty = (parseInt(form.qty_sm) || 0) + (parseInt(form.qty_a1) || 0) + (parseInt(form.qty_f2) || 0)
        const rate = parseFloat(form.rate) || 0
        return { qty, amount: (qty * rate).toFixed(2) }
    }

    const handleSubmit = async () => {
        setError('')
        setSuccess('')
        if (!form.md_no || !form.date) {
            setError('MD No and Date are required')
            return
        }
        setLoading(true)
        try {
            await createOrder({
                md_no: form.md_no,
                date: form.date,
                ord_date: form.ord_date || null,
                ord_no: form.ord_no,
                inv_no: form.inv_no,
                barcode: form.barcode,
                size: form.size,
                rate: parseFloat(form.rate) || 0,
                qty_sm: parseInt(form.qty_sm) || 0,
                qty_a1: parseInt(form.qty_a1) || 0,
                qty_f2: parseInt(form.qty_f2) || 0,
                status: form.status,
                remarks: form.remarks,
            })
            setSuccess(`Order for MD ${form.md_no} added`)
            setForm(EMPTY)
            fetchData()
        } catch (err: unknown) {
            const e = err as { response?: { data?: unknown } }
            setError(e.response?.data ? JSON.stringify(e.response.data) : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (id: number, status: string) => {
        await updateOrder(id, { status })
        fetchData()
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this order?')) return
        await deleteOrder(id)
        fetchData()
    }

    const { qty: autoQty, amount: autoAmount } = autoTotal()

    const inputStyle = {
        width: '100%', background: '#08080f',
        border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px',
        padding: '10px 14px', color: '#ffffff', fontSize: '13px',
        outline: 'none', boxSizing: 'border-box' as const,
    }

    const labelStyle = {
        color: 'rgba(255,255,255,0.4)', fontSize: '10px',
        letterSpacing: '1.5px', display: 'block', marginBottom: '6px', fontWeight: 600,
    }

    const statusColor = (s: string) => ({
        pending: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
        completed: { bg: 'rgba(39,174,96,0.1)', border: 'rgba(39,174,96,0.3)', text: '#4ade80' },
        cancelled: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
    }[s] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#ffffff' })

    return (
        <main style={{ background: '#08080f', minHeight: '100vh', padding: '32px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Title */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ width: '3px', height: '22px', background: 'linear-gradient(180deg, #D4AF37, #8B6914)', borderRadius: '2px' }} />
                        <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 600 }}>Order Readymade</h2>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '15px', letterSpacing: '1px' }}>
                        CUSTOMER ORDERS — TRACK BY SIZE, BARCODE AND STATUS
                    </p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                    {[
                        { label: 'TOTAL ORDERS', value: summary.total_orders, color: '#ffffff' },
                        { label: 'TOTAL QTY', value: summary.total_qty, color: '#60a5fa' },
                        { label: 'TOTAL AMOUNT', value: `AED ${summary.total_amount}`, color: '#D4AF37' },
                    ].map(c => (
                        <div key={c.label} style={{ background: '#111118', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '12px', padding: '20px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '2px', marginBottom: '8px' }}>{c.label}</p>
                            <p style={{ color: c.color, fontSize: '24px', fontWeight: 700 }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Add Form */}
                <div style={{ background: 'linear-gradient(135deg, #111118, #0d0d16)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', overflow: 'hidden', marginBottom: '28px' }}>
                    <div style={{ background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid rgba(212,175,55,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#D4AF37', borderRadius: '50%' }} />
                        <span style={{ color: 'rgba(212,175,55,0.8)', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }}>ADD NEW ORDER</span>
                    </div>

                    <div style={{ padding: '24px' }}>
                        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>{error}</div>}
                        {success && <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#4ade80', fontSize: '13px' }}>{success}</div>}

                        {/* Row 1 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <label style={labelStyle}>MD NO *</label>
                                <input name="md_no" value={form.md_no} onChange={handleMdNoChange}
                                    placeholder="5301" style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>DATE *</label>
                                <input name="date" value={form.date} onChange={handleChange}
                                    type="date" style={{ ...inputStyle, colorScheme: 'dark' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>ORDER DATE</label>
                                <input name="ord_date" value={form.ord_date} onChange={handleChange}
                                    type="date" style={{ ...inputStyle, colorScheme: 'dark' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>ORDER NO</label>
                                <input name="ord_no" value={form.ord_no} onChange={handleChange}
                                    placeholder="11700" style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <label style={labelStyle}>INV NO</label>
                                <input name="inv_no" value={form.inv_no} onChange={handleChange}
                                    placeholder="1165" style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>BARCODE</label>
                                <input name="barcode" value={form.barcode} onChange={handleChange}
                                    placeholder="53330" style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>RATE (AED)</label>
                                <input name="rate" value={form.rate} onChange={handleChange}
                                    type="number" placeholder="0" style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                            </div>
                            <div>
                                <label style={labelStyle}>STATUS</label>
                                <select name="status" value={form.status} onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 3 — Sizes */}
                        <div style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
                            <p style={{ color: 'rgba(212,175,55,0.7)', fontSize: '10px', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>QUANTITY BY SIZE</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>SM (SMALL)</label>
                                    <input name="qty_sm" value={form.qty_sm} onChange={handleChange}
                                        type="number" placeholder="0" style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                                </div>
                                <div>
                                    <label style={labelStyle}>A1 (SIZE A1)</label>
                                    <input name="qty_a1" value={form.qty_a1} onChange={handleChange}
                                        type="number" placeholder="0" style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                                </div>
                                <div>
                                    <label style={labelStyle}>F2 (SIZE F2)</label>
                                    <input name="qty_f2" value={form.qty_f2} onChange={handleChange}
                                        type="number" placeholder="0" style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                                </div>
                            </div>
                        </div>

                        {/* Auto Total */}
                        {autoQty > 0 && (
                            <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1.5px', marginBottom: '4px' }}>TOTAL QTY</p>
                                    <p style={{ color: '#60a5fa', fontSize: '22px', fontWeight: 700 }}>{autoQty} pcs</p>
                                </div>
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1.5px', marginBottom: '4px' }}>TOTAL AMOUNT</p>
                                    <p style={{ color: '#D4AF37', fontSize: '22px', fontWeight: 700 }}>AED {autoAmount}</p>
                                </div>
                            </div>
                        )}

                        {/* Remarks */}
                        <div style={{ marginBottom: '18px' }}>
                            <label style={labelStyle}>REMARKS</label>
                            <input name="remarks" value={form.remarks} onChange={handleChange}
                                placeholder="Optional notes..." style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')} />
                        </div>

                        <button onClick={handleSubmit} disabled={loading}
                            style={{ background: loading ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg, #D4AF37, #B8962E)', color: loading ? 'rgba(255,255,255,0.4)' : '#0a0a0f', padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}>
                            {loading ? 'SAVING...' : '+ ADD ORDER'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}
                        style={{ background: '#111118', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '10px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', outline: 'none' }}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        style={{ background: '#111118', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '10px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', outline: 'none' }}>
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Orders Table */}
                <div style={{ border: '1px solid rgba(212,175,55,0.12)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: 'linear-gradient(135deg, #0f0f1a, #111120)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                                    {['DATE', 'MD NO', 'ORD NO', 'INV NO', 'BARCODE', 'RATE', 'SM', 'A1', 'F2', 'TOTAL QTY', 'AMOUNT', 'STATUS', ''].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '13px 12px', color: 'rgba(212,175,55,0.6)', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, idx) => {
                                    const sc = statusColor(o.status)
                                    return (
                                        <tr key={o.id}
                                            style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#08080f' : '#0a0a12')}>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{o.date}</td>
                                            <td style={{ padding: '11px 12px', color: '#D4AF37', fontWeight: 700, fontFamily: 'monospace' }}>{o.md_no}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{o.ord_no || '—'}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '12px' }}>{o.inv_no || '—'}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{o.barcode || '—'}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.6)' }}>{o.rate}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{o.qty_sm}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{o.qty_a1}</td>
                                            <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{o.qty_f2}</td>
                                            <td style={{ padding: '11px 12px', color: '#60a5fa', fontWeight: 700 }}>{o.total_qty}</td>
                                            <td style={{ padding: '11px 12px', color: '#4ade80', fontWeight: 700 }}>AED {o.total_amount}</td>
                                            <td style={{ padding: '11px 12px' }}>
                                                <select
                                                    value={o.status}
                                                    onChange={e => handleStatusChange(o.id, e.target.value)}
                                                    style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                                                    <option value="pending">PENDING</option>
                                                    <option value="completed">COMPLETED</option>
                                                    <option value="cancelled">CANCELLED</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '11px 12px' }}>
                                                <button onClick={() => handleDelete(o.id)}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                                    Del
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            {orders.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: 'rgba(212,175,55,0.06)', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                                        <td colSpan={9} style={{ padding: '13px 12px', color: 'rgba(212,175,55,0.6)', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 600 }}>TOTAL</td>
                                        <td style={{ padding: '13px 12px', color: '#60a5fa', fontWeight: 700 }}>{summary.total_qty}</td>
                                        <td style={{ padding: '13px 12px', color: '#D4AF37', fontWeight: 700 }}>AED {summary.total_amount}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                    {orders.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px', letterSpacing: '1px' }}>
                            NO ORDERS FOR THIS PERIOD
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}