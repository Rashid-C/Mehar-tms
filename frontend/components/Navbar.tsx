'use client'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState } from 'react'
import Image from 'next/image'

const modules = [
  { href: '/job-invoice', label: 'Production'  },
  { href: '/items',       label: 'Items'       },
  { href: '/tailors',     label: 'Tailors'     },
  { href: '/ratesheet',   label: 'Rate Sheet'  },
  { href: '/stitching',   label: 'Stitching'   },
  { href: '/finished-goods', label: 'Finished Goods' },
  { href: '/report',      label: 'Reports'     },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  if (pathname === '/login') return null

  const logout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    router.push('/login')
  }

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── BAR 1 — dark top strip ─────────────────────────────────────── */}
      <div style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>

          {/* Logo + brand */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Mehar Pardha" width={32} height={32} style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ color: '#f0d060', fontSize: 13, fontWeight: 700, letterSpacing: 0.8 }}>MEHAR PARDHA</span>
              <span style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 0.4 }}>Tailor Management</span>
            </div>
          </a>

          {/* Module links — desktop */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 0 }}>
            {modules.map((m, i) => (
              <span key={m.href} style={{ display: 'flex', alignItems: 'center' }}>
                <a href={m.href} style={{
                  color: active(m.href) ? '#ffffff' : '#94a3b8',
                  fontSize: 13, fontWeight: active(m.href) ? 600 : 400,
                  padding: '0 14px', textDecoration: 'none', height: 48,
                  display: 'flex', alignItems: 'center',
                  borderBottom: active(m.href) ? '2px solid #f0d060' : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
                  onMouseEnter={e => { if (!active(m.href)) (e.currentTarget as HTMLElement).style.color = '#e2e8f0' }}
                  onMouseLeave={e => { if (!active(m.href)) (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                >
                  {m.label}
                </a>
                {i < modules.length - 1 && <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />}
              </span>
            ))}
          </div>

          {/* Right — user + signout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button onClick={logout}
              style={{ color: '#94a3b8', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, cursor: 'pointer', padding: '5px 12px', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f0d060'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,208,96,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}>
              Sign out
            </button>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#f0d060,#d4a017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a2e', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              M
            </div>
            {/* Mobile hamburger */}
            <button className="md:hidden" onClick={() => setOpen(v => !v)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#94a3b8' }}>
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* ── BAR 2 — white sub-nav ───────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e8ecf0', position: 'sticky', top: 48, zIndex: 50 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 38 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, marginRight: 16 }}>
            <Image src="/logo.png" alt="Mehar Pardha" width={20} height={20} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: 0.2 }}>Tailor ERP</span>
          </a>
          <div style={{ width: 1, height: 16, background: '#e2e8f0', marginRight: 16 }} />
          <div className="hidden md:flex" style={{ height: '100%' }}>
            {[{ href: '/', label: 'Dashboard' }, ...modules].map(m => (
              <a key={m.href} href={m.href} style={{
                fontSize: 13,
                color: active(m.href) ? '#2563eb' : '#64748b',
                fontWeight: active(m.href) ? 600 : 400,
                textDecoration: 'none',
                padding: '0 14px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                borderBottom: active(m.href) ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { if (!active(m.href)) (e.currentTarget as HTMLElement).style.color = '#2563eb' }}
                onMouseLeave={e => { if (!active(m.href)) (e.currentTarget as HTMLElement).style.color = '#64748b' }}
              >
                {m.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden" style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px 16px', position: 'sticky', top: 48, zIndex: 45 }}>
          {[{ href: '/', label: 'Dashboard' }, ...modules].map(m => (
            <a key={m.href} href={m.href} onClick={() => setOpen(false)}
              style={{ display: 'block', color: active(m.href) ? '#f0d060' : '#94a3b8', fontSize: 14, padding: '10px 12px', textDecoration: 'none', borderRadius: 6, marginBottom: 2, fontWeight: active(m.href) ? 600 : 400 }}>
              {m.label}
            </a>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
          <button onClick={logout} style={{ color: '#f87171', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', padding: '10px 12px', width: '100%', textAlign: 'left', fontWeight: 600 }}>
            Sign out
          </button>
        </div>
      )}
    </>
  )
}
