'use client'
import { useCallback, useEffect, useState } from 'react'
import { getInvoices, getSummary, getTailors, getTailorJobSummary, Invoice, Tailor, TailorJobSummary } from '@/lib/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Report() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [jobSummary, setJobSummary] = useState<TailorJobSummary[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedTailor, setSelectedTailor] = useState('')
  const [loading, setLoading] = useState(true)
  const [totalPieces, setTotalPieces] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { month: selectedMonth }
      if (selectedTailor) params.tailor = selectedTailor
      const [invRes, sumRes, tailorRes, jobRes] = await Promise.all([
        getInvoices(params), getSummary(params), getTailors(),
        getTailorJobSummary({ month: selectedMonth }),
      ])
      setInvoices(invRes.data)
      setTotalPieces(sumRes.data.total_pieces)
      setTotalAmount(sumRes.data.total_amount)
      setTailors(tailorRes.data)
      setJobSummary(selectedTailor ? jobRes.data.filter(r => r.tailor_code === selectedTailor) : jobRes.data)
    } finally { setLoading(false) }
  }, [selectedMonth, selectedTailor])

  useEffect(() => { fetchReport() }, [fetchReport])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(79,70,229); doc.rect(0,0,W,28,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(79,70,229); doc.setFontSize(13); doc.setFont('helvetica','bold')
    doc.text(`MONTHLY REPORT — ${MONTHS[selectedMonth-1].toUpperCase()} 2026`, W/2, 38, {align:'center'})
    if (selectedTailor) {
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal')
      doc.text(`Tailor: ${selectedTailor}`, W/2, 46, {align:'center'})
    }
    const boxY=52, boxH=16, boxW=55, gap=8, startX=(W-(boxW*3+gap*2))/2
    doc.setDrawColor(79,70,229); doc.setLineWidth(0.3)
    const boxes = [
      {label:'TOTAL INVOICES', value:String(invoices.length), color:[30,27,75] as [number,number,number]},
      {label:'TOTAL PIECES', value:String(totalPieces), color:[79,70,229] as [number,number,number]},
      {label:'TOTAL AMOUNT', value:`AED ${totalAmount}`, color:[79,70,229] as [number,number,number]},
    ]
    boxes.forEach((b,i) => {
      const x = startX+i*(boxW+gap)
      doc.setFillColor(245,243,255); doc.roundedRect(x,boxY,boxW,boxH,2,2,'FD')
      doc.setTextColor(165,180,252); doc.setFontSize(7); doc.setFont('helvetica','normal')
      doc.text(b.label, x+boxW/2, boxY+5, {align:'center'})
      doc.setTextColor(b.color[0],b.color[1],b.color[2]); doc.setFontSize(10); doc.setFont('helvetica','bold')
      doc.text(b.value, x+boxW/2, boxY+13, {align:'center'})
    })
    autoTable(doc, {
      startY: 76,
      head:[['INV NO','TAILOR','MD NO','DATE','PC','RATE','AMOUNT','REMARKS']],
      body: invoices.map(inv=>[inv.inv_no,inv.tailor_code,inv.md_no,inv.rcv_date,inv.pc_count,inv.rate,`AED ${inv.amount}`,inv.remarks||'—']),
      foot:[['TOTAL','','','',totalPieces,'',`AED ${totalAmount}`,'']],
      headStyles:{fillColor:[79,70,229],textColor:[255,255,255],fontStyle:'bold',fontSize:8},
      bodyStyles:{fillColor:[255,255,255],textColor:[30,27,75],fontSize:8},
      alternateRowStyles:{fillColor:[245,243,255]},
      footStyles:{fillColor:[237,233,254],textColor:[79,70,229],fontStyle:'bold',fontSize:9},
      styles:{lineColor:[221,214,254],lineWidth:0.2},
    })
    const finalY = (doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10
    doc.setTextColor(165,180,252); doc.setFontSize(7)
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, finalY, {align:'center'})
    doc.save(`Mehar-Pardha-${MONTHS[selectedMonth-1]}-2026.pdf`)
  }

  const downloadInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(79,70,229); doc.rect(0,0,W,28,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(79,70,229); doc.setFontSize(14); doc.setFont('helvetica','bold')
    doc.text(`INVOICE #${inv.inv_no}`, W/2, 40, {align:'center'})
    doc.setDrawColor(79,70,229); doc.setLineWidth(0.3); doc.line(14,45,W-14,45)
    let y=58
    const details:[string,string][] = [['Tailor Code',inv.tailor_code],['Tailor Name',inv.tailor_name],['MD Number',inv.md_no],['Receive Date',inv.rcv_date],['Pieces',String(inv.pc_count)],['Rate (AED)',String(inv.rate)],['Remarks',inv.remarks||'—']]
    details.forEach(([label,value]) => {
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text(label,20,y)
      doc.setTextColor(30,27,75); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(value,90,y)
      y+=10
    })
    doc.setFillColor(237,233,254); doc.setDrawColor(79,70,229); doc.setLineWidth(0.5)
    doc.roundedRect(14,y+5,W-28,24,3,3,'FD')
    doc.setTextColor(165,180,252); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text('TOTAL AMOUNT', W/2, y+15, {align:'center'})
    doc.setTextColor(79,70,229); doc.setFontSize(18); doc.setFont('helvetica','bold')
    doc.text(`AED ${inv.amount}`, W/2, y+25, {align:'center'})
    doc.setTextColor(165,180,252); doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, 270, {align:'center'})
    doc.save(`Invoice-${inv.inv_no}-${inv.tailor_code}.pdf`)
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Monthly Report" subtitle="FILTER BY MONTH AND TAILOR — DOWNLOAD AS PDF" />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-7">
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="field w-auto">
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedTailor} onChange={e => setSelectedTailor(e.target.value)} className="field w-auto">
            <option value="">All Tailors</option>
            {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
          </select>
          <button onClick={downloadPDF} disabled={invoices.length === 0} className="btn-gold">
            ↓ Download PDF
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <StatCard label="MONTH" value={MONTHS[selectedMonth-1]} color="dark" />
          <StatCard label="TOTAL PIECES" value={totalPieces} color="blue" />
          <StatCard label="TOTAL AMOUNT" value={`AED ${totalAmount}`} color="blue" />
        </div>

        {/* Job Invoice Tailor Summary */}
        <div className="mb-7">
          <h3 className="text-xs font-bold tracking-widest mb-4" style={{ color: '#4f46e5', letterSpacing: '2px' }}>
            JOB INVOICE SUMMARY — SHOP + ORDER PER TAILOR
          </h3>
          {jobSummary.length === 0 ? (
            <div className="text-center py-8 text-xs tracking-widest rounded-2xl" style={{ color: '#d1d5db', border: '1.5px solid rgba(79,70,229,0.1)', background: '#faf9ff' }}>
              NO JOB INVOICE RECORDS FOR THIS MONTH
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(79,70,229,0.12)', boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#ede9fe', borderBottom: '1px solid #ddd6fe' }}>
                    {['TAILOR','SECTION 1 (SHOP)','SECTION 2 (ORDER)','COMBINED TOTAL'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-bold" style={{ color: '#4f46e5', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobSummary.map((row, idx) => (
                    <tr key={row.tailor_id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#faf9ff', borderBottom: '1px solid rgba(79,70,229,0.05)' }}>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(79,70,229,0.08)', border: '1.5px solid rgba(79,70,229,0.2)', color: '#4f46e5' }}>
                          {row.tailor_code}
                        </span>
                        <span className="ml-2 text-xs" style={{ color: '#6b7280' }}>{row.tailor_name}</span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: '#4f46e5' }}>AED {row.shop_amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: '#0891b2' }}>AED {row.order_amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-bold text-base" style={{ color: '#16a34a' }}>AED {row.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                {jobSummary.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(79,70,229,0.05)', borderTop: '1.5px solid rgba(79,70,229,0.12)' }}>
                      <td className="px-4 py-3.5 text-xs font-bold" style={{ color: '#4f46e5', letterSpacing: '1.5px' }}>TOTAL</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#4f46e5' }}>
                        AED {jobSummary.reduce((s,r) => s+r.shop_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#0891b2' }}>
                        AED {jobSummary.reduce((s,r) => s+r.order_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#16a34a' }}>
                        AED {jobSummary.reduce((s,r) => s+r.total_amount, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: '#a5b4fc' }}>
            <span className="spinner" /><span className="text-sm tracking-widest">LOADING...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(79,70,229,0.12)', boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#ede9fe', borderBottom: '1px solid #ddd6fe' }}>
                    {['INV NO','TAILOR','MD NO','DATE','PC','RATE','AMOUNT','REMARKS',''].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-bold" style={{ color: '#4f46e5', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv,idx) => (
                    <tr key={inv.id}
                      style={{ background: idx%2===0 ? '#ffffff' : '#faf9ff', borderBottom: '1px solid rgba(79,70,229,0.05)' }}
                      onMouseEnter={e => (e.currentTarget.style.background='#ede9fe')}
                      onMouseLeave={e => (e.currentTarget.style.background=idx%2===0?'#ffffff':'#faf9ff')}>
                      <td className="px-4 py-3.5 font-mono font-semibold" style={{ color:'#4f46e5' }}>{inv.inv_no}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'rgba(79,70,229,0.08)',border:'1.5px solid rgba(79,70,229,0.2)',color:'#4f46e5' }}>{inv.tailor_code}</span>
                      </td>
                      <td className="px-4 py-3.5" style={{ color:'#4b5563' }}>{inv.md_no}</td>
                      <td className="px-4 py-3.5" style={{ color:'#4b5563' }}>{inv.rcv_date}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color:'#1e1b4b' }}>{inv.pc_count}</td>
                      <td className="px-4 py-3.5" style={{ color:'#4b5563' }}>{inv.rate}</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#16a34a' }}>AED {inv.amount}</td>
                      <td className="px-4 py-3.5 text-xs" style={{ color:'#9ca3af' }}>{inv.remarks||'—'}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={e => { e.stopPropagation(); downloadInvoicePDF(inv) }}
                          className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                          style={{ background:'rgba(79,70,229,0.08)',border:'1.5px solid rgba(79,70,229,0.2)',color:'#4f46e5',cursor:'pointer' }}>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {invoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background:'rgba(79,70,229,0.05)',borderTop:'1.5px solid rgba(79,70,229,0.12)' }}>
                      <td colSpan={4} className="px-4 py-3.5 text-xs font-bold" style={{ color:'#4f46e5',letterSpacing:'1.5px' }}>TOTAL</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#4f46e5' }}>{totalPieces}</td>
                      <td className="px-4 py-3.5" />
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#16a34a' }}>AED {totalAmount}</td>
                      <td colSpan={2} className="px-4 py-3.5" />
                    </tr>
                  </tfoot>
                )}
              </table>
              {invoices.length === 0 && (
                <div className="text-center py-16 text-sm tracking-widest" style={{ color:'#d1d5db' }}>
                  NO RECORDS FOR THIS MONTH
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {invoices.length === 0 ? (
                <div className="text-center py-16 text-sm tracking-widest" style={{ color:'#d1d5db' }}>NO RECORDS</div>
              ) : invoices.map(inv => (
                <div key={inv.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold" style={{ color:'#4f46e5' }}>#{inv.inv_no}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background:'rgba(79,70,229,0.08)',border:'1.5px solid rgba(79,70,229,0.2)',color:'#4f46e5' }}>{inv.tailor_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color:'#16a34a' }}>AED {inv.amount}</span>
                      <button onClick={() => downloadInvoicePDF(inv)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ background:'rgba(79,70,229,0.08)',border:'1.5px solid rgba(79,70,229,0.2)',color:'#4f46e5',cursor:'pointer' }}>
                        PDF
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color:'#6b7280' }}>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'#a5b4fc' }}>MD NO</span>{inv.md_no}</div>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'#a5b4fc' }}>DATE</span>{inv.rcv_date}</div>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'#a5b4fc' }}>PC × RATE</span>{inv.pc_count} × {inv.rate}</div>
                  </div>
                </div>
              ))}
              {invoices.length > 0 && (
                <div className="card p-4 flex items-center justify-between" style={{ borderColor:'rgba(79,70,229,0.3)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color:'#4f46e5' }}>TOTAL</span>
                  <div className="flex gap-4 text-sm font-bold">
                    <span style={{ color:'#4f46e5' }}>{totalPieces} pc</span>
                    <span style={{ color:'#16a34a' }}>AED {totalAmount}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
