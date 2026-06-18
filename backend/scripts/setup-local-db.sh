#!/usr/bin/env bash
# scripts/setup-local-db.sh
# Run all migrations against the local dev MySQL database.
# Usage:  bash scripts/setup-local-db.sh
# Safe to re-run — all migrations are idempotent.

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-avtraders_dev}"
DB_PASS="${DB_PASS:-DevLocal@123}"
DB_NAME="${DB_NAME:-avtradersdb}"

# Use BASH_SOURCE so the path resolves correctly even with spaces
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$(cd "${SCRIPT_DIR}/../migrations" && pwd)"

# Load DB_ vars from .env (skip comments and blank lines)
ENV_FILE="${SCRIPT_DIR}/../.env"
if [[ -f "${ENV_FILE}" ]]; then
  while IFS= read -r line; do
    [[ "${line}" =~ ^#.*$ || -z "${line}" ]] && continue
    [[ "${line}" =~ ^DB_ ]] && export "${line?}" 2>/dev/null || true
  done < "${ENV_FILE}"
fi

# Build mysql command as an array so spaces in credentials work
MYSQL_CMD=(mysql "-h${DB_HOST}" "-P${DB_PORT}" "-u${DB_USER}" "-p${DB_PASS}" "${DB_NAME}")

echo ""
echo "=========================================="
echo "  AV Traders — Local DB Migration Runner"
echo "=========================================="
echo "  Host : ${DB_HOST}:${DB_PORT}"
echo "  DB   : ${DB_NAME}"
echo "  User : ${DB_USER}"
echo "=========================================="
echo ""

# Test connection
echo "→ Testing connection..."
if ! "${MYSQL_CMD[@]}" -e "SELECT 1" &>/dev/null; then
  echo ""
  echo "❌  Cannot connect to MySQL!"
  echo "    Run this first:"
  echo ""
  echo "    sudo mysql -e \""
  echo "      CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  echo "      CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';"
  echo "      GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'127.0.0.1';"
  echo "      CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
  echo "      GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
  echo "      FLUSH PRIVILEGES;"
  echo "    \""
  exit 1
fi
echo "   ✓  Connection OK"
echo ""

# Run each migration in sorted order.
# -print0 / sort -z / read -d '' handle paths with spaces safely.
TOTAL=0
FAILED=0

while IFS= read -r -d '' migration; do
  filename="$(basename "${migration}")"
  echo -n "→ Running ${filename} ... "
  if "${MYSQL_CMD[@]}" < "${migration}" 2>&1; then
    echo "✓ done"
  else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
  fi
  TOTAL=$((TOTAL + 1))
done < <(find "${MIGRATIONS_DIR}" -maxdepth 1 -name "*.sql" -print0 | sort -z)

echo ""
echo "=========================================="
if [[ $FAILED -eq 0 ]]; then
  echo "  ✅  All ${TOTAL} migrations applied successfully!"
else
  echo "  ⚠️   ${FAILED}/${TOTAL} migrations failed. Check output above."
fi
echo "=========================================="
echo ""

# Show final table list
echo "→ Tables in ${DB_NAME}:"
"${MYSQL_CMD[@]}" -e "SHOW TABLES;" 2>/dev/null
echo ""
