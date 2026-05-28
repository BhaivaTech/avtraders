
# Backend (Node.js + Express + MySQL)

## Env
Copy `.env.example` to `.env` and adjust if needed.

## Dev
```
npm install
npm run dev
```

## Deploy (VPS + PM2 + NGINX sample)
1) Build a service directory on the VPS, e.g. `/var/www/avtraders-api`
2) Copy the **backend/** folder contents there.
3) Install Node 18+ and PM2:
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2
cd /var/www/avtraders-api
npm i
pm2 start server.js --name avtraders-api
pm2 save
pm2 startup
```

4) NGINX reverse proxy (example):
```
server {
  listen 80;
  server_name avtradersagriclinic.com www.avtradersagriclinic.com;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```
Enable SSL with Certbot and reload NGINX.

## Database
Import `schema.sql` into `avtradersdb` (host: 46.28.44.56).

## Notes
- OTP provider is `dev` by default — OTP prints in server logs.
- Payment provider is `stub` by default — use `/api/payment/mock-success` to mark success.
- File uploads are stored under `uploads/` and served at `/uploads/*`.
