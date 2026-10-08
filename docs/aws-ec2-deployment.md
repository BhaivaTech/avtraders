# AWS EC2 deployment

Deployment date: 2026-10-04
Branch: development
Commit: 623f370fc687321c3c4ad61d2dd431c146343ac1
Instance: i-0fb52a4ec016551a2 (Amazon Linux 2023, ap-south-1)
AWS CLI profile: avtraders
Elastic/public IP: 15.252.74.211
Domain: avtradersagriclinic.com and www.avtradersagriclinic.com

## Current state

Frontend is served over HTTP by Nginx. DNS has not been changed.
Backend is running in production mode under systemd. A new local MariaDB database avtradersdb was created, with a restricted application user. All eight startup migrations completed. The existing remote database was not modified.
Backend environment is /opt/avtraders/shared/backend.env, restricted to mode 600, with generated DB credentials and session/JWT secrets. MariaDB and the backend listen only on 127.0.0.1.
The frontend artifact currently targets http://15.252.74.211 for API access; rebuild API URLs for domain HTTPS cutover.

## Server paths

- Release: /opt/avtraders/releases/623f370
- Current release symlink: /opt/avtraders/current
- Nginx configuration: /etc/nginx/conf.d/avtraders.conf
- Backend unit: /etc/systemd/system/avtraders-backend.service
- Persistent uploads: /opt/avtraders/shared/uploads and uploads_private, linked into the backend release

## Verification

```sh
curl -I http://15.252.74.211/
curl -I -H 'Host: avtradersagriclinic.com' http://15.252.74.211/
ssh -i ~/Downloads/AVTRADERS.pem ec2-user@15.252.74.211
sudo nginx -t
sudo systemctl status nginx avtraders-backend
sudo journalctl -u avtraders-backend -n 100 --no-pager
```

SSH requires a key file restricted to mode 600; deployment used a restricted temporary copy.
Homepage, domain virtual host, and SPA route return HTTP 200. Frontend build passed. Backend tests: 27 passed, 2 failed (admin email rate limiter and announcement result count).

## Remaining work

Public API health returns HTTP 200 with db:true; announcements returns HTTP 200 with an empty list. All eight migrations are recorded. Login, authenticated socket traffic, upload flows, external OTP and payment integrations remain to be verified after HTTPS cutover.
Production cookies require HTTPS; HTTP is currently suitable for frontend preview.
After DNS is pointed, issue a certificate, enable HTTPS, update backend origins and callback URLs, and rebuild frontend API URLs.
Future DNS A records for @ and www should target 15.252.74.211.

## Rollback

This is the first release on an empty server. Stop the avtraders-backend unit and Nginx to withdraw it. Future releases should preserve the prior release and switch /opt/avtraders/current back, then restart the backend and reload Nginx. Database rollback requires a separately verified backup before applying migrations.

## Admin email build correction

The initial bundle used an inherited VITE_ADMIN_EMAIL override. Rebuilt and deployed with VITE_ADMIN_EMAIL=vnsrujan@gmail.com explicitly matching the backend; public bundle content verified. Previous frontend retained at frontend/dist-before-admin-fix for rollback.

Rebuild command:
```sh
VITE_ADMIN_EMAIL=vnsrujan@gmail.com VITE_API_BASE_URL=http://15.252.74.211 VITE_API_URL=http://15.252.74.211 VITE_SITE_URL=https://avtradersagriclinic.com npm --prefix frontend run build
```
Refresh browser caches/service-worker assets if the old email rejection persists. HTTPS is still required for production login sessions.

## HTTPS preparation (2026-10-06)

Certbot and Nginx plugin installed. Renewal timer enabled. IP and domain Nginx virtual hosts separated so domain HTTPS redirects will not redirect IP previews. Frontend rebuilt with empty API override and same-origin endpoint resolution; works for IP and future HTTPS domain.

DNS currently resolves @ and www to 46.28.44.56. No DNS changes or certificate issuance performed.

Set DNS A records @ and www to 15.252.74.211 (TTL 300 recommended). Remove conflicting A/AAAA records for those names. Once propagated, run on EC2:

```sh
sudo /usr/local/sbin/activate-avtraders-https
```

Script source: scripts/activate-ec2-https.sh. It checks both names resolve exclusively to EC2, obtains the trusted certificate, enables HTTP-to-HTTPS redirects, backs up and updates backend origins/callback URLs, restarts the backend and verifies HTTPS API health. SMTP authentication previously failed and remains a separate unresolved issue.

Validation: Nginx configuration passed; IP homepage and domain virtual-host API health passed. API origin checks passed for IP, HTTPS apex, HTTPS www and local development. Activation guard correctly refused while DNS targets the previous server.

## HTTPS activated (2026-10-07)

Activation completed on EC2 after nameserver delegation was updated. Let's Encrypt certificate issued for apex and www, expiring 2027-01-05. Nginx HTTPS configured, backend URLs switched to HTTPS, and renewal enabled. EC2 HTTPS health check returned ok:true and db:true. Verified both HTTPS virtual hosts with certificate validation and explicit EC2 resolution; HTTP redirects to HTTPS. Local DNS caches may take additional time to reflect the delegation change. SMTP authentication remains independently unresolved.

## CSRF recovery fix (2026-10-07)

Frontend token requests now share one in-flight fetch, fail before sending a write when token acquisition fails, and refresh/retry once for both missing and invalid CSRF credentials. IP HTTP visits redirect to the HTTPS domain to support secure cookies. Corrected frontend deployed and backend restarted.

Verification: focused client checks passed for concurrent fetch, header attachment and one-retry recovery. Live HTTPS request without a token was rejected with 403; cookie plus token passed CSRF and invalid test credentials were rejected with 401. Backend/database health passed after restart. No OTP email was sent by this check.

## SMTP corrected (2026-10-07)

Updated server-only SMTP sender to swaragh092@gmail.com using the supplied app password with whitespace removed. Gmail SMTP authentication verification passed, backend restarted, and database health passed. SMTP verification did not send an email. Admin login email remains vnsrujan@gmail.com; the SMTP sender is a separate setting. Secrets remain only in the restricted server environment and its backup, not in this document.

## Multiple admin login (2026-10-07)

Removed the frontend email allowlist from AdminLogin.jsx. Any email can reach backend authentication; only active accounts with valid credentials and OTP may log in. OTP confirmation now displays the entered email. Production build passed and deployed login bundle verified without the old rejection message. HTTPS login page returned 200. Existing account data and backend authorization were not changed.

## Admin OTP expiry (2026-10-07)

Increased ADMIN_OTP_EXPIRY_SECONDS to 300 seconds on EC2 and restarted the backend. Frontend countdown now formats minutes and seconds correctly and no longer claims a fixed one-minute expiry. Production build passed; server environment and database health verified. This applies to newly generated admin OTPs; existing OTPs retain their stored expiry.
