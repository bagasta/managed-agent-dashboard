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
  nameEn: string
  service: string
  description: string
  descriptionEn: string
  scopes: string[]
  category: 'sensitive' | 'non-sensitive'
}

export function getMcpToolName(tool: McpTool, language: 'id' | 'en') {
  return language === 'en' ? tool.nameEn : tool.name
}

export function getMcpToolDescription(tool: McpTool, language: 'id' | 'en') {
  return language === 'en' ? tool.descriptionEn : tool.description
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
    nameEn: 'Gmail (Send)',
    service: 'gmail',
    description: 'Mengirim email hanya setelah pengguna meminta agent mengirimkannya. Agent tidak menghapus atau mengubah email.',
    descriptionEn: 'Send email only after the user asks the agent to send it. The agent does not delete or change email.',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    category: 'sensitive',
  },
  {
    id: 'gmail-read',
    name: 'Gmail (Read)',
    nameEn: 'Gmail (Read)',
    service: 'gmail',
    description: 'Membaca email untuk merangkum atau mengambil informasi yang diminta pengguna. Agent tidak mengubah email.',
    descriptionEn: 'Read email to summarize or retrieve information requested by the user. The agent does not change email.',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    category: 'sensitive',
  },
  {
    id: 'drive-file-manage',
    name: 'Google Drive — Kelola file aplikasi',
    nameEn: 'Google Drive — Manage app files',
    service: 'drive',
    description: 'Melihat, membuat, mengubah, dan menghapus hanya file yang dibuat oleh aplikasi atau dipilih pengguna melalui aplikasi. Tidak dapat menjelajahi seluruh Drive.',
    descriptionEn: 'View, create, edit, and delete only files created by this app or selected by the user in this app. Cannot browse the entire Drive.',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    category: 'non-sensitive',
  },
  {
    id: 'calendar-read',
    name: 'Google Calendar — Lihat event',
    nameEn: 'Google Calendar — View events',
    service: 'calendar',
    description: 'Melihat event kalender untuk menjawab pertanyaan jadwal. Tidak dapat membuat, mengubah, atau menghapus event.',
    descriptionEn: 'View calendar events to answer scheduling questions. Cannot create, edit, or delete events.',
    scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    category: 'sensitive',
  },
  {
    id: 'calendar-manage',
    name: 'Google Calendar — Kelola event',
    nameEn: 'Google Calendar — Manage events',
    service: 'calendar',
    description: 'Membuat, mengubah, dan menghapus event kalender hanya atas permintaan pengguna. Izin ini juga mencakup melihat event.',
    descriptionEn: 'Create, edit, and delete calendar events only at the user’s request. This permission also includes viewing events.',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    category: 'sensitive',
  },
  {
    id: 'docs-read',
    name: 'Google Docs — Lihat dokumen',
    nameEn: 'Google Docs — View documents',
    service: 'docs',
    description: 'Membaca isi dokumen Google Docs untuk menjawab atau merangkum. Tidak dapat membuat atau mengubah dokumen.',
    descriptionEn: 'Read Google Docs content to answer or summarize. Cannot create or edit documents.',
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    category: 'sensitive',
  },
  {
    id: 'docs-manage',
    name: 'Google Docs — Buat & edit dokumen',
    nameEn: 'Google Docs — Create & edit documents',
    service: 'docs',
    description: 'Membuat dan mengedit dokumen Google Docs atas permintaan pengguna. Izin ini juga mencakup membaca dokumen.',
    descriptionEn: 'Create and edit Google Docs at the user’s request. This permission also includes reading documents.',
    scopes: ['https://www.googleapis.com/auth/documents'],
    category: 'sensitive',
  },
  {
    id: 'sheets-read',
    name: 'Google Sheets — Lihat spreadsheet',
    nameEn: 'Google Sheets — View spreadsheets',
    service: 'sheets',
    description: 'Membaca isi spreadsheet untuk menjawab pertanyaan atau membuat ringkasan. Tidak dapat membuat atau mengubah spreadsheet.',
    descriptionEn: 'Read spreadsheet content to answer questions or create summaries. Cannot create or edit spreadsheets.',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    category: 'sensitive',
  },
  {
    id: 'sheets-manage',
    name: 'Google Sheets — Buat & edit spreadsheet',
    nameEn: 'Google Sheets — Create & edit spreadsheets',
    service: 'sheets',
    description: 'Membuat, mengubah, dan menghapus spreadsheet atas permintaan pengguna. Izin ini juga mencakup membaca spreadsheet.',
    descriptionEn: 'Create, edit, and delete spreadsheets at the user’s request. This permission also includes reading spreadsheets.',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    category: 'sensitive',
  },
  {
    id: 'forms-body-read',
    name: 'Google Forms — Lihat struktur formulir',
    nameEn: 'Google Forms — View form structure',
    service: 'forms',
    description: 'Melihat judul, pertanyaan, dan pengaturan formulir. Tidak dapat membuat atau mengubah formulir.',
    descriptionEn: 'View form titles, questions, and settings. Cannot create or edit forms.',
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
    category: 'sensitive',
  },
  {
    id: 'forms-manage',
    name: 'Google Forms — Buat & edit formulir',
    nameEn: 'Google Forms — Create & edit forms',
    service: 'forms',
    description: 'Membuat, mengubah, dan menghapus formulir atas permintaan pengguna. Google menyediakan satu scope kelola, bukan scope terpisah untuk buat/edit/hapus.',
    descriptionEn: 'Create, edit, and delete forms at the user’s request. Google provides one management scope, not separate create/edit/delete scopes.',
    scopes: ['https://www.googleapis.com/auth/forms.body'],
    category: 'sensitive',
  },
  {
    id: 'forms-responses-read',
    name: 'Google Forms — Lihat respons',
    nameEn: 'Google Forms — View responses',
    service: 'forms',
    description: 'Membaca respons/pengisian formulir untuk rekap atau analisis. Tidak dapat mengubah respons.',
    descriptionEn: 'Read form responses for summaries or analysis. Cannot change responses.',
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
  'https://www.googleapis.com/auth/spreadsheets': ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
