export interface ToolsConfig {
  [key: string]: unknown
  memory?: boolean
  skills?: boolean
  escalation?: boolean
  rag?: boolean
  scheduler?: boolean
  http?: boolean
  tavily?: boolean
  whatsapp_media?: boolean
  sandbox?: boolean
  tool_creator?: boolean
  wa_agent_manager?: boolean
  deploy?: boolean
  builder?: boolean
  preset_id?: string
  business_context?: string
  domain?: string
  file_capability?: string
  agent_blueprint?: Record<string, unknown> | string
  operating_manual?: Record<string, unknown>
  mcp?: boolean | Record<string, unknown>
  google_workspace?: {
    tool_ids?: string[]
    scopes?: string[]
    updated_at?: string
  }
  subagents?: { enabled?: boolean; agent_ids?: string[] }
}

export interface Agent {
  id: string
  name: string
  description: string | null
  instructions: string
  model: string
  temperature: number
  max_tokens: number | null
  tools_config: ToolsConfig
  sandbox_config?: Record<string, unknown>
  safety_policy?: Record<string, unknown>
  escalation_config?: Record<string, unknown>
  operator_ids?: string[]
  allowed_senders?: string[] | null
  capabilities?: string[]
  owner_external_id?: string | null
  created_by_type?: string | null
  created_by_agent_id?: string | null
  created_by_agent_name?: string | null
  channel_type: string | null
  wa_device_id: string | null
  api_key: string
  token_quota: number
  tokens_used: number
  quota_period_days: number
  active_until: string
  version: number
  created_at: string
  updated_at: string
  qr_image?: string
}

export interface AgentListResponse {
  items: Agent[]
  total: number
  limit: number
  offset: number
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  context_length: number
  description: string
}

export interface Subscription {
  plan_code: string
  plan_label: string
  status: string
  token_quota: number
  tokens_used: number
  tokens_remaining: number
  max_agents: number
  subagents_allowed: boolean
  wa_connect: boolean
  expires_at: string | null
  grace_until: string | null
}

export interface User {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  external_id: string
  email_verified: boolean
  has_used_trial: boolean
  created_at: string
  subscription: Subscription | null
}

export interface WAQRResponse {
  device_id: string
  qr_image: string
  status: string
}

export interface AgentSession {
  id: string
  agent_id?: string
  external_user_id?: string
  created_at?: string
  updated_at?: string
}

export interface AgentStepSummary {
  step?: number
  tool?: string
  args?: Record<string, unknown>
  result?: string
}

export interface AgentMessageResponse {
  reply?: string
  run_id?: string
  steps?: AgentStepSummary[]
  messages_to_user?: Array<{ message?: string; text?: string; content?: string } | string>
}

export type OAuthConnection = {
  service: string
  email?: string | null
  scopes: string[]
  createdAt: string
  expiresAt: string
}

export type McpTool = {
  id: string
  name: string
  service: string
  description: string
  scopes: string[]
  category: 'sensitive' | 'non-sensitive'
}

export const GOOGLE_BASELINE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

