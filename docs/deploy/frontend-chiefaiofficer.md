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
PAYMENT_WEBHOOK_UPSTREAM=https://n8n.srv651498.hstgr.cloud/webhook/midtrans-aistaff
PAYMENT_WEBHOOK_HOST=n8n.srv651498.hstgr.cloud
VITE_PAYMENT_WEBHOOK_URL=/payment-webhook
VITE_DOKU_PAYMENT_LINK_TIER_1=https://sandbox.doku.com/p-link/p/...
VITE_DOKU_PAYMENT_LINK_TIER_2=https://pay.doku.com/...
VITE_DOKU_PAYMENT_LINK_TIER_3=https://pay.doku.com/...
```

`VITE_DOKU_PAYMENT_LINK_TIER_*` dipakai oleh route publik `/pay?plan=tier_1&wa=628xxxxxxxxxx` yang dikirim Arthur dari WhatsApp. Nilai ini masuk saat Docker build, jadi rebuild image setelah mengubah link DOKU.

Route `/pay` hanya menyimpan konteks nomor WhatsApp/plan di browser lalu redirect ke DOKU. Webhook n8n baru dipanggil oleh `/pay/return` jika callback DOKU membawa status sukses, misalnya `https://chiefaiofficer.id/pay/return?status=SUCCESS`. Kalau DOKU success redirect hanya bisa diisi URL tanpa query status, pakai `https://chiefaiofficer.id/pay/return`; route ini akan dianggap sukses selama user memulai pembayaran dari `/pay`. Jangan arahkan pending/failed/cancel callback ke URL sukses yang sama.

Jangan isi **Payment Notification URL** DOKU dengan `/pay/return`. Field itu adalah webhook server-to-server dari DOKU, sementara frontend ini static React app. Untuk mode bridge frontend, yang dibutuhkan adalah **success/return/redirect URL** setelah pembayaran sukses.

Dengan mode ini, frontend tetap memanggil `/v1/...` di domain yang sama, lalu Nginx meneruskan request ke backend.

## File Deploy

- `deploy/Dockerfile.prod` — build Vite lalu serve `dist/` dengan Nginx.
- `deploy/nginx.conf.template` — SPA fallback dan reverse proxy `/v1/`.
- `deploy/docker-compose.prod.yml` — service frontend dengan label Traefik untuk `chiefaiofficer.id`.
- `deploy/env.prod.example` — contoh env production.

## Google OAuth Branding

Untuk verifikasi Google Cloud Console, samakan branding OAuth dengan homepage publik:

- **App name**: `Clevio AI Staff`
- **Homepage URL**: `https://chiefaiofficer.id/`
- **Privacy Policy URL**: `https://chiefaiofficer.id/privacy`
- **Terms of Service URL**: `https://chiefaiofficer.id/terms`
- **Authorized domain**: `chiefaiofficer.id`

Jangan memakai nama lama seperti `Chief AI Officer`, `Managed Agent Platform`, atau nama project internal di field **App name** OAuth consent screen. Google reviewer membandingkan field itu dengan nama aplikasi yang terlihat di homepage.

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
