import { useState } from 'react'
import type { SimpleAgent } from '../api/agents'
import { agentApi } from '../api/agents'
import { configureGoogleWorkspaceTools } from '../api/googleWorkspace'
import { useI18n } from '../i18n'
import type { ToolsConfig } from '../types'
import { McpToolSelector } from './McpToolSelector'

type Props = {
  open: boolean
  ownerExternalId: string
  onClose: () => void
  onCreated: (agent: SimpleAgent) => void
}

type PresetId =
  | 'custom'
  | 'cs_whatsapp_basic'
  | 'approval_gated_service_agent'
  | 'faq_webchat_rag'
  | 'scheduler_assistant'
  | 'social_media_agent'
  | 'data_analyst_agent'
  | 'research_agent'
  | 'personal_assistant'

type Preset = {
  label: string
  description: string
  defaultModel: string
  defaultTemperature: number
  defaultMaxTokens: number
  defaultChannel: 'whatsapp' | 'none'
  toolsConfig: ToolsConfig
}

const DEFAULT_MODEL = 'openai/gpt-4.1-mini'

const DEFAULT_TOOLS_CONFIG: ToolsConfig = {
  memory: true,
  skills: true,
  escalation: true,
  sandbox: false,
  tool_creator: false,
  scheduler: false,
  rag: false,
  http: false,
  tavily: true,
  whatsapp_media: true,
  wa_agent_manager: false,
  subagents: { enabled: false },
}

const PRESETS: Record<PresetId, Preset> = {
  custom: {
    label: 'Custom Manual',
    description: 'Konfigurasi penuh dari dashboard.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.7,
    defaultMaxTokens: 1024,
    defaultChannel: 'whatsapp',
    toolsConfig: DEFAULT_TOOLS_CONFIG,
  },
  cs_whatsapp_basic: {
    label: 'CS WhatsApp Basic',
    description: 'Jawab pertanyaan pelanggan dan eskalasi ke operator.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.7,
    defaultMaxTokens: 800,
    defaultChannel: 'whatsapp',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, escalation: true, whatsapp_media: true },
  },
  approval_gated_service_agent: {
    label: 'Approval-Gated Service',
    description: 'Workflow jasa yang perlu review admin, pembayaran, atau approval.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.5,
    defaultMaxTokens: 2048,
    defaultChannel: 'whatsapp',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, escalation: true, whatsapp_media: true },
  },
  faq_webchat_rag: {
    label: 'FAQ & RAG Agent',
    description: 'Jawab dari dokumen, katalog, FAQ, atau knowledge base.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.4,
    defaultMaxTokens: 1024,
    defaultChannel: 'whatsapp',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, rag: true, tavily: true },
  },
  scheduler_assistant: {
    label: 'Scheduler & Reminder',
    description: 'Mengatur jadwal, reminder, booking, dan follow-up.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.5,
    defaultMaxTokens: 512,
    defaultChannel: 'whatsapp',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, scheduler: true },
  },
  social_media_agent: {
    label: 'Social Media Specialist',
    description: 'Membuat ide konten, kalender konten, caption, dan aset kerja.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.8,
    defaultMaxTokens: 2048,
    defaultChannel: 'none',
    toolsConfig: {
      ...DEFAULT_TOOLS_CONFIG,
      escalation: false,
      sandbox: true,
      whatsapp_media: false,
      subagents: { enabled: true },
    },
  },
  data_analyst_agent: {
    label: 'Data Analyst',
    description: 'Menganalisis data, tabel, CSV, dan membuat ringkasan.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.3,
    defaultMaxTokens: 2048,
    defaultChannel: 'none',
    toolsConfig: {
      ...DEFAULT_TOOLS_CONFIG,
      escalation: false,
      sandbox: true,
      whatsapp_media: false,
      subagents: { enabled: true },
    },
  },
  research_agent: {
    label: 'Research Agent',
    description: 'Riset web, analisis kompetitor, dan intelligence.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.4,
    defaultMaxTokens: 2048,
    defaultChannel: 'none',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, escalation: false, http: true, tavily: true, whatsapp_media: false },
  },
  personal_assistant: {
    label: 'Personal Assistant',
    description: 'Asisten pribadi untuk jadwal, catatan, dan follow-up.',
    defaultModel: DEFAULT_MODEL,
    defaultTemperature: 0.6,
    defaultMaxTokens: 1024,
    defaultChannel: 'whatsapp',
    toolsConfig: { ...DEFAULT_TOOLS_CONFIG, scheduler: true, escalation: false },
  },
}

