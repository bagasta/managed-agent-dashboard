import type { User } from '../types'
import { useI18n } from '../i18n'

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between py-3 border-b border-ink-100 last:border-0">
      <span className="text-xs text-ink-500">{k}</span>
      <span className="text-sm">{v ?? '—'}</span>
    </div>
  )
}

export default function Profile({ user }: { user: User }) {
  const { t } = useI18n()
  const sub = user.subscription
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.profile', 'Profile')}</h1>
      <p className="mt-1 text-sm text-ink-500">{t('profile.info', 'Informasi akun dan langganan.')}</p>

      <div className="mt-8 grid md:grid-cols-2 gap-6 max-w-3xl">
        <div className="surface p-6">
          <div className="text-sm font-medium mb-2">{t('profile.account', 'Akun')}</div>
          <Row k={t('agent.name', 'Nama')} v={user.full_name} />
          <Row k="Email" v={user.email} />
          <Row k={t('profile.whatsappNumber', 'Nomor WhatsApp')} v={user.phone_number ?? user.external_id} />
          <Row k={t('profile.registeredAt', 'Terdaftar')} v={new Date(user.created_at).toLocaleDateString('id-ID')} />
        </div>
        <div className="surface p-6">
          <div className="text-sm font-medium mb-2">{t('profile.subscription', 'Langganan')}</div>
          {sub ? (
            <>
              <Row k={t('profile.plan', 'Paket')} v={sub.plan_label} />
              <Row k="Status" v={sub.status} />
              <Row k={t('profile.maxAgents', 'Batas staf AI')} v={String(sub.max_agents)} />
              <Row k={t('agent.tokenQuota', 'Kuota token')} v={`${sub.tokens_remaining.toLocaleString('id-ID')} / ${sub.token_quota.toLocaleString('id-ID')}`} />
              <Row k={t('agent.activeUntil', 'Berakhir')} v={sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID') : null} />
            </>
          ) : (
            <div className="text-sm text-ink-500">{t('profile.noSubscription', 'Belum berlangganan.')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
