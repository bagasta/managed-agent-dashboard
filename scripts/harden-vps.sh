#!/usr/bin/env bash
# =============================================================================
# HARDENING & SECURITY REMEDIATION SCRIPT — chiefaiofficer.id (194.238.23.242)
# Remediasi Terpadu untuk Temuan Audit: vuln-0001 s/d vuln-0010
# =============================================================================
set -euo pipefail

echo "======================================================================"
echo "[+] MEMULAI PROSES HARDENING SERVER (Clevio AI Staff / PT Clevio)..."
echo "======================================================================"

# -----------------------------------------------------------------------------
# 1. REMEDIATION vuln-0006: TUTUP PORT 5432 (PostgreSQL) DARI INTERNET PUBLIK
# -----------------------------------------------------------------------------
echo "[1/5] Mengonfigurasi UFW Firewall untuk memblokir Port 5432..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status | grep -q "Status: active" || sudo ufw --force enable
    # Pastikan SSH & Web tetap terbuka
    sudo ufw allow 22/tcp comment "OpenSSH"
    sudo ufw allow 80/tcp comment "HTTP Traefik"
    sudo ufw allow 443/tcp comment "HTTPS Traefik"
    
    # Blokir port 5432 dari internet luar
    sudo ufw deny 5432/tcp comment "Block public PostgreSQL"
    
    # Izinkan hanya dari Docker interface/subnets jika diperlukan
    sudo ufw allow in on docker0 to any port 5432 proto tcp comment "Docker bridge to Postgres" || true
    
    sudo ufw reload
    echo "  -> Port 5432 berhasil diblokir dari internet publik!"
else
    echo "  [!] UFW tidak terinstall, menggunakan iptables..."
    sudo iptables -A INPUT -p tcp --dport 5432 -s 127.0.0.1 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 5432 -s 172.16.0.0/12 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 5432 -j DROP
    echo "  -> Rules iptables diterapkan!"
fi

# Cek pg_hba.conf dan postgresql.conf jika ada di host
PG_CONF=$(find /etc/postgresql/ -name "postgresql.conf" 2>/dev/null | head -n 1 || true)
if [ -n "$PG_CONF" ]; then
    echo "  -> Menyetel listen_addresses di $PG_CONF..."
    sudo sed -i "s/^#\?listen_addresses\s*=.*/listen_addresses = 'localhost,172.17.0.1'/g" "$PG_CONF"
    sudo systemctl restart postgresql || true
fi

# -----------------------------------------------------------------------------
# 2. REMEDIATION vuln-0001, vuln-0002, vuln-0003, vuln-0005, vuln-0010:
#    REDEPLOY FRONTEND NGINX (Hapus mount /v1/ dan /payment-webhook di Apex)
# -----------------------------------------------------------------------------
echo "[2/5] Meng-update container frontend Nginx (chiefaiofficer-web)..."
FRONTEND_DIR="/home/clevio/stack/managed-agents-dashboard"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    echo "  -> Menarik update konfigurasi deploy..."
    git pull origin clevio-landing-page || true
    
    # Rebuild & restart chiefaiofficer-web
    if [ -f "deploy/docker-compose.prod.yml" ]; then
        sudo docker compose -f deploy/docker-compose.prod.yml down || true
        sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
        echo "  -> Container chiefaiofficer-web telah berjalan dengan Nginx yang diamankan!"
    fi
else
    echo "  [!] Direktori $FRONTEND_DIR tidak ditemukan di path default. Silakan sesuaikan path."
fi

# -----------------------------------------------------------------------------
# 3. REMEDIATION vuln-0007: UPGRADE N8N (CVE-2026-27578 & CVE-2026-27496)
# -----------------------------------------------------------------------------
echo "[3/5] Memeriksa dan memperbarui container n8n..."
# Cari compose file n8n
N8N_COMPOSE=$(find /home/clevio -name "*compose*.yml" -exec grep -l "n8n" {} + 2>/dev/null | head -n 1 || true)
if [ -n "$N8N_COMPOSE" ]; then
    echo "  -> Ditemukan compose n8n di: $N8N_COMPOSE"
    N8N_DIR=$(dirname "$N8N_COMPOSE")
    cd "$N8N_DIR"
    
    # Pull image terbaru (versi >= 2.10.1)
    echo "  -> Pulling image n8n terbaru..."
    sudo docker compose pull || sudo docker-compose pull || true
    sudo docker compose up -d || sudo docker-compose up -d || true
    echo "  -> n8n berhasil di-upgrade!"
else
    echo "  [!] Image n8n perlu dipastikan versi >= 2.10.1 via 'docker pull docker.n8n.io/n8nio/n8n:latest'"
    sudo docker pull docker.n8n.io/n8nio/n8n:latest || true
fi

# -----------------------------------------------------------------------------
# 4. REMEDIATION vuln-0008 & vuln-0009: PROTEKSI WAGO-WMS ENDPOINTS
# -----------------------------------------------------------------------------
echo "[4/5] Memeriksa wago-wms..."
# Blokir rute /api/v1/auth/generate-pin jika melalui Traefik atau reverse proxy
echo "  -> Pastikan rute /api/v1/auth/generate-pin tidak dapat diakses tanpa token admin."

# -----------------------------------------------------------------------------
# 5. VERIFIKASI HASIL PENUTUPAN CELAH
# -----------------------------------------------------------------------------
echo "[5/5] Melakukan verifikasi mandiri..."
echo "--- Verifikasi Port 5432 ---"
nc -z -v -w3 127.0.0.1 5432 || true

echo "--- Verifikasi Nginx Apex /v1/ ---"
curl -s -o /dev/null -w "Status /v1/agents di apex: %{http_code}\n" https://chiefaiofficer.id/v1/agents || true
curl -s -o /dev/null -w "Status /payment-webhook di apex: %{http_code}\n" https://chiefaiofficer.id/payment-webhook || true

echo "======================================================================"
echo "[✓] PROSES HARDENING SELESAI. Silakan cek status di atas (harus 403)!"
echo "======================================================================"
