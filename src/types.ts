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
  'https://www.googleapis.com/auth/drive.file',
]

export const MCP_TOOLS: McpTool[] = [
  {
    id: 'gmail-send',
    name: 'Gmail (Send)',
    service: 'gmail',
    description: 'Kirim email melalui Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    category: 'sensitive',
  },
  {
    id: 'gmail-read',
    name: 'Gmail (Read)',
    service: 'gmail',
    description: 'Baca email dari Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    category: 'sensitive',
  },
  {
    id: 'drive-file',
    name: 'Google Drive',
    service: 'drive',
    description: 'Buat dan akses file Drive yang dibuat oleh agent',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    category: 'sensitive',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    service: 'calendar',
    description: 'Buat dan kelola events di Calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    category: 'sensitive',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    service: 'sheets',
    description: 'Baca dan tulis data ke Google Sheets',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    category: 'sensitive',
  },
  {
    id: 'docs',
    name: 'Google Docs',
    service: 'docs',
    description: 'Buat dan edit dokumen Google Docs',
    scopes: ['https://www.googleapis.com/auth/documents'],
    category: 'sensitive',
  },
  {
    id: 'forms',
    name: 'Google Forms',
    service: 'forms',
    description: 'Buat, baca, dan update Google Forms',
    scopes: [
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/forms.body.readonly',
      'https://www.googleapis.com/auth/forms.responses.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ],
    category: 'sensitive',
  },
  {
    id: 'slides',
    name: 'Google Slides',
    service: 'slides',
    description: 'Buat dan update presentasi Google Slides',
    scopes: ['https://www.googleapis.com/auth/presentations'],
    category: 'sensitive',
  },
  {
    id: 'tasks',
    name: 'Google Tasks',
    service: 'tasks',
    description: 'Buat dan kelola task Google',
    scopes: ['https://www.googleapis.com/auth/tasks'],
    category: 'sensitive',
  },
  {
    id: 'contacts',
    name: 'Google Contacts',
    service: 'contacts',
    description: 'Baca dan kelola kontak Google',
    scopes: ['https://www.googleapis.com/auth/contacts'],
    category: 'sensitive',
  },
  {
    id: 'chat',
    name: 'Google Chat',
    service: 'chat',
    description: 'Kelola spaces, pesan, dan membership Google Chat',
    scopes: [
      'https://www.googleapis.com/auth/chat.spaces',
      'https://www.googleapis.com/auth/chat.messages',
      'https://www.googleapis.com/auth/chat.memberships',
    ],
    category: 'sensitive',
  },
]

export function getMcpToolScopes(toolIds: string[], includeBaseline = true) {
  const toolScopes = toolIds.flatMap((id) => MCP_TOOLS.find((tool) => tool.id === id)?.scopes ?? [])
  return [...new Set([...(includeBaseline ? GOOGLE_BASELINE_SCOPES : []), ...toolScopes])]
}
