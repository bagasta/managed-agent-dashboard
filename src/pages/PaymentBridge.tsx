import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type PlanCode = 'tier_1' | 'tier_2' | 'tier_3'
type BridgeStatus = 'idle' | 'redirecting' | 'error'

const PLAN_CONFIG: Record<PlanCode, { label: string; description: string; dokuUrl: string }> = {
  tier_1: {
    label: 'Starter',
    description: '1 AI Staff, WhatsApp aktif, kuota 10 juta token per bulan.',
    dokuUrl: (import.meta.env.VITE_DOKU_PAYMENT_LINK_TIER_1 as string | undefined) || '',
  },
  tier_2: {
    label: 'Pro',
    description: '2 AI Staff, WhatsApp aktif, kuota 20 juta token per bulan.',
    dokuUrl: (import.meta.env.VITE_DOKU_PAYMENT_LINK_TIER_2 as string | undefined) || '',
  },
  tier_3: {
    label: 'Enterprise',
    description: 'AI Staff tanpa batas dengan kuota enterprise.',
    dokuUrl: (import.meta.env.VITE_DOKU_PAYMENT_LINK_TIER_3 as string | undefined) || '',
  },
}

const PLAN_ALIASES: Record<string, PlanCode> = {
  starter: 'tier_1',
  growth: 'tier_2',
  pro: 'tier_2',
  business: 'tier_3',
  enterprise: 'tier_3',
}

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

function resolvePlan(raw: string | null): PlanCode {
  const value = (raw || 'tier_1').toLowerCase().trim()
  if (value === 'tier_1' || value === 'tier_2' || value === 'tier_3') return value
  return PLAN_ALIASES[value] || 'tier_1'
}

function makeBridgeRef() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `pay_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function PaymentBridge() {
  const { search } = useLocation()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const initialPlan = resolvePlan(params.get('plan') || params.get('tier'))
  const initialPhone = normalizePhone(params.get('wa') || params.get('phone') || '')

  const [planCode, setPlanCode] = useState<PlanCode>(initialPlan)
  const [phone, setPhone] = useState(initialPhone)
  const [status, setStatus] = useState<BridgeStatus>('idle')
  const [error, setError] = useState('')

  const plan = PLAN_CONFIG[planCode]
  const normalizedPhone = normalizePhone(phone)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!normalizedPhone || normalizedPhone.length < 9) {
      setStatus('error')
      setError('Nomor WhatsApp belum valid. Pakai format 628xxxxxxxxxx.')
      return
    }
    if (!plan.dokuUrl) {
      setStatus('error')
      setError(`Link pembayaran DOKU untuk paket ${plan.label} belum dikonfigurasi.`)
      return
    }

    const bridgeRef = makeBridgeRef()
    const payload = {
      source: 'chiefaiofficer_payment_bridge',
      bridge_reference: bridgeRef,
      phone_number: normalizedPhone,
      plan_code: planCode,
      plan_label: plan.label,
      doku_payment_url: plan.dokuUrl,
      return_url: `${window.location.origin}/pay/return?ref=${encodeURIComponent(bridgeRef)}`,
      created_at: new Date().toISOString(),
    }

    localStorage.setItem('clevio_payment_intent', JSON.stringify(payload))
    setStatus('redirecting')
    window.location.assign(plan.dokuUrl)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-8 flex items-center justify-center">
      <section className="w-full max-w-[520px] bg-white border border-ink-100 rounded-[20px] shadow-card p-6 md:p-8">
        <Link to="/" className="text-[13px] text-brand-600">Clevio AI Staff</Link>
        <h1 className="mt-5 text-[30px] leading-tight font-semibold tracking-tight">Lanjutkan pembayaran</h1>
        <p className="mt-3 text-sm text-ink-500">
          Nomor WhatsApp ini akan dipakai untuk mengaktifkan paket setelah pembayaran DOKU terkonfirmasi.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Paket</label>
            <select
              className="input"
              value={planCode}
              onChange={(event) => setPlanCode(event.target.value as PlanCode)}
            >
              <option value="tier_1">Starter</option>
              <option value="tier_2">Pro</option>
              <option value="tier_3">Enterprise</option>
            </select>
            <p className="mt-2 text-xs text-ink-500">{plan.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Nomor WhatsApp</label>
            <input
              className="input"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="6281234567890"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'redirecting'}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {status === 'redirecting' ? 'Membuka DOKU...' : 'Bayar di DOKU'}
          </button>
        </form>

        <p className="mt-5 text-[12px] leading-relaxed text-ink-400">
          Setelah pembayaran sukses, aktivasi diproses lewat webhook pembayaran. Jangan tutup halaman DOKU sampai proses selesai.
        </p>
      </section>
    </main>
  )
}
