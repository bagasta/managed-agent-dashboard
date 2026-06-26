import { Link } from 'react-router-dom'

export default function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">C</span>
            Clevio AI Staff
          </Link>
          <Link to="/" className="text-sm text-ink-500 hover:text-ink-900 transition">← Back to home</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: {lastUpdated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-700 [&_h2]:text-ink-900 [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
        <footer className="mt-16 pt-6 border-t border-ink-100 text-sm text-ink-400 flex gap-4">
          <Link to="/privacy" className="hover:text-ink-700">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-ink-700">Terms &amp; Conditions</Link>
        </footer>
        <p className="mt-4 text-xs text-ink-400">Application name: Clevio AI Staff · Operator: PT Clevio</p>
      </main>
    </div>
  )
}
