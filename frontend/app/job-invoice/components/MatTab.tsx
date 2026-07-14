'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  getMaterialIssues, createMaterialIssue, updateMaterialIssue, deleteMaterialIssue, MaterialIssue,
  Tailor,
} from '@/lib/api'
import { lbl, today } from '../shared'
import TailorSelector from '@/components/TailorSelector'
import RowActions from '@/components/RowActions'

export default function MatTab({ tailors, onTailorCreated, notify, fail }: {
  tailors: Tailor[]
  onTailorCreated: (t: Tailor) => void
  notify: (msg: string) => void
  fail: (msg: string) => void
}) {
  const [matRecords, setMatRecords] = useState<MaterialIssue[]>([])
  const [loadingMat, setLoadingMat] = useState(false)
  const [isEditingMat, setIsEditingMat] = useState(false)
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [matTailor, setMatTailor] = useState<number | ''>('')
  const [matDate, setMatDate] = useState(today())
  const [matDescription, setMatDescription] = useState('')
  const [matAmount, setMatAmount] = useState('')
  const [matRemarks, setMatRemarks] = useState('')
  const [matDayFilter, setMatDayFilter] = useState('')
  const [matSearch, setMatSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const loadMat = useCallback(async () => {
    setLoadingMat(true)
    try { const res = await getMaterialIssues(); setMatRecords(res.data) }
    finally { setLoadingMat(false) }
  }, [])

  useEffect(() => { loadMat() }, [loadMat])

  const resetMatForm = () => {
    setMatTailor(''); setMatDate(today()); setMatDescription(''); setMatAmount(''); setMatRemarks('')
    setIsEditingMat(false); setEditMatId(null)
  }

  const openEditMat = (m: MaterialIssue) => {
    setMatTailor(m.tailor); setMatDate(m.date); setMatDescription(m.description || '')
    setMatAmount(String(m.amount)); setMatRemarks(m.remarks || '')
    setIsEditingMat(true); setEditMatId(m.id)
  }

  const handleMatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matTailor) { fail('Please select a tailor'); return }
    setSaving(true)
    try {
      const payload = { tailor: matTailor, date: matDate, description: matDescription, amount: parseFloat(matAmount), remarks: matRemarks }
      if (isEditingMat && editMatId) { await updateMaterialIssue(editMatId, payload); notify('Material issue updated') }
      else { await createMaterialIssue(payload); notify('Material issue saved') }
      resetMatForm(); await loadMat()
    } catch { fail('Failed to save material issue') } finally { setSaving(false) }
  }

  const handleDeleteMat = async (id: number) => {
    if (!confirm('Delete this material issue?')) return
    try { await deleteMaterialIssue(id); await loadMat() } catch { fail('Failed to delete') }
  }

  const filteredMats = matRecords.filter(m => {
    if (matDayFilter && m.date !== matDayFilter) return false
    if (matSearch) {
      const q = matSearch.toLowerCase()
      return m.tailor_code.toLowerCase().includes(q) || m.tailor_name.toLowerCase().includes(q) ||
             m.date.includes(q) || (m.description || '').toLowerCase().includes(q) ||
             (m.remarks || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
        <span className="badge badge-amber" style={{ flexShrink: 0 }}>{filteredMats.length}</span>
        <input className="field" style={{ padding: '7px 12px', flex: '1 1 160px', minWidth: 0, fontSize: 13 }}
          placeholder="Search Tailor, Description, Date…"
          value={matSearch} onChange={e => setMatSearch(e.target.value)}
          disabled={!!matDayFilter} />
        <input type="date" value={matDayFilter} onChange={e => { setMatDayFilter(e.target.value); setMatSearch('') }}
          className="field" style={{ width: 'auto', padding: '7px 12px', fontSize: 13, flex: '0 0 auto' }} />
        {matDayFilter && filteredMats.length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: '#e8ecf0', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', flexShrink: 0 }}>
              AED {filteredMats.reduce((s, m) => s + parseFloat(String(m.amount)), 0).toFixed(2)}
            </span>
            <button onClick={() => setMatDayFilter('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>✕</button>
          </>
        )}
        {matDayFilter && filteredMats.length === 0 && (
          <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>No records</span>
        )}
      </div>

      {/* 30/70 split */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left: Form */}
        <div style={{ width: '30%', flexShrink: 0 }}>
          <div className="card" style={{ position: 'sticky', top: '88px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{isEditingMat ? 'Edit Mat Issue' : 'New Mat Issue'}</span>
              {isEditingMat && (
                <button type="button" onClick={resetMatForm} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Cancel</button>
              )}
            </div>
            <form onSubmit={handleMatSubmit} className="flex flex-col gap-4 p-5">
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Date</label>
                <input type="date" className="field" value={matDate} onChange={e => setMatDate(e.target.value)} required />
              </div>
              <TailorSelector tailors={tailors} value={matTailor} onChange={v => setMatTailor(v)}
                onTailorCreated={onTailorCreated} onError={fail} />
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input className="field" value={matDescription} onChange={e => setMatDescription(e.target.value)} placeholder="e.g. Fabric, Thread, Buttons…" />
              </div>
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Amount (AED)</label>
                <input type="number" min="0" step="0.01" className="field" value={matAmount}
                  onChange={e => setMatAmount(e.target.value)} placeholder="0.00" required />
              </div>
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input className="field" value={matRemarks} onChange={e => setMatRemarks(e.target.value)} placeholder="Notes…" />
              </div>
              <button type="submit" disabled={saving} className="btn-gold" style={{ width: '100%', background: '#d97706' }}>
                {saving ? 'Saving…' : isEditingMat ? 'Update Issue' : 'Save Issue'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loadingMat ? (
            <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af' }}>Loading…</div>
          ) : filteredMats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              {matDayFilter ? 'No records for this date.' : 'No material issues yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: 'rgba(217,119,6,0.04)', borderBottom: '1.5px solid rgba(217,119,6,0.10)' }}>
                    {['DATE', 'TAILOR', 'DESCRIPTION', 'AMOUNT', 'REMARKS', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold tracking-widest"
                        style={{ color: '#94a3b8', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMats.map((m, idx) => (
                    <tr key={m.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fffbf0', borderBottom: '1px solid #f1f5f9' }}>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#64748b' }}>{m.date}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                          {m.tailor_code}
                        </span>
                        <span className="ml-2 text-xs" style={{ color: '#64748b' }}>{m.tailor_name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#475569' }}>{m.description || '—'}</td>
                      <td className="px-3 py-2.5 text-xs font-bold" style={{ color: '#d97706' }}>AED {m.amount}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#94a3b8' }}>{m.remarks || '—'}</td>
                      <td className="px-3 py-2.5">
                        <RowActions onEdit={() => openEditMat(m)} onDelete={() => handleDeleteMat(m.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(217,119,6,0.04)', borderTop: '1px solid rgba(217,119,6,0.15)' }}>
                    <td colSpan={3} className="px-3 py-2.5 text-[11px] font-bold tracking-widest" style={{ color: '#d97706' }}>TOTAL</td>
                    <td className="px-3 py-2.5 text-xs font-bold" style={{ color: '#d97706' }}>
                      AED {filteredMats.reduce((s, m) => s + parseFloat(String(m.amount)), 0).toFixed(2)}
                    </td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
