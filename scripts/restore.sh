#!/bin/bash

# Restore script for LLM Node Generator
# Restores database, user files, and configuration from backup

set -e

# Configuration
BACKUP_DIR="/backup"
DB_NAME="${DB_NAME:-workflow_automation_prod}"
DB_USER="${DB_USER:-automation_user}"
DB_HOST="${DB_HOST:-database}"

# Parse command line arguments
BACKUP_PREFIX=""
RESTORE_TYPE="full"

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -p PREFIX     Backup prefix (e.g., automation_backup_20240101_120000)"
    echo "  -t TYPE       Restore type: full, database, files (default: full)"
    echo "  -l            List available backups"
    echo "  -h            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 -l                                          # List backups"
    echo "  $0 -p automation_backup_20240101_120000       # Full restore"
    echo "  $0 -p automation_backup_20240101_120000 -t database  # Database only"
}

while getopts "p:t:lh" opt; do
    case $opt in
        p) BACKUP_PREFIX="$OPTARG" ;;
        t) RESTORE_TYPE="$OPTARG" ;;
        l) 
            echo "📋 Available backups:"
            ls -la "${BACKUP_DIR}"/automation_backup_*_manifest.txt 2>/dev/null | \
                sed 's/.*automation_backup_\([0-9_]*\)_manifest.txt/\1/' | \
                sort -r | head -10
            exit 0
            ;;
        h) usage; exit 0 ;;
        *) usage; exit 1 ;;
    esac
done

if [ -z "$BACKUP_PREFIX" ]; then
    echo "❌ Error: Backup prefix is required"
    echo "Use -l to list available backups"
    usage
    exit 1
fi

echo "🔄 Starting restore process at $(date)"
echo "📁 Backup prefix: ${BACKUP_PREFIX}"
echo "🎯 Restore type: ${RESTORE_TYPE}"

# Verify backup files exist
if [ ! -f "${BACKUP_DIR}/${BACKUP_PREFIX}_manifest.txt" ]; then
    echo "❌ Error: Backup manifest not found: ${BACKUP_DIR}/${BACKUP_PREFIX}_manifest.txt"
    exit 1
fi

echo "📋 Backup manifest:"
cat "${BACKUP_DIR}/${BACKUP_PREFIX}_manifest.txt"
echo ""

# Confirmation prompt
if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "database" ]; then
    echo "⚠️  WARNING: This will overwrite the current database!"
    echo "Database: ${DB_NAME} on ${DB_HOST}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Restore cancelled"
        exit 1
    fi
fi

# Create restore log
RESTORE_LOG="${BACKUP_DIR}/restore_${BACKUP_PREFIX}_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$RESTORE_LOG") 2>&1

# 1. Database restore
if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "database" ]; then
    echo "📊 Restoring PostgreSQL database..."
    
    if [ ! -f "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql.gz" ]; then
        echo "❌ Error: Database backup file not found"
        exit 1
    fi
    
    # Stop any active connections
    echo "🛑 Terminating active database connections..."
    psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Restore database
    echo "🔄 Restoring database from backup..."
    gunzip -c "${BACKUP_DIR}/${BACKUP_PREFIX}_database.sql.gz" | \
        psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restore completed"
    else
        echo "❌ Database restore failed"
        exit 1
    fi
fi

# 2. Files restore
if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "files" ]; then
    echo "📁 Restoring application files..."
    
    # Restore uploads
    if [ -f "${BACKUP_DIR}/${BACKUP_PREFIX}_uploads.tar.gz" ]; then
        echo "📤 Restoring uploads..."
        mkdir -p /app/uploads
        tar -xzf "${BACKUP_DIR}/${BACKUP_PREFIX}_uploads.tar.gz" -C /app/
        echo "✅ Uploads restored"
    fi
    
    # Restore configuration (manual merge required)
    if [ -f "${BACKUP_DIR}/${BACKUP_PREFIX}_config.env" ]; then
        echo "⚙️ Configuration backup available at: ${BACKUP_DIR}/${BACKUP_PREFIX}_config.env"
        echo "ℹ️  Please manually merge configuration settings (secrets not included)"
    fi
fi

# 3. Generated nodes restore (if JSON export exists)
if [ -f "${BACKUP_DIR}/${BACKUP_PREFIX}_generated_nodes.json" ] && [ -s "${BACKUP_DIR}/${BACKUP_PREFIX}_generated_nodes.json" ]; then
    echo "🔧 Generated nodes backup found"
    echo "ℹ️  JSON export available at: ${BACKUP_DIR}/${BACKUP_PREFIX}_generated_nodes.json"
    echo "ℹ️  This can be used for analysis or migration if needed"
fi

# 4. Verify restore
echo "🔍 Verifying restore..."

if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "database" ]; then
    # Check database connectivity
    psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database connectivity verified"
        
        # Check table counts
        TABLES=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        echo "📊 Tables restored: ${TABLES}"
        
        USERS=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
            "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        echo "👥 Users restored: ${USERS}"
        
        NODES=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
            "SELECT COUNT(*) FROM generated_nodes WHERE is_active = true;" 2>/dev/null || echo "0")
        echo "🔧 Active generated nodes: ${NODES}"
        
    else
        echo "❌ Database connectivity check failed"
        exit 1
    fi
fi

# 5. Post-restore tasks
echo "🔧 Running post-restore tasks..."

# Clear any cached data
if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -h redis FLUSHDB 2>/dev/null || true
    echo "✅ Cache cleared"
fi

# Update file permissions
if [ -d "/app/uploads" ]; then
    chown -R 1001:1001 /app/uploads 2>/dev/null || true
    echo "✅ File permissions updated"
fi

# 6. Summary
echo ""
echo "🎉 Restore completed successfully!"
echo "📊 Restore Summary:"
echo "   - Type: ${RESTORE_TYPE}"
echo "   - Source: ${BACKUP_PREFIX}"
echo "   - Log: ${RESTORE_LOG}"
echo "   - Completed: $(date)"
echo ""

# 7. Next steps
echo "📝 Next steps:"
echo "1. Verify application functionality"
echo "2. Check logs for any errors"
echo "3. Update any configuration changes manually"
if [ "$RESTORE_TYPE" = "full" ] || [ "$RESTORE_TYPE" = "database" ]; then
    echo "4. Restart application services to ensure clean state"
fi
echo ""

echo "✅ Restore process completed at $(date)"