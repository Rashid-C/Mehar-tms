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
        getInvoices(params),
        getSummary(params),
        getTailors(),
        getTailorJobSummary({ month: selectedMonth }),
      ])
      setInvoices(invRes.data)
      setTotalPieces(sumRes.data.total_pieces)
      setTotalAmount(sumRes.data.total_amount)
      setTailors(tailorRes.data)
      // Filter job summary by selected tailor if one is chosen
      const js = selectedTailor
        ? jobRes.data.filter(r => r.tailor_code === selectedTailor)
        : jobRes.data
      setJobSummary(js)
    } finally { setLoading(false) }
  }, [selectedMonth, selectedTailor])

  useEffect(() => { fetchReport() }, [fetchReport])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(212,175,55); doc.rect(0,0,W,28,'F')
    doc.setTextColor(10,10,15); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(212,175,55); doc.setFontSize(13); doc.setFont('helvetica','bold')
    doc.text(`MONTHLY REPORT — ${MONTHS[selectedMonth-1].toUpperCase()} 2026`, W/2, 38, {align:'center'})
    if (selectedTailor) {
      doc.setTextColor(150,150,150); doc.setFontSize(9); doc.setFont('helvetica','normal')
      doc.text(`Tailor: ${selectedTailor}`, W/2, 46, {align:'center'})
    }
    const boxY=52, boxH=16, boxW=55, gap=8, startX=(W-(boxW*3+gap*2))/2
    doc.setDrawColor(212,175,55); doc.setLineWidth(0.3)
    const boxes = [
      {label:'TOTAL INVOICES', value:String(invoices.length), color:[255,255,255] as [number,number,number]},
      {label:'TOTAL PIECES', value:String(totalPieces), color:[96,165,250] as [number,number,number]},
      {label:'TOTAL AMOUNT', value:`AED ${totalAmount}`, color:[212,175,55] as [number,number,number]},
    ]
    boxes.forEach((b,i) => {
      const x = startX+i*(boxW+gap)
      doc.setFillColor(20,20,30); doc.roundedRect(x,boxY,boxW,boxH,2,2,'FD')
      doc.setTextColor(150,150,150); doc.setFontSize(7); doc.setFont('helvetica','normal')
      doc.text(b.label, x+boxW/2, boxY+5, {align:'center'})
      doc.setTextColor(b.color[0],b.color[1],b.color[2]); doc.setFontSize(10); doc.setFont('helvetica','bold')
      doc.text(b.value, x+boxW/2, boxY+13, {align:'center'})
    })
    autoTable(doc, {
      startY: 76,
      head:[['INV NO','TAILOR','MD NO','DATE','PC','RATE','AMOUNT','REMARKS']],
      body: invoices.map(inv=>[inv.inv_no,inv.tailor_code,inv.md_no,inv.rcv_date,inv.pc_count,inv.rate,`AED ${inv.amount}`,inv.remarks||'—']),
      foot:[['TOTAL','','','',totalPieces,'',`AED ${totalAmount}`,'']],
      headStyles:{fillColor:[212,175,55],textColor:[10,10,15],fontStyle:'bold',fontSize:8},
      bodyStyles:{fillColor:[15,15,22],textColor:[200,200,200],fontSize:8},
      alternateRowStyles:{fillColor:[20,20,32]},
      footStyles:{fillColor:[30,25,10],textColor:[212,175,55],fontStyle:'bold',fontSize:9},
      styles:{lineColor:[40,40,60],lineWidth:0.2},
    })
    const finalY = (doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10
    doc.setTextColor(80,80,80); doc.setFontSize(7)
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, finalY, {align:'center'})
    doc.save(`Mehar-Pardha-${MONTHS[selectedMonth-1]}-2026.pdf`)
  }

  const downloadInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(212,175,55); doc.rect(0,0,W,28,'F')
    doc.setTextColor(10,10,15); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(212,175,55); doc.setFontSize(14); doc.setFont('helvetica','bold')
    doc.text(`INVOICE #${inv.inv_no}`, W/2, 40, {align:'center'})
    doc.setDrawColor(212,175,55); doc.setLineWidth(0.3); doc.line(14,45,W-14,45)
    let y=58
    const details:[string,string][] = [['Tailor Code',inv.tailor_code],['Tailor Name',inv.tailor_name],['MD Number',inv.md_no],['Receive Date',inv.rcv_date],['Pieces',String(inv.pc_count)],['Rate (AED)',String(inv.rate)],['Remarks',inv.remarks||'—']]
    details.forEach(([label,value]) => {
      doc.setTextColor(100,100,100); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text(label,20,y)
      doc.setTextColor(30,30,30); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(value,90,y)
      y+=10
    })
    doc.setFillColor(245,240,220); doc.setDrawColor(212,175,55); doc.setLineWidth(0.5)
    doc.roundedRect(14,y+5,W-28,24,3,3,'FD')
    doc.setTextColor(150,150,150); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text('TOTAL AMOUNT', W/2, y+15, {align:'center'})
    doc.setTextColor(212,175,55); doc.setFontSize(18); doc.setFont('helvetica','bold')
    doc.text(`AED ${inv.amount}`, W/2, y+25, {align:'center'})
    doc.setTextColor(120,120,120); doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, 270, {align:'center'})
    doc.save(`Invoice-${inv.inv_no}-${inv.tailor_code}.pdf`)
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#08080f' }}>
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
          <StatCard label="MONTH" value={MONTHS[selectedMonth-1]} color="white" />
          <StatCard label="TOTAL PIECES" value={totalPieces} color="blue" />
          <StatCard label="TOTAL AMOUNT" value={`AED ${totalAmount}`} color="gold" glow="gold" />
        </div>

        {/* Job Invoice Tailor Summary */}
        <div className="mb-7">
          <h3 className="text-xs font-bold tracking-widest mb-4" style={{ color: 'rgba(212,175,55,0.7)', letterSpacing: '2px' }}>
            JOB INVOICE SUMMARY — SHOP + ORDER PER TAILOR
          </h3>
          {jobSummary.length === 0 ? (
            <div className="text-center py-8 text-xs tracking-widest rounded-xl" style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.05)', background: '#0a0a12' }}>
              NO JOB INVOICE RECORDS FOR THIS MONTH
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#0f0f1a,#111120)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                    {['TAILOR', 'SECTION 1 (SHOP)', 'SECTION 2 (ORDER)', 'COMBINED TOTAL'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobSummary.map((row, idx) => (
                    <tr key={row.tailor_id}
                      style={{ background: idx % 2 === 0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                          {row.tailor_code}
                        </span>
                        <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.tailor_name}</span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: '#D4AF37' }}>AED {row.shop_amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: '#60a5fa' }}>AED {row.order_amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-bold text-base" style={{ color: '#4ade80' }}>AED {row.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                {jobSummary.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(212,175,55,0.06)', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                      <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '1.5px' }}>TOTAL</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#D4AF37' }}>
                        AED {jobSummary.reduce((s, r) => s + r.shop_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#60a5fa' }}>
                        AED {jobSummary.reduce((s, r) => s + r.order_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: '#4ade80' }}>
                        AED {jobSummary.reduce((s, r) => s + r.total_amount, 0).toFixed(2)}
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
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span className="spinner" /><span className="text-sm tracking-widest">LOADING...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#0f0f1a,#111120)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                    {['INV NO','TAILOR','MD NO','DATE','PC','RATE','AMOUNT','REMARKS',''].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '1.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv,idx) => (
                    <tr key={inv.id}
                      style={{ background: idx%2===0 ? '#08080f' : '#0a0a12', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background='rgba(212,175,55,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background=idx%2===0?'#08080f':'#0a0a12')}>
                      <td className="px-4 py-3.5 font-mono font-semibold" style={{ color:'#D4AF37' }}>{inv.inv_no}</td>
                      <td className="px-4 py-3.5"><span className="text-xs font-bold px-2 py-1 rounded" style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)',color:'#D4AF37' }}>{inv.tailor_code}</span></td>
                      <td className="px-4 py-3.5" style={{ color:'rgba(255,255,255,0.6)' }}>{inv.md_no}</td>
                      <td className="px-4 py-3.5" style={{ color:'rgba(255,255,255,0.6)' }}>{inv.rcv_date}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color:'rgba(255,255,255,0.8)' }}>{inv.pc_count}</td>
                      <td className="px-4 py-3.5" style={{ color:'rgba(255,255,255,0.6)' }}>{inv.rate}</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#4ade80' }}>AED {inv.amount}</td>
                      <td className="px-4 py-3.5 text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>{inv.remarks||'—'}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={e => { e.stopPropagation(); downloadInvoicePDF(inv) }}
                          className="text-xs font-semibold px-3 py-1 rounded-md transition-all"
                          style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',color:'#D4AF37',cursor:'pointer' }}>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {invoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background:'rgba(212,175,55,0.06)',borderTop:'1px solid rgba(212,175,55,0.2)' }}>
                      <td colSpan={4} className="px-4 py-3.5 text-xs font-semibold" style={{ color:'rgba(212,175,55,0.6)',letterSpacing:'1.5px' }}>TOTAL</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#60a5fa' }}>{totalPieces}</td>
                      <td className="px-4 py-3.5" />
                      <td className="px-4 py-3.5 font-bold" style={{ color:'#D4AF37' }}>AED {totalAmount}</td>
                      <td colSpan={2} className="px-4 py-3.5" />
                    </tr>
                  </tfoot>
                )}
              </table>
              {invoices.length === 0 && (
                <div className="text-center py-16 text-sm tracking-widest" style={{ color:'rgba(255,255,255,0.2)' }}>
                  NO RECORDS FOR THIS MONTH
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {invoices.length === 0 ? (
                <div className="text-center py-16 text-sm tracking-widest" style={{ color:'rgba(255,255,255,0.2)' }}>NO RECORDS</div>
              ) : invoices.map(inv => (
                <div key={inv.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold" style={{ color:'#D4AF37' }}>#{inv.inv_no}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)',color:'#D4AF37' }}>{inv.tailor_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color:'#4ade80' }}>AED {inv.amount}</span>
                      <button onClick={() => downloadInvoicePDF(inv)}
                        className="text-xs font-semibold px-2.5 py-1 rounded"
                        style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',color:'#D4AF37',cursor:'pointer' }}>
                        PDF
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>MD NO</span>{inv.md_no}</div>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>DATE</span>{inv.rcv_date}</div>
                    <div><span className="block text-[10px] tracking-wider mb-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>PC × RATE</span>{inv.pc_count} × {inv.rate}</div>
                  </div>
                </div>
              ))}
              {invoices.length > 0 && (
                <div className="card p-4 flex items-center justify-between" style={{ borderColor:'rgba(212,175,55,0.3)' }}>
                  <span className="text-xs font-semibold tracking-widest" style={{ color:'rgba(212,175,55,0.6)' }}>TOTAL</span>
                  <div className="flex gap-4 text-sm font-bold">
                    <span style={{ color:'#60a5fa' }}>{totalPieces} pc</span>
                    <span style={{ color:'#D4AF37' }}>AED {totalAmount}</span>
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
