'use client'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState } from 'react'

const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/add', label: 'New Invoice' },
    { href: '/tailors', label: 'Tailors' },
    { href: '/ratesheet', label: 'Rate Sheet' },
    { href: '/stitching', label: 'Stitching' },
    { href: '/orders', label: 'Orders' },
    { href: '/report', label: 'Reports' },
  ]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/login') return null

  const handleLogout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    router.push('/login')
  }

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      className="sticky top-0 z-50"
      style={{ background: 'linear-gradient(135deg,#0a0a0f,#111118 50%,#0d0d14)', borderBottom: '1px solid rgba(212,175,55,0.18)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">

        {/* Logo — links home */}
        <a href="/" className="flex items-center gap-3 no-underline" style={{ textDecoration: 'none' }}>
          <div style={{ border: '1px solid rgba(212,175,55,0.35)', borderRadius: '50%', padding: 2, background: 'rgba(212,175,55,0.05)', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Mehar Pardha" width={38} height={38} className="rounded-full object-contain" />
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base leading-tight" style={{ color: '#D4AF37', letterSpacing: '0.5px' }}>MEHAR PARDHA</span>
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', letterSpacing: '1px' }}>DUBAI</span>
            </div>
            <p className="text-[10px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px' }}>TAILOR MANAGEMENT</p>
          </div>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-all no-underline"
              style={isActive(link.href) ? {
                background: 'linear-gradient(135deg,#D4AF37,#B8962E)',
                color: '#0a0a0f', fontWeight: 700, letterSpacing: '0.5px',
              } : {
                color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px',
              }}
              onMouseEnter={e => { if (!isActive(link.href)) { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)' } }}
              onMouseLeave={e => { if (!isActive(link.href)) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(212,175,55,0.2)', margin: '0 6px' }} />
          <button
            onClick={handleLogout}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-all"
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', letterSpacing: '0.5px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1.5"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', cursor: 'pointer' }}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 transition-all" style={{ background: menuOpen ? '#D4AF37' : 'rgba(255,255,255,0.7)', transform: menuOpen ? 'rotate(45deg) translate(3px,3px)' : '' }} />
          <span className="block w-5 h-0.5 transition-all" style={{ background: menuOpen ? 'transparent' : 'rgba(255,255,255,0.7)', opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-5 h-0.5 transition-all" style={{ background: menuOpen ? '#D4AF37' : 'rgba(255,255,255,0.7)', transform: menuOpen ? 'rotate(-45deg) translate(3px,-3px)' : '' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: '1px solid rgba(212,175,55,0.1)', background: '#0a0a0f' }}
        >
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium px-4 py-3 rounded-lg no-underline transition-all"
              style={isActive(link.href) ? {
                background: 'linear-gradient(135deg,#D4AF37,#B8962E)',
                color: '#0a0a0f', fontWeight: 700,
              } : {
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ height: 1, background: 'rgba(212,175,55,0.1)', margin: '4px 0' }} />
          <button
            onClick={handleLogout}
            className="text-sm font-medium px-4 py-3 rounded-lg text-left transition-all"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
