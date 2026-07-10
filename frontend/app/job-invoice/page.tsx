'use client'
import { useEffect, useState } from 'react'
import { getTailors, Tailor } from '@/lib/api'
import { JobType } from './shared'
import ShopTab from './components/ShopTab'
import OrderTab from './components/OrderTab'
import PaymentTab from './components/PaymentTab'
import MatTab from './components/MatTab'

const jobs = [
  { id: 'shop'    as JobType, label: 'Shop',      color: '#2563eb' },
  { id: 'order'   as JobType, label: 'Order',     color: '#0891b2' },
  { id: 'payment' as JobType, label: 'Payment',   color: '#16a34a' },
  { id: 'mat'     as JobType, label: 'Mat Issue', color: '#d97706' },
]

export default function JobInvoicePage() {
  const [activeJob, setActiveJob] = useState<JobType>('shop')
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getTailors({ page_size: 1000 }).then(r => setTailors(r.data.results))
  }, [])

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3500) }
  const fail   = (msg: string) => { setError(msg); setSuccess('') }

  const onTailorCreated = (t: Tailor) => setTailors(prev => [...prev, t])
  const onTailorUpdated = (t: Tailor) => setTailors(prev => prev.map(x => x.id === t.id ? t : x))

  return (
    <main className="min-h-screen" style={{ padding: '24px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Production</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Job Invoice</h1>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Tabs — Zoho underline style */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e8ecf0', marginBottom: 20, gap: 0 }}>
          {jobs.map(j => (
            <button key={j.id} onClick={() => { setActiveJob(j.id); setError('') }}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: activeJob === j.id ? 600 : 400,
                color: activeJob === j.id ? j.color : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeJob === j.id ? `2px solid ${j.color}` : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}>
              {j.label}
            </button>
          ))}
        </div>

        {activeJob === 'shop' && (
          <ShopTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}
        {activeJob === 'order' && (
          <OrderTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}
        {activeJob === 'payment' && (
          <PaymentTab tailors={tailors} onTailorUpdated={onTailorUpdated} notify={notify} fail={fail} />
        )}
        {activeJob === 'mat' && (
          <MatTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}

      </div>
    </main>
  )
}
