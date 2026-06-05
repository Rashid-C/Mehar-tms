'use client'
import { Tailor } from '@/lib/api'
import Alert from '@/components/ui/Alert'
import FormField from '@/components/ui/FormField'

export interface InvoiceFormState {
  tailor: string
  inv_no: string
  md_no: string
  rcv_date: string
  pc_count: string
  rate: string
  remarks: string
  is_return: boolean
}

interface InvoiceFormProps {
  form: InvoiceFormState
  tailors: Tailor[]
  loading: boolean
  error: string
  mode: 'add' | 'edit'
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onSubmit: () => void
  onDelete?: () => void
}

export default function InvoiceForm({
  form, tailors, loading, error, mode, onChange, onSubmit, onDelete,
}: InvoiceFormProps) {
  const autoAmount =
    form.pc_count && form.rate
      ? (parseFloat(form.pc_count) * parseFloat(form.rate)).toFixed(2)
      : null

  return (
    <div>
      <Alert type="error" message={error} />

      <div className="card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ width: 8, height: 8, background: '#D4AF37', borderRadius: '50%' }} />
          <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '2px' }}>
            INVOICE DETAILS
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-5">

          {/* Tailor */}
          <FormField label="TAILOR" required>
            <select name="tailor" value={form.tailor} onChange={onChange} className="field">
              <option value="">Select Tailor</option>
              {tailors.map(t => (
                <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
              ))}
            </select>
          </FormField>

          {/* Invoice No + MD No */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="INVOICE NO" required>
              <input name="inv_no" value={form.inv_no} onChange={onChange}
                type="number" placeholder="1166" className="field" />
            </FormField>
            <FormField label="MD NO" required>
              <input name="md_no" value={form.md_no} onChange={onChange}
                type="text" placeholder="787" className="field" />
            </FormField>
          </div>

          {/* Receive Date */}
          <FormField label="RECEIVE DATE" required>
            <input name="rcv_date" value={form.rcv_date} onChange={onChange}
              type="date" className="field" />
          </FormField>

          {/* Pieces + Rate */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="PIECES" required>
              <input name="pc_count" value={form.pc_count} onChange={onChange}
                type="number" placeholder="11" className="field" />
            </FormField>
            <FormField label="RATE (AED)" required>
              <input name="rate" value={form.rate} onChange={onChange}
                type="number" placeholder="70" className="field" />
            </FormField>
          </div>

          {/* Auto amount */}
          {autoAmount && (
            <div className="flex items-center justify-between rounded-xl px-5 py-4"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px' }}>CALCULATED AMOUNT</p>
                <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>AED {autoAmount}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(212,175,55,0.12)' }}>
                <span style={{ color: '#D4AF37', fontSize: 18 }}>✓</span>
              </div>
            </div>
          )}

          {/* Remarks */}
          <FormField label="REMARKS">
            <textarea name="remarks" value={form.remarks} onChange={onChange}
              placeholder="RTN, special notes..."
              className="field resize-none" style={{ height: 80 }} />
          </FormField>

          {/* Return toggle */}
          <div
            onClick={() => onChange({ target: { name: 'is_return', type: 'checkbox', checked: !form.is_return } } as React.ChangeEvent<HTMLInputElement>)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer select-none transition-all"
            style={{
              background: form.is_return ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${form.is_return ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="flex items-center justify-center flex-shrink-0 rounded transition-all"
              style={{ width: 20, height: 20, border: `2px solid ${form.is_return ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`, background: form.is_return ? '#D4AF37' : 'transparent' }}>
              {form.is_return && <span style={{ color: '#08080f', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: form.is_return ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}>Mark as Return (RTN)</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Flag this invoice as a return delivery</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onSubmit} disabled={loading} className="btn-gold flex-1">
              {loading ? <><span className="spinner" /> {mode === 'add' ? 'SAVING...' : 'UPDATING...'}</> : mode === 'add' ? 'SAVE INVOICE' : 'UPDATE INVOICE'}
            </button>
            {mode === 'edit' && onDelete && (
              <button onClick={onDelete} disabled={loading} className="btn-danger">
                Delete
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
