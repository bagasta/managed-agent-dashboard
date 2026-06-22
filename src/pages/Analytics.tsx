import { useI18n } from '../i18n'

export default function Analytics() {
  const { t } = useI18n()
  return (
    <div className="page">
      <h1 className="text-2xl font-semibold tracking-tight">{t('analytics.title', 'Analytics')}</h1>
      <p className="mt-2 text-sm text-ink-500">{t('analytics.body', 'Statistik percakapan akan tampil di sini.')}</p>
    </div>
  )
}
