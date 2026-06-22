'use client'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState } from 'react'

const links = [
  { href: '/',            label: 'Dashboard'   },
  { href: '/job-invoice', label: 'Job Invoice' },
  { href: '/tailors',     label: 'Tailors'     },
  { href: '/ratesheet',   label: 'Rate Sheet'  },
  { href: '/stitching',   label: 'Stitching'   },
  { href: '/report',      label: 'Reports'     },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/login') return null

  const handleLogout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    router.push('/login')
  }

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="sticky top-0 z-50"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(79,70,229,0.08)', boxShadow: '0 2px 20px rgba(79,70,229,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-17">

        {/* Logo */}
        <a href="/" className="flex items-center gap-3 no-underline shrink-0" style={{ textDecoration: 'none' }}>
          <div style={{ border: '2px solid rgba(79,70,229,0.2)', borderRadius: '50%', padding: 2, background: 'rgba(79,70,229,0.05)', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Mehar Pardha" width={36} height={36} className="rounded-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[15px] tracking-tight" style={{ color: '#1e1b4b' }}>MEHAR PARDHA</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', letterSpacing: '1px' }}>DUBAI</span>
            </div>
            <p className="text-[10px] font-medium tracking-widest" style={{ color: '#a5b4fc', letterSpacing: '1.5px' }}>TAILOR MANAGEMENT</p>
          </div>
        </a>

        {/* Desktop nav — pill container */}
        <div className="hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-2xl"
          style={{ background: 'rgba(79,70,229,0.06)', border: '1.5px solid rgba(79,70,229,0.1)' }}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[13px] font-medium px-4 py-2 rounded-xl transition-all no-underline whitespace-nowrap"
              style={isActive(link.href) ? {
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
              } : {
                color: '#6b7280',
              }}
              onMouseEnter={e => { if (!isActive(link.href)) { const el = e.currentTarget as HTMLElement; el.style.color = '#4f46e5'; el.style.background = 'rgba(79,70,229,0.08)' } }}
              onMouseLeave={e => { if (!isActive(link.href)) { const el = e.currentTarget as HTMLElement; el.style.color = '#6b7280'; el.style.background = 'transparent' } }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right — logout button (pill CTA style like NIBX "Get a Quote") */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button onClick={handleLogout}
            className="text-[13px] font-bold px-5 py-2.5 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.3)', letterSpacing: '0.2px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(79,70,229,0.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(79,70,229,0.3)' }}>
            Logout →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl gap-1.5"
          style={{ background: 'rgba(79,70,229,0.07)', border: '1.5px solid rgba(79,70,229,0.15)', cursor: 'pointer' }}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 transition-all rounded-full" style={{ background: menuOpen ? '#4f46e5' : '#6b7280', transform: menuOpen ? 'rotate(45deg) translate(3px,3px)' : '' }} />
          <span className="block w-5 h-0.5 transition-all rounded-full" style={{ background: menuOpen ? 'transparent' : '#6b7280', opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-5 h-0.5 transition-all rounded-full" style={{ background: menuOpen ? '#4f46e5' : '#6b7280', transform: menuOpen ? 'rotate(-45deg) translate(3px,-3px)' : '' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-5 pt-2 flex flex-col gap-1"
          style={{ borderTop: '1px solid rgba(79,70,229,0.08)', background: 'rgba(255,255,255,0.98)' }}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium px-4 py-3 rounded-xl no-underline transition-all"
              style={isActive(link.href) ? {
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: '#ffffff', fontWeight: 700,
              } : {
                color: '#4b5563',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ height: 1, background: 'rgba(79,70,229,0.1)', margin: '6px 0' }} />
          <button onClick={handleLogout}
            className="text-sm font-bold px-4 py-3 rounded-xl text-left transition-all"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            Logout →
          </button>
        </div>
      )}
    </nav>
  )
}
