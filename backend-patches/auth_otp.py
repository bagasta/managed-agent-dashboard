"""
Secure Phone Authentication via One-Time Password (OTP) & JWT
Remediasi untuk vuln-0001 (CWE-287 Authentication Bypass & Enumeration Oracle)
"""
import os
import random
import time
from typing import Dict, Optional
from datetime import datetime, timedelta
import jwt
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/users/auth", tags=["Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-change-in-production-123456")
JWT_ALGORITHM = "HS256"
OTP_EXPIRY_SECONDS = 300  # 5 menit

# Penyimpanan OTP in-memory (pada production gunakan Redis dengan TTL)
otp_cache: Dict[str, Dict[str, Any]] = {}


class RequestOTPInput(BaseModel):
    phone_number: str = Field(..., description="Nomor WhatsApp/HP Indonesia, e.g. 628123456789")


class VerifyOTPInput(BaseModel):
    phone_number: str
    otp: str = Field(..., min_length=6, max_length=6)


def generate_otp() -> str:
    """Generate 6-digit numeric OTP"""
    return f"{random.randint(100000, 999999)}"


def send_otp_via_whatsapp(phone_number: str, otp: str):
    """
    Kirim OTP via WhatsApp Service internal (wa-service).
    Implementasikan request ke http://wa-service:8081/send
    """
    message = f"Kode verifikasi Clevio AI Staff Anda: {otp}. Jangan berikan kode ini kepada siapapun. Berlaku 5 menit."
    # requests.post("http://deploy-wa-service-1:8081/send", json={"phone": phone_number, "message": message})
    print(f"[OTP] Mengirim OTP {otp} ke {phone_number}")


@router.post("/request-otp")
async def request_otp(payload: RequestOTPInput):
    """
    Anti-Enumeration: Endpoint ini SELALU mengembalikan HTTP 200 dengan pesan seragam,
    baik nomor terdaftar maupun tidak terdaftar di sistem.
    """
    phone = payload.phone_number.strip().replace("+", "").replace("-", "")
    
    # Generate OTP baru
    code = generate_otp()
    otp_cache[phone] = {
        "code": code,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
        "attempts": 0
    }
    
    # Kirim OTP
    send_otp_via_whatsapp(phone, code)
    
    return {
        "status": "success",
        "message": "Jika nomor terdaftar, kode verifikasi OTP telah dikirim melalui WhatsApp."
    }


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPInput):
    """
    Verifikasi kode OTP dan terbitkan session JWT jika valid.
    Tidak pernah mengembalikan user record/kuota sebelum OTP diverifikasi!
    """
    phone = payload.phone_number.strip().replace("+", "").replace("-", "")
    data = otp_cache.get(phone)
    
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP tidak ditemukan atau telah kedaluwarsa.")
        
    if time.time() > data["expires_at"]:
        del otp_cache[phone]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP telah kedaluwarsa. Silakan minta kode baru.")
        
    if data["attempts"] >= 3:
        del otp_cache[phone]
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Terlalu banyak percobaan salah. Silakan minta OTP baru.")
        
    if payload.otp != data["code"]:
        data["attempts"] += 1
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kode OTP tidak valid.")
        
    # OTP Valid: Hapus dari cache
    del otp_cache[phone]
    
    # Terbitkan JWT Session
    payload_jwt = {
        "sub": phone,
        "role": "user",
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload_jwt, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 7 * 86400
    }
