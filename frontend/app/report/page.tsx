'use client'
import { useCallback, useEffect, useState } from 'react'
import { getInvoices, getSummary, getTailors, getTailorJobSummary, Invoice, Tailor, TailorJobSummary } from '@/lib/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const formatDateLabel = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return `${day} ${MONTHS[m - 1]} ${y}`
}

export default function Report() {
  const [invoices, setInvoices]         = useState<Invoice[]>([])
  const [tailors, setTailors]           = useState<Tailor[]>([])
  const [jobSummary, setJobSummary]     = useState<TailorJobSummary[]>([])
  const [selectedMonth, setSelectedMonth]   = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate]     = useState('')
  const [selectedTailor, setSelectedTailor] = useState('')
  const [loading, setLoading]           = useState(true)
  const [totalPieces, setTotalPieces]   = useState(0)
  const [totalAmount, setTotalAmount]   = useState(0)

  const periodLabel = selectedDate ? formatDateLabel(selectedDate) : `${MONTHS[selectedMonth - 1]} 2026`

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = selectedDate ? { date: selectedDate } : { month: selectedMonth }
      if (selectedTailor) params.tailor = selectedTailor
      const [invRes, sumRes, tailorRes, jobRes] = await Promise.all([
        getInvoices(params), getSummary(params), getTailors({ page_size: 1000 }),
        getTailorJobSummary(selectedDate ? { date: selectedDate } : { month: selectedMonth }),
      ])
      setInvoices(invRes.data)
      setTotalPieces(sumRes.data.total_pieces)
      setTotalAmount(sumRes.data.total_amount)
      setTailors(tailorRes.data.results)
      setJobSummary(selectedTailor ? jobRes.data.filter(r => r.tailor_code === selectedTailor) : jobRes.data)
    } finally { setLoading(false) }
  }, [selectedMonth, selectedDate, selectedTailor])

  useEffect(() => { fetchReport() }, [fetchReport])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(37,99,235); doc.rect(0,0,W,28,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(37,99,235); doc.setFontSize(13); doc.setFont('helvetica','bold')
    doc.text(`${selectedDate ? 'DAILY' : 'MONTHLY'} REPORT — ${periodLabel.toUpperCase()}`, W/2, 38, {align:'center'})
    if (selectedTailor) {
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal')
      doc.text(`Tailor: ${selectedTailor}`, W/2, 46, {align:'center'})
    }
    const boxY=52, boxH=16, boxW=55, gap=8, startX=(W-(boxW*3+gap*2))/2
    doc.setDrawColor(37,99,235); doc.setLineWidth(0.3)
    const boxes = [
      {label:'TOTAL INVOICES', value:String(invoices.length), color:[30,27,75] as [number,number,number]},
      {label:'TOTAL PIECES',   value:String(totalPieces),     color:[37,99,235] as [number,number,number]},
      {label:'TOTAL AMOUNT',   value:`AED ${totalAmount}`,    color:[37,99,235] as [number,number,number]},
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
      headStyles:{fillColor:[37,99,235],textColor:[255,255,255],fontStyle:'bold',fontSize:8},
      bodyStyles:{fillColor:[255,255,255],textColor:[30,27,75],fontSize:8},
      alternateRowStyles:{fillColor:[245,243,255]},
      footStyles:{fillColor:[237,233,254],textColor:[37,99,235],fontStyle:'bold',fontSize:9},
      styles:{lineColor:[221,214,254],lineWidth:0.2},
    })
    const finalY = (doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10
    doc.setTextColor(165,180,252); doc.setFontSize(7)
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, finalY, {align:'center'})
    doc.save(`Mehar-Pardha-${selectedDate || MONTHS[selectedMonth-1]+'-2026'}.pdf`)
  }

  const getTailorPhone = (code: string) => tailors.find(t => t.code === code)?.phone
  const getOpeningBalance = (code: string) => {
    const t = tailors.find(t => t.code === code)
    return t ? parseFloat(String(t.opening_balance)) || 0 : 0
  }

  const downloadTailorStatementPDF = (row: TailorJobSummary) => {
    const openingBalance = getOpeningBalance(row.tailor_code)
    const pendingBalance = openingBalance + row.total_amount - row.mat_issue_amount - row.paid_amount
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(37,99,235); doc.rect(0,0,W,28,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(37,99,235); doc.setFontSize(14); doc.setFont('helvetica','bold')
    doc.text(`TAILOR STATEMENT — ${row.tailor_code}`, W/2, 40, {align:'center'})
    doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text(`${row.tailor_name} · ${periodLabel}`, W/2, 47, {align:'center'})
    doc.setDrawColor(37,99,235); doc.setLineWidth(0.3); doc.line(14,52,W-14,52)

    let y = 64
    const lines: [string, string][] = []
    if (openingBalance !== 0) lines.push(['Opening Balance', `AED ${openingBalance.toFixed(2)}`])
    lines.push(
      [`Shop (${row.shop_qty} pc)`, `AED ${row.shop_amount.toFixed(2)}`],
      [`Order (${row.order_qty} qty)`, `AED ${row.order_amount.toFixed(2)}`],
      [`Production (${row.production_qty} pc)`, `AED ${row.production_amount.toFixed(2)}`],
      ['Total Earned', `AED ${row.total_amount.toFixed(2)}`],
      ['Mat Issue', `- AED ${row.mat_issue_amount.toFixed(2)}`],
      ['Already Paid', `- AED ${row.paid_amount.toFixed(2)}`],
    )
    lines.forEach(([label, value]) => {
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text(label,20,y)
      doc.setTextColor(30,27,75); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(value,W-20,y,{align:'right'})
      y+=10
    })

    doc.setFillColor(245,243,255); doc.setDrawColor(37,99,235); doc.setLineWidth(0.5)
    doc.roundedRect(14,y+5,W-28,24,3,3,'FD')
    doc.setTextColor(165,180,252); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text('PENDING BALANCE', W/2, y+15, {align:'center'})
    if (pendingBalance >= 0) doc.setTextColor(22,163,74); else doc.setTextColor(220,38,38)
    doc.setFontSize(18); doc.setFont('helvetica','bold')
    doc.text(`AED ${pendingBalance.toFixed(2)}`, W/2, y+25, {align:'center'})

    doc.setTextColor(165,180,252); doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, 270, {align:'center'})
    doc.save(`Statement-${row.tailor_code}-${selectedDate || MONTHS[selectedMonth-1]+'-2026'}.pdf`)
  }

  const buildStatementText = (row: TailorJobSummary) => {
    const openingBalance = getOpeningBalance(row.tailor_code)
    const pendingBalance = openingBalance + row.total_amount - row.mat_issue_amount - row.paid_amount
    const lines = [`${row.tailor_name} (${row.tailor_code}) — ${periodLabel}`, '']
    if (openingBalance !== 0) lines.push(`Opening Balance: AED ${openingBalance.toFixed(2)}`)
    lines.push(
      `Shop (${row.shop_qty} pc): AED ${row.shop_amount.toFixed(2)}`,
      `Order (${row.order_qty} qty): AED ${row.order_amount.toFixed(2)}`,
      `Production (${row.production_qty} pc): AED ${row.production_amount.toFixed(2)}`,
      `Total Earned: AED ${row.total_amount.toFixed(2)}`,
      `Mat Issue: − AED ${row.mat_issue_amount.toFixed(2)}`,
      `Already Paid: − AED ${row.paid_amount.toFixed(2)}`,
      `Pending Balance: AED ${pendingBalance.toFixed(2)}`,
    )
    return lines.join('\n')
  }

  const downloadInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    doc.setFillColor(37,99,235); doc.rect(0,0,W,28,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.text('MEHAR PARDHA', W/2, 12, {align:'center'})
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TAILOR MANAGEMENT SYSTEM — DEIRA, DUBAI', W/2, 21, {align:'center'})
    doc.setTextColor(37,99,235); doc.setFontSize(14); doc.setFont('helvetica','bold')
    doc.text(`INVOICE #${inv.inv_no}`, W/2, 40, {align:'center'})
    doc.setDrawColor(37,99,235); doc.setLineWidth(0.3); doc.line(14,45,W-14,45)
    let y=58
    const details:[string,string][] = [['Tailor Code',inv.tailor_code],['Tailor Name',inv.tailor_name],['MD Number',inv.md_no],['Receive Date',inv.rcv_date],['Pieces',String(inv.pc_count)],['Rate (AED)',String(inv.rate)],['Remarks',inv.remarks||'—']]
    details.forEach(([label,value]) => {
      doc.setTextColor(107,114,128); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text(label,20,y)
      doc.setTextColor(30,27,75); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(value,90,y)
      y+=10
    })
    doc.setFillColor(237,233,254); doc.setDrawColor(37,99,235); doc.setLineWidth(0.5)
    doc.roundedRect(14,y+5,W-28,24,3,3,'FD')
    doc.setTextColor(165,180,252); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text('TOTAL AMOUNT', W/2, y+15, {align:'center'})
    doc.setTextColor(37,99,235); doc.setFontSize(18); doc.setFont('helvetica','bold')
    doc.text(`AED ${inv.amount}`, W/2, y+25, {align:'center'})
    doc.setTextColor(165,180,252); doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text(`Generated ${new Date().toLocaleDateString('en-AE')} — Mehar Pardha`, W/2, 270, {align:'center'})
    doc.save(`Invoice-${inv.inv_no}-${inv.tailor_code}.pdf`)
  }

  return (
    <main style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Reports</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedDate ? 'Daily Report' : 'Monthly Report'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="field" style={{ width: 'auto' }} value={selectedMonth} disabled={!!selectedDate}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="date" className="field" style={{ width: 'auto' }} value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)} />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>✕</button>
            )}
            <select className="field" style={{ width: 'auto' }} value={selectedTailor} onChange={e => setSelectedTailor(e.target.value)}>
              <option value="">All Tailors</option>
              {tailors.map(t => <option key={t.id} value={t.code}>{t.code} — {t.name}</option>)}
            </select>
            <button onClick={downloadPDF} disabled={invoices.length === 0} className="btn-gold">
              ↓ Download PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: selectedDate ? 'Date' : 'Month', value: periodLabel, color: '#1e293b' },
            { label: 'Total Pieces',  value: totalPieces,             color: '#2563eb' },
            { label: 'Total Amount',  value: `AED ${totalAmount}`,    color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Job Invoice Tailor Summary */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Job Invoice Summary — Shop + Order per Tailor</span>
          </div>
          {jobSummary.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 13 }}>No job invoice records for this month.</p>
          ) : (
            <table className="z-table">
              <thead>
                <tr>
                  <th>Tailor</th>
                  <th>Shop (CR)</th>
                  <th>Order (CR)</th>
                  <th>Production (CR)</th>
                  <th>Mat Issue (DR)</th>
                  <th>Paid (DR)</th>
                  <th>Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobSummary.map(row => {
                  const phone = getTailorPhone(row.tailor_code)?.replace(/\D/g, '')
                  const waMsg = encodeURIComponent(buildStatementText(row))
                  return (
                    <tr key={row.tailor_id}>
                      <td>
                        <span className="badge badge-blue" style={{ marginRight: 6 }}>{row.tailor_code}</span>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>{row.tailor_name}</span>
                      </td>
                      <td style={{ color: '#2563eb', fontWeight: 500 }}>AED {row.shop_amount.toFixed(2)}</td>
                      <td style={{ color: '#0891b2', fontWeight: 500 }}>AED {row.order_amount.toFixed(2)}</td>
                      <td style={{ color: '#7c3aed', fontWeight: 500 }}>AED {row.production_amount.toFixed(2)}</td>
                      <td style={{ color: '#d97706', fontWeight: 500 }}>AED {row.mat_issue_amount.toFixed(2)}</td>
                      <td style={{ color: '#dc2626', fontWeight: 500 }}>AED {row.paid_amount.toFixed(2)}</td>
                      <td style={{ color: row.balance >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 14 }}>AED {row.balance.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => downloadTailorStatementPDF(row)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
                            PDF
                          </button>
                          {phone ? (
                            <a href={`https://wa.me/${phone}?text=${waMsg}`} target="_blank" rel="noreferrer"
                              title="Send statement via WhatsApp"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#dcfce7', border: '1.5px solid #86efac', cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#16a34a">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </a>
                          ) : (
                            <span title="No phone saved for this tailor"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: '1.5px solid #e2e8f0', flexShrink: 0, opacity: 0.45 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#94a3b8">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {jobSummary.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.shop_amount, 0).toFixed(2)}</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.order_amount, 0).toFixed(2)}</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.production_amount, 0).toFixed(2)}</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.mat_issue_amount, 0).toFixed(2)}</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.paid_amount, 0).toFixed(2)}</td>
                    <td>AED {jobSummary.reduce((s,r) => s+r.balance, 0).toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Invoice Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '60px', color: '#6b7280' }}>
            <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Invoice Records</span>
              <span className="badge badge-gray">{invoices.length} records</span>
            </div>
            <table className="z-table">
              <thead>
                <tr>
                  <th>Inv No</th>
                  <th>Tailor</th>
                  <th>MD No</th>
                  <th>Date</th>
                  <th>Pieces</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>{inv.inv_no}</td>
                    <td><span className="badge badge-blue">{inv.tailor_code}</span></td>
                    <td style={{ color: '#374151' }}>{inv.md_no}</td>
                    <td style={{ color: '#6b7280' }}>{inv.rcv_date}</td>
                    <td style={{ fontWeight: 600 }}>{inv.pc_count}</td>
                    <td style={{ color: '#6b7280' }}>{inv.rate}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {inv.amount}</td>
                    <td style={{ color: '#9ca3af' }}>{inv.remarks || '—'}</td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); downloadInvoicePDF(inv) }} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {invoices.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4}>Total</td>
                    <td>{totalPieces}</td>
                    <td />
                    <td>AED {totalAmount}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
            {invoices.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>No records for this period.</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
