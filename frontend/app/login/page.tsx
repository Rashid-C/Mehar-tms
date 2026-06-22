'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Cookies from 'js-cookie'
import axios from 'axios'
import Alert from '@/components/ui/Alert'
import FormField from '@/components/ui/FormField'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!username || !password) { setError('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/token/`, { username, password })
      Cookies.set('access_token', res.data.access, { expires: 1 })
      Cookies.set('refresh_token', res.data.refresh, { expires: 7 })
      router.push('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-block mb-5" style={{ border: '2px solid rgba(37,99,235,0.25)', borderRadius: '50%', padding: 6, background: 'rgba(37,99,235,0.06)' }}>
            <Image src="/logo.png" alt="Mehar Pardha" width={76} height={76} className="rounded-full object-contain" priority />
          </div>
          <h1 className="font-bold text-xl tracking-widest mb-1" style={{ color: '#2563eb', letterSpacing: '2.5px' }}>MEHAR PARDHA</h1>
          <p className="text-xs tracking-widest" style={{ color: '#9ca3af', letterSpacing: '2px' }}>TAILOR MANAGEMENT SYSTEM</p>
          <div className="mx-auto mt-4" style={{ width: 60, height: 1, background: 'linear-gradient(90deg,transparent,#2563eb,transparent)' }} />
        </div>

        {/* Card */}
        <div className="card p-7">
          <h2 className="font-bold text-lg mb-1" style={{ color: '#1e293b' }}>Sign In</h2>
          <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>Enter your credentials to continue</p>

          <Alert type="error" message={error} />

          <div className="space-y-4">
            <FormField label="USERNAME">
              <input type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="admin" className="field" autoComplete="username" />
            </FormField>

            <FormField label="PASSWORD">
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••" className="field" autoComplete="current-password" />
            </FormField>

            <button onClick={handleLogin} disabled={loading} className="btn-gold w-full mt-2">
              {loading ? <><span className="spinner" /> SIGNING IN...</> : 'Sign In →'}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#c4b5fd', letterSpacing: '0.5px' }}>
          Mehar Pardha · Deira, Dubai · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  )
}
