import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, ToolsConfig, User } from '../types'

type Step = 'greet' | 'ask_role' | 'ask_name' | 'ask_persona' | 'ask_channel' | 'confirm' | 'done'

interface Draft {
  role: string
  name: string
  persona: string
  tools: ToolsConfig
  model: string
  channel: 'whatsapp' | 'none'
}

interface ChatMessage {
  id: string
  ts: Date
  role: 'arthur' | 'user'
  text?: string
  preview?: Draft
  actions?: { label: string; onClick: () => void; primary?: boolean }[]
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-6'

function uid() { return Math.random().toString(36).slice(2, 10) }

function detectTools(text: string): ToolsConfig {
  const t = text.toLowerCase()
  return {
    rag: /dokumen|katalog|produk|menu|brosur|harga/.test(t),
    scheduler: /jadwal|booking|reminder|janji|appointment/.test(t),
    http: /integrasi|api|sistem|webhook/.test(t),
    whatsapp_media: /gambar|foto|brosur|file/.test(t),
  }
}

function buildInstructions(d: Draft): string {
  const lines = [
    `Anda adalah ${d.name}, staf AI untuk ${d.role}.`,
    `Gaya bicara: ${d.persona}.`,
    `Selalu balas dengan ringkas, sopan, dan profesional.`,
  ]
  if (d.tools.rag) lines.push('Gunakan dokumen referensi untuk menjawab pertanyaan produk.')
  if (d.tools.scheduler) lines.push('Bantu pelanggan membuat jadwal atau pengingat.')
  if (d.tools.http) lines.push('Gunakan integrasi sistem bila diperlukan.')
  return lines.join(' ')
}

function AgentCardPreview({ draft }: { draft: Draft }) {
  const tools = Object.entries(draft.tools).filter(([, v]) => v).map(([k]) => k)
  return (
    <div className="surface p-4 max-w-sm mt-1">
      <div className="text-xs text-ink-500">Pratinjau</div>
      <div className="mt-1 text-base font-medium">{draft.name || '—'}</div>
      <div className="text-xs text-ink-500">{draft.role || '—'}</div>
      <div className="mt-3 text-xs text-ink-700 line-clamp-3">{draft.persona}</div>
      <div className="mt-3 flex flex-wrap gap-1">
        {draft.channel === 'whatsapp' && <span className="chip">WhatsApp</span>}
        {tools.length === 0 ? <span className="chip">Tanpa integrasi</span> : tools.map((t) => <span key={t} className="chip">{t}</span>)}
      </div>
    </div>
  )
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

export default function Arthur({ user: _user }: { user: User }) {
  const nav = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState<Draft>({
    role: '', name: '', persona: '',
    tools: { rag: false, scheduler: false, http: false, whatsapp_media: false },
    model: DEFAULT_MODEL,
    channel: 'whatsapp',
  })
  const [step, setStep] = useState<Step>('greet')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { api.listAgents().then(setAgents).catch(() => {}) }, [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  function push(m: Omit<ChatMessage, 'id' | 'ts'>) {
    setMessages((prev) => [...prev, { ...m, id: uid(), ts: new Date() }])
  }

  function arthurSay(text: string, after?: () => void, delay = 500) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      push({ role: 'arthur', text })
      after?.()
    }, delay)
  }

