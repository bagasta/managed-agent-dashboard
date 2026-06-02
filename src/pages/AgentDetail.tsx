import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, ModelInfo, ToolsConfig, WAQRResponse } from '../types'

const TOOL_OPTIONS: { key: keyof ToolsConfig; label: string; desc: string }[] = [
  { key: 'rag', label: 'Dokumen (RAG)', desc: 'Jawab pertanyaan berdasarkan dokumen yang diunggah.' },
  { key: 'scheduler', label: 'Jadwal & Reminder', desc: 'Buat dan kelola pengingat untuk pelanggan.' },
  { key: 'http', label: 'Integrasi HTTP', desc: 'Panggil API eksternal (GET/POST).' },
  { key: 'whatsapp_media', label: 'Kirim Media WA', desc: 'Mengirim gambar dan dokumen ke WhatsApp.' },
  { key: 'sandbox', label: 'Sandbox Kode', desc: 'Jalankan kode Python di container terisolasi.' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface p-6">
      <div className="text-sm font-medium mb-4">{title}</div>
      {children}
    </div>
  )
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [draft, setDraft] = useState<Partial<Agent> | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [qr, setQr] = useState<WAQRResponse | null>(null)
  const [waStatus, setWaStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getAgent(id).then((a) => { setAgent(a); setDraft(a) }).catch((e) => setMsg({ type: 'err', text: String(e) }))
    api.listModels().then((r) => setModels(r.models)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (agent?.channel_type === 'whatsapp' && agent.wa_device_id) {
      api.getWAStatus(agent.id).then((r) => setWaStatus(r.status)).catch(() => {})
    }
  }, [agent])

  if (!agent || !draft) {
    return (
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {msg ? <div className="text-sm text-red-600">{msg.text}</div> : <div className="text-sm text-ink-500">Memuat…</div>}
      </div>
    )
  }

  const tools = draft.tools_config || {}

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
        tools_config: draft.tools_config,
      }
      const updated = await api.updateAgent(id, payload)
      setAgent(updated); setDraft(updated)
      setMsg({ type: 'ok', text: 'Tersimpan.' })
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

  async function remove() {
    if (!id) return
    if (!confirm(`Hapus staf AI "${agent?.name}"?`)) return
    try {
      await api.deleteAgent(id)
      nav('/app/agents')
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal menghapus' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-ink-500 mb-3">
          <Link to="/app/agents" className="hover:text-ink-900">AI Staff</Link>
          <span>/</span>
          <span>{agent.name}</span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{agent.name}</h1>
            <div className="mt-1 text-sm text-ink-500">
              {agent.model} · token {agent.tokens_used.toLocaleString('id-ID')} / {agent.token_quota.toLocaleString('id-ID')} · v{agent.version}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={remove} className="btn-ghost text-red-600 border-red-200 hover:bg-red-50">Hapus</button>
            <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mt-4 text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</div>
        )}

        <div className="mt-8 grid gap-5">
          <Section title="Identitas">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-500">Nama</label>
                <input className="input mt-1" value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-ink-500">Model</label>
                <select className="input mt-1" value={draft.model || ''}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                  ))}
                  {models.length === 0 && <option value={draft.model}>{draft.model}</option>}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-500">Deskripsi singkat</label>
              <input className="input mt-1" value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
          </Section>

          <Section title="Instruksi (Persona & Aturan)">
            <textarea
              className="input mt-1 min-h-[180px] font-mono text-[13px] leading-6"
              value={draft.instructions || ''}
              onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
              <span>Tulis bagaimana staf AI harus berbicara dan bertindak.</span>
              <span>Suhu (kreativitas): {(draft.temperature ?? 0.7).toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.05"
              value={draft.temperature ?? 0.7}
              onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
              className="w-full mt-2 accent-ink-900"
            />
          </Section>

          <Section title="Kemampuan (Tools)">
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

          <Section title="WhatsApp">
            {agent.channel_type !== 'whatsapp' || !agent.wa_device_id ? (
              <div>
                <p className="text-sm text-ink-500">Belum terhubung ke WhatsApp.</p>
                <button onClick={connectWA} className="btn-primary mt-3">Hubungkan WhatsApp</button>
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
                    <div className="mt-2 text-[11px] text-ink-500 text-center">Scan di WhatsApp → Linked devices</div>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Kuota & API">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-ink-500">Token quota</div>
                <div>{agent.token_quota.toLocaleString('id-ID')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Token dipakai</div>
                <div>{agent.tokens_used.toLocaleString('id-ID')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Aktif sampai</div>
                <div>{new Date(agent.active_until).toLocaleDateString('id-ID')}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-ink-500">Agent API Key</div>
              <div className="mt-1 font-mono text-xs break-all bg-ink-50 border border-ink-100 rounded-lg p-2">{agent.api_key}</div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
