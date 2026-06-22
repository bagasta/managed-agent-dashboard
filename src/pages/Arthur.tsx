import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, AgentMessageResponse, AgentStepSummary, User } from '../types'
import { useI18n } from '../i18n'

interface ChatMessage {
  id: string
  ts: Date
  role: 'arthur' | 'user' | 'system'
  text: string
  runId?: string | null
  steps?: AgentStepSummary[]
  actions?: { label: string; onClick: () => void; primary?: boolean }[]
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function isBuilderAgent(agent: Agent) {
  const tools = agent.tools_config || {}
  const caps = agent.capabilities || []
  const name = `${agent.name || ''} ${agent.description || ''}`.toLowerCase()
  return (
    tools.builder === true ||
    caps.includes('builder') ||
    caps.includes('system') ||
    name.includes('arthur') ||
    name.includes('agent builder')
  )
}

function pickArthurAgent(agents: Agent[]) {
  const builders = agents.filter(isBuilderAgent)
  return (
    builders.find((agent) => agent.name.toLowerCase() === 'arthur') ||
    builders.find((agent) => agent.name.toLowerCase().includes('arthur')) ||
    builders[0] ||
    null
  )
}

function extractReply(response: AgentMessageResponse) {
  if (response.reply?.trim()) return response.reply.trim()
  const messages = response.messages_to_user || []
  for (const item of messages) {
    if (typeof item === 'string' && item.trim()) return item.trim()
    if (typeof item === 'object') {
      const text = item.message || item.text || item.content
      if (text?.trim()) return text.trim()
    }
  }
  return 'Arthur belum mengirim balasan. Cek run detail atau coba kirim ulang.'
}

function summarizeSteps(steps?: AgentStepSummary[]) {
  if (!steps?.length) return ''
  const tools = [...new Set(steps.map((step) => step.tool).filter(Boolean))]
  if (!tools.length) return `${steps.length} langkah diproses`
  return `${steps.length} langkah: ${tools.slice(0, 4).join(', ')}${tools.length > 4 ? ` +${tools.length - 4}` : ''}`
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 typing-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 typing-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 typing-dot" />
    </div>
  )
}

