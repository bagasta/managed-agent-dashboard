# Dashboard Visual Refine + Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Clevio AI Staff dashboard to look more elegant/modern and add Google-OAuth-ready Terms & Privacy Policy pages — presentation only, no logic changes.

**Architecture:** Extend the shared Tailwind/CSS design layer first, then swap each page/component to the new classes with markup polish. Add two public legal routes with a shared legal layout. Wire existing footer labels to the new routes.

**Tech Stack:** React 18, react-router-dom 6, Tailwind CSS, Vite, TypeScript.

## Global Constraints

- **No logic changes.** Do not alter any `src/api/*`, handlers, state, effects, props, or route guards. Only JSX `className`/markup and CSS/Tailwind utilities.
- Keep the existing identity: `ink`/`brand` palette, SF Pro fonts, rounded surfaces. No new color identity.
- Legal pages are **English only**.
- Landing/Login design unchanged except wiring existing footer links.
- Per-task verification = `npm run build` passes (no new tsc/vite errors). There are no unit tests for visual changes.
- Legal placeholders to keep literally: `[Company legal name]`, `[Address]`, `[jurisdiction]`. Contact email: `aiagronomists@gmail.com`.

---

### Task 1: Design-system foundation

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

**Interfaces:**
- Produces: utility classes `.btn-secondary`, `.card-stat`, `.badge`/`.badge-success`/`.badge-warn`/`.badge-neutral`, `.section-title`, `.skeleton`, `.page`; box-shadow tokens `shadow-card`, `shadow-card-hover`; keyframe `shimmer`. Used by all later tasks.

- [ ] **Step 1: Add shadow tokens to Tailwind theme**

In `tailwind.config.js` under `theme.extend`, add:

```js
boxShadow: {
  card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
  'card-hover': '0 2px 4px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.10)',
},
keyframes: {
  shimmer: { '100%': { transform: 'translateX(100%)' } },
},
animation: { shimmer: 'shimmer 1.5s infinite' },
```

- [ ] **Step 2: Refine `.surface` and add shared component classes**

In `src/index.css` `@layer components`, update `.surface` and add new classes:

```css
.surface {
  @apply bg-white border border-ink-100 rounded-2xl shadow-card;
}
.page {
  @apply flex-1 overflow-y-auto px-8 py-8;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-full border border-ink-200 bg-white text-ink-900 px-5 py-2 text-sm font-medium hover:bg-ink-50 hover:border-ink-300 transition;
}
.card-stat {
  @apply surface p-5 transition hover:shadow-card-hover;
}
.section-title {
  @apply text-lg font-medium tracking-tight;
}
.badge {
  @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium;
}
.badge-success { @apply badge bg-emerald-50 text-emerald-700; }
.badge-warn { @apply badge bg-amber-50 text-amber-700; }
.badge-neutral { @apply badge bg-ink-100 text-ink-600; }
.skeleton {
  @apply relative overflow-hidden rounded-xl bg-ink-100;
}
.skeleton::after {
  @apply absolute inset-0 -translate-x-full;
  content: '';
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: shimmer 1.5s infinite;
}
```

- [ ] **Step 3: Add focus-ring polish to existing interactive classes**

In `src/index.css`, append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100` to `.btn-primary`, `.btn-ghost`, `.btn-secondary`, `.nav-link`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS (no tsc/vite errors).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js src/index.css
git commit -m "style: extend design-system foundation (shadows, shared classes, skeleton)"
```

---

### Task 2: Layout / sidebar refine

**Files:**
- Modify: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: existing `.nav-link`, `.nav-link-active`, and Task 1 classes. No prop/logic changes.

- [ ] **Step 1: Upgrade logo + nav presentation**

Replace the plain `<span className="w-2.5 h-2.5 rounded-full bg-ink-900" />` logo with a rounded brand chip (e.g. `w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-semibold` containing `C`). Keep the "Clevio AI Staff" text. Do not change nav data or NavLink `to`/logic.

- [ ] **Step 2: Polish user/plan footer + add legal links**

In the sidebar bottom block, wrap the user display + plan in a subtle rounded `bg-ink-50 border border-ink-100 rounded-xl p-3` card. Below the logout button add:

```tsx
<div className="mt-3 flex gap-3 text-[11px] text-ink-400">
  <Link to="/privacy" className="hover:text-ink-700">Privacy</Link>
  <Link to="/terms" className="hover:text-ink-700">Terms</Link>
</div>
```

