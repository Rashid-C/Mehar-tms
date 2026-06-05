
'use client'
import { useEffect, useState } from 'react'
import { getInvoices, getTailors, getSummary, Invoice, Tailor, Summary } from '@/lib/api'

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterTailor, setFilterTailor] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = filterTailor ? { tailor: filterTailor } : {}
      const [invRes, tailorRes, sumRes] = await Promise.all([
        getInvoices(params),
        getTailors(),
        getSummary(params),
      ])
      setInvoices(invRes.data)
      setTailors(tailorRes.data)
      setSummary(sumRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterTailor])

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mehar Pardha</h1>
        <p className="text-gray-400 text-sm mt-1">Tailor Shop · Deira, Dubai</p>
      </div>
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-bold text-white mt-1">{summary.total_invoices}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Pieces</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{summary.total_pieces}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Amount</p>
            <p className="text-2xl font-bold text-green-400 mt-1">AED {summary.total_amount}</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex gap-3">
        <select
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          value={filterTailor}
          onChange={e => setFilterTailor(e.target.value)}
        >
          <option value="">All Tailors</option>
          {tailors.map(t => (
            <option key={t.id} value={t.code}>{t.code} - {t.name}</option>
          ))}
        </select>
        <a
          href="/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          + Add Invoice
        </a>
      </div>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-3 px-3">INV NO</th>
                <th className="text-left py-3 px-3">TAILOR</th>
                <th className="text-left py-3 px-3">MD NO</th>
                <th className="text-left py-3 px-3">DATE</th>
                <th className="text-left py-3 px-3">PC</th>
                <th className="text-left py-3 px-3">RATE</th>
                <th className="text-left py-3 px-3">AMOUNT</th>
                <th className="text-left py-3 px-3">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="py-3 px-3 font-mono text-blue-400">{inv.inv_no}</td>
                  <td className="py-3 px-3">
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs font-bold">{inv.tailor_code}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{inv.md_no}</td>
                  <td className="py-3 px-3 text-gray-300">{inv.rcv_date}</td>
                  <td className="py-3 px-3 text-gray-300">{inv.pc_count}</td>
                  <td className="py-3 px-3 text-gray-300">{inv.rate}</td>
                  <td className="py-3 px-3 font-bold text-green-400">AED {inv.amount}</td>
                  <td className="py-3 px-3 text-gray-400">{inv.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <p className="text-gray-500 text-center py-10">No invoices found</p>
          )}
        </div>
      )}
    </main>
  )
}
