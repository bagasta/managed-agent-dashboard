export interface ToolsConfig {
  rag?: boolean
  scheduler?: boolean
  http?: boolean
  whatsapp_media?: boolean
  sandbox?: boolean
  tool_creator?: boolean
  wa_agent_manager?: boolean
  mcp?: Record<string, unknown>
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