export default function Arthur({ user }: { user: User }) {
  const { t } = useI18n()
  const nav = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [arthur, setArthur] = useState<Agent | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingArthur, setLoadingArthur] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const canSend = Boolean(arthur && sessionId && !sending)

  const latestAgent = useMemo(() => {
    const userAgents = agents.filter((agent) => !isBuilderAgent(agent))
    return [...userAgents].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] || null
  }, [agents])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function push(m: Omit<ChatMessage, 'id' | 'ts'>) {
    setMessages((prev) => [...prev, { ...m, id: uid(), ts: new Date() }])
  }

  async function refreshUserAgents() {
    const owned = await api.listAgents(user.external_id)
    setAgents(owned)
    return owned
  }

  useEffect(() => {
    let cancelled = false

    async function bootArthur() {
      setLoadingArthur(true)
      setError(null)
      try {
        const [ownedAgents, allAgents] = await Promise.all([
          api.listAgents(user.external_id),
          api.listAgents(),
        ])
        if (cancelled) return
        setAgents(ownedAgents)

        const builder = pickArthurAgent(allAgents)
        if (!builder) {
          setArthur(null)
          setSessionId(null)
          setMessages([{
            id: uid(),
            ts: new Date(),
            role: 'system',
          text: t('arthur.notFound', 'Arthur backend belum ditemukan. Pastikan agent builder sudah diseed dan punya capability builder/system.'),
          }])
          return
        }

        setArthur(builder)
        const session = await api.createAgentSession(builder.id, {
          external_user_id: user.external_id,
          metadata: {
            source: 'dashboard_arthur',
            dashboard_user_id: user.id,
          },
        })
        if (cancelled) return
        setSessionId(session.id)
        setMessages([{
          id: uid(),
          ts: new Date(),
          role: 'arthur',
          text: t('arthur.boot', 'Halo, saya Arthur. Ceritakan agent seperti apa yang mau dibuat, termasuk bisnisnya, channel yang dipakai, dan integrasi yang dibutuhkan.'),
        }])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Gagal memuat Arthur')
      } finally {
        if (!cancelled) setLoadingArthur(false)
      }
    }

    bootArthur()
    return () => {
      cancelled = true
    }
  }, [user.external_id, user.id])

  async function handleSend() {
    const text = input.trim()
    if (!text || !arthur || !sessionId || sending) return

    push({ role: 'user', text })
    setInput('')
    setSending(true)
    setError(null)

    try {
      const response = await api.sendAgentMessage(arthur.id, sessionId, arthur.api_key, {
        message: text,
        external_user_id: user.external_id,
        metadata: {
          source: 'dashboard_arthur',
        },
      })
      const reply = extractReply(response)
      push({
        role: 'arthur',
        text: reply,
        runId: response.run_id,
        steps: response.steps,
      })
      const beforeIds = new Set(agents.map((agent) => agent.id))
      const nextAgents = await refreshUserAgents()
      const created = nextAgents.find((agent) => !beforeIds.has(agent.id) && !isBuilderAgent(agent))
      if (created) {
        push({
          role: 'system',
          text: `${created.name} sudah muncul di dashboard.`,
          actions: [
            { label: 'Buka agent', primary: true, onClick: () => nav(`/app/agents/${created.id}`) },
          ],
        })
      }
    } catch (err) {
      push({
        role: 'system',
        text: err instanceof Error ? err.message : 'Gagal mengirim pesan ke Arthur',
      })
    } finally {
      setSending(false)
    }
  }

  async function restart() {
    if (!arthur) return
    setSending(false)
    setError(null)
    try {
      const session = await api.createAgentSession(arthur.id, {
        external_user_id: user.external_id,
        metadata: {
          source: 'dashboard_arthur',
          dashboard_user_id: user.id,
          reset: true,
        },
      })
      setSessionId(session.id)
      setMessages([{
        id: uid(),
        ts: new Date(),
        role: 'arthur',
        text: t('arthur.newSession', 'Session baru siap. Ceritakan agent yang mau dibuat.'),
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat session Arthur')
    }
  }

  return (
    <div className="flex-1 flex min-h-0">
      <aside className="w-72 shrink-0 border-r border-ink-100 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-ink-100">
          <div className="font-medium">{t('arthur.yourStaff', 'AI Staff Anda')}</div>
          <div className="text-xs text-ink-500">{t('arthur.registered', '{count} terdaftar', { count: agents.filter((agent) => !isBuilderAgent(agent)).length })}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {agents.filter((agent) => !isBuilderAgent(agent)).length === 0 && (
            <div className="text-xs text-ink-500 px-2 py-3">{t('arthur.empty', 'Belum ada. Ngobrol dengan Arthur untuk membuat.')}</div>
          )}
          {agents.filter((agent) => !isBuilderAgent(agent)).map((agent) => (
            <button key={agent.id} onClick={() => nav(`/app/agents/${agent.id}`)} className="w-full text-left nav-link">
              <span className="flex-1 truncate">{agent.name}</span>
            </button>
          ))}
        </div>
        {latestAgent && (
          <div className="border-t border-ink-100 p-3">
            <button onClick={() => nav(`/app/agents/${latestAgent.id}`)} className="btn-ghost w-full">
              {t('arthur.openLatest', 'Buka agent terbaru')}
            </button>
          </div>
        )}
      </aside>

      <section className="flex-1 flex flex-col min-w-0 bg-ink-50">
        <header className="px-6 py-4 bg-white border-b border-ink-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${arthur ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div>
              <div className="font-medium">Arthur</div>
              <div className="text-xs text-ink-500">
                {arthur ? t('arthur.backend', 'Agent Builder backend: {name}', { name: arthur.name }) : t('arthur.finding', 'Mencari Agent Builder backend')}
              </div>
            </div>
          </div>
          <button onClick={restart} disabled={!arthur || loadingArthur} className="btn-ghost disabled:opacity-40">
            {t('common.reset', 'Reset')}
          </button>
        </header>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {loadingArthur && (
              <div className="flex justify-start">
                <div className="inline-block px-4 py-3 rounded-2xl bg-white border border-ink-100">
                  <TypingDots />
                </div>
              </div>
            )}
            {messages.map((message) => {
              const stepSummary = summarizeSteps(message.steps)
              return (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap text-left ${
                        message.role === 'user'
                          ? 'bg-ink-900 text-white'
                          : message.role === 'system'
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : 'bg-white border border-ink-100 text-ink-900'
                      }`}
                    >
                      {message.text}
                      {(message.runId || stepSummary) && (
                        <div className="mt-2 text-[11px] opacity-70">
                          {stepSummary && <div>{stepSummary}</div>}
                          {message.runId && <div>Run ID: {message.runId}</div>}
                        </div>
                      )}
                    </div>
                    {message.actions && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {message.actions.map((action, index) => (
                          <button key={index} onClick={action.onClick} className={action.primary ? 'btn-primary' : 'btn-ghost'}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="inline-block px-4 py-3 rounded-2xl bg-white border border-ink-100">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink-100 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend()
              }}
              placeholder={canSend ? t('arthur.placeholder', 'Contoh: Buatin CS WhatsApp untuk bisnis kursus, bisa jawab FAQ dan eskalasi ke admin.') : t('arthur.notReady', 'Arthur belum siap...')}
              disabled={!canSend}
              className="input flex-1"
            />
            <button onClick={handleSend} disabled={!canSend || !input.trim()} className="btn-primary disabled:opacity-40">
              {t('common.send', 'Kirim')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
