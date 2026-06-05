'use client'
import { useEffect, useState } from 'react'
import { getInvoice, updateInvoice, deleteInvoice, getTailors, Invoice, Tailor } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import InvoiceForm, { InvoiceFormState } from '@/components/InvoiceForm'

export default function EditInvoice() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<InvoiceFormState>({
    tailor: '', inv_no: '', md_no: '', rcv_date: '',
    pc_count: '', rate: '', remarks: '', is_return: false,
  })

  useEffect(() => {
    Promise.all([getInvoice(id), getTailors()]).then(([invRes, tailorRes]) => {
      const inv: Invoice = invRes.data
      setForm({
        tailor: String(inv.tailor),
        inv_no: String(inv.inv_no),
        md_no: inv.md_no,
        rcv_date: inv.rcv_date,
        pc_count: String(inv.pc_count),
        rate: String(inv.rate),
        remarks: inv.remarks,
        is_return: inv.is_return,
      })
      setTailors(tailorRes.data)
      setFetching(false)
    })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    setForm(prev => ({ ...prev, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  }

  const handleUpdate = async () => {
    setError('')
    if (!form.tailor || !form.inv_no || !form.md_no || !form.rcv_date || !form.pc_count || !form.rate) {
      setError('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await updateInvoice(id, {
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

  const handleDelete = async () => {
    if (!confirm(`Delete Invoice #${form.inv_no}? This cannot be undone.`)) return
    setLoading(true)
    try {
      await deleteInvoice(id)
      router.push('/')
    } catch {
      setError('Failed to delete invoice')
      setLoading(false)
    }
  }

  if (fetching) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
      <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="spinner" />
        <span className="text-sm tracking-widest">LOADING INVOICE...</span>
      </div>
    </main>
  )

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
        <PageHeader title={`Edit Invoice #${form.inv_no}`} subtitle="MODIFY DETAILS BELOW" />
        <InvoiceForm
          form={form} tailors={tailors} loading={loading}
          error={error} mode="edit" onChange={handleChange}
          onSubmit={handleUpdate} onDelete={handleDelete}
        />
      </div>
    </main>
  )
}
