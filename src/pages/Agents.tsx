import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent } from '../types'

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.listAgents().then(setAgents).catch((e) => setErr(String(e))).finally(() => setLoading(false))
  }, [])
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Staff</h1>
          <p className="mt-1 text-sm text-ink-500">{agents.length} staf AI terdaftar</p>
        </div>
        <Link to="/app/arthur" className="btn-primary">Buat dengan Arthur</Link>
      </div>
      {err && <div className="mt-6 text-sm text-red-600">{err}</div>}
      {loading && <div className="mt-8 text-sm text-ink-500">Memuat…</div>}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {agents.map((a) => {
          const usage = a.token_quota > 0 ? (a.tokens_used / a.token_quota) * 100 : 0
          return (
            <Link to={`/app/agents/${a.id}`} key={a.id} className="surface p-5 hover:border-ink-300 transition">
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
                <span>v{a.version}</span>
              </div>
              <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-ink-900" style={{ width: `${Math.min(100, usage)}%` }} />
              </div>
            </Link>
          )
        })}
        {!loading && agents.length === 0 && !err && (
          <div className="text-sm text-ink-500">Belum ada staf AI. Mulai dengan Arthur.</div>
        )}
      </div>
    </div>
  )
}
