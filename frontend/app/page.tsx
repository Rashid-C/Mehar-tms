'use client'
import { useEffect, useState } from 'react'
import { getSummary, Summary } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'

const actions = [
  {
    href: '/job-invoice',
    icon: '+',
    title: 'Job Invoice',
    desc: 'Shop entry · Order · Payment',
    iconBg: 'linear-gradient(135deg,#D4AF37,#B8962E)',
    iconColor: '#08080f',
    borderColor: 'rgba(212,175,55,0.35)',
    titleColor: '#D4AF37',
  },
  {
    href: '/add',
    icon: '✦',
    title: 'New Invoice',
    desc: 'Create a standard invoice',
    iconBg: 'rgba(212,175,55,0.1)',
    iconColor: '#D4AF37',
    borderColor: 'rgba(212,175,55,0.15)',
    titleColor: 'rgba(255,255,255,0.85)',
  },
  {
    href: '/report',
    icon: '↓',
    title: 'Reports',
    desc: 'Monthly PDF · per-tailor summary',
    iconBg: 'rgba(96,165,250,0.1)',
    iconColor: '#60a5fa',
    borderColor: 'rgba(96,165,250,0.2)',
    titleColor: '#60a5fa',
  },
  {
    href: '/tailors',
    icon: '人',
    title: 'Tailors',
    desc: 'Manage tailor list',
    iconBg: 'rgba(74,222,128,0.08)',
    iconColor: '#4ade80',
    borderColor: 'rgba(74,222,128,0.15)',
    titleColor: '#4ade80',
  },
  {
    href: '/stitching',
    icon: '⌀',
    title: 'Stitching',
    desc: 'Shop stitching records',
    iconBg: 'rgba(251,191,36,0.08)',
    iconColor: '#fbbf24',
    borderColor: 'rgba(251,191,36,0.15)',
    titleColor: '#fbbf24',
  },
  {
    href: '/orders',
    icon: '◈',
    title: 'Orders',
    desc: 'Ready-made order tracking',
    iconBg: 'rgba(167,139,250,0.08)',
    iconColor: '#a78bfa',
    borderColor: 'rgba(167,139,250,0.15)',
    titleColor: '#a78bfa',
  },
]

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    getSummary().then(r => setSummary(r.data)).catch(console.error)
  }, [])

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto">

        <PageHeader title="Dashboard" subtitle="MEHAR PARDHA — TAILOR MANAGEMENT" />

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="TOTAL INVOICES" value={summary.total_invoices} color="white" glow="gold" />
            <StatCard label="TOTAL PIECES"   value={summary.total_pieces}   color="blue" />
            <StatCard label="TOTAL AMOUNT"   value={`AED ${summary.total_amount}`} color="gold" glow="gold" />
          </div>
        )}

        {/* Quick-action grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(a => (
            <a
              key={a.href}
              href={a.href}
              className="card p-5 flex items-start gap-4 no-underline transition-all"
              style={{ border: `1px solid ${a.borderColor}`, textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4)` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: a.iconBg, color: a.iconColor, border: `1px solid ${a.borderColor}` }}
              >
                {a.icon}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: a.titleColor }}>{a.title}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.desc}</p>
              </div>
            </a>
          ))}
        </div>

      </div>
    </main>
  )
}