  useEffect(() => {
    if (step === 'greet' && messages.length === 0) {
      arthurSay('Halo, saya Arthur. Saya bantu Anda membuat staf AI hanya dengan ngobrol.', () => {
        arthurSay('Bisnis Anda di bidang apa? Ceritakan singkat saja.', () => setStep('ask_role'))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    push({ role: 'user', text })
    setInput('')

    if (step === 'ask_role') {
      setDraft((d) => ({ ...d, role: text, tools: detectTools(text) }))
      arthurSay('Bagus. Mau diberi nama apa staf AI ini?', () => setStep('ask_name'))
      return
    }
    if (step === 'ask_name') {
      setDraft((d) => ({ ...d, name: text }))
      arthurSay(`Oke, ${text}. Bagaimana gaya bicaranya? Contoh: ramah dan santai, formal, atau singkat ke poin.`, () => setStep('ask_persona'))
      return
    }
    if (step === 'ask_persona') {
      const withPersona = { ...draft, persona: text }
      setDraft(withPersona)
      arthurSay('Pakai WhatsApp untuk balas pelanggan?', () => {
        push({
          role: 'arthur',
          actions: [
            { label: 'Ya, pakai WhatsApp', primary: true, onClick: () => pickChannel('whatsapp', withPersona) },
            { label: 'Belum sekarang', onClick: () => pickChannel('none', withPersona) },
          ],
        })
        setStep('ask_channel')
      })
      return
    }
  }

  function pickChannel(channel: 'whatsapp' | 'none', base: Draft) {
    const next = { ...base, channel }
    setDraft(next)
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      push({ role: 'arthur', text: 'Berikut pratinjaunya. Mau saya buat sekarang?' })
      push({
        role: 'arthur',
        preview: next,
        actions: [
          { label: 'Buat sekarang', primary: true, onClick: () => createAgent(next) },
          { label: 'Mulai ulang', onClick: restart },
        ],
      })
      setStep('confirm')
    }, 400)
  }

  async function createAgent(d: Draft) {
    setTyping(true)
    try {
      const payload: Record<string, unknown> = {
        name: d.name,
        description: `Staf AI untuk ${d.role}`,
        model: d.model,
        instructions: buildInstructions(d),
        tools_config: d.tools,
        temperature: 0.7,
      }
      if (d.channel === 'whatsapp') payload.channel_type = 'whatsapp'
      const created = await api.createAgent(payload)
      setAgents((prev) => [created, ...prev])
      setTyping(false)
      push({ role: 'arthur', text: `Selesai. ${d.name} sudah dibuat.` })
      push({
        role: 'arthur',
        actions: [
          { label: 'Buka pengaturan', primary: true, onClick: () => nav(`/app/agents/${created.id}`) },
          { label: 'Buat lagi', onClick: restart },
        ],
      })
      setStep('done')
    } catch (e: unknown) {
      setTyping(false)
      const err = e instanceof Error ? e.message : String(e)
      push({ role: 'arthur', text: `Gagal membuat: ${err}` })
      push({
        role: 'arthur',
        actions: [
          { label: 'Coba lagi', primary: true, onClick: () => createAgent(d) },
          { label: 'Mulai ulang', onClick: restart },
        ],
      })
    }
  }

  function restart() {
    setMessages([])
    setDraft({
      role: '', name: '', persona: '',
      tools: { rag: false, scheduler: false, http: false, whatsapp_media: false },
      model: DEFAULT_MODEL,
      channel: 'whatsapp',
    })
    setStep('greet')
  }

  const inputDisabled = step === 'confirm' || step === 'done' || step === 'ask_channel'

  return (
    <div className="flex-1 flex min-h-0">
      <aside className="w-72 shrink-0 border-r border-ink-100 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-ink-100">
          <div className="font-medium">AI Staff Anda</div>
          <div className="text-xs text-ink-500">{agents.length} terdaftar</div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {agents.length === 0 && (
            <div className="text-xs text-ink-500 px-2 py-3">Belum ada. Ngobrol dengan Arthur untuk membuat.</div>
          )}
          {agents.map((a) => (
            <button key={a.id} onClick={() => nav(`/app/agents/${a.id}`)} className="w-full text-left nav-link">
              <span className="flex-1 truncate">{a.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 bg-ink-50">
        <header className="px-6 py-4 bg-white border-b border-ink-100 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-ink-900" />
          <div>
            <div className="font-medium">Arthur</div>
            <div className="text-xs text-ink-500">Agent Builder</div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                  {m.text && (
                    <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-100 text-ink-900'}`}>
                      {m.text}
                    </div>
                  )}
                  {m.preview && <AgentCardPreview draft={m.preview} />}
                  {m.actions && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {m.actions.map((a, i) => (
                        <button key={i} onClick={a.onClick} className={a.primary ? 'btn-primary' : 'btn-ghost'}>{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="inline-block px-4 py-3 rounded-2xl bg-white border border-ink-100"><TypingDots /></div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink-100 bg-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={inputDisabled ? 'Pilih tombol di atas untuk lanjut…' : 'Ketik pesan untuk Arthur…'}
              disabled={inputDisabled}
              className="input flex-1"
            />
            <button onClick={handleSend} disabled={inputDisabled} className="btn-primary disabled:opacity-40">Kirim</button>
          </div>
        </div>
      </section>
    </div>
  )
}
