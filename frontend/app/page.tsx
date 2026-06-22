'use client'
import { useEffect, useState } from 'react'
import { getSummary, Summary } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'

const actions = [
  {
    href: '/job-invoice',
    icon: '✦',
    title: 'Job Invoice',
    desc: 'Shop entry · Order · Payment',
    accent: '#4f46e5',
    rgb: '79,70,229',
    gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
  },
  {
    href: '/report',
    icon: '↓',
    title: 'Reports',
    desc: 'Monthly PDF · per-tailor summary',
    accent: '#0891b2',
    rgb: '8,145,178',
    gradient: 'linear-gradient(135deg,#0891b2,#0e7490)',
  },
  {
    href: '/tailors',
    icon: '人',
    title: 'Tailors',
    desc: 'Manage tailor list',
    accent: '#16a34a',
    rgb: '22,163,74',
    gradient: 'linear-gradient(135deg,#16a34a,#15803d)',
  },
  {
    href: '/stitching',
    icon: '⌀',
    title: 'Stitching',
    desc: 'Shop stitching records',
    accent: '#d97706',
    rgb: '217,119,6',
    gradient: 'linear-gradient(135deg,#d97706,#b45309)',
  },
  {
    href: '/ratesheet',
    icon: '₌',
    title: 'Rate Sheet',
    desc: 'MD number rate configuration',
    accent: '#7c3aed',
    rgb: '124,58,237',
    gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
  },
]

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    getSummary().then(r => setSummary(r.data)).catch(console.error)
  }, [])

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        <PageHeader title="Dashboard" subtitle="MEHAR PARDHA — TAILOR MANAGEMENT" />

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="TOTAL INVOICES" value={summary.total_invoices} color="dark" />
            <StatCard label="TOTAL PIECES"   value={summary.total_pieces}   color="blue" />
            <StatCard label="TOTAL AMOUNT"   value={`AED ${summary.total_amount}`} color="blue" />
          </div>
        )}

        {/* Quick-action grid */}
        <p className="text-[11px] font-bold tracking-widest mb-4" style={{ color: '#a5b4fc', letterSpacing: '2.5px' }}>QUICK ACCESS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(a => (
            <a
              key={a.href}
              href={a.href}
              className="card p-5 flex items-center gap-4 no-underline transition-all group"
              style={{ textDecoration: 'none', border: `1.5px solid rgba(${a.rgb},0.15)` }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = `0 12px 32px rgba(${a.rgb},0.18)`
                el.style.borderColor = `rgba(${a.rgb},0.35)`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 2px 12px rgba(79,70,229,0.07)'
                el.style.borderColor = `rgba(${a.rgb},0.15)`
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: a.gradient, color: '#ffffff', boxShadow: `0 4px 14px rgba(${a.rgb},0.35)` }}
              >
                {a.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: '#1e1b4b' }}>{a.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>{a.desc}</p>
              </div>
              <span className="ml-auto text-lg shrink-0" style={{ color: `rgba(${a.rgb},0.4)` }}>→</span>
            </a>
          ))}
        </div>

      </div>
    </main>
  )
}
