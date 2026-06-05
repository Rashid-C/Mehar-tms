'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getInvoices, getTailors, getSummary, Invoice, Tailor, Summary } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'

export default function Home() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterTailor, setFilterTailor] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterTailor ? { tailor: filterTailor } : {}
      const [invRes, tailorRes, sumRes] = await Promise.all([
        getInvoices(params),
        getTailors(),
        getSummary(params),
      ])
      setInvoices(invRes.data)
      setTailors(tailorRes.data)
      setSummary(sumRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterTailor])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-7xl mx-auto">

        <PageHeader title="Dashboard" subtitle="INVOICE OVERVIEW — ALL RECORDS" />

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="TOTAL INVOICES" value={summary.total_invoices} color="white" glow="gold" />
            <StatCard label="TOTAL PIECES" value={summary.total_pieces} color="blue" />
            <StatCard label="TOTAL AMOUNT" value={`AED ${summary.total_amount}`} color="gold" glow="gold" />
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            className="field flex-1 min-w-40 max-w-60"
            value={filterTailor}
            onChange={e => setFilterTailor(e.target.value)}
          >
            <option value="">All Tailors</option>
            {tailors.map(t => (
              <option key={t.id} value={t.code}>{t.code} — {t.name}</option>
            ))}
          </select>
          <a href="/add" className="btn-gold">+ New Invoice</a>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span className="spinner" />
            <span className="text-sm tracking-widest">LOADING...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-sm tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            NO INVOICES FOUND
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#0f0f1a,#111120)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                    {['INV NO', 'TAILOR', 'MD NO', 'DATE', 'PC', 'RATE', 'AMOUNT', 'REMARKS'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/invoice/${inv.id}`)}
                      className="cursor-pointer transition-colors"
                      style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#08080f' : '#0a0a12')}
                    >
                      <td className="px-4 py-3.5 font-mono font-semibold" style={{ color: '#D4AF37' }}>{inv.inv_no}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>{inv.tailor_code}</span>
                      </td>
                      <td className="px-4 py-3.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{inv.md_no}</td>
                      <td className="px-4 py-3.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{inv.rcv_date}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{inv.pc_count}</td>
                      <td className="px-4 py-3.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{inv.rate}</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#4ade80' }}>AED {inv.amount}</td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{inv.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden flex flex-col gap-3">
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoice/${inv.id}`)}
                  className="card p-4 cursor-pointer active:opacity-80 transition-opacity"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono font-bold text-base" style={{ color: '#D4AF37' }}>#{inv.inv_no}</span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>{inv.tailor_code}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: '#4ade80' }}>AED {inv.amount}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <div><span className="block" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '1px' }}>MD NO</span>{inv.md_no}</div>
                    <div><span className="block" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '1px' }}>DATE</span>{inv.rcv_date}</div>
                    <div><span className="block" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '1px' }}>PC × RATE</span>{inv.pc_count} × {inv.rate}</div>
                  </div>
                  {inv.remarks && <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{inv.remarks}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