Add `Link` to the existing `react-router-dom` import.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "style: refine sidebar layout and add legal links"
```

---

### Task 3: Overview refine

**Files:**
- Modify: `src/pages/Overview.tsx`

- [ ] **Step 1: Apply page shell + stat cards + gradient usage bar**

- Change outer wrapper `className` to `page`.
- In `Stat`, change card class from `surface p-5` to `card-stat`.
- Change usage bar fill from `bg-ink-900` to `bg-gradient-to-r from-brand-500 to-brand-600`.
- Upgrade the empty state block: keep text/links, wrap in `surface p-10 text-center` with a muted icon circle above (`mx-auto mb-3 w-10 h-10 rounded-full bg-ink-100`).

Keep all data, props, and `api.listAgents` logic identical.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Overview.tsx
git commit -m "style: refine overview stats, usage bar, empty state"
```

---

### Task 4: Agents (AI Staff) refine

**Files:**
- Modify: `src/pages/Agents.tsx`

- [ ] **Step 1: Replace ad-hoc button + add hover lift + version badge**

- Change outer wrapper to `page`.
- Replace `className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"` with `className="btn-secondary"`.
- On the agent card `Link`, change `surface p-5 hover:border-ink-300 transition` to `surface p-5 transition hover:shadow-card-hover`.
- Change `v{a.version}` span to use `.badge-neutral`.
- Change token bar fill `bg-ink-900` to `bg-gradient-to-r from-brand-500 to-brand-600`.

- [ ] **Step 2: Replace loading text with skeletons**

Replace `{loading && <div className="mt-8 text-sm text-ink-500">...</div>}` with a skeleton grid:

```tsx
{loading && (
  <div className="mt-8 grid md:grid-cols-2 gap-4">
    {[0,1,2,3].map((i) => <div key={i} className="skeleton h-28" />)}
  </div>
)}
```

Keep `CreateAgentModal` usage and all handlers unchanged.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Agents.tsx
git commit -m "style: refine AI Staff list (buttons, skeletons, badges)"
```

---

### Task 5: AgentDetail / Analytics / Arthur / Profile refine

**Files:**
- Modify: `src/pages/AgentDetail.tsx`
- Modify: `src/pages/Analytics.tsx`
- Modify: `src/pages/Arthur.tsx`
- Modify: `src/pages/Profile.tsx`

- [ ] **Step 1: Standardize page shells and headers**

In each file, change the outer page wrapper that reads `flex-1 overflow-y-auto px-8 py-8` to `page`. Where a section heading uses `text-lg font-medium`, switch to `section-title`. Apply `.badge-*` to any status/plan/state text (e.g. subscription `status` in Profile, agent status in AgentDetail). Do not change any data, effects, handlers, or API calls.

- [ ] **Step 2: Add skeletons where lists/data load (AgentDetail, Analytics, Arthur)**

For any `loading`/initial-empty block currently rendering a "Memuat…"/"Loading" text node, replace the text with `<div className="skeleton h-24 mt-6" />` (or a small grid of skeletons matching the layout). Preserve the loading condition and variable names exactly.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AgentDetail.tsx src/pages/Analytics.tsx src/pages/Arthur.tsx src/pages/Profile.tsx
git commit -m "style: standardize page shells, headers, badges, skeletons"
```

---

### Task 6: Modals refine

**Files:**
- Modify: `src/components/CreateAgentModal.tsx`
- Modify: `src/components/McpToolSelector.tsx`

- [ ] **Step 1: Refine modal overlay + container (CreateAgentModal)**

- Change the backdrop overlay element to `fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4` (keep the existing `open` guard and `onClose` handler).
- Change the modal panel to `surface w-full max-w-lg p-0 overflow-hidden` with an internal header (`px-6 py-4 border-b border-ink-100`), body (`px-6 py-5`), and footer (`px-6 py-4 border-t border-ink-100 flex justify-end gap-2`) wrapping the existing fields/buttons. Do not change form state, validation, or submit logic.

- [ ] **Step 2: Refine McpToolSelector presentation**

- Replace any `text-gray-*` utility with the `ink` scale equivalent (`text-gray-600`→`text-ink-600`, `text-gray-500`→`text-ink-500`) for consistency.
- Wrap the scopes list block in `mt-3 rounded-xl bg-ink-50 border border-ink-100 p-3`. Keep `selectedScopes` logic and `getMcpToolScopes` usage unchanged.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/CreateAgentModal.tsx src/components/McpToolSelector.tsx
git commit -m "style: refine modal overlay and MCP tool selector"
```

---

### Task 7: Legal layout + Privacy + Terms pages + routes

**Files:**
- Create: `src/components/LegalLayout.tsx`
- Create: `src/pages/Privacy.tsx`
- Create: `src/pages/Terms.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `LegalLayout` default export `({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode })`; `Privacy` and `Terms` default-export components. New public routes `/privacy`, `/terms`.

