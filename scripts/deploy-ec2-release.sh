#!/usr/bin/env bash
set -euo pipefail
umask 077
release_id=${1:?release id required}
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release id'; exit 1; }
app_root=/opt/avtraders
archive=/tmp/avtraders-${release_id}.tar.gz
release=$app_root/releases/$release_id
exec 9>"$app_root/shared/deploy.lock"
flock -w 300 9
[[ -f "$archive" && -f "$app_root/shared/backend.env" ]]
[[ ! -e "$release" ]] || { echo 'Release already exists'; exit 1; }
[[ $(df -Pk "$app_root" | awk 'NR==2 {print $4}') -gt 1048576 ]] || { echo 'Less than 1 GiB free; deployment stopped'; exit 1; }
mkdir -p "$release" "$app_root/shared/backups"
tar -xzf "$archive" -C "$release"
[[ -f "$release/backend/server.js" && -f "$release/frontend/dist/index.html" ]]
chmod 755 "$release"
chmod -R a+rX "$release/frontend"
[[ ! -e "$release/backend/.env" ]] || { echo 'Deployment archive must not include secrets'; exit 1; }
ln -s "$app_root/shared/backend.env" "$release/backend/.env"
ln -s "$app_root/shared/uploads" "$release/backend/uploads"
ln -s "$app_root/shared/uploads_private" "$release/backend/uploads_private"
(cd "$release/backend" && npm-22 ci --omit=dev --no-audit --no-fund)
# Backend startup applies pending migrations; preserve a database snapshot first.
sudo mysqldump --single-transaction --routines --events avtradersdb | gzip > "$app_root/shared/backups/before-${release_id}.sql.gz"
gzip -t "$app_root/shared/backups/before-${release_id}.sql.gz"
previous=$(readlink -f "$app_root/current")
activated=0
rollback() {
    result=$?
    if (( result != 0 && activated == 1 )); then
        echo 'Deployment failed; restoring previous application release.'
        ln -s "$previous" "$app_root/current.rollback"
        mv -Tf "$app_root/current.rollback" "$app_root/current"
        sudo systemctl restart avtraders-backend || true
        echo "Database backup retained; database changes are not automatically reversed."
    fi
    exit "$result"
}
trap rollback EXIT
ln -s "$release" "$app_root/current.next"
mv -Tf "$app_root/current.next" "$app_root/current"
activated=1
sudo systemctl restart avtraders-backend
healthy=0
for attempt in {1..20}; do
    if curl --fail --silent --max-time 5 http://127.0.0.1:5100/api/health > "$release/health.json"; then
        healthy=1
        break
    fi
    sleep 3
done
(( healthy == 1 ))
curl --fail --silent --show-error --max-time 20 --resolve avtradersagriclinic.com:443:127.0.0.1 https://avtradersagriclinic.com/api/health
curl --fail --silent --show-error --max-time 20 --resolve avtradersagriclinic.com:443:127.0.0.1 -o /dev/null https://avtradersagriclinic.com/
printf '%s\n' "$release_id" > "$app_root/shared/deployed-release"
echo "Deployed $release_id"
