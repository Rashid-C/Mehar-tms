'use client'
import { useRouter } from 'next/navigation'
import { jobs } from './shared'

export default function JobInvoicePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen" style={{ padding: '24px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Production</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Job Invoice</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Select a category to view its details</p>
        </div>

        {/* Boxes — dashboard tile style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ gap: 12 }}>
          {jobs.map(j => (
            <button key={j.id} onClick={() => router.push(`/job-invoice/${j.id}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                padding: '16px 16px',
                borderRadius: 10,
                border: '1px solid #e8ecf0',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.borderColor = j.color
                ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${j.color}22`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#e8ecf0'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
              }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, background: `${j.color}14`,
              }}>
                {j.icon}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{j.label}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{j.desc}</span>
            </button>
          ))}
        </div>

      </div>
    </main>
  )
}
