import { request } from './client'
import { getMcpToolScopes } from '../types'

const GOOGLE_SCOPE_CACHE_KEY = 'clevio_google_connected_scopes'

type ScopeCache = Record<string, { scopes: string[]; toolIds: string[] }>

function cacheKey(agentId: string, externalUserId: string) {
  return `${externalUserId}::${agentId}`
}

function readScopeCache(): ScopeCache {
  try {
    return JSON.parse(localStorage.getItem(GOOGLE_SCOPE_CACHE_KEY) || '{}') as ScopeCache
  } catch {
    return {}
  }
}

export function getCachedGoogleScopes(agentId: string, externalUserId: string): string[] {
  return readScopeCache()[cacheKey(agentId, externalUserId)]?.scopes || []
}

function rememberRequestedGoogleScopes(agentId: string, externalUserId: string, toolIds: string[], scopes: string[]) {
  const cache = readScopeCache()
  cache[cacheKey(agentId, externalUserId)] = { toolIds, scopes }
  localStorage.setItem(GOOGLE_SCOPE_CACHE_KEY, JSON.stringify(cache))
}

export const oauthApi = {
  startConnect: async (agentId: string, externalUserId: string, toolIds: string[]): Promise<void> => {
    const scopes = getMcpToolScopes(toolIds)
    rememberRequestedGoogleScopes(agentId, externalUserId, toolIds, scopes)
    const params = new URLSearchParams({
      external_user_id: externalUserId,
      agent_id: agentId,
      ...(scopes.length > 0 && { scopes: scopes.join(',') }),
    })
    const data = await request<{ auth_url: string }>(`/v1/integrations/google/auth-link?${params}`)
    window.location.href = data.auth_url
  },

  revoke: async (agentId: string, service: string): Promise<void> => {
    void agentId
    void service
    throw new Error('Cabut koneksi Google belum tersedia dari backend.')
  },
}
