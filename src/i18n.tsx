import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Language = 'id' | 'en'

const STORAGE_KEY = 'clevio_dashboard_language'

const EN: Record<string, string> = {
  'nav.workspace': 'Workspace',
  'nav.tools': 'Tools',
  'nav.account': 'Account',
  'nav.overview': 'Overview',
  'nav.aiStaff': 'AI Staff',
  'nav.analytics': 'Analytics',
  'nav.agentBuilder': 'Agent Builder',
  'nav.profile': 'Profile',
  'nav.logout': 'Log out',
  'lang.label': 'Language',
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.delete': 'Delete',
  'common.reset': 'Reset',
  'common.cancel': 'Cancel',
  'common.send': 'Send',
  'common.sending': 'Sending...',
  'common.back': 'Back',
  'agents.title': 'AI Staff',
  'agents.count': '{count} AI staff registered',
  'agents.createManual': '+ Create Manual Agent',
  'agents.createArthur': 'Create with Arthur',
  'agents.empty': 'No AI staff yet. Start with Arthur.',
  'agent.notOwnerTitle': 'This agent does not belong to the signed-in account.',
  'agent.notOwnerBody': 'The dashboard only shows and opens agents owned by the signed-in user.',
  'agent.tokenUsed': 'Tokens used',
  'agent.noGoogleTools': 'No Google tools selected',
  'agent.testTitle': 'Test AI',
  'agent.testSubtitle': 'Try this agent before users use it.',
  'agent.testEmptyTitle': 'No test messages yet',
  'agent.testEmptyBody': 'Send a sample question to check tone, tools, and integrations.',
  'agent.testPlaceholder': 'Write a test message...',
  'agent.waitingReply': 'Waiting for reply...',
  'agent.identity': 'Identity',
  'agent.name': 'Name',
  'agent.model': 'Model',
  'agent.maxOutputTokens': 'Max output tokens',
  'agent.description': 'Short description',
  'agent.instructions': 'Instructions (Persona & Rules)',
  'agent.instructionsHint': 'Write how this AI staff should speak and act.',
  'agent.temperature': 'Temperature',
  'agent.capabilities': 'Capabilities (Tools)',
  'agent.runtimeConfig': 'Runtime Configuration',
  'agent.operatorIds': 'Operator IDs',
  'agent.allowedSenders': 'Allowed Senders',
  'agent.escalationChannel': 'Escalation channel',
  'agent.operatorPhone': 'Escalation operator number/ID',
  'agent.sandboxMemory': 'Sandbox memory',
  'agent.sandboxCpu': 'Sandbox CPU',
  'agent.safetyRules': 'Safety rules',
  'agent.maxOutputLength': 'Max output length',
  'agent.whatsappNotConnected': 'Not connected to WhatsApp yet.',
  'agent.connectWhatsapp': 'Connect WhatsApp',
  'agent.googleRuntime': 'Google Workspace Runtime',
  'agent.googleRuntimeActive': 'MCP google_workspace is active on this agent.',
  'agent.googleRuntimeInactive': 'Google OAuth alone is not enough. Activate MCP runtime so the agent can use Google tools.',
  'agent.activateRuntime': 'Activate Runtime',
  'agent.addConnection': 'Add New Connection',
  'agent.googleConnectedNoScopes': 'Google account is connected, but selected service scopes are not stored yet. Select the required services and reconnect to sync checklist status.',
  'agent.connected': 'Connected',
  'agent.connectGoogle': 'Connect with Google',
  'agent.revokeSoon': 'Revoke soon',
  'agent.quotaApi': 'Quota & API',
  'agent.tokenQuota': 'Token quota',
  'agent.activeUntil': 'Active until',
  'agent.apiKey': 'Agent API Key',
  'agent.saved': 'Saved.',
  'agent.runtimeActivated': 'Google Workspace runtime is active on this agent.',
  'agent.confirmDelete': 'Delete AI staff "{name}"?',
  'arthur.yourStaff': 'Your AI Staff',
  'arthur.registered': '{count} registered',
  'arthur.empty': 'None yet. Chat with Arthur to create one.',
  'arthur.openLatest': 'Open latest agent',
  'arthur.finding': 'Finding Agent Builder backend',
  'arthur.backend': 'Agent Builder backend: {name}',
  'arthur.boot': 'Hi, I am Arthur. Tell me what kind of agent you want to create, including the business, channel, and integrations needed.',
  'arthur.notFound': 'Arthur backend was not found. Make sure the builder agent is seeded and has builder/system capability.',
  'arthur.newSession': 'New session is ready. Describe the agent you want to create.',
  'arthur.placeholder': 'Example: Create a WhatsApp CS agent for a course business that can answer FAQs and escalate to admin.',
  'arthur.notReady': 'Arthur is not ready...',
  'overview.newStaff': 'Create new AI staff',
  'overview.summary': 'Summary of your AI staff and subscription.',
  'overview.planLimit': '{plan} plan limit',
  'overview.tokensLeft': 'Tokens left',
  'overview.tokenQuotaOf': 'of {quota} quota',
  'overview.monthlyUsage': 'Token usage this month',
  'overview.yourStaff': 'Your AI Staff',
  'overview.viewAll': 'View all',
  'overview.empty': 'No AI staff yet.',
  'overview.startArthur': 'Start with Arthur',
  'analytics.title': 'Analytics',
  'analytics.body': 'Charts and reporting will appear here.',
  'profile.noSubscription': 'No active subscription.',
  'profile.info': 'Account and subscription information.',
  'profile.account': 'Account',
  'profile.subscription': 'Subscription',
  'profile.registeredAt': 'Registered',
  'profile.plan': 'Plan',
  'profile.maxAgents': 'AI staff limit',
  'profile.whatsappNumber': 'WhatsApp number',
  'login.title': 'Sign in',
  'login.subtitle': 'Use your registered WhatsApp number.',
  'login.phone': 'WhatsApp number',
  'login.checking': 'Checking...',
  'login.submit': 'Sign in',
  'login.help': 'Do not have an account yet? Contact admin to activate it.',
  'login.hero': 'Enter your WhatsApp number to sign in. No password, no hassle.',
  'login.noPlan': 'Number is registered but has no active plan. Contact admin.',
  'login.notRegistered': 'Number is not registered. Contact admin for activation.',
  'mcp.title': 'Select MCP Tools',
  'mcp.scopes': 'Scopes to request:',
  'create.title': 'Create Manual Agent',
  'create.preset': 'Arthur Preset',
  'create.channel': 'Channel',
  'create.fileCapability': 'File capability',
  'create.noChannel': 'No channel',
  'create.textOnly': 'Text only',
  'create.fileEnabled': 'Receive/create files',
  'create.fileNotNeeded': 'No files needed',
  'create.agentName': 'Agent Name',
  'create.domain': 'Domain',
  'create.goal': 'Agent goal description',
  'create.businessContext': 'Business / owner context',
  'create.runtimeInstructions': 'Runtime instructions',
  'create.runtimeCapabilities': 'Runtime capabilities',
  'create.googleNotice': 'Agent will be created with Google Workspace MCP enabled. After creation, open the agent detail page to log in with the Google account it should use.',
  'create.operatorName': 'Operator name',
  'create.quotaPeriodDays': 'Quota period days',
  'create.advancedArtifacts': 'Advanced Arthur artifacts',
  'create.blueprintJson': 'Blueprint JSON',
  'create.manualJson': 'Operating Manual / SOP JSON',
  'create.submit': 'Create Manual Agent',
  'create.creating': 'Creating...',
}

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, fallback?: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'id'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage)

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: (next) => {
      localStorage.setItem(STORAGE_KEY, next)
      setLanguageState(next)
    },
    t: (key, fallback = key, vars = {}) => {
      const template = language === 'en' ? EN[key] || fallback : fallback
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
        template,
      )
    },
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
