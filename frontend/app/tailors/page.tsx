'use client'
import { useEffect, useState } from 'react'
import api, { getTailors, Tailor } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import FormField from '@/components/ui/FormField'

export default function Tailors() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', code: '', phone: '' })

  const fetchTailors = () => getTailors().then(r => setTailors(r.data))
  useEffect(() => { fetchTailors() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.name || !form.code) { setError('Name and Code are required'); return }
    setLoading(true)
    try {
      await api.post('/tailors/', form)
      setSuccess(`Tailor "${form.code}" added successfully`)
      setForm({ name: '', code: '', phone: '' })
      fetchTailors()
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } }
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a href="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4AF37')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            ← Back
          </a>
        </div>

        <PageHeader title="Manage Tailors" subtitle="ADD AND VIEW TAILORS" />

        {/* Add Form */}
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ width: 8, height: 8, background: '#D4AF37', borderRadius: '50%' }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '2px' }}>ADD NEW TAILOR</span>
          </div>
          <div className="p-5 sm:p-7 space-y-5">
            <Alert type="error" message={error} />
            <Alert type="success" message={success} />

            <FormField label="FULL NAME" required>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Muhammad Javed" className="field" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="CODE" required>
                <input name="code" value={form.code} onChange={handleChange}
                  placeholder="MJ" className="field uppercase" />
              </FormField>
              <FormField label="PHONE">
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+971 50 000 0000" className="field" />
              </FormField>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn-gold w-full">
              {loading ? <><span className="spinner" /> ADDING...</> : '+ ADD TAILOR'}
            </button>
          </div>
        </div>

        {/* Tailor list */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ width: 8, height: 8, background: '#D4AF37', borderRadius: '50%' }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '2px' }}>ALL TAILORS</span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>{tailors.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {tailors.length === 0 ? (
              <p className="text-center py-10 text-sm tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>NO TAILORS YET</p>
            ) : tailors.map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                    {t.code}
                  </span>
                  <span className="text-sm font-medium text-white">{t.name}</span>
                </div>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.phone || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
