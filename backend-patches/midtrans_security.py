"""
Midtrans Webhook Cryptographic Verification & Settlement Confirmation
Remediasi untuk vuln-0004 (CWE-345)
"""
import hashlib
import hmac
import os
import requests
from typing import Dict, Any, Optional

MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY", "")
IS_PRODUCTION = os.getenv("MIDTRANS_IS_PRODUCTION", "true").lower() == "true"
MIDTRANS_API_BASE = "https://api.midtrans.com/v2" if IS_PRODUCTION else "https://api.sandbox.midtrans.com/v2"


def verify_midtrans_signature(payload: Dict[str, Any], server_key: Optional[str] = None) -> bool:
    """
    Memvalidasi signature_key Midtrans resmi:
    signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
    """
    key = server_key or MIDTRANS_SERVER_KEY
    if not key:
        raise ValueError("MIDTRANS_SERVER_KEY tidak disetel di environment variables.")

    order_id = str(payload.get("order_id", ""))
    status_code = str(payload.get("status_code", ""))
    gross_amount = str(payload.get("gross_amount", ""))
    received_signature = str(payload.get("signature_key", ""))

    if not (order_id and status_code and gross_amount and received_signature):
        return False

    raw_string = f"{order_id}{status_code}{gross_amount}{key}"
    calculated_signature = hashlib.sha512(raw_string.encode("utf-8")).hexdigest()

    # Cegah timing attack dengan hmac.compare_digest
    return hmac.compare_digest(calculated_signature.lower(), received_signature.lower())


def verify_transaction_with_midtrans_api(order_id: str, server_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Double-check langsung ke server Midtrans (Server-to-Server Verification).
    Mencegah webhook forgery dan replay attack.
    """
    key = server_key or MIDTRANS_SERVER_KEY
    url = f"{MIDTRANS_API_BASE}/{order_id}/status"
    
    try:
        response = requests.get(
            url,
            auth=(key, ""),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"[ERROR] Gagal menghubungi Midtrans Status API: {e}")
        return None


def is_payment_valid_and_settled(payload: Dict[str, Any]) -> bool:
    """
    Memastikan transaksi telah diverifikasi secara kriptografis
    DAN statusnya benar-benar settlement/capture di API Midtrans.
    """
    # 1. Cek Signature
    if not verify_midtrans_signature(payload):
        print(f"[SECURITY ALERT] Midtrans signature tidak valid untuk order_id: {payload.get('order_id')}")
        return False

    # 2. Double-check status ke API Midtrans
    order_id = payload.get("order_id", "")
    server_status = verify_transaction_with_midtrans_api(order_id)
    if not server_status:
        return False

    tx_status = server_status.get("transaction_status")
    fraud_status = server_status.get("fraud_status", "")

    # Status sukses pembayaran Midtrans
    if tx_status == "capture":
        return fraud_status == "accept"
    elif tx_status == "settlement":
        return True

    return False
