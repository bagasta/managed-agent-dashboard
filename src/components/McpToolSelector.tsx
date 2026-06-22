import { getMcpToolScopes, MCP_TOOLS, McpTool } from '../types'
import { useI18n } from '../i18n'

type Props = {
  selected: string[]
  onChange: (ids: string[]) => void
}

export function McpToolSelector({ selected, onChange }: Props) {
  const { t } = useI18n()
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const selectedScopes = selected.length > 0 ? getMcpToolScopes(selected) : []

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-700">{t('mcp.title', 'Pilih MCP Tools')}</p>
      <div className="grid grid-cols-1 gap-2">
        {MCP_TOOLS.map((tool: McpTool) => (
          <label
            key={tool.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.includes(tool.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(tool.id)}
              onChange={() => toggle(tool.id)}
              className="mt-0.5 h-4 w-4 text-blue-600"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-900">{tool.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                  {tool.category}
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5">{tool.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selectedScopes.length > 0 && (
        <div className="mt-3 rounded-xl bg-ink-50 border border-ink-100 p-3">
          <p className="text-xs font-medium text-ink-700 mb-1">{t('mcp.scopes', 'Scopes yang akan diminta:')}</p>
          <ul className="space-y-0.5">
            {selectedScopes.map((scope) => (
              <li key={scope} className="text-xs text-ink-500 font-mono truncate">
                • {scope}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
