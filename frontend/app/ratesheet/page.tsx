'use client'
import { useEffect, useState } from 'react'
import { getRateSheets, createRateSheet, deleteRateSheet, getTailors, lookupRateSheet, RateSheet, Tailor } from '@/lib/api'

export default function RateSheetPage() {
    const [ratesheets, setRatesheets] = useState<RateSheet[]>([])
    const [tailors, setTailors] = useState<Tailor[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({
        md_no: '',
        tailor: '',
        rate: '',
        work_type: 'regular',
        notes: '',
    })

    const fetchData = async () => {
        const [rsRes, tailorRes] = await Promise.all([getRateSheets(), getTailors()])
        setRatesheets(rsRes.data)
        setTailors(tailorRes.data)
    }

    useEffect(() => { fetchData() }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleMdNoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setForm(prev => ({ ...prev, md_no: value, tailor: '', rate: '' }))

        if (value.length >= 2) {
            try {
                const res = await lookupRateSheet(value)
                if (res.data) {
                    setForm(prev => ({
                        ...prev,
                        md_no: value,
                        tailor: String(res.data.tailor_id),
                        rate: String(res.data.rate),
                    }))
                }
            } catch {
                // not found — user fills manually
            }
        }
    }

    const handleSubmit = async () => {
        setError('')
        setSuccess('')
        if (!form.md_no || !form.tailor || !form.rate) {
            setError('MD Number, Tailor and Rate are required')
            return
        }
        setLoading(true)
        try {
            await createRateSheet({
                md_no: form.md_no,
                tailor: parseInt(form.tailor),
                rate: parseFloat(form.rate),
                work_type: form.work_type,
                notes: form.notes,
            })
            setSuccess(`Rate sheet for MD ${form.md_no} added successfully`)
            setForm({ md_no: '', tailor: '', rate: '', work_type: 'regular', notes: '' })
            fetchData()
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: unknown } }
                setError(JSON.stringify(axiosErr.response?.data))
            } else {
                setError('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number, md_no: string) => {
        if (!confirm(`Delete rate sheet for MD ${md_no}?`)) return
        await deleteRateSheet(id)
        fetchData()
    }

    const inputStyle = {
        width: '100%',
        background: '#08080f',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '8px',
        padding: '11px 16px',
        color: '#ffffff',
        fontSize: '13px',
        outline: 'none',
        boxSizing: 'border-box' as const,
    }

    const labelStyle = {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '10px',
        letterSpacing: '1.5px',
        display: 'block',
        marginBottom: '8px',
        fontWeight: 600,
    }

    const workTypes = ['regular', 'new_design', 'special', 'alteration']

    return (
        <main style={{ background: '#08080f', minHeight: '100vh', padding: '32px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Title */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ width: '3px', height: '22px', background: 'linear-gradient(180deg, #D4AF37, #8B6914)', borderRadius: '2px' }} />
                        <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 600 }}>Rate Sheet</h2>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '15px', letterSpacing: '1px' }}>
                        SET RATE PER MD NUMBER — AUTO-FILLS IN INVOICE
                    </p>
                </div>

                {/* Add Form */}
                <div style={{ background: 'linear-gradient(135deg, #111118, #0d0d16)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0f0f1a, #111120)', borderBottom: '1px solid rgba(212,175,55,0.1)', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#D4AF37', borderRadius: '50%' }} />
                        <span style={{ color: 'rgba(212,175,55,0.8)', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }}>ADD NEW RATE</span>
                    </div>

                    <div style={{ padding: '28px' }}>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#4ade80', fontSize: '13px' }}>
                                {success}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>MD NUMBER *</label>
                                <input
                                    name="md_no" value={form.md_no} onChange={handleMdNoChange}
                                    placeholder="787"
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>TAILOR *</label>
                                <select
                                    name="tailor" value={form.tailor} onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                                >
                                    <option value="">Select Tailor</option>
                                    {tailors.map(t => (
                                        <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>RATE (AED) *</label>
                                <input
                                    name="rate" value={form.rate} onChange={handleChange}
                                    type="number" placeholder="70"
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>WORK TYPE</label>
                                <select
                                    name="work_type" value={form.work_type} onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    {workTypes.map(w => (
                                        <option key={w} value={w}>{w.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>NOTES</label>
                                <input
                                    name="notes" value={form.notes} onChange={handleChange}
                                    placeholder="Optional notes..."
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit} disabled={loading}
                            style={{ background: loading ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg, #D4AF37, #B8962E)', color: loading ? 'rgba(255,255,255,0.4)' : '#0a0a0f', padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
                        >
                            {loading ? 'SAVING...' : '+ ADD RATE'}
                        </button>
                    </div>
                </div>

                {/* Rate Sheet Table */}
                <div style={{ border: '1px solid rgba(212,175,55,0.12)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0f0f1a, #111120)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(212,175,55,0.8)', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }}>ALL RATES</span>
                        <span style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{ratesheets.length}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                                {['MD NO', 'TAILOR', 'RATE', 'WORK TYPE', 'NOTES', 'STATUS', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '13px 16px', color: 'rgba(212,175,55,0.6)', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ratesheets.map((rs, idx) => (
                                <tr key={rs.id}
                                    style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.04)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#08080f' : '#0a0a12')}
                                >
                                    <td style={{ padding: '12px 16px', color: '#D4AF37', fontWeight: 700, fontFamily: 'monospace' }}>{rs.md_no}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                                            {rs.tailor_code}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#4ade80', fontWeight: 700 }}>AED {rs.rate}</td>
                                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{rs.work_type.replace('_', ' ').toUpperCase()}</td>
                                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{rs.notes || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ background: rs.is_active ? 'rgba(39,174,96,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${rs.is_active ? 'rgba(39,174,96,0.3)' : 'rgba(239,68,68,0.3)'}`, color: rs.is_active ? '#4ade80' : '#f87171', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>
                                            {rs.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button
                                            onClick={() => handleDelete(rs.id, rs.md_no)}
                                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ratesheets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px', letterSpacing: '1px' }}>
                            NO RATES CONFIGURED YET
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
