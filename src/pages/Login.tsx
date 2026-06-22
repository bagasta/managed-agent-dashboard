import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { User } from '../types'
import { useI18n } from '../i18n'

function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (p.startsWith('8')) p = '62' + p
  return p
}

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const { t, language, setLanguage } = useI18n()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const norm = normalizePhone(phone)
    if (norm.length < 10) {
      setErr(language === 'en' ? 'Invalid phone number.' : 'Nomor HP tidak valid.')
      return
    }
    setLoading(true)
    try {
      const user = await api.loginByPhone(norm)
      if (!user.subscription) {
        setErr(t('login.noPlan', 'Nomor terdaftar tapi belum memiliki paket aktif. Hubungi admin.'))
        return
      }
      onLogin(user)
      nav('/app')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (language === 'en' ? 'Failed to sign in' : 'Gagal masuk')
      setErr(msg.includes('tidak terdaftar') ? t('login.notRegistered', 'Nomor belum terdaftar. Hubungi admin untuk aktivasi.') : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden md:flex flex-1 bg-ink-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <Link to="/" className="relative flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-white" />
          Clevio AI Staff
        </Link>
        <div className="relative">
          <div className="text-[13px] uppercase tracking-[0.2em] text-ink-400">{language === 'en' ? 'Welcome back' : 'Selamat datang kembali'}</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight leading-[1.1]">
            {language === 'en' ? 'Your AI staff' : 'Staf AI Anda'}
            <br />
            {language === 'en' ? 'is waiting.' : 'sudah menunggu.'}
          </h2>
          <p className="mt-4 text-ink-300 max-w-sm leading-relaxed">
            {t('login.hero', 'Cukup masukkan nomor WhatsApp untuk masuk. Tanpa password, tanpa ribet.')}
          </p>
        </div>
        <div className="relative text-xs text-ink-400">
          {language === 'en' ? 'Trusted by 1,000+ business owners in Indonesia.' : 'Dipercaya 1.000+ pemilik bisnis di Indonesia.'}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden flex items-center gap-2 justify-center mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-900" />
            <span className="font-semibold tracking-tight">Clevio AI Staff</span>
          </Link>
          <div className="mb-5 inline-flex rounded-full border border-ink-200 bg-ink-50 p-1">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${language === 'id' ? 'bg-white shadow-sm' : 'text-ink-500'}`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${language === 'en' ? 'bg-white shadow-sm' : 'text-ink-500'}`}
            >
              EN
            </button>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('login.title', 'Masuk')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('login.subtitle', 'Gunakan nomor WhatsApp yang terdaftar.')}</p>
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
            <label className="text-xs text-ink-500">{t('login.phone', 'Nomor WhatsApp')}</label>
            <div className="flex items-stretch rounded-xl border border-ink-200 focus-within:border-ink-900 transition overflow-hidden bg-white">
              <span className="px-3 flex items-center text-sm text-ink-500 border-r border-ink-200 bg-ink-50">+62</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="81234567890"
                className="flex-1 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                required
                autoFocus
              />
            </div>
            {err && <div className="text-xs text-red-600 break-all">{err}</div>}
            <button type="submit" disabled={loading} className="btn-primary mt-4 disabled:opacity-50">
              {loading ? t('login.checking', 'Memeriksa...') : t('login.submit', 'Masuk')}
            </button>
            <p className="text-[11px] text-ink-400 text-center mt-2">
              {t('login.help', 'Belum punya akun? Hubungi admin untuk diaktifkan.')}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
