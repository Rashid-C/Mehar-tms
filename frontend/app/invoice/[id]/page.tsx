'use client'
import { useEffect, useState } from 'react'
import { getInvoice, updateInvoice, deleteInvoice, getTailors, Invoice, Tailor } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'

export default function EditInvoice() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tailor: '',
    inv_no: '',
    md_no: '',
    rcv_date: '',
    pc_count: '',
    rate: '',
    remarks: '',
    is_return: false,
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
    setForm(prev => ({
      ...prev,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }))
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
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: unknown } }
        setError(JSON.stringify(axiosErr.response?.data))
      } else {
        setError('Something went wrong')
      }
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
    <main className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
      <p className="text-gray-400">Loading invoice...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm">← Back</a>
          <h1 className="text-2xl font-bold">Edit Invoice #{form.inv_no}</h1>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Tailor *</label>
            <select name="tailor" value={form.tailor} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
              <option value="">Select Tailor</option>
              {tailors.map(t => (
                <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Invoice No *</label>
              <input name="inv_no" value={form.inv_no} onChange={handleChange} type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">MD No *</label>
              <input name="md_no" value={form.md_no} onChange={handleChange} type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Receive Date *</label>
            <input name="rcv_date" value={form.rcv_date} onChange={handleChange} type="date"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Pieces *</label>
              <input name="pc_count" value={form.pc_count} onChange={handleChange} type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Rate *</label>
              <input name="rate" value={form.rate} onChange={handleChange} type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            </div>
          </div>

          {form.pc_count && form.rate && (
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Amount (auto)</p>
              <p className="text-green-400 text-xl font-bold mt-1">
                AED {(parseInt(form.pc_count) * parseFloat(form.rate)).toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white h-20" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_return" checked={form.is_return}
              onChange={handleChange} id="is_return" className="w-4 h-4" />
            <label htmlFor="is_return" className="text-gray-300 text-sm">Mark as Return (RTN)</label>
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={handleUpdate} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-3 rounded-lg font-medium">
              {loading ? 'Saving...' : 'Update Invoice'}
            </button>
            <button onClick={handleDelete} disabled={loading}
              className="bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white px-6 py-3 rounded-lg font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}