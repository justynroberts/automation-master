#!/bin/bash

# Backup script for LLM Node Generator
# Backs up database, user files, and configuration

set -e

# Configuration
BACKUP_DIR="/backup"
DB_NAME="${DB_NAME:-workflow_automation_prod}"
DB_USER="${DB_USER:-automation_user}"
DB_HOST="${DB_HOST:-database}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="automation_backup_${DATE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "🗄️ Starting backup process at $(date)"

# 1. Database backup
echo "📊 Backing up PostgreSQL database..."
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password --clean --if-exists --create \
    > "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql"

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed"
    gzip "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql"
else
    echo "❌ Database backup failed"
    exit 1
fi

# 2. Application files backup
echo "📁 Backing up application files..."
if [ -d "/app/uploads" ]; then
    tar -czf "${BACKUP_DIR}/${BACKUP_PREFIX}_uploads.tar.gz" -C /app uploads/
    echo "✅ Uploads backup completed"
fi

# 3. Configuration backup
echo "⚙️ Backing up configuration..."
if [ -f "/app/.env" ]; then
    # Remove sensitive data before backup
    grep -v -E "(PASSWORD|SECRET|KEY)" /app/.env > "${BACKUP_DIR}/${BACKUP_PREFIX}_config.env" || true
    echo "✅ Configuration backup completed"
fi

# 4. Generated nodes backup (additional JSON export)
echo "🔧 Backing up generated nodes..."
psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM generated_nodes WHERE is_active = true) t) TO STDOUT;" \
    > "${BACKUP_DIR}/${BACKUP_PREFIX}_generated_nodes.json" 2>/dev/null || echo "No generated nodes to backup"

# 5. Logs backup (last 7 days)
echo "📝 Backing up recent logs..."
if [ -d "/app/logs" ]; then
    find /app/logs -name "*.log" -mtime -7 | tar -czf "${BACKUP_DIR}/${BACKUP_PREFIX}_logs.tar.gz" -T - 2>/dev/null || true
    echo "✅ Logs backup completed"
fi

# 6. Create manifest file
echo "📋 Creating backup manifest..."
cat > "${BACKUP_DIR}/${BACKUP_PREFIX}_manifest.txt" << EOF
Backup Created: $(date)
Database: ${DB_NAME}
Files Included:
- ${BACKUP_PREFIX}_database.sql.gz (PostgreSQL dump)
- ${BACKUP_PREFIX}_uploads.tar.gz (User uploads)
- ${BACKUP_PREFIX}_config.env (Configuration without secrets)
- ${BACKUP_PREFIX}_generated_nodes.json (Generated nodes export)
- ${BACKUP_PREFIX}_logs.tar.gz (Recent logs)

Backup Size:
$(du -sh ${BACKUP_DIR}/${BACKUP_PREFIX}_* | awk '{print $1 "\t" $2}')
EOF

# 7. Upload to S3 (if configured)
if [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${BACKUP_S3_BUCKET}" ]; then
    echo "☁️ Uploading to S3..."
    aws s3 sync "${BACKUP_DIR}" "s3://${BACKUP_S3_BUCKET}/backups/$(date +%Y/%m)/" \
        --exclude "*" --include "${BACKUP_PREFIX}_*" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        echo "✅ S3 upload completed"
    else
        echo "❌ S3 upload failed"
    fi
fi

# 8. Cleanup old backups
echo "🧹 Cleaning up old backups..."
find "${BACKUP_DIR}" -name "automation_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
echo "✅ Cleanup completed (kept last ${RETENTION_DAYS} days)"

# 9. Summary
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_PREFIX}_"* | awk '{sum+=$1} END {print sum}')
echo ""
echo "🎉 Backup completed successfully!"
echo "📊 Backup Summary:"
echo "   - Location: ${BACKUP_DIR}"
echo "   - Prefix: ${BACKUP_PREFIX}"
echo "   - Total Size: $(du -sh ${BACKUP_DIR}/${BACKUP_PREFIX}_* | awk 'BEGIN{size=0} {size+=$1} END{print size "B"}')"
echo "   - Files: $(ls -1 ${BACKUP_DIR}/${BACKUP_PREFIX}_* | wc -l)"
echo ""

# 10. Health check (verify backup integrity)
echo "🔍 Verifying backup integrity..."
if [ -f "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql.gz" ]; then
    gunzip -t "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql.gz"
    if [ $? -eq 0 ]; then
        echo "✅ Database backup integrity verified"
    else
        echo "❌ Database backup corrupted!"
        exit 1
    fi
fi

echo "✅ Backup process completed at $(date)"