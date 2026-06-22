import { getMcpToolScopes, type ToolsConfig } from '../types'

export const DEFAULT_GOOGLE_WORKSPACE_MCP_URL =
  (import.meta.env.VITE_GOOGLE_WORKSPACE_MCP_URL as string | undefined) ||
  'https://google-workspace-mcp.chiefaiofficer.id/mcp'

export const DEFAULT_GOOGLE_WORKSPACE_TRANSPORT = 'streamable_http'

export type GoogleWorkspaceServerConfig = {
  url: string
  transport: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

function isStaleGoogleWorkspaceUrl(value: unknown) {
  const url = typeof value === 'string' ? value : ''
  return url.includes('msj90wr2-8002.asse.devtunnels.ms')
}

export function getGoogleToolScopes(toolIds: string[]) {
  return getMcpToolScopes(toolIds)
}

export function getGoogleWorkspaceServer(tools: ToolsConfig | undefined): GoogleWorkspaceServerConfig {
  const mcp = asRecord(tools?.mcp)
  const servers = asRecord(mcp.servers)
  const googleServer = asRecord(servers.google_workspace)
  return {
    url: typeof googleServer.url === 'string' && googleServer.url.trim() && !isStaleGoogleWorkspaceUrl(googleServer.url)
      ? googleServer.url
      : DEFAULT_GOOGLE_WORKSPACE_MCP_URL,
    transport: typeof googleServer.transport === 'string' && googleServer.transport.trim()
      ? googleServer.transport
      : DEFAULT_GOOGLE_WORKSPACE_TRANSPORT,
  }
}

export function isGoogleWorkspaceMcpEnabled(tools: ToolsConfig | undefined) {
  const mcp = asRecord(tools?.mcp)
  const servers = asRecord(mcp.servers)
  const googleServer = asRecord(servers.google_workspace)
  return (
    mcp.enabled === true &&
    Boolean(servers.google_workspace) &&
    !isStaleGoogleWorkspaceUrl(googleServer.url)
  )
}

export function configureGoogleWorkspaceTools(
  tools: ToolsConfig | undefined,
  toolIds: string[],
  server: Partial<GoogleWorkspaceServerConfig> = {},
): ToolsConfig {
  const currentTools = tools || {}
  const mcp = asRecord(currentTools.mcp)
  const servers = asRecord(mcp.servers)
  const currentServer = asRecord(servers.google_workspace)
  const savedToolIds = currentTools.google_workspace?.tool_ids || []
  const savedScopes = currentTools.google_workspace?.scopes || []
  const scopes = getGoogleToolScopes(toolIds)

  return {
    ...currentTools,
    tavily: currentTools.tavily ?? true,
    mcp: {
      ...mcp,
      enabled: true,
      servers: {
        ...servers,
        google_workspace: {
          ...currentServer,
          url: server.url?.trim() && !isStaleGoogleWorkspaceUrl(server.url)
            ? server.url.trim()
            : getGoogleWorkspaceServer(currentTools).url,
          transport: server.transport?.trim() || getGoogleWorkspaceServer(currentTools).transport,
        },
      },
    },
    google_workspace: {
      tool_ids: [...new Set([...savedToolIds, ...toolIds])],
      scopes: [...new Set([...savedScopes, ...scopes])],
      updated_at: new Date().toISOString(),
    },
  }
}
