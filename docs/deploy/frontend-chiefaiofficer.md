# Deploy Frontend — chiefaiofficer.id

Panduan ini khusus untuk mengganti website lama di `chiefaiofficer.id` dengan frontend React/Vite dari repo ini.
Dokumen backend di `docs/deploy/SOP-deploy.md` tetap dipakai sebagai referensi backend/API.

## Arsitektur

```
Internet
  -> Traefik root_default
    -> chiefaiofficer-web container
      -> /              static React app
      -> /app/*         SPA fallback ke index.html
      -> /v1/*          proxy ke backend existing
```

Default upstream API:

```env
API_UPSTREAM=https://managed-agent.chiefaiofficer.id
API_UPSTREAM_HOST=managed-agent.chiefaiofficer.id
```

Dengan mode ini, frontend tetap memanggil `/v1/...` di domain yang sama, lalu Nginx meneruskan request ke backend.

## File Deploy

- `deploy/Dockerfile.prod` — build Vite lalu serve `dist/` dengan Nginx.
- `deploy/nginx.conf.template` — SPA fallback dan reverse proxy `/v1/`.
- `deploy/docker-compose.prod.yml` — service frontend dengan label Traefik untuk `chiefaiofficer.id`.
- `deploy/env.prod.example` — contoh env production.

## Cutover dari Website Lama

1. SSH ke VPS.
2. Identifikasi container/config lama yang memakai `Host(\`chiefaiofficer.id\`)`.
3. Backup config lama atau catat compose path-nya.
4. Stop service lama atau hapus label Traefik domain lama.
5. Deploy frontend baru:

```bash
cd /home/clevio/stack/managed-agents-dashboard
cp deploy/env.prod.example deploy/.env.prod
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d --build
```

6. Verifikasi:

```bash
curl -I https://chiefaiofficer.id/
curl -I https://chiefaiofficer.id/login
curl -I https://chiefaiofficer.id/app
curl -I https://chiefaiofficer.id/v1/models
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml ps
```

## Catatan Security

Jangan isi `VITE_API_KEY` dengan admin API key untuk public production. Variable `VITE_*` masuk ke bundle JavaScript dan bisa dibaca dari browser.

Kalau backend masih mewajibkan API key untuk semua endpoint setelah login, selesaikan dulu salah satu opsi ini:

- ubah backend agar session/user login cukup untuk endpoint dashboard,
- buat backend-for-frontend yang menyimpan API key di server,
- atau gunakan API key sementara hanya untuk environment private/internal.

## Rollback

Jika frontend baru bermasalah:

1. Stop compose frontend ini.
2. Jalankan kembali stack/container website lama.
3. Pastikan Traefik hanya punya satu router aktif untuk `chiefaiofficer.id`.

```bash
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml down
```
