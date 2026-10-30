# Laporan Keamanan — chiefaiofficer.id (Clevio AI Staff / PT Clevio)

**Tanggal pengujian:** 2026-10-28  
**Target:** https://chiefaiofficer.id (+ seluruh subdomain & infrastruktur terkait)  
**Metode:** Black-box assessment terotorisasi (recon, validasi, PoC)  

## Ringkasan Eksekutif

Ditemukan **10 vulnerability** (1 critical, 5 high, 2 medium, 2 info). Akar masalah utama:

1. **API internal (Managed Agent Platform, FastAPI) di-mount ke domain utama (`/v1/*`) TANPA layer autentikasi** — vhost `managed-agent.chiefaiofficer.id` yang sama mem-validasi `X-API-Key`, tetapi mount di apex melewatkannya sepenuhnya. Dari sini mengalir: leak seluruh API key tenant, BOLA riwayat chat, pembuatan/modifikasi/penghapusan agent lintas-tenant, dan minting subscription berbayar.
2. **Login hanya dengan nomor HP** (`POST /v1/users/login/phone`) — tanpa OTP/password — dan daftar nomor HP customer bocor lewat poin 1, menghasilkan account takeover total setiap customer.
3. **Webhook pembayaran Midtrans tanpa verifikasi signature** (`POST /payment-webhook`) — notifikasi palsu bisa memperpanjang/membuat subscription berbayar tanpa membayar.

## Daftar Temuan

| ID | Severity | CVSS | Judul | Target |
|----|----------|------|-------|--------|
| vuln-0005 | CRITICAL | 9.1 | Unauthenticated cross-tenant agent creation (mass-assigned owner), modification, | /v1/agents, /v1/agents/{agent_id} |
| vuln-0001 | HIGH | 8.2 | Phone-only authentication bypass / full account takeover on POST /v1/users/login | https://chiefaiofficer.id/v1/users/login/phone |
| vuln-0002 | HIGH | 8.2 | Unauthenticated GET /v1/agents leaks all 174 tenants' plaintext API keys and own | https://chiefaiofficer.id/v1/agents |
| vuln-0003 | HIGH | 7.5 | Unauthenticated session history BOLA exposes all customer chat transcripts | https://chiefaiofficer.id/v1/sessions/{session_id}/history |
| vuln-0004 | HIGH | 7.5 | Unauthenticated payment webhook forgery renews paid subscriptions without paymen | /payment-webhook |
| vuln-0010 | HIGH | 7.5 | Unauthenticated subscription minting: free activate/topup/upgrade to paid tiers  | /v1/subscriptions/{user_id}/activate |
| vuln-0007 | MEDIUM | 4.6 | CVE-2026-27578 in n8n 2.8.3 (self-hosted instance) — stored XSS via workflow nod | n8n.srv651498.hstgr.cloud (194.238.23.242) |
| vuln-0008 | MEDIUM | 6.5 | Unauthenticated credential minting via POST /api/v1/auth/generate-pin on wago-wm | https://wago-wms.chiefaiofficer.id |
| vuln-0006 | INFO | 0.0 | Production PostgreSQL database exposed to the public internet on port 5432 (194. | 194.238.23.242 (srv651498.hstgr.cloud) |
| vuln-0009 | INFO | 0.0 | DELETE /api/v1/sessions/{session_id} skips ownership check (no-op success on oth | https://wago-wms.chiefaiofficer.id |

## Urutan Prioritas Remediasi

1. **Segera (jam pertama):** hapus mount `/v1/*` dari apex nginx, tutup port 5432 PostgreSQL dari internet, rotasi SEMUA API key agent (semuanya dianggap bocor).
2. **Sama hari:** tambahkan OTP di login nomor HP, validasi signature Midtrans di `/payment-webhook`, hapus endpoint `/api/v1/auth/generate-pin` dari wago-wms.
3. **Minggu ini:** enforce API-key dependency di level router FastAPI (bukan per-route), object-level authorization di semua handler mutasi, upgrade n8n 2.8.3 → ≥2.10.1.
4. **Berkelanjutan:** rate limit login, audit log mutasi agent, monitoring brute-force di Postgres.

## Detail per Temuan

Setiap temuan didokumentasikan lengkap (deskripsi, dampak, analisis teknis, PoC, bukti, remediasi) di file `vuln-XXXX.md` di folder ini, terurut:

- **`vuln-0005.md`** — [CRITICAL] Unauthenticated cross-tenant agent creation (mass-assigned owner), modification, and deletion on apex /v1/* API
- **`vuln-0001.md`** — [HIGH] Phone-only authentication bypass / full account takeover on POST /v1/users/login/phone
- **`vuln-0002.md`** — [HIGH] Unauthenticated GET /v1/agents leaks all 174 tenants' plaintext API keys and owner PII (apex mount bypasses key validation)
- **`vuln-0003.md`** — [HIGH] Unauthenticated session history BOLA exposes all customer chat transcripts
- **`vuln-0004.md`** — [HIGH] Unauthenticated payment webhook forgery renews paid subscriptions without payment (no Midtrans signature verification)
- **`vuln-0010.md`** — [HIGH] Unauthenticated subscription minting: free activate/topup/upgrade to paid tiers on apex /v1 API
- **`vuln-0007.md`** — [MEDIUM] CVE-2026-27578 in n8n 2.8.3 (self-hosted instance) — stored XSS via workflow nodes (payment-workflow instance)
- **`vuln-0008.md`** — [MEDIUM] Unauthenticated credential minting via POST /api/v1/auth/generate-pin on wago-wms
- **`vuln-0006.md`** — [INFO] Production PostgreSQL database exposed to the public internet on port 5432 (194.238.23.242 / srv651498.hstgr.cloud)
- **`vuln-0009.md`** — [INFO] DELETE /api/v1/sessions/{session_id} skips ownership check (no-op success on other users' and nonexistent sessions)

## Catatan Infrastruktur

- Host: 194.238.23.242 (srv651498.hstgr.cloud, Hostinger AS47583, DE) — Traefik reverse proxy di depan stack containerized.
- Port terbuka: 22 (OpenSSH 9.6p1), 80/443 (Traefik), **5432 (PostgreSQL 16.11–16.12, internet-exposed)**.
- n8n 2.8.3 (`n8n.srv651498.hstgr.cloud`) — environment flag `development` bocor di `/versioncheck`.
- Tidak ada WAF di vhost mana pun.
- Vhost live: chiefaiofficer.id (SPA), wago-wms (WhatsApp Mgmt System), wa-n8n (FastAPI gateway), managed-agent (FastAPI API), google-workspace-mcp (MCP).
- 12 subdomain DNS-only (api., backend-ai., langchain., bcrypt., file., dst.) resolve tapi 404 di Traefik.

---

*Laporan ini dihasilkan dari authorized security assessment. Semua temuan sudah tervalidasi dengan PoC dan bukti exchange proxy (ID tercantum di tiap file). Detail teknis mentah tersedia di `/workspace/recon/`.*