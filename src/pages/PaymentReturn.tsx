import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const PAYMENT_WEBHOOK_URL =
  (import.meta.env.VITE_PAYMENT_WEBHOOK_URL as string | undefined) ||
  'https://n8n.srv651498.hstgr.cloud/webhook/midtrans-aistaff'

async function postPaymentEvent(payload: Record<string, unknown>) {
  try {
    await fetch(PAYMENT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    await fetch(PAYMENT_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    }).catch(() => undefined)
  }
}

function readStoredIntent() {
  const raw = localStorage.getItem('clevio_payment_intent')
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function getFirstParam(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key)
    if (value) return value
  }
  return ''
}

function isSuccessStatus(value: string) {
  const normalized = value.trim().toLowerCase()
  return [
    'success',
    'sukses',
    'paid',
    'settlement',
    'settled',
    'completed',
    'complete',
    'capture',
    'captured',
    '00',
    'true',
  ].includes(normalized)
}

function isExplicitNonSuccessStatus(value: string) {
  const normalized = value.trim().toLowerCase()
  return [
    'pending',
    'process',
    'processing',
    'failed',
    'failure',
    'error',
    'cancel',
    'cancelled',
    'canceled',
    'expired',
    'deny',
    'denied',
    'void',
    'refund',
    'refunded',
  ].includes(normalized)
}

export default function PaymentReturn() {
  const { search } = useLocation()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const [sent, setSent] = useState(false)
  const [shouldNotify, setShouldNotify] = useState(false)
  const stored = readStoredIntent()

  const invoiceNumber = getFirstParam(params, [
    'invoice_number',
    'invoice',
    'order_id',
    'reference_id',
    'order.invoice_number',
  ])
  const transactionStatus = getFirstParam(params, [
    'status',
    'transaction_status',
    'transaction.status',
    'payment_status',
    'result',
    'status_code',
  ])
  const explicitFailure = isExplicitNonSuccessStatus(transactionStatus)
  const success =
    isSuccessStatus(transactionStatus) ||
    (!transactionStatus && Boolean(stored?.bridge_reference || params.get('ref')))

  useEffect(() => {
    if (!success) {
      setSent(false)
      setShouldNotify(false)
      return
    }

    setShouldNotify(true)
    const payload = {
      event: 'clevio_payment_success_returned',
      source: 'chiefaiofficer_payment_bridge',
      bridge_reference: params.get('ref') || stored?.bridge_reference || null,
      phone_number: stored?.phone_number || null,
      plan_code: stored?.plan_code || null,
      plan_label: stored?.plan_label || null,
      invoice_number: invoiceNumber || null,
      transaction_status: transactionStatus || 'SUCCESS_RETURN_URL',
      returned_at: new Date().toISOString(),
      query: Object.fromEntries(params.entries()),
    }

    postPaymentEvent(payload).finally(() => setSent(true))
  }, [invoiceNumber, params, stored?.bridge_reference, stored?.phone_number, stored?.plan_code, stored?.plan_label, success, transactionStatus])

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-8 flex items-center justify-center">
      <section className="w-full max-w-[520px] bg-white border border-ink-100 rounded-[20px] shadow-card p-6 md:p-8 text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-xl ${
          success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {success ? '✓' : '!'}
        </div>
        <h1 className="mt-5 text-[28px] leading-tight font-semibold tracking-tight">
          {success ? 'Pembayaran sukses diterima' : 'Pembayaran belum terkonfirmasi'}
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          {success
            ? 'Data pembayaran sukses sudah dikirim ke sistem aktivasi.'
            : explicitFailure
              ? 'Status dari DOKU belum sukses, jadi sistem aktivasi belum dipanggil.'
              : 'Halaman ini belum menerima konteks pembayaran dari DOKU, jadi sistem aktivasi belum dipanggil.'}
        </p>
        {invoiceNumber && (
          <div className="mt-5 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3 text-left">
            <div className="text-xs text-ink-500">Invoice</div>
            <div className="mt-1 text-sm font-medium text-ink-900 break-all">{invoiceNumber}</div>
          </div>
        )}
        <div className="mt-7">
          <Link to="/login" className="btn-primary">Masuk ke dashboard</Link>
        </div>
        <p className="mt-4 text-[12px] text-ink-400">
          {success
            ? (sent ? 'Status sukses sudah dikirim ke sistem aktivasi.' : 'Mengirim status sukses ke sistem aktivasi...')
            : (shouldNotify ? 'Menunggu pengiriman status...' : 'Webhook n8n tidak dipanggil karena status belum sukses.')}
        </p>
      </section>
    </main>
  )
}
