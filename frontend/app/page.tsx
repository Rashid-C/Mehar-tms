'use client'
import { useEffect, useState } from 'react'
import { getSummary, Summary } from '@/lib/api'

const actions = [
  { href: '/job-invoice', icon: '✦', title: 'Job Invoice',  desc: 'Shop entry · Order · Payment',      accent: '#4f46e5', rgb: '79,70,229',   gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  { href: '/report',      icon: '↓', title: 'Reports',      desc: 'Monthly PDF · per-tailor summary',  accent: '#0891b2', rgb: '8,145,178',   gradient: 'linear-gradient(135deg,#0891b2,#0e7490)' },
  { href: '/tailors',     icon: '人', title: 'Tailors',      desc: 'Manage tailor list',                accent: '#16a34a', rgb: '22,163,74',   gradient: 'linear-gradient(135deg,#16a34a,#15803d)' },
  { href: '/stitching',   icon: '⌀', title: 'Stitching',    desc: 'Shop stitching records',            accent: '#d97706', rgb: '217,119,6',   gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  { href: '/ratesheet',   icon: '₌', title: 'Rate Sheet',   desc: 'MD number rate configuration',     accent: '#7c3aed', rgb: '124,58,237',  gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
]

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    getSummary().then(r => setSummary(r.data)).catch(console.error)
  }, [])

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h2 className="font-bold text-3xl" style={{ color: '#1e1b4b' }}>Dashboard</h2>
          <p className="text-xs font-semibold tracking-widest mt-1.5" style={{ color: '#a5b4fc', letterSpacing: '2.5px' }}>
            MEHAR PARDHA — TAILOR MANAGEMENT
          </p>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">

            {/* ── Total Invoices ── */}
            <div className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 20px 60px rgba(99,102,241,0.45)',
                minHeight: 190,
              }}>
              {/* dot grid */}
              <div style={{ position:'absolute',inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.12) 1px,transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }} />
              {/* shine */}
              <div style={{ position:'absolute',top:0,left:0,right:0,height:'55%', background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)', pointerEvents:'none' }} />
              {/* watermark */}
              <div style={{ position:'absolute',right:-8,bottom:-16,fontSize:130,opacity:0.08,color:'#fff',lineHeight:1,fontWeight:900,pointerEvents:'none',userSelect:'none' }}>
                #
              </div>
              {/* icon chip */}
              <div style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:46,height:46,borderRadius:14,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.3)',fontSize:20,color:'#fff',fontWeight:700,marginBottom:20 }}>
                ≡
              </div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.65)',fontSize:'10px',fontWeight:700,letterSpacing:'2.5px',marginBottom:6 }}>TOTAL INVOICES</p>
                <p style={{ color:'#ffffff',fontSize:'2.8rem',fontWeight:800,lineHeight:1,letterSpacing:'-1px' }}>
                  {summary.total_invoices}
                </p>
              </div>
            </div>

            {/* ── Total Pieces ── */}
            <div className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                boxShadow: '0 20px 60px rgba(14,165,233,0.4)',
                minHeight: 190,
              }}>
              <div style={{ position:'absolute',inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.12) 1px,transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }} />
              <div style={{ position:'absolute',top:0,left:0,right:0,height:'55%', background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)', pointerEvents:'none' }} />
              <div style={{ position:'absolute',right:-8,bottom:-16,fontSize:130,opacity:0.08,color:'#fff',lineHeight:1,fontWeight:900,pointerEvents:'none',userSelect:'none' }}>
                ◈
              </div>
              <div style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:46,height:46,borderRadius:14,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.3)',fontSize:20,color:'#fff',fontWeight:700,marginBottom:20 }}>
                ⬡
              </div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.65)',fontSize:'10px',fontWeight:700,letterSpacing:'2.5px',marginBottom:6 }}>TOTAL PIECES</p>
                <p style={{ color:'#ffffff',fontSize:'2.8rem',fontWeight:800,lineHeight:1,letterSpacing:'-1px' }}>
                  {summary.total_pieces}
                </p>
              </div>
            </div>

            {/* ── Total Amount ── */}
            <div className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 20px 60px rgba(16,185,129,0.4)',
                minHeight: 190,
              }}>
              <div style={{ position:'absolute',inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.12) 1px,transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }} />
              <div style={{ position:'absolute',top:0,left:0,right:0,height:'55%', background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)', pointerEvents:'none' }} />
              <div style={{ position:'absolute',right:-8,bottom:-16,fontSize:130,opacity:0.08,color:'#fff',lineHeight:1,fontWeight:900,pointerEvents:'none',userSelect:'none' }}>
                ₌
              </div>
              <div style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:46,height:46,borderRadius:14,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.3)',fontSize:18,color:'#fff',fontWeight:700,marginBottom:20 }}>
                د.إ
              </div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.65)',fontSize:'10px',fontWeight:700,letterSpacing:'2.5px',marginBottom:6 }}>TOTAL AMOUNT</p>
                <p style={{ color:'#ffffff',fontSize:'2.2rem',fontWeight:800,lineHeight:1,letterSpacing:'-0.5px' }}>
                  AED {summary.total_amount}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ── Quick-action grid ───────────────────────────────────────────── */}
        <p className="text-[11px] font-bold tracking-widest mb-4" style={{ color: '#a5b4fc', letterSpacing: '2.5px' }}>QUICK ACCESS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(a => (
            <a
              key={a.href}
              href={a.href}
              className="card p-5 flex items-center gap-4 no-underline transition-all"
              style={{ textDecoration: 'none', border: `1.5px solid rgba(${a.rgb},0.15)` }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = `0 12px 32px rgba(${a.rgb},0.18)`
                el.style.borderColor = `rgba(${a.rgb},0.35)`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 2px 12px rgba(79,70,229,0.07)'
                el.style.borderColor = `rgba(${a.rgb},0.15)`
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: a.gradient, color: '#ffffff', boxShadow: `0 4px 14px rgba(${a.rgb},0.35)` }}
              >
                {a.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: '#1e1b4b' }}>{a.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>{a.desc}</p>
              </div>
              <span className="ml-auto text-lg shrink-0" style={{ color: `rgba(${a.rgb},0.4)` }}>→</span>
            </a>
          ))}
        </div>

      </div>
    </main>
  )
}
