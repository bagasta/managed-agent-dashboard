# SOP Deploy — managed-agent.chiefaiofficer.id

Dokumen ini adalah panduan baku untuk melakukan deployment **Managed Agent Platform** ke VPS produksi.
Ikuti urutan ini setiap kali deploy agar `/ui/` dan `/wa-dev/` selalu berhasil.

---

## Informasi Akses

| Item | Nilai |
|------|-------|
| VPS IP | `194.238.23.242` |
| SSH User | `clevio` |
| SSH Password | `Humancentric4725.` |
| Project dir di VPS | `/home/clevio/stack/managed-agents/` |
| API Key | `42523db14d86f993409fba4984764be01fb169ddf7e5e401efab2f33442c9a7b` |

## URL Produksi

| Endpoint | URL |
|----------|-----|
| API + Swagger | `https://managed-agent.chiefaiofficer.id/docs` |
| UI Dashboard | `https://managed-agent.chiefaiofficer.id/ui/` |
| WA Dev Dashboard | `https://managed-agent.chiefaiofficer.id/wa-dev/` |
| Health check | `https://managed-agent.chiefaiofficer.id/health` |

---

## Cara Deploy (dari laptop lokal)

Cukup jalankan satu perintah dari root project:

```bash
python3 deploy_paramiko.py
```

Script ini melakukan:
1. Membuat tarball project (exclude `.git`, `venv`, `__pycache__`, `wa-store`, `wa-dev-store`, `node_modules`)
2. Upload ke VPS via SFTP
3. Extract ke `/home/clevio/stack/managed-agents/`
4. `docker build -f sandbox.Dockerfile -t managed-agents-sandbox:latest .` (build image sandbox runtime)
5. `docker compose up -d --build` (rebuild semua service image)
6. `alembic upgrade head` (jalankan migrasi DB)

### Lama deploy
- Build pertama: ~5–8 menit (download base image + compile Go)
- Build ulang setelah ada perubahan kode: ~2–4 menit (Go compile wa-dev-service ±100 detik)
- Build ulang tanpa perubahan Go (hanya Python/UI): ~1–2 menit (semua Go layer cached)

---

## ⚠️ Sinkronisasi Arthur (DB vs file) — WAJIB setelah ubah rulebook/model

**Penting:** deploy hanya meng-update KODE. Konfigurasi Arthur (instructions & model) hidup di **DATABASE**, bukan di kode. App runtime **tidak** membaca `system-message-builder.md` secara live — file itu cuma SUMBER yang di-*bake* ke DB lewat `scripts/seed_arthur.py`.

Artinya, kalau kamu mengubah salah satu dari ini:
- `system-message-builder.md` (system message / rulebook Arthur), atau
- model / tools_config / max_tokens Arthur (di `scripts/seed_arthur.py`)

maka **setelah deploy WAJIB jalankan seed** supaya Arthur di DB ikut ter-update:

```bash
# Cek dulu (tidak mengubah apa-apa)
sudo docker exec deploy-api-1 python scripts/seed_arthur.py --dry-run

# Terapkan (update instructions + model + tools_config + soul Arthur di DB)
sudo docker exec deploy-api-1 python scripts/seed_arthur.py
```

Seed ini idempoten & aman untuk Arthur yang sudah ada:
- Update `instructions` (dari `system-message-builder.md`), `model`, `max_tokens`, `tools_config`, dan re-seed soul.
- `operator_ids` di-**merge** (yang lama tidak dihapus); koneksi WhatsApp (`wa_device_id`) **tidak** disentuh; agent lain **tidak** terpengaruh.
- Efektif **langsung** — config dibaca dari DB tiap run, tanpa restart.

> Model/instruksi agent **buatan user** juga ada di DB masing-masing. Mengubahnya tidak lewat deploy, tapi lewat Arthur (`update_agent`) atau UPDATE DB langsung.

---

## Checklist Sebelum Deploy

- [ ] Kode sudah di-commit (tidak wajib di-push, deploy pakai local copy)
- [ ] `deploy/.env.prod` sudah ada dan lengkap (lihat bagian **env.prod wajib** di bawah)
- [ ] Tidak ada syntax error di Python: `make lint` (opsional tapi disarankan)
- [ ] Perubahan DB schema sudah dibuatkan migration: `make migrate MSG="deskripsi"`

---

## Checklist Setelah Deploy

Verifikasi semua endpoint berikut berfungsi:

