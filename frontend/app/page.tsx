'use client'
import { useEffect, useState } from 'react'
import { getSummary, Summary } from '@/lib/api'

const modules = [
  {
    href: '/job-invoice',
    label: 'Production',
    desc: 'Shop entry, order, payment and material issue management.',
    iconBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    iconColor: '#2563eb',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    href: '/tailors',
    label: 'Tailors',
    desc: 'Manage tailor profiles, codes, and contact information.',
    iconBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    iconColor: '#16a34a',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: '/stitching',
    label: 'Stitching',
    desc: 'Daily stitching work log with MD number auto-fill.',
    iconBg: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
    iconColor: '#d97706',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  {
    href: '/ratesheet',
    label: 'Rate Sheet',
    desc: 'Configure per-MD number rates that auto-fill in invoices.',
    iconBg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
    iconColor: '#0891b2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    href: '/report',
    label: 'Reports',
    desc: 'Monthly summaries, per-tailor balance, and PDF export.',
    iconBg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    iconColor: '#7c3aed',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
        <line x1="2"  y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
]

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    getSummary().then(r => setSummary(r.data)).catch(console.error)
  }, [])

  return (
    <main style={{ padding: '28px 24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        </div>

        {/* Stat cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Invoices', value: summary.total_invoices, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '#' },
              { label: 'Total Pieces',   value: summary.total_pieces,   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', icon: '◈' },
              { label: 'Total Amount',   value: `AED ${summary.total_amount}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'د.إ' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, margin: 0 }}>{s.label}</p>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: s.color, fontWeight: 700 }}>
                    {s.icon}
                  </div>
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Module cards — Zoho style */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 14px' }}>Modules</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            {modules.map(m => (
              <a key={m.href} href={m.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e8ecf0',
                  borderRadius: 10,
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = m.iconColor
                    el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.08)`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#e8ecf0'
                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.iconColor, marginBottom: 14 }}>
                    {m.icon}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5, flex: 1 }}>{m.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: m.iconColor }}>
                    Explore {m.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