export const MCP_TOOLS: McpTool[] = [
  {
    id: 'gmail-send',
    name: 'Gmail (Send)',
    service: 'gmail',
    description: 'Mengirim email hanya setelah pengguna meminta agent mengirimkannya. Agent tidak menghapus atau mengubah email.',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    category: 'sensitive',
  },
  {
    id: 'gmail-read',
    name: 'Gmail (Read)',
    service: 'gmail',
    description: 'Membaca email untuk merangkum atau mengambil informasi yang diminta pengguna. Agent tidak mengubah email.',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    category: 'sensitive',
  },
  {
    id: 'calendar-read',
    name: 'Google Calendar — Lihat event',
    service: 'calendar',
    description: 'Melihat event kalender untuk menjawab pertanyaan jadwal. Tidak dapat membuat, mengubah, atau menghapus event.',
    scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    category: 'sensitive',
  },
  {
    id: 'calendar-manage',
    name: 'Google Calendar — Kelola event',
    service: 'calendar',
    description: 'Membuat, mengubah, dan menghapus event kalender hanya atas permintaan pengguna. Izin ini juga mencakup melihat event.',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    category: 'sensitive',
  },
  {
    id: 'docs-read',
    name: 'Google Docs — Lihat dokumen',
    service: 'docs',
    description: 'Membaca isi dokumen Google Docs untuk menjawab atau merangkum. Tidak dapat membuat atau mengubah dokumen.',
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    category: 'sensitive',
  },
  {
    id: 'docs-manage',
    name: 'Google Docs — Buat & edit dokumen',
    service: 'docs',
    description: 'Membuat dan mengedit dokumen Google Docs atas permintaan pengguna. Izin ini juga mencakup membaca dokumen.',
    scopes: ['https://www.googleapis.com/auth/documents'],
    category: 'sensitive',
  },
  {
    id: 'forms-body-read',
    name: 'Google Forms — Lihat struktur formulir',
    service: 'forms',
    description: 'Melihat judul, pertanyaan, dan pengaturan formulir. Tidak dapat membuat atau mengubah formulir.',
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
    category: 'sensitive',
  },
  {
    id: 'forms-manage',
    name: 'Google Forms — Buat & edit formulir',
    service: 'forms',
    description: 'Membuat dan memperbarui struktur formulir atas permintaan pengguna. Google Forms API tidak menyediakan izin hapus formulir terpisah.',
    scopes: ['https://www.googleapis.com/auth/forms.body'],
    category: 'sensitive',
  },
  {
    id: 'forms-responses-read',
    name: 'Google Forms — Lihat respons',
    service: 'forms',
    description: 'Membaca respons/pengisian formulir untuk rekap atau analisis. Tidak dapat mengubah respons.',
    scopes: [
      'https://www.googleapis.com/auth/forms.responses.readonly',
    ],
    category: 'sensitive',
  },
]

export const GOOGLE_WORKSPACE_SCOPE_ALLOWLIST = new Set([
  ...GOOGLE_BASELINE_SCOPES,
  ...MCP_TOOLS.flatMap((tool) => tool.scopes),
])

// Scope tulis Google juga mencakup akses baca pasangannya. Kita kirim hanya
// scope yang lebih luas agar permintaan OAuth tetap minimal dan tidak duplikat.
const GOOGLE_SCOPE_IMPLICATIONS: Record<string, string[]> = {
  'https://www.googleapis.com/auth/calendar.events': ['https://www.googleapis.com/auth/calendar.events.readonly'],
  'https://www.googleapis.com/auth/documents': ['https://www.googleapis.com/auth/documents.readonly'],
  'https://www.googleapis.com/auth/forms.body': ['https://www.googleapis.com/auth/forms.body.readonly'],
}

export function hasGoogleScope(grantedScopes: Iterable<string>, requiredScope: string) {
  const granted = new Set(grantedScopes)
  return granted.has(requiredScope) || Object.entries(GOOGLE_SCOPE_IMPLICATIONS)
    .some(([scope, impliedScopes]) => granted.has(scope) && impliedScopes.includes(requiredScope))
}

export function isSupportedGoogleToolId(toolId: string) {
  return MCP_TOOLS.some((tool) => tool.id === toolId)
}

export function getMcpToolScopes(toolIds: string[], includeBaseline = true) {
  const toolScopes = toolIds
    .filter(isSupportedGoogleToolId)
    .flatMap((id) => MCP_TOOLS.find((tool) => tool.id === id)?.scopes ?? [])
  const uniqueToolScopes = [...new Set(toolScopes)]
  const nonRedundantToolScopes = uniqueToolScopes.filter((scope) =>
    !Object.entries(GOOGLE_SCOPE_IMPLICATIONS)
      .some(([grantedScope, impliedScopes]) => grantedScope !== scope && uniqueToolScopes.includes(grantedScope) && impliedScopes.includes(scope))
  )
  return [...new Set([...(includeBaseline ? GOOGLE_BASELINE_SCOPES : []), ...nonRedundantToolScopes])]
}