```bash
# Health API
curl https://managed-agent.chiefaiofficer.id/health

# UI Dashboard (harus return HTML)
curl -I https://managed-agent.chiefaiofficer.id/ui/

# WA Dev Dashboard (harus return HTML)
curl -I https://managed-agent.chiefaiofficer.id/wa-dev/
```

Atau buka manual di browser:
- [ ] `https://managed-agent.chiefaiofficer.id/health` → `{"status":"ok"}`
- [ ] `https://managed-agent.chiefaiofficer.id/ui/` → halaman UI terbuka
- [ ] `https://managed-agent.chiefaiofficer.id/wa-dev/` → dashboard WA Dev terbuka dengan tombol "Hubungkan WhatsApp"
- [ ] **Jika `system-message-builder.md` atau config Arthur berubah** → `sudo docker exec deploy-api-1 python scripts/seed_arthur.py` (lihat bagian *Sinkronisasi Arthur* di atas)
- [ ] Verifikasi model Arthur benar: `PGPASSWORD=... psql -h localhost -U postgres -d managed_agents -tA -c "select name, model from agents where name='Arthur';"` → `Arthur|openai/gpt-4.1-mini`

---

## Isi `.env.prod` yang Wajib Ada

File ini **tidak ada di git** (di-gitignore). Lokasi di repo: `deploy/.env.prod`.
Kalau VPS di-rebuild dari scratch, buat manual dengan isi minimal:

```env
DATABASE_URL=postgresql+asyncpg://postgres:Aiagronomists4725.@host.docker.internal:5432/managed_agents
OPENROUTER_API_KEY=sk-or-v1-...
API_KEY=42523db14d86f993409fba4984764be01fb169ddf7e5e401efab2f33442c9a7b
WA_DEV_SERVICE_URL=http://wa-dev-service:8081
SANDBOX_BASE_DIR=/tmp/agent-sandboxes
DOCKER_SANDBOX_IMAGE=managed-agents-sandbox:latest
AGENT_MAX_STEPS=12
AGENT_TIMEOUT_SECONDS=300
```

> **Catatan penting**: `wa-dev-service` membaca `API_KEY` dari `.env.prod` secara otomatis
> (code sudah diset fallback: `MAIN_API_KEY` → `API_KEY`). Tidak perlu env var tambahan.

---

## Arsitektur Container

```
Internet
  └── Traefik (root_default network, port 80/443)
        ├── managed-agent.chiefaiofficer.id/*     → deploy-api-1 (port 8000)
        ├── managed-agent.chiefaiofficer.id/ui/*  → deploy-api-1 (serve static via FastAPI)
        └── managed-agent.chiefaiofficer.id/wa-dev/* → deploy-wa-dev-service-1 (port 8081)

Internal network (hanya antar container):
  deploy-api-1
  deploy-scheduler-1
  deploy-wa-service-1
  deploy-wa-dev-service-1
  deploy-redis-1
  deploy-pgbouncer-1
```

### Routing Traefik
- **`/ui/`** — dilayani FastAPI (`StaticFiles`) dari dalam container `api`. Tidak perlu container terpisah.
- **`/wa-dev/`** — Traefik strip prefix `/wa-dev`, forward ke `wa-dev-service:8081`. Dashboard HTML di `/app/dashboard/index.html` dalam container.

---

## Container & Volume

| Container | Image | Fungsi |
|-----------|-------|--------|
| `deploy-api-1` | build dari `Dockerfile` root | FastAPI backend + serve `/ui/` |
| `deploy-scheduler-1` | build dari `Dockerfile` root | APScheduler worker |
| `deploy-wa-service-1` | build dari `wa-service/Dockerfile` | WhatsApp production microservice (Go) |
| `deploy-wa-dev-service-1` | build dari `wa-dev-service/Dockerfile` | WhatsApp dev/test number + dashboard (Go) |
| `deploy-redis-1` | `redis:7-alpine` | Rate limiting, deduplication, caching |
| `deploy-pgbouncer-1` | `edoburu/pgbouncer` | Connection pooling ke PostgreSQL host |

| Volume | Isi | Jangan dihapus |
|--------|-----|----------------|
| `deploy_wa_store` | SQLite session wa-service (WhatsApp auth) | Ya — scan QR ulang kalau dihapus |
| `deploy_wa_dev_store` | SQLite session wa-dev-service + `connections.json` | Ya — sama |
| `deploy_redis_data` | Redis persistence | Bisa dihapus kalau mau reset |

