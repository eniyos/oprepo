#!/usr/bin/env bash
# backup-db.sh — Nightly PostgreSQL dump to Backblaze B2 (or local fallback).
#
# Add to crontab on the VM:
#   0 4 * * * /home/ubuntu/oprepo/scripts/backup-db.sh
#
# Prerequisites:
#   - b2 CLI installed and authorized: pip install b2 && b2 authorize-account
#   - Or: B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY set in .env.production
#
# If B2 is not configured, saves to local directory (not a real backup).

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-~/backups/oprepo}"
DATABASE_URL="${DATABASE_URL:-postgresql://oprepo:oprepo@localhost:5432/oprepo}"
B2_BUCKET="${B2_BUCKET:-oprepo-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Parse DATABASE_URL for pg_dump
DB_USER="oprepo"
DB_PASS="oprepo"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="oprepo"

if [[ "$DATABASE_URL" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="oprepo-${TIMESTAMP}.sql.gz"
mkdir -p "${BACKUP_DIR}"

echo "→ Dumping ${DB_NAME}@${DB_HOST}:${DB_PORT}..."
PGPASSWORD="${DB_PASS}" pg_dump \
  -h "${DB_HOST}" -p "${DB_PORT}" \
  -U "${DB_USER}" -d "${DB_NAME}" \
  --no-owner --no-acl \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "  ✓ Dumped to ${BACKUP_DIR}/${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Upload to Backblaze B2 if configured
if command -v b2 &>/dev/null && [[ -n "${B2_APPLICATION_KEY_ID:-}" ]]; then
  echo "→ Uploading to B2 bucket ${B2_BUCKET}..."
  b2 upload-file "${B2_BUCKET}" "${BACKUP_DIR}/${FILENAME}" "oprepo/${FILENAME}" 2>/dev/null
  echo "  ✓ Uploaded"
fi

# Prune local backups older than retention
find "${BACKUP_DIR}" -name "oprepo-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
echo "  ✓ Pruned backups older than ${RETENTION_DAYS} days"
echo "✓ Backup complete"
