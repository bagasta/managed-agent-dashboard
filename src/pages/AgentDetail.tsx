import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, AgentMessageResponse, AgentStepSummary, ModelInfo, OAuthConnection, ToolsConfig, WAQRResponse, McpTool, User } from '../types'
import { MCP_TOOLS } from '../types'
import { agentApi } from '../api/agents'
import { oauthApi } from '../api/oauth'
import { useI18n } from '../i18n'
import {
  configureGoogleWorkspaceTools,
  getGoogleWorkspaceServer,
  isGoogleWorkspaceMcpEnabled,
} from '../api/googleWorkspace'

const TOOL_OPTIONS: { key: keyof ToolsConfig; label: string; desc: string }[] = [
  { key: 'memory', label: 'Memory', desc: 'Simpan konteks percakapan agar agent ingat user.' },
  { key: 'skills', label: 'Skills', desc: 'Izinkan agent memakai skill internal yang tersedia.' },
  { key: 'escalation', label: 'Eskalasi Operator', desc: 'Agent bisa meneruskan chat ke operator manusia.' },
  { key: 'rag', label: 'Dokumen (RAG)', desc: 'Jawab pertanyaan berdasarkan dokumen yang diunggah.' },
  { key: 'scheduler', label: 'Jadwal & Reminder', desc: 'Buat dan kelola pengingat untuk pelanggan.' },
  { key: 'http', label: 'Integrasi HTTP', desc: 'Panggil API eksternal (GET/POST).' },
  { key: 'tavily', label: 'Web Search', desc: 'Cari informasi web ketika runtime mendukung Tavily.' },
  { key: 'whatsapp_media', label: 'Kirim Media WA', desc: 'Mengirim gambar dan dokumen ke WhatsApp.' },
  { key: 'sandbox', label: 'Sandbox Kode', desc: 'Jalankan kode Python di container terisolasi.' },
  { key: 'tool_creator', label: 'Tool Creator', desc: 'Izinkan agent membuat tool internal tambahan.' },
  { key: 'wa_agent_manager', label: 'WA Agent Manager', desc: 'Kelola agent lain melalui jalur WhatsApp.' },
]

type TestChatMessage = {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
  runId?: string
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface p-5 sm:p-6">
      <div className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  )
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
      active
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {label}
    </span>
  )
}

function normalizeExternalId(value: string | null | undefined) {
  return (value || '').replace(/[^\d]/g, '')
}

function agentBelongsToUser(agent: Agent, user: User) {
  const rawOwner = user.external_id.trim()
  const owner = normalizeExternalId(user.external_id)
  const matches = (value: string | null | undefined) => {
    const raw = (value || '').trim()
    if (!raw) return false
    return raw === rawOwner || (owner ? normalizeExternalId(raw) === owner : false)
  }
  return matches(agent.owner_external_id) || (agent.operator_ids || []).some(matches)
}