function cloneToolsConfig(config: ToolsConfig): ToolsConfig {
  return JSON.parse(JSON.stringify(config)) as ToolsConfig
}

function parseList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseJsonObject(value: string, label: string): Record<string, unknown> | null {
  if (!value.trim()) return null
  const parsed = JSON.parse(value) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} harus berupa JSON object`)
  }
  return parsed as Record<string, unknown>
}

function buildInstructions(params: {
  name: string
  description: string
  businessContext: string
  domain: string
  channelType: 'whatsapp' | 'none'
  toolsConfig: ToolsConfig
  operatorName: string
}) {
  const lines = [
    `Kamu adalah ${params.name}, staf AI yang bertugas: ${params.description || 'membantu user sesuai instruksi owner'}.`,
    params.businessContext ? `Konteks bisnis/owner: ${params.businessContext}` : '',
    params.domain ? `Domain kerja: ${params.domain}.` : '',
    params.channelType === 'whatsapp'
      ? 'Gunakan bahasa Indonesia yang natural untuk WhatsApp. Jawab singkat, jelas, dan tidak memakai markdown berat.'
      : 'Jawab jelas, terstruktur, dan langsung ke kebutuhan user.',
    params.toolsConfig.rag ? 'Jika pertanyaan membutuhkan data dokumen, gunakan knowledge/RAG sebelum menjawab.' : '',
    params.toolsConfig.scheduler ? 'Untuk jadwal, reminder, booking, atau deadline, gunakan kemampuan scheduler atau integrasi kalender yang aktif.' : '',
    params.toolsConfig.escalation
      ? `Jika butuh keputusan manusia, komplain serius, pembayaran, refund, atau data tidak cukup, eskalasi ke operator${params.operatorName ? ` ${params.operatorName}` : ''}.`
      : '',
    'Jangan mengarang hasil tool. Jika tool gagal, jelaskan dengan jujur dan minta user mencoba lagi atau menghubungi operator.',
  ]
  return lines.filter(Boolean).join('\n')
}

function buildBlueprint(params: {
  presetId: PresetId
  name: string
  description: string
  businessContext: string
  domain: string
  channelType: 'whatsapp' | 'none'
  fileCapability: string
  toolsConfig: ToolsConfig
}) {
  return {
    blueprint_id: 'dashboard_manual_blueprint',
    source: 'dashboard_manual',
    preset_id: params.presetId,
    agent_name: params.name,
    goal: params.description,
    business_context: params.businessContext,
    domain: params.domain || 'generic',
    channel: params.channelType,
    file_capability: params.fileCapability,
    tools_config: params.toolsConfig,
    workflows: [
      {
        workflow_id: 'main_request',
        trigger: 'User mengirim permintaan ke agent.',
        goal: params.description || `Menjalankan tugas utama ${params.name}.`,
        required_inputs: ['Tujuan user', 'konteks percakapan', 'data tambahan bila diperlukan'],
        expected_output: 'Jawaban atau tindakan yang selesai, jujur, dan bisa ditindaklanjuti.',
      },
      {
        workflow_id: 'handoff_or_failure',
        trigger: 'Data tidak cukup, butuh approval manusia, atau tool gagal.',
        goal: 'Menjaga jawaban tetap aman dan tidak mengarang.',
        required_inputs: ['Alasan gagal atau alasan eskalasi', 'ringkasan kebutuhan user'],
        expected_output: 'Eskalasi ke operator atau instruksi retry yang jelas.',
      },
    ],
  }
}

function buildOperatingManual(params: {
  name: string
  description: string
  businessContext: string
  domain: string
  channelType: 'whatsapp' | 'none'
  fileCapability: string
  toolsConfig: ToolsConfig
}) {
  const missingContext = [
    !params.businessContext ? 'business_context' : '',
    !params.description ? 'agent_goal' : '',
  ].filter(Boolean)
  const allowedTools = Object.entries(params.toolsConfig)
    .filter(([, enabled]) => {
      if (typeof enabled === 'boolean') return enabled
      if (enabled && typeof enabled === 'object' && 'enabled' in enabled) {
        return Boolean((enabled as { enabled?: boolean }).enabled)
      }
      return false
    })
    .map(([key]) => key)

  return {
    manual_id: 'agent_operating_manual',
    version: 1,
    source: 'dashboard_manual',
    domain: params.domain || 'generic',
    domain_confidence: params.domain ? 'medium' : 'low',
    maturity: missingContext.length ? 'needs_review' : 'usable',
    owner_review_required: Boolean(missingContext.length),
    missing_context: missingContext,
    assumptions: [
      'SOP dibuat dari konfigurasi manual dashboard.',
      'Owner perlu review ulang jika konteks bisnis belum lengkap.',
    ],
    workflows: [
      {
        workflow_id: 'intake_and_response',
        name: 'Intake dan respons utama',
        trigger: 'User mengirim pesan atau permintaan.',
        goal: params.description || `Membantu user sebagai ${params.name}.`,
        required_inputs: ['Permintaan user', 'konteks percakapan', 'data wajib sesuai kasus'],
        steps: [
          'Pahami tujuan user dan identifikasi data yang kurang.',
          'Gunakan memory, knowledge, atau integrasi resmi yang aktif sebelum menjawab fakta spesifik.',
          'Berikan jawaban singkat dan actionable.',
          'Simpan konteks penting jika memory aktif.',
        ],
        decision_points: [
          'Jika informasi kurang, tanya klarifikasi.',
          'Jika butuh keputusan manusia atau approval, eskalasi.',
          'Jika tool gagal, jangan mengarang hasil.',
        ],
        allowed_tools: allowedTools,
        escalation_rules: params.toolsConfig.escalation
          ? ['Eskalasi untuk komplain serius, approval, refund, pembayaran, atau permintaan di luar SOP.']
          : ['Jika tidak bisa membantu, jelaskan batasan secara jujur.'],
        prohibited_actions: [
          'Mengklaim sudah menjalankan tool padahal gagal.',
          'Membuat keputusan pembayaran/refund/approval tanpa izin owner.',
          'Membocorkan konfigurasi internal agent.',
        ],
        final_output: 'Jawaban final ke user atau eskalasi dengan ringkasan konteks.',
      },
      {
        workflow_id: 'tool_failure_recovery',
        name: 'Pemulihan saat tool gagal',
        trigger: 'Integrasi, MCP, sandbox, RAG, atau scheduler tidak tersedia.',
        goal: 'Memberi status jujur dan next step yang jelas.',
        required_inputs: ['Tool yang gagal', 'aksi yang diminta user'],
        steps: [
          'Jelaskan bahwa proses belum berhasil.',
          'Sebutkan aksi yang belum selesai tanpa detail teknis berlebihan.',
          'Minta user mencoba lagi atau eskalasi jika penting.',
        ],
        decision_points: ['Jika data sensitif atau transaksi, eskalasi ke operator.'],
        allowed_tools: params.toolsConfig.escalation ? ['escalation'] : [],
        escalation_rules: params.toolsConfig.escalation ? ['Eskalasi jika user butuh bantuan manusia.'] : [],
        prohibited_actions: ['Mengirim link atau output palsu.'],
        final_output: 'Status gagal yang jujur dan langkah berikutnya.',
      },
    ],
    knowledge_plan: {
      must_have: params.businessContext ? ['Konteks bisnis dari owner'] : ['Konteks bisnis perlu dilengkapi'],
      nice_to_have: ['FAQ', 'daftar produk/layanan', 'aturan operasional', 'template jawaban'],
      needs_upload: Boolean(params.toolsConfig.rag),
    },
    memory_plan: [
      { key: 'business_context', value_to_store: params.businessContext || params.description || params.name },
    ],
    validation_checklist: [
      'Instructions sesuai tujuan agent.',
      'Tool yang dibutuhkan sudah aktif.',
      'Operator dan allowed sender sudah benar.',
      'Google Workspace sudah login jika tool Google dipilih.',
    ],
  }
}

export function CreateAgentModal({ open, ownerExternalId, onClose, onCreated }: Props) {
  const { t } = useI18n()
  const [presetId, setPresetId] = useState<PresetId>('custom')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [businessContext, setBusinessContext] = useState('')
  const [domain, setDomain] = useState('')
  const [instructions, setInstructions] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [tokenQuota, setTokenQuota] = useState('4000000')
  const [quotaPeriodDays, setQuotaPeriodDays] = useState('30')
  const [channelType, setChannelType] = useState<'whatsapp' | 'none'>('whatsapp')
  const [fileCapability, setFileCapability] = useState<'text_only' | 'enabled' | 'not_needed'>('text_only')
  const [operatorIds, setOperatorIds] = useState('')
  const [allowedSenders, setAllowedSenders] = useState('')
  const [safetyRules, setSafetyRules] = useState('Tolak permintaan yang melanggar hukum atau tidak etis.')
  const [sandboxMemory, setSandboxMemory] = useState('512m')
  const [sandboxCpu, setSandboxCpu] = useState('1.0')
  const [escalationChannel, setEscalationChannel] = useState('whatsapp')
  const [operatorPhone, setOperatorPhone] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [toolsConfig, setToolsConfig] = useState<ToolsConfig>(cloneToolsConfig(DEFAULT_TOOLS_CONFIG))
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [blueprintJson, setBlueprintJson] = useState('')
  const [operatingManualJson, setOperatingManualJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const dashboardOwnerOperators = () => [
    ...new Set([
      ownerExternalId,
      ownerExternalId.replace(/[^\d]/g, ''),
    ].filter(Boolean)),
  ]

  const applyPreset = (nextPresetId: PresetId) => {
    const preset = PRESETS[nextPresetId]
    setPresetId(nextPresetId)
    setModel(preset.defaultModel)
    setTemperature(String(preset.defaultTemperature))
    setMaxTokens(String(preset.defaultMaxTokens))
    setChannelType(preset.defaultChannel)
    setToolsConfig(cloneToolsConfig(preset.toolsConfig))
    if (!description.trim()) setDescription(preset.description)
  }

  const setTool = (key: keyof ToolsConfig, value: boolean) => {
    setToolsConfig((prev) => {
      const next: ToolsConfig = { ...prev, [key]: value }
      if (key === 'tool_creator' && value) next.sandbox = true
      if (key === 'sandbox' && !value) {
        next.tool_creator = false
        next.deploy = false
      }
      return next
    })
  }

  const applyFileCapability = (value: 'text_only' | 'enabled' | 'not_needed') => {
    setFileCapability(value)
    if (value === 'enabled') {
      setToolsConfig((prev) => ({
        ...prev,
        sandbox: true,
        whatsapp_media: true,
        subagents: { ...(typeof prev.subagents === 'object' ? prev.subagents : {}), enabled: true },
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const preset = PRESETS[presetId]
      const baseTools: ToolsConfig = {
        ...cloneToolsConfig(toolsConfig),
        tavily: toolsConfig.tavily !== false,
        preset_id: presetId,
        business_context: businessContext.trim(),
        domain: domain.trim(),
        file_capability: fileCapability,
      }
      if (fileCapability === 'enabled') {
        baseTools.sandbox = true
        baseTools.whatsapp_media = true
        baseTools.subagents = {
          ...(typeof baseTools.subagents === 'object' ? baseTools.subagents : {}),
          enabled: true,
        }
      }
      if (operatorPhone.trim()) baseTools.escalation = true

      const generatedBlueprint = buildBlueprint({
        presetId,
        name: name.trim(),
        description: description.trim() || preset.description,
        businessContext: businessContext.trim(),
        domain: domain.trim(),
        channelType,
        fileCapability,
        toolsConfig: baseTools,
      })
      baseTools.agent_blueprint = parseJsonObject(blueprintJson, 'Blueprint') || generatedBlueprint
      baseTools.operating_manual =
        parseJsonObject(operatingManualJson, 'Operating manual') ||
        buildOperatingManual({
          name: name.trim(),
          description: description.trim() || preset.description,
          businessContext: businessContext.trim(),
          domain: domain.trim(),
          channelType,
          fileCapability,
          toolsConfig: baseTools,
        })

      const nextTools = selectedTools.length > 0
        ? configureGoogleWorkspaceTools(baseTools, selectedTools)
        : baseTools

      const finalInstructions = instructions.trim() || buildInstructions({
        name: name.trim(),
        description: description.trim() || preset.description,
        businessContext: businessContext.trim(),
        domain: domain.trim(),
        channelType,
        toolsConfig: nextTools,
        operatorName: operatorName.trim(),
      })
      const operatorList = [
        ...new Set([
          ...dashboardOwnerOperators(),
          ...parseList(operatorIds || operatorPhone),
        ]),
      ]

      const agent = await agentApi.create({
        name: name.trim(),
        description: description.trim() || preset.description,
        instructions: finalInstructions,
        model,
        temperature: Number(temperature || preset.defaultTemperature),
        toolsConfig: nextTools,
        sandboxConfig: nextTools.sandbox ? { memory: sandboxMemory, cpu: sandboxCpu } : {},
        safetyPolicy: {
          rules: parseList(safetyRules),
          max_output_length: 4000,
          launch_source: 'dashboard_manual',
          preset_id: presetId,
        },
        escalationConfig: nextTools.escalation
          ? {
              channel_type: escalationChannel,
              operator_phone: operatorPhone.trim(),
              operator_name: operatorName.trim(),
            }
          : {},
        operatorIds: operatorList,
        allowedSenders: allowedSenders.trim() ? parseList(allowedSenders) : null,
        maxTokens: maxTokens.trim() ? Number(maxTokens) : null,
        tokenQuota: Number(tokenQuota || 4000000),
        quotaPeriodDays: Number(quotaPeriodDays || 30),
        channelType: channelType === 'whatsapp' ? 'whatsapp' : null,
        ownerExternalId,
      })
      onCreated(agent)
      setPresetId('custom')
      setName('')
      setDescription('')
      setBusinessContext('')
      setDomain('')
      setInstructions('')
      setModel(DEFAULT_MODEL)
      setTemperature('0.7')
      setMaxTokens('1024')
      setTokenQuota('4000000')
      setQuotaPeriodDays('30')
      setChannelType('whatsapp')
      setFileCapability('text_only')
      setOperatorIds('')
      setAllowedSenders('')
      setOperatorPhone('')
      setOperatorName('')
      setBlueprintJson('')
      setOperatingManualJson('')
      setToolsConfig(cloneToolsConfig(DEFAULT_TOOLS_CONFIG))
      setSelectedTools([])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="surface w-full max-w-lg p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{t('create.title', 'Buat Agent Manual')}</h2>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 text-xl leading-none"
          >
            x
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          <form id="create-agent-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-ink-200 p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.preset', 'Preset Arthur')}</label>
                  <select
                    value={presetId}
                    onChange={(e) => applyPreset(e.target.value as PresetId)}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  >
                    {Object.entries(PRESETS).map(([id, preset]) => (
                      <option key={id} value={id}>{preset.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.channel', 'Channel')}</label>
                  <select
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value as 'whatsapp' | 'none')}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="none">{t('create.noChannel', 'Tanpa channel')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.fileCapability', 'Kemampuan file')}</label>
                  <select
                    value={fileCapability}
                    onChange={(e) => applyFileCapability(e.target.value as 'text_only' | 'enabled' | 'not_needed')}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  >
                    <option value="text_only">{t('create.textOnly', 'Text only')}</option>
                    <option value="enabled">{t('create.fileEnabled', 'Terima/buat file')}</option>
                    <option value="not_needed">{t('create.fileNotNeeded', 'Tidak perlu file')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.agentName', 'Nama Agent')} *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Akademi Juara CS"
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.domain', 'Domain')}</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="education, ecommerce, travel, clinic_wellness"
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.goal', 'Deskripsi tujuan agent')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tugas utama agent dan tipe user yang akan dilayani."
                rows={2}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.businessContext', 'Konteks bisnis / owner')}</label>
              <textarea
                value={businessContext}
                onChange={(e) => setBusinessContext(e.target.value)}
                placeholder="Produk/layanan, aturan harga, jam operasional, gaya brand, proses order, hal yang wajib dieskalasi."
                rows={4}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.runtimeInstructions', 'Instruksi runtime')}</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Kosongkan untuk dibuat otomatis dari konteks di atas."
                rows={6}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-y"
              />
            </div>

            <div className="rounded-lg border border-ink-200 p-4">
              <div className="text-sm font-medium text-ink-900 mb-3">{t('create.runtimeCapabilities', 'Kemampuan runtime')}</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  ['memory', 'Memory percakapan'],
                  ['skills', 'Skills'],
                  ['escalation', 'Eskalasi ke operator'],
                  ['scheduler', 'Jadwal & reminder'],
                  ['rag', 'Dokumen/RAG'],
                  ['http', 'Integrasi HTTP'],
                  ['tavily', 'Web search'],
                  ['sandbox', 'Sandbox kode/file'],
                  ['tool_creator', 'Tool creator'],
                  ['whatsapp_media', 'Media WhatsApp'],
                  ['wa_agent_manager', 'Kelola agent WA'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean((toolsConfig as Record<string, unknown>)[key])}
                      onChange={(e) => setTool(key as keyof ToolsConfig, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <McpToolSelector selected={selectedTools} onChange={setSelectedTools} />

            {selectedTools.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t('create.googleNotice', 'Agent akan dibuat dengan MCP Google Workspace aktif. Setelah dibuat, buka detail agent untuk login OAuth Google dengan akun yang ingin dipakai.')}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.operatorIds', 'Operator IDs')}</label>
                <textarea
                  value={operatorIds}
                  onChange={(e) => setOperatorIds(e.target.value)}
                  placeholder="+62811..., satu per baris atau pisahkan koma"
                  rows={3}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.allowedSenders', 'Allowed Senders')}</label>
                <textarea
                  value={allowedSenders}
                  onChange={(e) => setAllowedSenders(e.target.value)}
                  placeholder="Kosong = semua user boleh chat"
                  rows={3}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-none"
                />
              </div>
            </div>

            {toolsConfig.escalation && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.escalationChannel', 'Channel eskalasi')}</label>
                  <select
                    value={escalationChannel}
                    onChange={(e) => setEscalationChannel(e.target.value)}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.operatorPhone', 'Nomor/ID operator')}</label>
                  <input
                    value={operatorPhone}
                    onChange={(e) => setOperatorPhone(e.target.value)}
                    placeholder="+62811..."
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.operatorName', 'Nama operator')}</label>
                  <input
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Tim CS"
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  />
                </div>
              </div>
            )}

            {toolsConfig.sandbox && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.sandboxMemory', 'Sandbox memory')}</label>
                  <input
                    value={sandboxMemory}
                    onChange={(e) => setSandboxMemory(e.target.value)}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.sandboxCpu', 'Sandbox CPU')}</label>
                  <input
                    value={sandboxCpu}
                    onChange={(e) => setSandboxCpu(e.target.value)}
                    className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.model', 'Model')}</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.temperature', 'Temperature')}</label>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.maxOutputTokens', 'Max output tokens')}</label>
                <input
                  type="number"
                  min={64}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.tokenQuota', 'Token quota')}</label>
                <input
                  type="number"
                  min={1}
                  value={tokenQuota}
                  onChange={(e) => setTokenQuota(e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('agent.safetyRules', 'Safety rules')}</label>
                <textarea
                  value={safetyRules}
                  onChange={(e) => setSafetyRules(e.target.value)}
                  rows={3}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.quotaPeriodDays', 'Quota period days')}</label>
                <input
                  type="number"
                  min={1}
                  value={quotaPeriodDays}
                  onChange={(e) => setQuotaPeriodDays(e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
                />
              </div>
            </div>

            <details className="rounded-lg border border-ink-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink-900">{t('create.advancedArtifacts', 'Artifact Arthur advanced')}</summary>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.blueprintJson', 'Blueprint JSON')}</label>
                  <textarea
                    value={blueprintJson}
                    onChange={(e) => setBlueprintJson(e.target.value)}
                    placeholder="Kosongkan untuk dibuat otomatis dari konfigurasi."
                    rows={8}
                    className="font-mono w-full border border-ink-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('create.manualJson', 'Operating Manual / SOP JSON')}</label>
                  <textarea
                    value={operatingManualJson}
                    onChange={(e) => setOperatingManualJson(e.target.value)}
                    placeholder="Kosongkan untuk dibuat otomatis sebagai tools_config.operating_manual."
                    rows={8}
                    className="font-mono w-full border border-ink-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-y"
                  />
                </div>
              </div>
            </details>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-ink-200 text-ink-700 rounded-lg px-4 py-2 text-sm hover:bg-ink-50"
          >
            {t('common.cancel', 'Batal')}
          </button>
          <button
            type="submit"
            form="create-agent-form"
            disabled={loading || !name.trim()}
            className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('create.creating', 'Membuat...') : t('create.submit', 'Buat Agent Manual')}
          </button>
        </div>
      </div>
    </div>
  )
}
