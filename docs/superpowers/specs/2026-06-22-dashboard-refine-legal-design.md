# Dashboard Visual Refine + Legal Pages — Design Spec

**Date:** 2026-06-22
**Branch:** feat/google-oauth-mcp-integration
**Author:** Clevio team (assisted)

## Goal

Make the Clevio AI Staff dashboard more user-friendly, elegant, and modern, and
add Terms & Conditions and Privacy Policy pages that pass Google Cloud Console
OAuth verification quickly. **Visual/presentation only — no business logic, no
data flow, no API calls, no props/state/handlers changed.**

## Constraints

- **Refine, not redesign.** Keep the existing Apple-clean identity (`ink`/`brand`
  palette, SF Pro fonts, rounded surfaces). No new color identity.
- Do not touch any JS logic: API modules (`src/api/*`), handlers, state, effects,
  routing guards. Only JSX markup/className and CSS/Tailwind utilities change.
- Landing and Login **design** stay as-is. Only add discreet footer links to the
  new legal pages (link-only, required for Google reachability).
- Legal pages: **English only.**
- Out of scope: Landing/Login redesign, dark mode, new features, refactors
  unrelated to presentation.

## Section 1 — Design-system foundation

Files: `src/index.css`, `tailwind.config.js`.

- Add a soft layered shadow scale (`shadow-card`, `shadow-card-hover`) in the
  Tailwind theme; apply to `.surface` with a subtle hover lift.
- New shared component classes in `@layer components`:
  - `.btn-secondary` — replaces ad-hoc `bg-blue-600` button styling.
  - `.card-stat` — stat card styling for Overview.
  - `.badge`, `.badge-success`, `.badge-warn`, `.badge-neutral`.
  - `.section-title` — consistent section heading.
  - `.skeleton` — shimmer loading placeholder (add shimmer keyframes).
  - `.page` — standardizes the `flex-1 overflow-y-auto px-8 py-8` page shell.
- Consistent `transition`, hover/active states, and visible focus rings on
  interactive elements (accessibility + polish).
- Minor polish tokens: warmer surface background, refined border tints.

No identity change, no JS touched.

## Section 2 — Per-page & component refinements (visual only)

- **`components/Layout.tsx`**: nav items with leading icons + active accent bar;
  polished user/plan footer card; cleaner ID/EN toggle; upgraded logo mark;
  add Privacy/Terms links in sidebar footer.
- **`pages/Overview.tsx`**: stat cards → `.card-stat`; gradient usage bar;
  richer empty state with icon.
- **`pages/Agents.tsx`**: swap raw `bg-blue-600` → `.btn-secondary`; card hover
  lift; clearer token bar + version badge; richer empty state; `.skeleton`
  loading rows instead of "Memuat…" text.
- **`pages/AgentDetail.tsx`, `pages/Analytics.tsx`, `pages/Arthur.tsx`,
  `pages/Profile.tsx`**: consistent page header treatment, `.surface` polish,
  spacing/typography rhythm, status badges, skeletons where lists load.
- **`components/CreateAgentModal.tsx`, `components/McpToolSelector.tsx`**:
  backdrop blur overlay, rounded modal with header/footer separation, better
  focus states and spacing.

Every prop, state, handler, and API call stays identical.

## Section 3 — Legal pages

New public routes (outside the `/app` auth guard) in `src/App.tsx`:

- `/privacy` → `src/pages/Privacy.tsx`
- `/terms` → `src/pages/Terms.tsx`
- Shared `src/components/LegalLayout.tsx`: on-brand header (Clevio logo +
  back-to-home), readable max-width prose, footer. English only.

### Privacy Policy must include (for Google OAuth approval)

- Effective / last-updated date.
- Who we are: Clevio AI Staff; contact `aiagronomists@gmail.com`;
  `[Company legal name]` and `[Address]` placeholders to fill later.
- **Google user data accessed**, grouped by service, with purpose. Actual scopes
  in use (from `src/types.ts`):
  - Identity: `userinfo.email`, `userinfo.profile`
  - Gmail: `gmail.send`, `gmail.readonly`
  - Drive: `drive.file`
  - Calendar: `calendar.events`
  - Sheets: `spreadsheets`
  - Docs: `documents`
  - Forms: `forms.body`, `forms.body.readonly`, `forms.responses.readonly`
  - Slides: `presentations`
  - Tasks: `tasks`
  - Contacts: `contacts`
  - Chat: `chat.spaces`, `chat.messages`, `chat.memberships`
- How data is used, stored, retained, deleted; statement that we do not sell it.
- **Limited Use disclosure** — verbatim affirmative statement that the app's use
  and transfer of information received from Google APIs adheres to the
  [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
  including the Limited Use requirements. (Most important line for approval.)
- Third-party subprocessors, security measures, user rights, children's policy,
  changes to the policy, contact section.

### Terms & Conditions includes

Acceptance; service description; accounts; acceptable use; subscriptions/tokens;
intellectual property; third-party & Google services; disclaimers; limitation of
liability; termination; governing law `[jurisdiction]` placeholder; contact.

## Section 4 — Reachability & links

- Add footer links to `/privacy` and `/terms` on Landing and Login (link-only,
  no redesign) and in the dashboard sidebar footer.
- Pages must render without authentication so Google's reviewer can reach them.

## Verification

- `npm run build` passes (tsc + vite).
- Manual: every existing flow still works (login, list agents, create agent,
  Arthur, OAuth connect) — unchanged because logic untouched.
- `/privacy` and `/terms` reachable while logged out; Limited Use statement and
  all scopes present; placeholders clearly marked.
