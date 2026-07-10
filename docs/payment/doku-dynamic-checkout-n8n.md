# DOKU Dynamic Checkout via n8n

Frontend `chiefaiofficer.id` tidak memanggil DOKU API langsung. DOKU `client-id` dan `secret-key` harus disimpan di n8n/backend.

Workflow import n8n sudah disiapkan di:

```text
docs/payment/n8n-doku-create-checkout.workflow.json
```

Import file itu ke n8n, lalu aktifkan workflow. Path webhook production-nya:

```text
https://n8n.srv651498.hstgr.cloud/webhook/doku-create-checkout
```

## DOKU Config di Node

Buka node **Build DOKU Request**, lalu isi blok `DOKU_CONFIG` di paling atas:

```js
const DOKU_CONFIG = {
  clientId: 'BRN-xxxxxxxxxxxxxxxx',
  secretKey: 'xxxxxxxxxxxxxxxx',
  checkoutEndpoint: 'https://api-sandbox.doku.com/checkout/v1/payment',
  notificationUrl: 'https://n8n.srv651498.hstgr.cloud/webhook/midtrans-aistaff',
  checkoutDueMinutes: 60,
};
```

Credential DOKU tidak perlu ditaruh di env n8n dan jangan dimasukkan ke env frontend.

## Frontend Request

Arthur mengirim link seperti ini:

```text
https://chiefaiofficer.id/pay?plan=tier_1&wa=628xxxxxxxxxx
```

Saat user klik **Bayar di DOKU**, frontend POST ke:

```text
POST https://chiefaiofficer.id/payment-create-checkout
```

Nginx meneruskan request ini ke `PAYMENT_CREATE_CHECKOUT_UPSTREAM`.

Payload:

```json
{
  "event": "clevio_payment_create_checkout",
  "source": "chiefaiofficer_payment_bridge",
  "bridge_reference": "uuid",
  "phone_number": "628xxxxxxxxxx",
  "plan_code": "tier_1",
  "plan_label": "Starter",
  "display_amount": 100000,
  "currency": "IDR",
  "return_url": "https://chiefaiofficer.id/pay/return?ref=uuid",
  "callback_url_result": "https://chiefaiofficer.id/pay/return?ref=uuid",
  "callback_url": "https://chiefaiofficer.id/pay",
  "notification_url": "https://chiefaiofficer.id/payment-webhook",
  "created_at": "2026-07-10T06:25:23.000Z"
}
```

`display_amount` dari frontend hanya untuk tampilan. n8n/backend wajib menentukan nominal final dari `plan_code`.

## n8n Create Checkout Response

n8n harus membalas request frontend secara synchronous dengan salah satu format ini:

```json
{
  "payment_url": "https://sandbox.doku.com/checkout-link-v2/..."
}
```

atau langsung meneruskan response DOKU:

```json
{
  "response": {
    "payment": {
      "url": "https://sandbox.doku.com/checkout-link-v2/..."
    }
  }
}
```

Frontend akan redirect browser ke URL tersebut.

## DOKU Sandbox Request

n8n/backend membuat request ke:

```text
POST https://api-sandbox.doku.com/checkout/v1/payment
```

Minimal body:

```json
{
  "order": {
    "amount": 100000,
    "invoice_number": "CLE1628xxxxxxxxxx20260710132523",
    "currency": "IDR",
    "callback_url": "https://chiefaiofficer.id/pay",
    "callback_url_result": "https://chiefaiofficer.id/pay/return?ref=uuid",
    "auto_redirect": true,
    "line_items": [
      {
        "id": "tier_1",
        "name": "Clevio AI Staff Starter",
        "quantity": 1,
        "price": 100000,
        "sku": "CLE-TIER-1",
        "category": "digital-content"
      }
    ]
  },
  "payment": {
    "payment_due_date": 60
  },
  "customer": {
    "id": "628xxxxxxxxxx",
    "name": "Clevio Customer",
    "phone": "628xxxxxxxxxx"
  },
  "additional_info": {
    "override_notification_url": "https://n8n.srv651498.hstgr.cloud/webhook/midtrans-aistaff"
  }
}
```

Gunakan `invoice_number` sebagai key idempotency dan mapping:

```text
invoice_number -> phone_number -> plan_code -> amount
```

Workflow import memakai format invoice:

```text
CLE{tierNumber}{phoneNumber}{yyyyMMddHHmmss}
```

Contoh:

```text
CLE1628123456789020260710132523
```

## DOKU Notification

DOKU akan POST hasil pembayaran ke `override_notification_url` atau Payment Notification URL di dashboard DOKU.

n8n hanya boleh aktivasi plan saat notification resmi DOKU berisi status sukses, misalnya:

```json
{
  "order": {
    "invoice_number": "CLE-T1-628xxxxxxxxxx-20260710132523",
    "amount": 100000
  },
  "transaction": {
    "status": "SUCCESS"
  }
}
```

Frontend `/pay/return` boleh mengirim event tambahan ke n8n, tapi jangan dijadikan satu-satunya sumber aktivasi. Source-of-truth aktivasi adalah DOKU notification server-to-server.
