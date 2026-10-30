# Clevio AI Staff — Landing Page & Security Management

Official landing page and production gateway configuration for **Clevio AI Staff** (operated by PT Clevio). A modern, interactive web application featuring live WhatsApp AI staff simulation, multi-industry solutions, responsive mobile-first architecture, and bilingual (ID/EN) support.

- Live URL: [https://chiefaiofficer.id](https://chiefaiofficer.id) / [https://chiefaiofficer-alpha.vercel.app](https://chiefaiofficer-alpha.vercel.app)
- Production Server: `194.238.23.242` (srv651498.hstgr.cloud)

---

## 🛡️ Panduan Cepat Hardening Keamanan Server (DevOps / Server Admin)

Hasil audit keamanan 2026-10-28 telah diselesaikan dan diintegrasikan ke repository ini. Untuk menutup celah keamanan di server produksi (`194.238.23.242`), cukup jalankan 3 baris perintah berikut di VPS:

```bash
# 1. Masuk ke direktori dashboard di VPS
cd /home/clevio/stack/managed-agents-dashboard

# 2. Tarik update terbaru dari branch ini
git pull origin clevio-landing-page

# 3. Jalankan skrip hardening otomatis
bash scripts/harden-vps.sh
```

### Apa yang Otomatis Dijalankan oleh Skrip Tersebut?
1. **Memblokir Port 5432 (PostgreSQL)** dari internet luar dengan UFW Firewall (*vuln-0006*).
2. **Me-redeploy Nginx Frontend** dengan konfigurasi aman ([`deploy/nginx.conf.template`](./deploy/nginx.conf.template)):
   - Memblokir mount `/v1/*` di apex domain `chiefaiofficer.id` (mengembalikan 403 Forbidden) sehingga tidak ada API key atau chat history yang bisa diakses publik (*vuln-0001, vuln-0002, vuln-0003, vuln-0005, vuln-0010*).
   - Memblokir relay `/payment-webhook` palsu (*vuln-0004*).
   - Mengaktifkan HTTP Security Headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`).
3. **Upgrade n8n** ke versi terbaru (`>= 2.10.1`) untuk menutup CVE-2026-27578 (*vuln-0007*).

> **Detail Laporan Lengkap:** Lihat file [`REMEDIASI-VULNERABILITY-MASTER.md`](./REMEDIASI-VULNERABILITY-MASTER.md) dan modul patch backend di folder [`backend-patches/`](./backend-patches/).

---

## 💻 Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5
- **Routing**: React Router DOM 6
- **Styling**: Tailwind CSS 3 + Vanilla CSS
- **Typography**: Inter (Body) & Poppins (Headings) via Google Fonts
- **Deployment**: Docker Compose + Hardened Nginx + Traefik Reverse Proxy / Vercel

---

## ✨ Fitur Utama

- **Interactive WhatsApp Simulator**: Demo interaktif agen AI multi-industri (Online Store, Klinik, Properti, Asisten Pribadi).
- **Mobile-First Responsive Design**: Tampilan optimal untuk smartphone, tablet, dan desktop.
- **Bilingual Support**: Dukungan instan Bahasa Indonesia (ID) & English (EN).
- **Hardened Architecture**: Tidak membocorkan API key rahasia ke bundle client (`.env` aman).

---

## 🚀 Memulai (Lokal)

### Prasyarat
- Node.js 18+
- npm atau pnpm

### Instalasi & Menjalankan Dev Server
```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev
```

Buka `http://localhost:5173` di browser.

### Build Produksi
```bash
# Compile TypeScript dan build bundle Vite
npm run build

# Preview hasil build
npm run preview
```

---

## 📁 Struktur Direktori Kritis

```
.
├── backend-patches/          # Modul patch backend FastAPI (OTP login, Midtrans verifier, Anti-BOLA)
├── deploy/                   # Konfigurasi container Nginx & Docker Compose yang diamankan
│   ├── Dockerfile.prod       # Multi-stage production Dockerfile
│   ├── docker-compose.prod.yml
│   └── nginx.conf.template   # Template Nginx dengan pemblokiran /v1/ & security headers
├── scripts/
│   └── harden-vps.sh         # Skrip otomatisasi hardening port & server VPS
├── src/                      # Source code React + TypeScript
├── 00-RINGKASAN.md           # Ringkasan eksekutif laporan audit keamanan
├── REMEDIASI-VULNERABILITY-MASTER.md # Panduan master detail perbaikan 10 kerentanan
└── README.md
```

---

## Lisensi

Copyright © 2026 PT Clevio. Seluruh hak cipta dilindungi undang-undang.
