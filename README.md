# Clevio — Managed Agent Dashboard

Admin dashboard untuk **Managed Agent Platform**. Tempat mengelola agent (CRUD), menyambungkan WhatsApp, melihat analitik, dan mengakses Arthur.

Dibangun dengan **Vite + React 18 + TypeScript + Tailwind CSS**. Frontend murni — semua data datang dari backend lewat HTTP. Tidak ada kode backend di repo ini.

---

## Stack

| | |
|---|---|
| Build tool | Vite 5 |
| Framework | React 18 + React Router 6 |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State | React state + `localStorage` (belum ada state lib) |

---

## Menjalankan secara lokal

Butuh **Node.js 18+**.

```bash
# 1. Install dependency
npm install

# 2. Siapkan env
cp .env.example .env
# edit .env, isi VITE_API_KEY (lihat bagian Environment di bawah)

# 3. Jalankan dev server (port 5173, hot reload)
npm run dev
```

Buka http://localhost:5173

### Perintah lain

```bash
npm run build     # type-check (tsc -b) + build produksi ke dist/
npm run preview   # preview hasil build dist/ secara lokal
```

---

## Backend (WAJIB jalan)

Dashboard ini **tidak berisi backend**. Ia hanya consumer API. Backend (`managed-agents-project`, FastAPI) harus berjalan terpisah di **`http://localhost:8000`**.

Saat dev, Vite mem-proxy semua request `/v1/*` → `http://localhost:8000`. Konfigurasinya ada di `vite.config.ts`:

```ts
server: {
  port: 5173,
  proxy: { '/v1': { target: 'http://localhost:8000', changeOrigin: true } },
}
```

> **Mau arahkan ke backend lain (mis. staging)?** Ubah `target` di `vite.config.ts`.

---

## Environment

| Variable | Wajib | Keterangan |
|---|---|---|
| `VITE_API_KEY` | ya | Admin API key backend. Otomatis dikirim sebagai header `X-API-Key` di setiap request yang butuh auth. |

- `.env` di-gitignore (jangan commit secret). Hanya `.env.example` yang masuk repo.
- API key juga bisa di-set runtime dari UI (disimpan di `localStorage` key `clevio_api_key`) — ini menimpa `VITE_API_KEY`. Lihat `src/api/client.ts`.

---

## Struktur project

```
src/
├── main.tsx              # entry point React
├── App.tsx              # routing (React Router)
├── types.ts            # tipe TypeScript bersama (Agent, User, ModelInfo, ...)
├── index.css           # Tailwind + global styles
├── api/
│   └── client.ts       # SATU-SATUNYA tempat panggil backend. Tambah endpoint di sini.
├── components/
│   └── Layout.tsx      # shell halaman /app (sidebar/nav + <Outlet/>)
└── pages/
    ├── Landing.tsx     # /          landing publik
    ├── Login.tsx       # /login     login via nomor HP
    ├── Overview.tsx    # /app       dashboard utama
    ├── Agents.tsx      # /app/agents        list + create agent
    ├── AgentDetail.tsx # /app/agents/:id    detail, edit, koneksi WhatsApp
    ├── Analytics.tsx   # /app/analytics
    ├── Arthur.tsx      # /app/arthur
    └── Profile.tsx     # /app/profile
```

### Routing

| Path | Halaman | Auth |
|---|---|---|
| `/` | Landing | publik |
| `/login` | Login (by nomor HP) | publik |
| `/app` | Overview | login required |
| `/app/agents`, `/app/agents/:id` | Agents / AgentDetail | login required |
| `/app/analytics`, `/app/arthur`, `/app/profile` | — | login required |

Route di bawah `/app` butuh user login. User disimpan di `localStorage` key `clevio_user`; kalau kosong → redirect ke `/login`.

---

## API client

Semua panggilan backend lewat `src/api/client.ts`. **Jangan `fetch()` langsung di komponen** — tambahkan method baru di objek `api` supaya auth (`X-API-Key`) dan error handling konsisten.

Endpoint yang sudah ada:

| Method | Endpoint backend | Fungsi |
|---|---|---|
| `api.loginByPhone(phone)` | `POST /v1/users/login/phone` | login |
| `api.getUser(id)` | `GET /v1/users/:id` | |
| `api.listAgents()` | `GET /v1/agents?limit=100` | |
| `api.getAgent(id)` | `GET /v1/agents/:id` | |
| `api.createAgent(payload)` | `POST /v1/agents` | |
| `api.updateAgent(id, payload)` | `PATCH /v1/agents/:id` | |
| `api.deleteAgent(id)` | `DELETE /v1/agents/:id` | |
| `api.listModels()` | `GET /v1/models` | daftar model LLM |
| `api.connectWhatsApp(id)` | `POST /v1/agents/:id/whatsapp/connect` | mulai koneksi, dapat QR |
| `api.getWAQR(id)` | `GET /v1/agents/:id/whatsapp/qr` | |
| `api.getWAStatus(id)` | `GET /v1/agents/:id/whatsapp/status` | |
| `api.disconnectWA(id)` | `DELETE /v1/agents/:id/whatsapp` | |

---

## Status

⚠️ Masih dalam pengembangan — tampilan sudah ada, sebagian halaman/fitur belum lengkap.

## Deploy

`npm run build` menghasilkan static files di `dist/` — bisa di-host di mana saja (Vercel, Netlify, Nginx, dll). Pastikan request `/v1/*` di-proxy/diarahkan ke backend yang benar di lingkungan produksi.
