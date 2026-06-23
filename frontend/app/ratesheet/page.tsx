'use client'
import { useEffect, useState } from 'react'
import { getRateSheets, createRateSheet, deleteRateSheet, getTailors, lookupRateSheet, RateSheet, Tailor } from '@/lib/api'

export default function RateSheetPage() {
    const [ratesheets, setRatesheets] = useState<RateSheet[]>([])
    const [tailors, setTailors] = useState<Tailor[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ md_no: '', tailor: '', rate: '', work_type: 'regular', notes: '' })

    const fetchData = async () => {
        const [rsRes, tailorRes] = await Promise.all([getRateSheets(), getTailors({ page_size: 1000 })])
        setRatesheets(rsRes.data)
        setTailors(tailorRes.data.results)
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
                    setForm(prev => ({ ...prev, md_no: value, tailor: String(res.data.tailor_id), rate: String(res.data.rate) }))
                }
            } catch { }
        }
    }

    const handleSubmit = async () => {
        setError(''); setSuccess('')
        if (!form.md_no || !form.tailor || !form.rate) { setError('MD Number, Tailor and Rate are required'); return }
        setLoading(true)
        try {
            await createRateSheet({ md_no: form.md_no, tailor: parseInt(form.tailor), rate: parseFloat(form.rate), work_type: form.work_type, notes: form.notes })
            setSuccess(`Rate sheet for MD ${form.md_no} added successfully`)
            setForm({ md_no: '', tailor: '', rate: '', work_type: 'regular', notes: '' })
            fetchData()
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: unknown } }
                setError(JSON.stringify(axiosErr.response?.data))
            } else { setError('Something went wrong') }
        } finally { setLoading(false) }
    }

    const handleDelete = async (id: number, md_no: string) => {
        if (!confirm(`Delete rate sheet for MD ${md_no}?`)) return
        await deleteRateSheet(id)
        fetchData()
    }

    const inputStyle = {
        width: '100%', background: '#ffffff',
        border: '1.5px solid #e5e7eb', borderRadius: '12px',
        padding: '11px 16px', color: '#1e293b', fontSize: '13px',
        outline: 'none', boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s, box-shadow 0.2s',
    }
    const labelStyle = { color: '#6b7280', fontSize: '10px', letterSpacing: '1.5px', display: 'block', marginBottom: '8px', fontWeight: 700 }
    const workTypes = ['regular', 'new_design', 'special', 'alteration']

    return (
        <main style={{ minHeight: '100vh', padding: '32px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Title */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ color: '#1e293b', fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>Rate Sheet</h2>
                    <p style={{ color: '#93c5fd', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }}>
                        SET RATE PER MD NUMBER — AUTO-FILLS IN INVOICE
                    </p>
                </div>

                {/* Add Form */}
                <div style={{ background: '#ffffff', border: '1.5px solid rgba(37,99,235,0.12)', borderRadius: '20px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 2px 12px rgba(37,99,235,0.07)' }}>
                    <div style={{ background: 'rgba(37,99,235,0.04)', borderBottom: '1.5px solid rgba(37,99,235,0.08)', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '50%' }} />
                        <span style={{ color: '#2563eb', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>ADD NEW RATE</span>
                    </div>
                    <div style={{ padding: '28px' }}>
                        {error && <div style={{ background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
                        {success && <div style={{ background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#16a34a', fontSize: '13px' }}>{success}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>MD NUMBER *</label>
                                <input name="md_no" value={form.md_no} onChange={handleMdNoChange} placeholder="787" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 4px rgba(37,99,235,0.1)' }}
                                    onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>TAILOR *</label>
                                <select name="tailor" value={form.tailor} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}
                                    onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 4px rgba(37,99,235,0.1)' }}
                                    onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none' }}>
                                    <option value="">Select Tailor</option>
                                    {tailors.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>RATE (AED) *</label>
                                <input name="rate" value={form.rate} onChange={handleChange} type="number" placeholder="70" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 4px rgba(37,99,235,0.1)' }}
                                    onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>WORK TYPE</label>
                                <select name="work_type" value={form.work_type} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    {workTypes.map(w => <option key={w} value={w}>{w.replace('_',' ').toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>NOTES</label>
                                <input name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes..." style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 4px rgba(37,99,235,0.1)' }}
                                    onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none' }} />
                            </div>
                        </div>

                        <button onClick={handleSubmit} disabled={loading}
                            style={{ background: loading ? 'rgba(37,99,235,0.15)' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: loading ? '#9ca3af' : '#ffffff', padding: '12px 32px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)' }}>
                            {loading ? 'SAVING...' : '+ ADD RATE'}
                        </button>
                    </div>
                </div>

                {/* Rate Sheet Table */}
                <div style={{ border: '1.5px solid rgba(37,99,235,0.12)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(37,99,235,0.07)' }}>
                    <div style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#2563eb', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>ALL RATES</span>
                        <span style={{ background: 'rgba(37,99,235,0.1)', border: '1.5px solid rgba(37,99,235,0.2)', color: '#2563eb', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{ratesheets.length}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#faf9ff', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
                                {['MD NO','TAILOR','RATE','WORK TYPE','NOTES','STATUS',''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '13px 16px', color: '#2563eb', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ratesheets.map((rs, idx) => (
                                <tr key={rs.id}
                                    style={{ background: idx % 2 === 0 ? '#ffffff' : '#faf9ff', borderBottom: '1px solid rgba(37,99,235,0.05)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#faf9ff')}>
                                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>{rs.md_no}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ background: 'rgba(37,99,235,0.08)', border: '1.5px solid rgba(37,99,235,0.2)', color: '#2563eb', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                                            {rs.tailor_code}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 700 }}>AED {rs.rate}</td>
                                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '12px' }}>{rs.work_type.replace('_',' ').toUpperCase()}</td>
                                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>{rs.notes || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ background: rs.is_active ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', border: `1.5px solid ${rs.is_active ? 'rgba(22,163,74,0.25)' : 'rgba(239,68,68,0.25)'}`, color: rs.is_active ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                            {rs.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button onClick={() => handleDelete(rs.id, rs.md_no)}
                                            style={{ background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ratesheets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#d1d5db', fontSize: '13px', letterSpacing: '1px' }}>
                            NO RATES CONFIGURED YET
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
