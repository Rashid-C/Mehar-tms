'use client'
import { useEffect, useState } from 'react'
import { getTailors, Tailor } from '@/lib/api'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function Tailors() {
  const router = useRouter()
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', code: '', phone: '' })

  const fetchTailors = async () => {
    const res = await getTailors()
    setTailors(res.data)
  }

  useEffect(() => {
    fetchTailors()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!form.name || !form.code) {
      setError('Name and Code are required')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tailors/`, form)
      setSuccess(`Tailor ${form.code} added successfully`)
      setForm({ name: '', code: '', phone: '' })
      fetchTailors()
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

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm">← Back</a>
          <h1 className="text-2xl font-bold">Manage Tailors</h1>
        </div>

        {/* Add Tailor Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Tailor</h2>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Muhammad Javed"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Code *</label>
                <input name="code" value={form.code} onChange={handleChange}
                  placeholder="MJ"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white uppercase" />
              </div>
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+971 50 000 0000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-3 rounded-lg font-medium">
              {loading ? 'Adding...' : 'Add Tailor'}
            </button>
          </div>
        </div>

        {/* Tailors List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">All Tailors</h2>
          <div className="space-y-3">
            {tailors.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs font-bold">{t.code}</span>
                  <span className="text-white">{t.name}</span>
                </div>
                <span className="text-gray-400 text-sm">{t.phone || 'No phone'}</span>
              </div>
            ))}
            {tailors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No tailors yet</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}