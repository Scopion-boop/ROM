#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL backup script for PhysioLens production
# Run via cron: 0 2 * * * /opt/physiolens/deploy/backup-db.sh >> /var/log/physiolens-backup.log 2>&1

BACKUP_DIR="/opt/physiolens/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/physiolens_${TIMESTAMP}.sql.gz"

# Create backup directory if needed
mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting database backup..."

# Dump using Docker exec into the running postgres container
docker compose -f /opt/physiolens/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-physiolens}" "${POSTGRES_DB:-physiolens_prod}" \
  --clean --if-exists --no-owner \
  | gzip > "${BACKUP_FILE}"

FILESIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null)
echo "[$(date -Iseconds)] Backup complete: ${BACKUP_FILE} (${FILESIZE} bytes)"

# Prune old backups
echo "[$(date -Iseconds)] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "physiolens_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(ls -1 "${BACKUP_DIR}"/physiolens_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date -Iseconds)] Backup rotation complete. ${REMAINING} backups retained."
