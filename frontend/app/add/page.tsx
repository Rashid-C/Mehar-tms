'use client'
import { useEffect, useState } from 'react'
import { getTailors, createInvoice, Tailor, lookupRateSheet } from '@/lib/api'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import InvoiceForm, { InvoiceFormState } from '@/components/InvoiceForm'

const EMPTY: InvoiceFormState = {
  tailor: '', inv_no: '', md_no: '', rcv_date: '',
  pc_count: '', rate: '', remarks: '', is_return: false,
}

export default function AddInvoice() {
  const router = useRouter()
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<InvoiceFormState>(EMPTY)

  useEffect(() => { getTailors().then(r => setTailors(r.data)) }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    setForm(prev => ({ ...prev, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
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
    if (!form.tailor || !form.inv_no || !form.md_no || !form.rcv_date || !form.pc_count || !form.rate) {
      setError('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await createInvoice({
        tailor: parseInt(form.tailor),
        inv_no: parseInt(form.inv_no),
        md_no: form.md_no,
        rcv_date: form.rcv_date,
        pc_count: parseInt(form.pc_count),
        rate: parseFloat(form.rate),
        remarks: form.remarks,
        is_return: form.is_return,
      })
      router.push('/')
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
        <PageHeader title="New Invoice" subtitle="FILL IN THE DETAILS — AMOUNT IS AUTO-CALCULATED" />
   <InvoiceForm
          form={form} tailors={tailors} loading={loading}
          error={error} mode="add" onChange={handleChange}
          onMdNoChange={handleMdNoChange}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}
