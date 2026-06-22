import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, User } from '../types'
import { useI18n } from '../i18n'

function Stat({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="surface p-5">
      <div className="text-xs text-ink-500">{k}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{v}</div>
      {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  )
}

function nf(n: number) {
  return new Intl.NumberFormat('id-ID').format(n)
}

export default function Overview({ user }: { user: User }) {
  const { t, language } = useI18n()
  const [agents, setAgents] = useState<Agent[]>([])
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    api.listAgents(user.external_id).then(setAgents).catch((e) => setErr(String(e)))
  }, [user.external_id])

  const sub = user.subscription
  const display = user.full_name || user.phone_number || (language === 'en' ? 'user' : 'pengguna')
  const agentCount = agents.length
  const maxAgents = sub?.max_agents ?? 0
  const tokensLeft = sub?.tokens_remaining ?? 0
  const tokensQuota = sub?.token_quota ?? 0
  const usagePct = tokensQuota > 0 ? Math.min(100, ((tokensQuota - tokensLeft) / tokensQuota) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{language === 'en' ? `Hello, ${display}.` : `Halo, ${display}.`}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('overview.summary', 'Ringkasan staf AI dan langganan Anda.')}</p>
        </div>
        <Link to="/app/arthur" className="btn-primary">{t('overview.newStaff', 'Buat staf AI baru')}</Link>
      </div>

      {err && <div className="mt-6 text-sm text-red-600">{err}</div>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          k={t('agents.title', 'Staf AI')}
          v={`${agentCount}${maxAgents ? ` / ${maxAgents}` : ''}`}
          sub={maxAgents ? t('overview.planLimit', 'Batas paket {plan}', { plan: sub?.plan_label || '' }) : undefined}
        />
        <Stat
          k={t('overview.tokensLeft', 'Token tersisa')}
          v={nf(tokensLeft)}
          sub={tokensQuota ? t('overview.tokenQuotaOf', 'dari {quota} kuota', { quota: nf(tokensQuota) }) : undefined}
        />
        <Stat k={t('profile.plan', 'Paket')} v={sub?.plan_label ?? '—'} sub={sub?.status ?? undefined} />
        <Stat
          k={t('agent.activeUntil', 'Berakhir')}
          v={sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        />
      </div>

      {sub && tokensQuota > 0 && (
        <div className="mt-6 surface p-5">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>{t('overview.monthlyUsage', 'Pemakaian token bulan ini')}</span>
            <span>{usagePct.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full bg-ink-900" style={{ width: `${usagePct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">{t('overview.yourStaff', 'Staf AI Anda')}</h2>
          <Link to="/app/agents" className="text-xs text-ink-700 hover:text-ink-900">{t('overview.viewAll', 'Lihat semua')}</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {agents.slice(0, 4).map((a) => (
            <div key={a.id} className="surface p-5">
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-ink-500 mt-1">{a.model}</div>
              <p className="mt-3 text-sm text-ink-700 line-clamp-2">{a.instructions}</p>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="surface p-8 text-center text-sm text-ink-500 md:col-span-2">
              {t('overview.empty', 'Belum ada staf AI.')} <Link to="/app/arthur" className="text-ink-900 underline">{t('overview.startArthur', 'Mulai dengan Arthur')}</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