export default function AgentDetail({ user }: { user: User }) {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [draft, setDraft] = useState<Partial<Agent> | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [qr, setQr] = useState<WAQRResponse | null>(null)
  const [waStatus, setWaStatus] = useState<string | null>(null)
  const [connections, setConnections] = useState<OAuthConnection[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [testSessionId, setTestSessionId] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('Halo! Siapa kamu dan apa saja yang bisa kamu bantu?')
  const [testMessages, setTestMessages] = useState<TestChatMessage[]>([])
  const [testSending, setTestSending] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getAgent(id).then((a) => { setAgent(a); setDraft(a) }).catch((e) => setMsg({ type: 'err', text: String(e) }))
    api.listModels().then((r) => setModels(r.models)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    agentApi.getConnections(id, user.external_id).then(setConnections).catch(() => {})
  }, [id, user.external_id, searchParams.get('oauth_success')])

  useEffect(() => {
    if (agent?.channel_type === 'whatsapp' && agent.wa_device_id) {
      api.getWAStatus(agent.id).then((r) => setWaStatus(r.status)).catch(() => {})
    }
  }, [agent])

  if (!agent || !draft) {
    return (
      <div className="page">
        {msg ? <div className="text-sm text-red-600">{msg.text}</div> : <div className="skeleton h-24 mt-6" />}
      </div>
    )
  }

  if (!agentBelongsToUser(agent, user)) {
    return (
      <div className="page">
        <div className="max-w-4xl mx-auto">
          <Link to="/app/agents" className="text-xs text-ink-500 hover:text-ink-900">{t('common.back', 'Kembali')} AI Staff</Link>
          <div className="surface p-6 mt-4">
            <div className="text-sm font-medium text-red-700">{t('agent.notOwnerTitle', 'Agent ini bukan milik akun yang sedang login.')}</div>
            <p className="mt-2 text-sm text-ink-500">{t('agent.notOwnerBody', 'Dashboard hanya menampilkan dan membuka agent milik user login.')}</p>
          </div>
        </div>
      </div>
    )
  }

  const activeAgent = agent
  const tools = draft.tools_config || {}
  const savedGoogleToolIds = tools.google_workspace?.tool_ids || []
  const savedGoogleScopes = tools.google_workspace?.scopes || []
  const connectedGoogleScopes = new Set([
    ...connections.flatMap((conn) => conn.scopes || []),
    ...savedGoogleScopes,
  ])
  const googleConnectedWithoutScopes = connections.length > 0 && connectedGoogleScopes.size === 0
  const selectedUnconnectedTools = selectedTools.filter((toolId) => {
    const tool = MCP_TOOLS.find((item) => item.id === toolId)
    return tool ? !tool.scopes.every((scope) => connectedGoogleScopes.has(scope)) : false
  })
  const googleServer = getGoogleWorkspaceServer(tools)
  const googleRuntimeActive = isGoogleWorkspaceMcpEnabled(tools)

  const parseList = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)

  const listToText = (items: string[] | null | undefined) => (items || []).join('\n')

  const dashboardOwnerOperators = () => [
    ...new Set([
      user.external_id,
      normalizeExternalId(user.external_id),
    ].filter(Boolean)),
  ]

  const withDashboardOwnerOperators = (items: string[] | null | undefined) => [
    ...new Set([
      ...dashboardOwnerOperators(),
      ...(items || []),
    ].filter(Boolean)),
  ]

  const patchTools = (nextTools: ToolsConfig) => {
    setDraft({ ...draft, tools_config: nextTools })
  }

  const patchSandboxConfig = (key: string, value: string) => {
    setDraft({
      ...draft,
      sandbox_config: {
        ...(draft.sandbox_config || {}),
        [key]: value,
      },
    })
  }

  const patchEscalationConfig = (key: string, value: string) => {
    setDraft({
      ...draft,
      escalation_config: {
        ...(draft.escalation_config || {}),
        [key]: value,
      },
    })
  }

  const patchSafetyRules = (value: string) => {
    setDraft({
      ...draft,
      safety_policy: {
        ...(draft.safety_policy || {}),
        rules: parseList(value),
      },
    })
  }

  const patchSafetyNumber = (key: string, value: string) => {
    setDraft({
      ...draft,
      safety_policy: {
        ...(draft.safety_policy || {}),
        [key]: value.trim() ? Number(value) : undefined,
      },
    })
  }

  const patchGoogleMcpServer = (serverPatch: { url?: string; transport?: string }) => {
    patchTools(configureGoogleWorkspaceTools(tools, [], { ...googleServer, ...serverPatch }))
  }

  async function activateGoogleRuntime() {
    if (!id) return
    setMsg(null)
    try {
      const updatedTools = configureGoogleWorkspaceTools(tools, [], googleServer)
      const updated = await api.updateAgent(activeAgent.id, { tools_config: updatedTools })
      setAgent(updated)
      setDraft(updated)
      setMsg({ type: 'ok', text: t('agent.runtimeActivated', 'Runtime Google Workspace sudah aktif di agent ini.') })
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal mengaktifkan runtime Google' })
    }
  }

  async function save() {
    if (!id || !draft) return
    setSaving(true); setMsg(null)
    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        instructions: draft.instructions,
        model: draft.model,
        temperature: draft.temperature,
        max_tokens: draft.max_tokens,
        tools_config: draft.tools_config,
        sandbox_config: draft.sandbox_config,
        safety_policy: draft.safety_policy,
        escalation_config: draft.escalation_config,
        operator_ids: withDashboardOwnerOperators(draft.operator_ids),
        allowed_senders: draft.allowed_senders,
      }
      const updated = await api.updateAgent(id, payload)
      setAgent(updated); setDraft(updated)
      setMsg({ type: 'ok', text: t('agent.saved', 'Tersimpan.') })
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  async function connectWA() {
    if (!id) return
    setMsg(null)
    try {
      const r = await api.connectWhatsApp(id)
      setQr(r)
      setWaStatus(r.status)
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal connect WA' })
    }
  }

  async function refreshQR() {
    if (!id) return
    try {
      const r = await api.getWAQR(id)
      setQr(r); setWaStatus(r.status)
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal ambil QR' })
    }
  }

  async function disconnectWA() {
    if (!id) return
    try {
      await api.disconnectWA(id); setQr(null); setWaStatus(null)
      const refreshed = await api.getAgent(id); setAgent(refreshed); setDraft(refreshed)
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal disconnect' })
    }
  }

  async function handleConnect() {
    if (!id || selectedUnconnectedTools.length === 0) return
    try {
      const updatedTools = configureGoogleWorkspaceTools(tools, selectedUnconnectedTools, googleServer)
      const updated = await api.updateAgent(activeAgent.id, { tools_config: updatedTools })
      setAgent(updated)
      setDraft(updated)
      await oauthApi.startConnect(id, user.external_id, selectedUnconnectedTools)
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal memulai koneksi Google' })
    }
  }

  async function remove() {
    if (!id) return
    if (!confirm(t('agent.confirmDelete', 'Hapus staf AI "{name}"?', { name: agent?.name || '' }))) return
    try {
      await api.deleteAgent(id)
      nav('/app/agents')
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal menghapus' })
    }
  }

  function getDashboardExternalUserId() {
    return user.external_id || user.id || `dashboard-test-${activeAgent.id}`
  }

  async function ensureTestSession() {
    if (testSessionId) return testSessionId
    const session = await api.createAgentSession(activeAgent.id, {
      external_user_id: getDashboardExternalUserId(),
      metadata: {
        source_app: 'internal-dashboard',
        source: 'dashboard-test',
        locale: 'id-ID',
      },
    })
    setTestSessionId(session.id)
    return session.id
  }

  function compactText(value: string, limit = 4000) {
    const text = value.trim()
    return text.length > limit ? `${text.slice(0, limit)}\n…` : text
  }

  function stringifyResult(value: unknown) {
    if (typeof value === 'string') return value
    if (value == null) return ''
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  function hasGoogleFormOutput(text: string) {
    return /docs\.google\.com\/forms|forms\.gle|form id:|edit url:|responder url:|create_form|batch_update_form|get_form/i.test(text)
  }

  function formatToolOutputs(steps: AgentStepSummary[] | undefined) {
    const relevantSteps = (steps || []).filter((step) => {
      const tool = step.tool || ''
      const result = stringifyResult(step.result)
      return /form|google|workspace/i.test(tool) || hasGoogleFormOutput(result)
    })
    if (relevantSteps.length === 0) return ''

    const rendered = relevantSteps
      .map((step) => {
        const label = step.tool || `step ${step.step ?? ''}`.trim()
        const result = stringifyResult(step.result)
        if (!result.trim()) return ''
        return `Tool ${label}:\n${compactText(result)}`
      })
      .filter(Boolean)
      .join('\n\n')
    return rendered ? `Output tool:\n${rendered}` : ''
  }

  function getReplyText(response: AgentMessageResponse) {
    const reply = (response.reply || '').trim()
    const toolOutput = formatToolOutputs(response.steps)
    if (reply) {
      if (toolOutput && hasGoogleFormOutput(toolOutput) && !hasGoogleFormOutput(reply)) {
        return `${reply}\n\n${toolOutput}`
      }
      return reply
    }
    const messages = response.messages_to_user || []
    const text = messages
      .map((m) => (typeof m === 'string' ? m : m.message || m.text || m.content || ''))
      .filter(Boolean)
      .join('\n\n')
    return text || toolOutput || 'AI selesai merespons, tapi tidak ada teks balasan di response.'
  }

  async function sendTestMessage(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault()
    const text = testInput.trim()
    if (!text || testSending) return
    setTestInput('')
    setTestError(null)
    setTestSending(true)
    setTestMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text }])
    try {
      const sessionId = await ensureTestSession()
      const response = await api.sendAgentMessage(activeAgent.id, sessionId, activeAgent.api_key, {
        message: text,
        metadata: {
          source: 'dashboard',
          locale: 'id-ID',
        },
      })
      setTestMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: getReplyText(response),
          runId: response.run_id,
        },
      ])
    } catch (e: unknown) {
      const text = e instanceof Error ? e.message : 'Gagal mengetes AI'
      setTestError(text)
      setTestMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: 'system', text }])
    } finally {
      setTestSending(false)
    }
  }

  const sandboxConfig = draft.sandbox_config || {}
  const safetyPolicy = draft.safety_policy || {}
  const escalationConfig = draft.escalation_config || {}
  const safetyRulesText = Array.isArray(safetyPolicy.rules)
    ? safetyPolicy.rules.map((rule) => String(rule)).join('\n')
    : ''
  const maxOutputLength = typeof safetyPolicy.max_output_length === 'number'
    ? String(safetyPolicy.max_output_length)
    : ''
  const sandboxMemory = typeof sandboxConfig.memory === 'string' ? sandboxConfig.memory : ''
  const sandboxCpu = typeof sandboxConfig.cpu === 'string' ? sandboxConfig.cpu : ''
  const escalationChannel = typeof escalationConfig.channel_type === 'string' ? escalationConfig.channel_type : 'whatsapp'
  const operatorPhone = typeof escalationConfig.operator_phone === 'string' ? escalationConfig.operator_phone : ''
  const tokenUsagePercent = agent.token_quota > 0 ? Math.min(100, (agent.tokens_used / agent.token_quota) * 100) : 0
  const selectedToolLabels = savedGoogleToolIds
    .map((toolId) => MCP_TOOLS.find((tool) => tool.id === toolId)?.name || toolId)
    .slice(0, 4)

  const testPanel = (
    <div className="surface overflow-hidden">
      <div className="border-b border-ink-100 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t('agent.testTitle', 'Test AI')}</div>
            <div className="mt-0.5 text-xs text-ink-500">
              {t('agent.testSubtitle', 'Coba agent ini sebelum dipakai user.')}
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost text-xs py-1.5 px-3"
            onClick={() => {
              setTestSessionId(null)
              setTestMessages([])
              setTestError(null)
            }}
            disabled={testSending}
          >
            {t('common.reset', 'Reset')}
          </button>
        </div>
        {testSessionId && (
          <div className="mt-2 text-[11px] text-ink-400 truncate">
            Session {testSessionId}
          </div>
        )}
      </div>

      <div className="h-[420px] xl:h-[calc(100vh-390px)] min-h-[320px] overflow-y-auto bg-ink-50 p-4 space-y-3">
        {testMessages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-sm font-medium text-ink-700">{t('agent.testEmptyTitle', 'Belum ada pesan test')}</div>
              <div className="mt-1 text-xs text-ink-500 max-w-xs">
                {t('agent.testEmptyBody', 'Kirim contoh pertanyaan untuk mengecek gaya bicara, tools, dan integrasi agent.')}
              </div>
            </div>
          </div>
        )}
        {testMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : m.role === 'system'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-white text-ink-800 border border-ink-100'
              }`}
            >
              {m.text}
              {m.runId && <div className="mt-2 text-[11px] opacity-60">Run ID: {m.runId}</div>}
            </div>
          </div>
        ))}
        {testSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-ink-100 rounded-2xl px-4 py-3 text-sm text-ink-500">
              {t('agent.waitingReply', 'Menunggu balasan...')}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendTestMessage} className="border-t border-ink-100 bg-white p-3">
        {testError && <div className="mb-2 text-xs text-red-600">{testError}</div>}
        <div className="flex gap-2">
          <textarea
            className="input min-h-[48px] max-h-32 resize-y"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder={t('agent.testPlaceholder', 'Tulis pesan test...')}
            disabled={testSending}
          />
          <button
            type="submit"
            className="btn-primary self-end disabled:opacity-50"
            disabled={testSending || !testInput.trim()}
          >
            {testSending ? '...' : t('common.send', 'Kirim')}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-ink-500 mb-3">
          <Link to="/app/agents" className="hover:text-ink-900">AI Staff</Link>
          <span>/</span>
          <span>{agent.name}</span>
        </div>
        <div className="surface p-5 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{agent.name}</h1>
              <div className="mt-1 text-sm text-ink-500">
                {agent.model} · v{agent.version}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill active={agent.channel_type === 'whatsapp' && Boolean(agent.wa_device_id)} label="WhatsApp" />
                <StatusPill active={googleRuntimeActive} label="Google Runtime" />
                <StatusPill active={connections.length > 0} label="Google Login" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('agent-test-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="btn-ghost"
              >
                {t('agent.testTitle', 'Test AI')}
              </button>
              <button onClick={remove} className="btn-ghost text-red-600 border-red-200 hover:bg-red-50">{t('common.delete', 'Hapus')}</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? t('common.saving', 'Menyimpan...') : t('common.save', 'Simpan')}
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs text-ink-500">
                <span>{t('agent.tokenUsed', 'Token dipakai')}</span>
                <span>{agent.tokens_used.toLocaleString('id-ID')} / {agent.token_quota.toLocaleString('id-ID')}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-brand-600" style={{ width: `${tokenUsagePercent}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {selectedToolLabels.length > 0 ? (
                selectedToolLabels.map((label) => <span key={label} className="chip">{label}</span>)
              ) : (
                <span className="chip">{t('agent.noGoogleTools', 'Belum ada tool Google dipilih')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-20 -mx-4 mt-4 border-y border-ink-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden">
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => document.getElementById('agent-test-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-primary shrink-0"
            >
              {t('agent.testTitle', 'Test AI')}
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('agent-google-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-ghost shrink-0"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('agent-whatsapp-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-ghost shrink-0"
            >
              WhatsApp
            </button>
            <button onClick={save} disabled={saving} className="btn-ghost shrink-0 disabled:opacity-50">
              {saving ? t('common.saving', 'Menyimpan...') : t('common.save', 'Simpan')}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>{msg.text}</div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="grid gap-5">
            <div id="agent-test-panel" className="xl:hidden scroll-mt-24">
              {testPanel}
            </div>
          <Section title={t('agent.identity', 'Identitas')}>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-ink-500">{t('agent.name', 'Nama')}</label>
                <input className="input mt-1" value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.model', 'Model')}</label>
                <select className="input mt-1" value={draft.model || ''}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                  ))}
                  {models.length === 0 && <option value={draft.model}>{draft.model}</option>}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.maxOutputTokens', 'Max output tokens')}</label>
                <input
                  type="number"
                  min={64}
                  className="input mt-1"
                  value={draft.max_tokens ?? ''}
                  placeholder="Default"
                  onChange={(e) => setDraft({ ...draft, max_tokens: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-500">{t('agent.description', 'Deskripsi singkat')}</label>
              <input className="input mt-1" value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
          </Section>

          <Section title={t('agent.instructions', 'Instruksi (Persona & Aturan)')}>
            <textarea
              className="input mt-1 min-h-[180px] font-mono text-[13px] leading-6"
              value={draft.instructions || ''}
              onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
              <span>{t('agent.instructionsHint', 'Tulis bagaimana staf AI harus berbicara dan bertindak.')}</span>
              <span>{t('agent.temperature', 'Suhu (kreativitas)')}: {(draft.temperature ?? 0.7).toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.05"
              value={draft.temperature ?? 0.7}
              onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
              className="w-full mt-2 accent-ink-900"
            />
          </Section>

          <Section title={t('agent.capabilities', 'Kemampuan (Tools)')}>
            <div className="grid sm:grid-cols-2 gap-3">
              {TOOL_OPTIONS.map((t) => {
                const checked = Boolean((tools as Record<string, unknown>)[t.key as string])
                return (
                  <label key={t.key as string} className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 hover:bg-ink-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          tools_config: { ...tools, [t.key]: e.target.checked } as ToolsConfig,
                        })
                      }
                      className="mt-1 accent-ink-900"
                    />
                    <div>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-ink-500">{t.desc}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </Section>

          <Section title={t('agent.runtimeConfig', 'Konfigurasi Runtime')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-500">{t('agent.operatorIds', 'Operator IDs')}</label>
                <textarea
                  className="input mt-1 min-h-[86px] resize-y"
                  value={listToText(draft.operator_ids)}
                  placeholder="+62811..., satu per baris atau pisahkan koma"
                  onChange={(e) => setDraft({ ...draft, operator_ids: parseList(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.allowedSenders', 'Allowed Senders')}</label>
                <textarea
                  className="input mt-1 min-h-[86px] resize-y"
                  value={listToText(draft.allowed_senders)}
                  placeholder="Kosong = semua user boleh chat"
                  onChange={(e) => {
                    const values = parseList(e.target.value)
                    setDraft({ ...draft, allowed_senders: values.length ? values : null })
                  }}
                />
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-500">{t('agent.escalationChannel', 'Channel eskalasi')}</label>
                <select
                  className="input mt-1"
                  value={escalationChannel}
                  onChange={(e) => patchEscalationConfig('channel_type', e.target.value)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.operatorPhone', 'Nomor/ID operator eskalasi')}</label>
                <input
                  className="input mt-1"
                  value={operatorPhone}
                  placeholder="+62811..."
                  onChange={(e) => patchEscalationConfig('operator_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-500">{t('agent.sandboxMemory', 'Sandbox memory')}</label>
                <input
                  className="input mt-1"
                  value={sandboxMemory}
                  placeholder="512m"
                  onChange={(e) => patchSandboxConfig('memory', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.sandboxCpu', 'Sandbox CPU')}</label>
                <input
                  className="input mt-1"
                  value={sandboxCpu}
                  placeholder="1.0"
                  onChange={(e) => patchSandboxConfig('cpu', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-[1fr_180px] gap-4">
              <div>
                <label className="text-xs text-ink-500">{t('agent.safetyRules', 'Safety rules')}</label>
                <textarea
                  className="input mt-1 min-h-[96px] resize-y"
                  value={safetyRulesText}
                  placeholder="Satu aturan per baris"
                  onChange={(e) => patchSafetyRules(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-ink-500">{t('agent.maxOutputLength', 'Max output length')}</label>
                <input
                  type="number"
                  min={1}
                  className="input mt-1"
                  value={maxOutputLength}
                  placeholder="4000"
                  onChange={(e) => patchSafetyNumber('max_output_length', e.target.value)}
                />
              </div>
            </div>
          </Section>

          <div id="agent-whatsapp-section" className="scroll-mt-24">
            <Section title="WhatsApp">
              {agent.channel_type !== 'whatsapp' || !agent.wa_device_id ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink-500">{t('agent.whatsappNotConnected', 'Belum terhubung ke WhatsApp.')}</p>
                  <button onClick={connectWA} className="btn-primary">{t('agent.connectWhatsapp', 'Hubungkan WhatsApp')}</button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div>
                    <div className="text-xs text-ink-500">Device ID</div>
                    <div className="text-sm font-mono break-all max-w-xs">{agent.wa_device_id}</div>
                    <div className="mt-3 text-xs text-ink-500">Status</div>
                    <div className="text-sm">{waStatus ?? '—'}</div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={refreshQR} className="btn-ghost text-xs py-1.5">Refresh QR</button>
                      <button onClick={disconnectWA} className="btn-ghost text-xs py-1.5 text-red-600 border-red-200">Putus</button>
                    </div>
                  </div>
                  {qr?.qr_image && (
                    <div className="p-3 bg-white border border-ink-100 rounded-xl">
                      <img src={`data:image/png;base64,${qr.qr_image}`} alt="QR" className="w-44 h-44" />
                      <div className="mt-2 text-[11px] text-ink-500 text-center">Scan di WhatsApp - Linked devices</div>
                    </div>
                  )}
                </div>
              )}
            </Section>
          </div>

          <div id="agent-google-section" className="scroll-mt-24">
            <Section title="Google Workspace">
            <div className="mb-4 rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{t('agent.googleRuntime', 'Runtime Google Workspace')}</div>
                  <div className={`mt-1 text-xs ${googleRuntimeActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {googleRuntimeActive
                      ? t('agent.googleRuntimeActive', 'MCP google_workspace aktif di agent ini.')
                      : t('agent.googleRuntimeInactive', 'OAuth Google saja belum cukup. Aktifkan runtime MCP agar agent bisa memakai tool Google.')}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost text-xs py-1.5"
                  onClick={activateGoogleRuntime}
                >
                  {t('agent.activateRuntime', 'Aktifkan Runtime')}
                </button>
              </div>
              <div className="mt-4 grid sm:grid-cols-[1fr_180px] gap-3">
                <div>
                  <label className="text-xs text-ink-500">MCP URL</label>
                  <input
                    className="input mt-1"
                    value={googleServer.url}
                    onChange={(e) => patchGoogleMcpServer({ url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-500">Transport</label>
                  <select
                    className="input mt-1"
                    value={googleServer.transport}
                    onChange={(e) => patchGoogleMcpServer({ transport: e.target.value })}
                  >
                    <option value="streamable_http">streamable_http</option>
                    <option value="sse">sse</option>
                  </select>
                </div>
              </div>
            </div>

            {connections.length > 0 && (
              <div className="mb-4 space-y-2">
                {connections.map((conn) => (
                  <div key={conn.service} className="flex items-center justify-between p-3 rounded-lg border border-ink-100 bg-ink-50">
                    <div>
                      <div className="text-sm font-medium">{conn.email || conn.service}</div>
                      <div className="text-xs text-ink-500">
                        {connectedGoogleScopes.size > 0 ? `${connectedGoogleScopes.size} izin Google aktif` : 'Akun terhubung, izin layanan belum terbaca'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Endpoint cabut koneksi Google belum tersedia di backend"
                      className="text-xs text-ink-400 border border-ink-200 rounded px-2 py-1 cursor-not-allowed bg-white"
                    >
                      Cabut segera
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-700">{t('agent.addConnection', 'Tambah Koneksi Baru')}</p>
              {googleConnectedWithoutScopes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {t('agent.googleConnectedNoScopes', 'Akun Google sudah terhubung, tapi daftar layanan yang dipilih belum tersimpan. Pilih layanan yang dibutuhkan lalu hubungkan ulang agar status centang tersinkron.')}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {MCP_TOOLS.map((tool: McpTool) => {
                  const connected = tool.scopes.every((scope) => connectedGoogleScopes.has(scope))
                  const checked = connected || selectedTools.includes(tool.id)
                  return (
                    <label
                      key={tool.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-ink-100 hover:bg-ink-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={connected}
                        onChange={() =>
                          setSelectedTools((prev) =>
                            prev.includes(tool.id)
                              ? prev.filter((s) => s !== tool.id)
                              : [...prev, tool.id]
                          )
                        }
                        className="mt-1 accent-ink-900 disabled:opacity-70"
                      />
                      <div>
                        <div className="text-sm font-medium">{tool.name}</div>
                        <div className="text-xs text-ink-500">
                          {connected ? t('agent.connected', 'Terhubung') : tool.description}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              <button
                onClick={handleConnect}
                disabled={selectedUnconnectedTools.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('agent.connectGoogle', 'Hubungkan dengan Google')}
              </button>
            </div>
            </Section>
          </div>

          <Section title={t('agent.quotaApi', 'Kuota & API')}>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-ink-500">{t('agent.tokenQuota', 'Token quota')}</div>
                <div>{agent.token_quota.toLocaleString('id-ID')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">{t('agent.tokenUsed', 'Token dipakai')}</div>
                <div>{agent.tokens_used.toLocaleString('id-ID')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">{t('agent.activeUntil', 'Aktif sampai')}</div>
                <div>{new Date(agent.active_until).toLocaleDateString('id-ID')}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-ink-500">{t('agent.apiKey', 'Agent API Key')}</div>
              <div className="mt-1 font-mono text-xs break-all bg-ink-50 border border-ink-100 rounded-lg p-2">{agent.api_key}</div>
            </div>
          </Section>
          </div>

          <aside id="agent-test-panel-desktop" className="hidden xl:block xl:sticky xl:top-6">
            {testPanel}
          </aside>
        </div>
      </div>
    </div>
  )
}
