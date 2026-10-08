#!/usr/bin/env bash
set -euo pipefail
if [[ $EUID -ne 0 ]]; then echo 'Run with sudo on the EC2 server.'; exit 1; fi
python3 - <<'PY'
import socket
for name in ['avtradersagriclinic.com','www.avtradersagriclinic.com']:
    addresses={item[4][0] for item in socket.getaddrinfo(name,80,type=socket.SOCK_STREAM)}
    if addresses != {'15.252.74.211'}:
        raise SystemExit(f'{name} still resolves to {addresses}; point it only to 15.252.74.211 and remove conflicting AAAA records before activation.')
print('DNS points both names to EC2.')
PY
certbot --nginx --non-interactive --agree-tos --email vnsrujan@gmail.com --redirect -d avtradersagriclinic.com -d www.avtradersagriclinic.com
python3 - <<'PY'
import pathlib,json,datetime,shutil
p=pathlib.Path('/opt/avtraders/shared/backend.env')
backup=p.with_name('backend.env.before-https-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
shutil.copy2(p,backup)
updates={'PUBLIC_BASE_URL':'https://avtradersagriclinic.com','BACKEND_BASE_URL':'https://avtradersagriclinic.com','APP_ORIGIN':'https://avtradersagriclinic.com','ALLOWED_ORIGINS':'https://avtradersagriclinic.com,https://www.avtradersagriclinic.com','COOKIE_DOMAIN':''}
lines=[line for line in p.read_text().splitlines() if line.split('=',1)[0].strip() not in updates]
lines += [key+'='+json.dumps(value) for key,value in updates.items()]
p.write_text('\n'.join(lines)+'\n');p.chmod(0o600)
PY
nginx -t
systemctl reload nginx
systemctl restart avtraders-backend
systemctl enable --now certbot-renew.timer
for attempt in {1..10}; do
    if curl --fail --silent https://avtradersagriclinic.com/api/health; then echo; exit 0; fi
    sleep 2
done
echo 'HTTPS configured but API health needs investigation.' >&2
exit 1