> **JANGAN** jalankan `docker compose down -v` — akan menghapus volume WhatsApp session
> dan harus scan QR ulang dari awal.

---

## Perintah Berguna di VPS

SSH ke VPS dulu:
```bash
ssh clevio@194.238.23.242
```

### Lihat status semua container
```bash
sudo docker compose -f /home/clevio/stack/managed-agents/deploy/docker-compose.prod.yml ps
```

### Lihat logs
```bash
# API
sudo docker logs deploy-api-1 -f --tail 100

# WA Dev Service (cek apakah MAIN_API_KEY terbaca)
sudo docker logs deploy-wa-dev-service-1 -f --tail 50

# WA Service
sudo docker logs deploy-wa-service-1 -f --tail 50

# Scheduler
sudo docker logs deploy-scheduler-1 -f --tail 50
```

### Restart satu service (tanpa rebuild)
```bash
sudo docker compose -f /home/clevio/stack/managed-agents/deploy/docker-compose.prod.yml restart api
sudo docker compose -f /home/clevio/stack/managed-agents/deploy/docker-compose.prod.yml restart wa-dev-service
```

### Jalankan migrasi DB manual
```bash
sudo docker exec deploy-api-1 alembic upgrade head
```

### Rebuild + redeploy langsung dari VPS (tanpa upload dari laptop)
```bash
cd /home/clevio/stack/managed-agents
sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
sudo docker exec deploy-api-1 alembic upgrade head
```

---

## Troubleshooting

### `/wa-dev/` tidak muncul (blank / 502)

1. Cek container jalan:
   ```bash
   sudo docker ps | grep wa-dev
   ```
2. Cek logs wa-dev-service:
   ```bash
   sudo docker logs deploy-wa-dev-service-1 --tail 30
   ```
3. Penyebab umum dan solusi:

   | Gejala di log | Penyebab | Solusi |
   |---------------|----------|--------|
   | `MAIN_API_KEY is required` | `API_KEY` tidak ada di `.env.prod` | Tambahkan `API_KEY=...` ke `.env.prod`, deploy ulang |
   | `store init: ...` | Error baca/tulis `connections.json` | Pastikan volume `deploy_wa_dev_store` di-mount di `/data/wa-dev-store` |
   | Container langsung exit | Crash saat init | Lihat log lengkap, cek env vars |
   | QR tidak muncul; `POST /wa-dev/connect-wa` → 500 `connect: invalid use of deleted device` | Device WA di-`logged out from another device`; client whatsmeow lama "poisoned" (row device sudah di-`Store.Delete`, tapi proses masih pegang client lama) | Sudah di-fix di `wa-dev-service/whatsapp.go` (rebuild device fresh saat `needsReset`). Untuk service versi lama: cukup `docker compose ... restart wa-dev-service` → QR balik muncul |

### `/ui/` tidak muncul (404)

1. Cek direktori `UI-DEV/` ada di project root
2. Cek `app/main.py` mount StaticFiles di path `/ui`
3. Cek container api running: `sudo docker ps | grep api`

### API return 502 Bad Gateway

1. Cek api container: `sudo docker logs deploy-api-1 --tail 50`
2. Cek redis healthy: `sudo docker logs deploy-redis-1 --tail 20`
3. Cek pgbouncer: `sudo docker logs deploy-pgbouncer-1 --tail 20`

### WhatsApp dev perlu scan QR ulang

Normal setelah session expired. Buka `https://managed-agent.chiefaiofficer.id/wa-dev/`, klik **Hubungkan WhatsApp**, scan QR.

---

## Catatan Infrastruktur VPS

- **Traefik** sudah jalan permanen di network `root_default`. Jangan hapus network ini — dipakai semua project di VPS.
- **PostgreSQL** berjalan langsung di host VPS (bukan container), diakses container via `host.docker.internal:5432`.
  - DB: `managed_agents`, user: `postgres`, password: `Aiagronomists4725.`
- **Sandbox Docker** pakai bind mount `/tmp/agent-sandboxes` di host — path ini harus sama antara API container dan sandbox container yang dibuat via Docker socket. Kalau VPS di-rebuild, jalankan `mkdir -p /tmp/agent-sandboxes` di host dan build ulang image `managed-agents-sandbox:latest`.
- Tidak ada port yang di-expose langsung ke internet — semua akses via Traefik (80/443).