- [ ] **Step 1: Create `LegalLayout.tsx`**

```tsx
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
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create `Privacy.tsx`** (English; includes scope disclosure + Limited Use)

Use `LegalLayout` with `title="Privacy Policy"` and `lastUpdated="June 22, 2026"`. Body sections (`<h2>` + `<p>`/`<ul>`): Introduction (Clevio AI Staff operated by `[Company legal name]`, `[Address]`, contact `aiagronomists@gmail.com`); Information We Collect (account info, WhatsApp number, usage); **Google User Data** — list each service and scope:

```
- Identity (email, profile): sign-in and account identification
- Gmail (send, read): send and read emails on your instruction
- Google Drive (file): create and access agent-created files
- Google Calendar (events): create and manage calendar events
- Google Sheets: read and write spreadsheet data
- Google Docs: create and edit documents
- Google Forms: create forms and read responses
- Google Slides: create presentations
- Google Tasks: manage tasks
- Google Contacts: read contacts
- Google Chat: send and manage chat messages and spaces
```

How We Use Data; How We Store and Retain Data; Data Deletion (how to request via `aiagronomists@gmail.com`); We Do Not Sell Your Data; Sharing & Subprocessors; Security; Your Rights; Children's Privacy; Changes; Contact.

Include this **Limited Use** section verbatim:

> Clevio AI Staff's use and transfer of information received from Google APIs to any other app will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

- [ ] **Step 3: Create `Terms.tsx`** (English)

Use `LegalLayout` with `title="Terms & Conditions"` and `lastUpdated="June 22, 2026"`. Sections: Acceptance of Terms; Description of Service; Accounts & Eligibility; Acceptable Use; Subscriptions & Token Usage; Third-Party & Google Services (link to Privacy Policy); Intellectual Property; Disclaimers; Limitation of Liability; Termination; Governing Law (`[jurisdiction]`); Changes to Terms; Contact (`aiagronomists@gmail.com`).

- [ ] **Step 4: Register public routes in `App.tsx`**

Add imports for `Privacy` and `Terms`, and add inside `<Routes>` (outside the `/app` guarded route):

```tsx
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
```

Place them before the `<Route path="*" ... />` catch-all.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Verify reachable while logged out**

Run: `npm run preview` (or `npm run dev`), open `/privacy` and `/terms` in a fresh/incognito window (no login). Confirm both render, the Limited Use statement is present, and all scopes are listed.

- [ ] **Step 7: Commit**

```bash
git add src/components/LegalLayout.tsx src/pages/Privacy.tsx src/pages/Terms.tsx src/App.tsx
git commit -m "feat: add Privacy Policy and Terms pages with Google Limited Use disclosure"
```

---

### Task 8: Wire footer links on Landing & Login

**Files:**
- Modify: `src/pages/Landing.tsx`
- Modify: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: `/privacy`, `/terms` routes from Task 7.

- [ ] **Step 1: Wire Landing footer Privacy/Terms labels to routes**

In `src/pages/Landing.tsx`, find where the footer legal labels (`privasi`/`ketentuan`, rendered "Privacy"/"Terms") are output. Make the Privacy label a `<Link to="/privacy">` and the Terms label a `<Link to="/terms">`, preserving existing text/i18n and classes. Ensure `Link` is imported (it already is).

- [ ] **Step 2: Add a minimal legal footer to Login**

In `src/pages/Login.tsx`, add near the bottom of the card a discreet line (do not change the auth form/handlers):

```tsx
<p className="mt-6 text-center text-xs text-ink-400">
  <Link to="/privacy" className="hover:text-ink-700">Privacy</Link>
  <span className="mx-2">·</span>
  <Link to="/terms" className="hover:text-ink-700">Terms</Link>
</p>
```

Ensure `Link` is imported (it already is).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx src/pages/Login.tsx
git commit -m "feat: link Privacy and Terms from landing and login footers"
```

---

## Self-Review

- **Spec coverage:** §1 foundation → Task 1; §2 per-page/components → Tasks 2–6; §3 legal pages → Task 7; §4 reachability/links → Tasks 2 (sidebar), 7 (legal-layout footer), 8 (landing/login). All covered.
- **Placeholders:** Legal `[Company legal name]`/`[Address]`/`[jurisdiction]` are intentional fill-ins, not plan gaps. No "TBD"/"handle edge cases" steps.
- **Type consistency:** `LegalLayout` prop names (`title`, `lastUpdated`, `children`) used identically in Privacy/Terms (Task 7).
- **No-logic guarantee:** every task restates that data/handlers/API stay unchanged.
