import { api, request } from './client'
import type { Agent, OAuthConnection, ToolsConfig } from '../types'
import { getCachedGoogleScopes } from './oauth'

export type SimpleAgent = Agent

export const agentApi = {
  list: () => api.listAgents(),

  get: (id: string) => api.getAgent(id),

  create: (data: {
    name: string
    description?: string
    instructions?: string
    model?: string
    temperature?: number
    toolsConfig?: ToolsConfig
    sandboxConfig?: Record<string, unknown>
    safetyPolicy?: Record<string, unknown>
    escalationConfig?: Record<string, unknown>
    operatorIds?: string[]
    allowedSenders?: string[] | null
    maxTokens?: number | null
    tokenQuota?: number
    quotaPeriodDays?: number
    channelType?: string | null
    ownerExternalId: string
  }) =>
    api.createAgent({
      name: data.name,
      description: data.description ?? null,
      instructions: data.instructions ?? '',
      model: data.model,
      temperature: data.temperature,
      tools_config: data.toolsConfig,
      sandbox_config: data.sandboxConfig,
      safety_policy: data.safetyPolicy,
      escalation_config: data.escalationConfig,
      operator_ids: data.operatorIds,
      allowed_senders: data.allowedSenders,
      max_tokens: data.maxTokens,
      token_quota: data.tokenQuota,
      quota_period_days: data.quotaPeriodDays,
      channel_type: data.channelType || undefined,
      owner_external_id: data.ownerExternalId,
      created_by_type: 'dashboard',
    }),

  delete: (id: string) => api.deleteAgent(id),

  getConnections: async (agentId: string, externalUserId: string): Promise<OAuthConnection[]> => {
    try {
      const data = await request<{ connected: boolean; email: string | null; scopes: string[] }>(
        `/v1/integrations/google/status?external_user_id=${encodeURIComponent(externalUserId)}&agent_id=${encodeURIComponent(agentId)}`
      )
      if (!data.connected) return []
      // TODO(backend): butuh granted_scopes dari /status. Saat ini fallback ke requested scopes localStorage.
      const scopes = data.scopes?.length ? data.scopes : getCachedGoogleScopes(agentId, externalUserId)
      return [{ service: 'google', email: data.email, scopes, createdAt: '', expiresAt: '' }]
    } catch {
      return []
    }
  },
}
