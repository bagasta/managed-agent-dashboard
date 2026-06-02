import type { Agent, AgentListResponse, ModelInfo, User, WAQRResponse } from '../types'

const API_BASE = ''
const STORAGE_KEY = 'clevio_api_key'
let runtimeKey: string | null = null

export function setApiKey(key: string) {
  runtimeKey = key
  if (key) localStorage.setItem(STORAGE_KEY, key)
  else localStorage.removeItem(STORAGE_KEY)
}

export function getApiKey(): string {
  if (runtimeKey) return runtimeKey
  runtimeKey = localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_API_KEY as string | undefined) || ''
  return runtimeKey
}

async function request<T>(path: string, opts: RequestInit = {}, useAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  }
  const k = getApiKey()
  if (useAuth && k) headers['X-API-Key'] = k
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail = text
    try {
      const j = JSON.parse(text)
      detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail || j)
    } catch {}
    throw new Error(detail || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  loginByPhone: (phone_number: string) =>
    request<User>('/v1/users/login/phone', { method: 'POST', body: JSON.stringify({ phone_number }) }, false),
  getUser: (id: string) => request<User>(`/v1/users/${id}`),

  listAgents: async (): Promise<Agent[]> => {
    const r = await request<AgentListResponse>('/v1/agents?limit=100')
    return r.items
  },
  getAgent: (id: string) => request<Agent>(`/v1/agents/${id}`),
  createAgent: (payload: Record<string, unknown>) =>
    request<Agent>('/v1/agents', { method: 'POST', body: JSON.stringify(payload) }),
  updateAgent: (id: string, payload: Record<string, unknown>) =>
    request<Agent>(`/v1/agents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAgent: (id: string) => request<void>(`/v1/agents/${id}`, { method: 'DELETE' }),

  listModels: () => request<{ models: ModelInfo[] }>('/v1/models'),

  connectWhatsApp: (id: string) =>
    request<WAQRResponse>(`/v1/agents/${id}/whatsapp/connect`, { method: 'POST' }),
  getWAQR: (id: string) => request<WAQRResponse>(`/v1/agents/${id}/whatsapp/qr`),
  getWAStatus: (id: string) => request<{ status: string }>(`/v1/agents/${id}/whatsapp/status`),
  disconnectWA: (id: string) => request<void>(`/v1/agents/${id}/whatsapp`, { method: 'DELETE' }),
}
