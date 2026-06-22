import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { useI18n } from '../i18n'

const NAV_WORKSPACE = [
  { to: '/app', labelKey: 'nav.overview', fallback: 'Overview', end: true },
  { to: '/app/agents', labelKey: 'nav.aiStaff', fallback: 'AI Staff' },
  { to: '/app/analytics', labelKey: 'nav.analytics', fallback: 'Analytics' },
]
const NAV_TOOLS = [
  { to: '/app/arthur', labelKey: 'Arthur', fallback: 'Arthur', subKey: 'nav.agentBuilder', subFallback: 'Agent Builder' },
]
const NAV_ACCOUNT = [
  { to: '/app/profile', labelKey: 'nav.profile', fallback: 'Profile' },
]

type NavItem = {
  to: string
  labelKey: string
  fallback: string
  subKey?: string
  subFallback?: string
  end?: boolean
}

function Group({ title, items }: { title: string; items: NavItem[] }) {
  const { t } = useI18n()
  return (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-ink-400">{title}</div>
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <span className="flex-1">{t(it.labelKey, it.fallback)}</span>
            {it.subKey && <span className="text-[11px] text-ink-400">{t(it.subKey, it.subFallback)}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const nav = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const display = user.full_name || user.phone_number || user.email
  return (
    <div className="h-screen w-screen flex bg-ink-50">
      <aside className="w-64 shrink-0 bg-white border-r border-ink-100 flex flex-col">
        <div className="px-5 py-5 border-b border-ink-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ink-900" />
          <span className="font-semibold tracking-tight">Clevio AI Staff</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <Group title={t('nav.workspace', 'Workspace')} items={NAV_WORKSPACE} />
          <Group title={t('nav.tools', 'Tools')} items={NAV_TOOLS} />
          <Group title={t('nav.account', 'Account')} items={NAV_ACCOUNT} />
        </div>
        <div className="px-4 py-4 border-t border-ink-100">
          <div className="mb-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-ink-400">{t('lang.label', 'Bahasa')}</div>
            <div className="grid grid-cols-2 rounded-full border border-ink-200 bg-ink-50 p-1">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${language === 'id' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${language === 'en' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
              >
                EN
              </button>
            </div>
          </div>
          <div className="text-sm truncate">{display}</div>
          {user.subscription && (
            <div className="mt-0.5 text-[11px] text-ink-500">{user.subscription.plan_label}</div>
          )}
          <button
            onClick={() => { onLogout(); nav('/') }}
            className="mt-2 text-xs text-ink-700 hover:text-ink-900"
          >
            {t('nav.logout', 'Log out')}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
