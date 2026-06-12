
# AV Traders Agri Clinic — Full‑Stack App (B2C + B2B + Admin)

This project provides a production‑ready starter for the AV Traders Agri Clinic website with:
- Farmer "Get Solutions" chat (with image upload & spraying details)
- Dealer "Distribution Unit" with product list and ordering
- Admin panel with Unread / Read / Sent tabs, quotation upload, payments & LR number
- OTP login (SMS provider pluggable; dev mode included)
- UPI payments via pluggable providers (PhonePe/Razorpay stubs + test mode)
- Kannada/English toggle

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env   # update values!
npm install
npm run dev            # starts on PORT=5000 by default
```

### 2) Database
Import `schema.sql` into your MySQL `avtradersdb` (on your VPS). For example:
```bash
mysql -h <DB_HOST> -u <DB_USER> -p <DB_NAME> < schema.sql
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev            # Vite dev server (default 5173)
```

Update `VITE_API_BASE_URL` in `frontend/.env.example` if your backend URL differs.

See backend `README.md` for NGINX + PM2 deployment samples.
