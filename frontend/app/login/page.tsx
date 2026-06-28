'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import axios from 'axios'
import Image from 'next/image'

export default function Login() {
  const router = useRouter()
  const [step, setStep]         = useState<'user'|'pass'>('user')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const goToPass = () => {
    if (!username.trim()) { setError('Enter your username'); return }
    setError(''); setStep('pass')
  }

  const handleLogin = async () => {
    if (!password) { setError('Enter your password'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/token/`, { username, password })
      Cookies.set('access_token', res.data.access, { expires: 1 })
      Cookies.set('refresh_token', res.data.refresh, { expires: 7 })
      router.push('/')
    } catch {
      setError('Invalid username or password')
    } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #d1d5db', borderRadius: 8,
    padding: '12px 14px', fontSize: 14, color: '#0f172a',
    outline: 'none', background: '#fff', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'inherit' }}>

      {/* ── Left — Brand panel ─────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #fef9e7 0%, #eff6ff 55%, #dbeafe 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 72px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ marginBottom: 48 }}>
          <Image src="/logo.png" alt="Mehar Pardha" width={60} height={60} style={{ objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', lineHeight: 1.15, margin: '0 0 16px', maxWidth: 420 }}>
          Tailor Management<br />
          <span style={{ color: '#2563eb' }}>Made Simple.</span>
        </h1>

        <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 52px', maxWidth: 380, lineHeight: 1.8 }}>
          End-to-end ERP for tailor shops — production, orders, payments, and material tracking in one place.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['Complete', 'shop stitching and order management.'],
            ['Real-time', 'tailor balance and payment tracking.'],
            ['Built for', 'Mehar Pardha, Deira, Dubai.'],
          ].map(([bold, rest], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: '#1e293b', fontWeight: 600 }}>{bold}</strong> {rest}
              </p>
            </div>
          ))}
        </div>

        {/* Buildings silhouette */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, opacity: 0.05, pointerEvents: 'none' }}>
          <svg viewBox="0 0 700 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <rect x="0"   y="20" width="50"  height="80"  fill="#0f172a"/>
            <rect x="10"  y="5"  width="30"  height="95"  fill="#0f172a"/>
            <rect x="60"  y="40" width="40"  height="60"  fill="#0f172a"/>
            <rect x="110" y="10" width="55"  height="90"  fill="#0f172a"/>
            <rect x="122" y="0"  width="30"  height="100" fill="#0f172a"/>
            <rect x="175" y="30" width="45"  height="70"  fill="#0f172a"/>
            <rect x="230" y="15" width="60"  height="85"  fill="#0f172a"/>
            <rect x="242" y="2"  width="36"  height="98"  fill="#0f172a"/>
            <rect x="300" y="45" width="40"  height="55"  fill="#0f172a"/>
            <rect x="350" y="25" width="55"  height="75"  fill="#0f172a"/>
            <rect x="415" y="35" width="45"  height="65"  fill="#0f172a"/>
            <rect x="470" y="20" width="50"  height="80"  fill="#0f172a"/>
            <rect x="530" y="40" width="40"  height="60"  fill="#0f172a"/>
            <rect x="580" y="15" width="60"  height="85"  fill="#0f172a"/>
            <rect x="650" y="30" width="50"  height="70"  fill="#0f172a"/>
          </svg>
        </div>
      </div>

      {/* ── Right — Form panel ─────────────────────────────────── */}
      <div style={{ width: 480, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px', boxShadow: '-2px 0 20px rgba(0,0,0,0.04)', position: 'relative' }}>

        <div style={{ marginBottom: 36 }}>
          <Image src="/logo.png" alt="Mehar Pardha" width={40} height={40} style={{ objectFit: 'contain' }} />
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Sign in</h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>to access Mehar Pardha ERP</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {step === 'user' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Username</label>
              <input type="text" placeholder="Enter your username" value={username} autoFocus
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && goToPass()}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
              />
            </div>
            <button onClick={goToPass}
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
              Next
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>👤 {username}</span>
              <button onClick={() => { setStep('user'); setPassword(''); setError('') }}
                style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Change
              </button>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="Enter your password" value={password} autoFocus
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
              />
            </div>
            <button onClick={handleLogin} disabled={loading}
              style={{ width: '100%', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563eb' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        )}

        <p style={{ position: 'absolute', bottom: 32, left: 56, right: 56, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          © {new Date().getFullYear()} Mehar Pardha — Deira, Dubai. All rights reserved.
        </p>
      </div>
    </div>
  )
}
