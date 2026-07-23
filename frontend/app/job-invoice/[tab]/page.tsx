'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTailors, Tailor } from '@/lib/api'
import { jobs, JobType } from '../shared'
import ShopTab from '../components/ShopTab'
import OrderTab from '../components/OrderTab'
import PaymentTab from '../components/PaymentTab'
import MatTab from '../components/MatTab'
import StitchingContent from '../../stitching/StitchingContent'

export default function JobInvoiceTabPage() {
  const router = useRouter()
  const params = useParams()
  const tab = params.tab as string
  const job = jobs.find(j => j.id === tab)

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

  if (!job) {
    return (
      <main className="min-h-screen" style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Unknown category.</p>
          <button onClick={() => router.push('/job-invoice')} className="btn-ghost" style={{ marginTop: 12 }}>← Back to Job Invoice</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ padding: '24px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: 20, gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>
              Home · Production · <button onClick={() => router.push('/job-invoice')} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>Job Invoice</button> · {job.label}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{job.icon}</span> {job.label}
            </h1>
          </div>
          <button onClick={() => router.push('/job-invoice')} className="btn-ghost" style={{ fontWeight: 700 }}>← Back</button>
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

        {(job.id as JobType) === 'shop' && (
          <ShopTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}
        {(job.id as JobType) === 'order' && (
          <OrderTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}
        {(job.id as JobType) === 'payment' && (
          <PaymentTab tailors={tailors} onTailorUpdated={onTailorUpdated} notify={notify} fail={fail} />
        )}
        {(job.id as JobType) === 'mat' && (
          <MatTab tailors={tailors} onTailorCreated={onTailorCreated} notify={notify} fail={fail} />
        )}
        {(job.id as JobType) === 'stitching' && (
          <StitchingContent />
        )}

      </div>
    </main>
  )
}
