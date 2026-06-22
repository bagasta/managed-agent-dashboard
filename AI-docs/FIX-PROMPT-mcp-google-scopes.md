# Prompt: Perbaikan Frontend — MCP Google Workspace & Scope

Salin blok di bawah ini ke agent coding (atau kerjakan langsung). Sudah dibatasi **frontend-only**;
perubahan backend ditandai sebagai dependensi, bukan bagian task ini.

---

## Konteks

Repo: `/home/bagas/frontend-managed-agents` (Vite + React + TS, "clevio-dashboard").
Backend: `/home/bagas/managed-agents-project` (FastAPI). MCP: `/home/bagas/google-workspace-mcp`.

Hasil QA menemukan agent tidak bisa pakai Google Form (dan service Google lain) karena flow OAuth
granular di dashboard meminta scope yang kurang dan tidak lengkap. Tujuan task ini: rapikan definisi
tool/scope MCP di frontend supaya token yang di-grant cukup untuk semua tool MCP yang dipakai agent.

File relevan:
- `src/types.ts` → `MCP_TOOLS` (definisi tool + scopes)
- `src/api/oauth.ts` → `oauthApi.startConnect` (kirim scopes ke auth-link), `oauthApi.revoke`
- `src/api/googleWorkspace.ts` → `getGoogleToolScopes`, config server google_workspace
- `src/api/agents.ts` → `getConnections` (tampilan koneksi)
- `src/components/McpToolSelector.tsx` → UI pilih tool

Acuan kebenaran scope = backend `GOOGLE_SCOPES` di
`/home/bagas/google-workspace-mcp/app/api/integrations.py` dan daftar service MCP
(`SERVICE_MODULES`) di `/home/bagas/google-workspace-mcp/google_workspace_mcp/main.py`:
`gmail, drive, calendar, docs, sheets, chat, forms, slides, tasks, contacts, search, appscript`.

## Yang harus dikerjakan (frontend-only)

### 1. Lengkapi scope tool `forms` (BUG utama)
Di `src/types.ts`, tool `id: 'forms'` saat ini hanya minta `forms.body`, `forms.body.readonly`,
`drive.file`. Tambahkan `https://www.googleapis.com/auth/forms.responses.readonly` supaya
`get_form_response` / `list_form_responses` tidak 403 saat baca jawaban form.

### 2. Lengkapi `MCP_TOOLS` dengan service yang didukung backend tapi belum ada di UI
Tambahkan entri tool untuk: **slides, docs, tasks, contacts, chat** (dan opsional gmail-read).
Pakai scope kanonik dari backend `GOOGLE_SCOPES`:
- slides → `https://www.googleapis.com/auth/presentations`
- docs → `https://www.googleapis.com/auth/documents`
- tasks → `https://www.googleapis.com/auth/tasks`
- contacts → `https://www.googleapis.com/auth/contacts`
- chat → `https://www.googleapis.com/auth/chat.spaces`, `.../chat.messages`, `.../chat.memberships`
- (opsional) gmail-read → `https://www.googleapis.com/auth/gmail.readonly`
Pastikan `service` tiap tool = nama service backend, dan `category` konsisten dgn yang sudah ada.

### 3. Hindari scope sempit menimpa baseline
Backend `_build_google_auth_url` memakai `scopes if scopes else GOOGLE_SCOPES` — artinya `scopes`
granular dari frontend MENGGANTIKAN total default. Pilih salah satu, konsisten:
- (Disarankan) Sediakan opsi UI "Aktifkan semua Google Workspace" yang mengirim seluruh scope
  service yang dipakai agent, ATAU
- Selalu sertakan baseline minimal (`openid`, `userinfo.email`, `userinfo.profile`, `drive.file`)
  di setiap connect agar tidak ada regresi identitas/Drive.
Terapkan di `oauthApi.startConnect` (src/api/oauth.ts) dan `getGoogleToolScopes`
(src/api/googleWorkspace.ts).

### 4. Tombol revoke memanggil endpoint yang tidak ada → 404
`oauthApi.revoke` memanggil `DELETE /v1/integrations/google/revoke/{agentId}/{service}` yang belum
ada di backend. Untuk sekarang: sembunyikan/disable tombol revoke di UI (atau beri state
"coming soon") sampai endpoint backend tersedia. JANGAN biarkan memanggil endpoint 404.

### 5. Samakan default URL MCP
Pastikan `DEFAULT_GOOGLE_WORKSPACE_MCP_URL` (src/api/googleWorkspace.ts) dan `VITE_*` env satu
sumber. Pertahankan guard `isStaleGoogleWorkspaceUrl` untuk devtunnel lama.

## Di luar scope (dependensi backend — JANGAN dikerjakan di task ini, cukup catat)
- `/status` backend selalu balikin `scopes: []` dan DB tidak menyimpan granted scopes → UI tidak bisa
  tahu scope sebenarnya (saat ini fallback ke localStorage requested-scopes di `getConnections`).
  Tandai dengan komentar `// TODO(backend): butuh granted_scopes dari /status` di
  `src/api/agents.ts#getConnections`. Jangan klaim "tersambung + scope X" seolah pasti.
- Endpoint revoke backend.

## Acceptance criteria
- [ ] Tool `forms` menyertakan `forms.responses.readonly`.
- [ ] `MCP_TOOLS` mencakup minimal: gmail, drive, calendar, sheets, forms, slides, docs, tasks,
      contacts, chat — tiap entri scope-nya valid sesuai backend.
- [ ] Connect via dashboard tidak menghilangkan baseline identity/Drive (opsi 3 diterapkan).
- [ ] Tombol revoke tidak lagi memanggil endpoint 404.
- [ ] `npm run build` (atau `tsc --noEmit`) lulus tanpa error tipe.
- [ ] `McpToolSelector` menampilkan tool baru beserta daftar scope-nya dengan benar.

## Catatan
- Bahasa UI: Indonesia, ikuti gaya komponen yang ada.
- Jangan ubah backend / DB di task ini.
- Setelah selesai, sebutkan file yang diubah + ringkasan 2-3 baris.
