import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, User } from '../types'
import { CreateAgentModal } from '../components/CreateAgentModal'
import type { SimpleAgent } from '../api/agents'
import { useI18n } from '../i18n'

export default function Agents({ user }: { user: User }) {
  const { t } = useI18n()
  const [agents, setAgents] = useState<Agent[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const handleAgentCreated = (agent: SimpleAgent) => {
    setAgents((prev) => [agent, ...prev])
  }

  useEffect(() => {
    api.listAgents(user.external_id).then(setAgents).catch((e) => setErr(String(e))).finally(() => setLoading(false))
  }, [user.external_id])
  return (
    <div className="page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Staff</h1>
          <p className="mt-1 text-sm text-ink-500">{t('agents.count', '{count} staf AI terdaftar', { count: agents.length })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="btn-secondary">{t('agents.createManual', '+ Buat Agent Manual')}</button>
          <Link to="/app/arthur" className="btn-primary">{t('agents.createArthur', 'Buat dengan Arthur')}</Link>
        </div>
      </div>
      {err && <div className="mt-6 text-sm text-red-600">{err}</div>}
      {loading && (
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {[0,1,2,3].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
      )}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {agents.map((a) => {
          const usage = a.token_quota > 0 ? (a.tokens_used / a.token_quota) * 100 : 0
          return (
            <Link to={`/app/agents/${a.id}`} key={a.id} className="surface p-5 transition hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{a.model}</div>
                </div>
                {a.channel_type === 'whatsapp' && (
                  <span className="chip text-[10px]">WhatsApp</span>
                )}
              </div>
              <p className="mt-3 text-sm text-ink-700 line-clamp-2">{a.instructions || a.description || '—'}</p>
              <div className="mt-4 text-[11px] text-ink-500 flex justify-between">
                <span>Token {usage.toFixed(0)}%</span>
                <span className="badge-neutral">v{a.version}</span>
              </div>
              <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${Math.min(100, usage)}%` }} />
              </div>
            </Link>
          )
        })}
        {!loading && agents.length === 0 && !err && (
          <div className="text-sm text-ink-500">{t('agents.empty', 'Belum ada staf AI. Mulai dengan Arthur.')}</div>
        )}
      </div>
      <CreateAgentModal
        open={showCreate}
        ownerExternalId={user.external_id}
        onClose={() => setShowCreate(false)}
        onCreated={handleAgentCreated}
      />
    </div>
  )
}
