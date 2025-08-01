# Troubleshooting Guide

## 🔍 Overview

This guide helps diagnose and resolve common issues with the Workflow Automation Platform. It covers everything from startup problems to execution failures and performance issues.

## 📋 Table of Contents

1. [Quick Diagnostic Commands](#quick-diagnostic-commands)
2. [Container Issues](#container-issues)
3. [Database Problems](#database-problems)
4. [Network & Connectivity](#network--connectivity)
5. [Workflow Execution Issues](#workflow-execution-issues)
6. [Performance Problems](#performance-problems)
7. [Security & Authentication](#security--authentication)
8. [Common Error Messages](#common-error-messages)

## ⚡ Quick Diagnostic Commands

### System Status Check

```bash
# Check all container status
docker-compose ps

# View resource usage
docker-compose top
docker stats

# Check logs for all services
docker-compose logs --tail=50

# Check specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Test service connectivity
curl http://localhost:3000  # Frontend
curl http://localhost:3001/api/health  # Backend API
```

### Health Checks

```bash
# Backend health check
curl -s http://localhost:3001/api/health | jq

# Database connectivity
docker-compose exec postgres pg_isready -U postgres

# Redis connectivity
docker-compose exec redis redis-cli ping

# Docker socket access
docker-compose exec backend docker ps
```

## 🐳 Container Issues

### Container Won't Start

**Symptoms:**
- Container exits immediately
- "Exited (1)" status
- Port binding failures

**Diagnosis:**
```bash
# Check container logs
docker-compose logs container-name

# Check for port conflicts
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Check resource availability
free -h
df -h
```

**Solutions:**

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3000
kill -9 PID

# Or change port in docker-compose.yml
ports:
  - "3002:3000"  # Use different host port
```

**Insufficient Resources:**
```bash
# Free up memory
docker system prune -a
docker volume prune

# Increase Docker resources in Docker Desktop
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .

# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Container Keeps Restarting

**Symptoms:**
- Container in restart loop
- High CPU usage
- Memory limit exceeded

**Diagnosis:**
```bash
# Check restart count
docker-compose ps

# Monitor resource usage
docker stats container-name

# Check for memory limits
docker-compose exec container-name cat /sys/fs/cgroup/memory/memory.limit_in_bytes
```

**Solutions:**

**Memory Issues:**
```yaml
# Add memory limits to docker-compose.yml
services:
  backend:
    mem_limit: 2g
    mem_reservation: 1g
```

**Environment Variables:**
```bash
# Check required env vars
docker-compose exec backend printenv | grep -E "(DATABASE|REDIS|JWT)"

# Validate .env file
cat .env | grep -v '^#' | grep '='
```

## 🗄️ Database Problems

### Database Connection Failed

**Symptoms:**
- "ECONNREFUSED" errors
- "database does not exist"
- Authentication failures

**Diagnosis:**
```bash
# Test database connectivity
docker-compose exec backend psql $DATABASE_URL

# Check database logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U postgres -l
```

**Solutions:**

**Database Not Ready:**
```yaml
# Add health checks to docker-compose.yml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 30s
    timeout: 10s
    retries: 3

backend:
  depends_on:
    postgres:
      condition: service_healthy
```

**Wrong Credentials:**
```bash
# Check environment variables
docker-compose exec postgres printenv | grep POSTGRES

# Reset database password
docker-compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

**Database Corruption:**
```bash
# Check database integrity
docker-compose exec postgres pg_dump --schema-only postgres

# Recreate database
docker-compose down
docker volume rm automation-master_postgres_data
docker-compose up -d postgres
```

### Migration Failures

**Symptoms:**
- "relation does not exist" errors
- Schema inconsistencies
- Missing tables/columns

**Diagnosis:**
```sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d workflow_automation

-- Check table existence
\dt

-- Check specific table schema
\d users
\d workflows
\d executions

-- Check for migrations table
SELECT * FROM schema_migrations;
```

**Solutions:**

**Manual Table Creation:**
```sql
-- Create missing tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns
ALTER TABLE executions ADD COLUMN IF NOT EXISTS error_message TEXT;
```

**Reset Database:**
```bash
# Complete database reset
docker-compose down
docker volume rm automation-master_postgres_data
docker-compose up -d
```

## 🌐 Network & Connectivity

### Frontend Can't Reach Backend

**Symptoms:**
- API calls fail with network errors
- 404 errors on API endpoints
- CORS errors

**Diagnosis:**
```bash
# Test backend directly
curl http://localhost:3001/api/health

# Check from within frontend container
docker-compose exec frontend curl http://backend:3001/api/health

# Check network configuration
docker network ls
docker network inspect automation-master_default
```

**Solutions:**

**CORS Configuration:**
```javascript
// backend/server.js
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
```

**API URL Configuration:**
```bash
# Check frontend environment
docker-compose exec frontend printenv | grep REACT_APP_API_URL

# Update .env file
REACT_APP_API_URL=http://localhost:3001/api
```

**Network Issues:**
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

### External API Failures

**Symptoms:**
- Claude API failures
- Third-party integrations fail
- DNS resolution errors

**Diagnosis:**
```bash
# Test external connectivity from container
docker-compose exec backend curl -v https://api.anthropic.com
docker-compose exec backend nslookup api.anthropic.com

# Check proxy settings
docker-compose exec backend printenv | grep -i proxy
```

**Solutions:**

**DNS Issues:**
```yaml
# Add DNS servers to docker-compose.yml
services:
  backend:
    dns:
      - 8.8.8.8
      - 1.1.1.1
```

**Proxy Configuration:**
```yaml
# Add proxy settings
services:
  backend:
    environment:
      HTTP_PROXY: http://proxy.company.com:8080
      HTTPS_PROXY: http://proxy.company.com:8080
      NO_PROXY: localhost,127.0.0.1,postgres,redis
```

## ⚙️ Workflow Execution Issues

### Workflow Execution Hangs

**Symptoms:**
- Workflows stuck in "running" status
- No progress updates
- Timeout errors

**Diagnosis:**
```bash
# Check execution logs
docker-compose logs backend | grep -i execution

# Check Redis queue
docker-compose exec redis redis-cli
KEYS *
LLEN bull:workflow-execution:*

# Check running processes
docker-compose exec backend ps aux
```

**Solutions:**

**Clear Stuck Jobs:**
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Clear all queues
FLUSHDB

# Or remove specific job
LREM bull:workflow-execution:waiting 0 job-id
```

**Restart Queue Workers:**
```bash
# Restart backend to reset workers
docker-compose restart backend

# Check queue status
docker-compose logs backend | grep -i "queue\|worker"
```

### Node Execution Failures

**Symptoms:**
- Individual nodes fail
- Script execution errors
- Sandbox issues

**Diagnosis:**
```bash
# Check node execution logs
docker-compose logs backend | grep -i "node\|execution"

# Check Docker availability
docker-compose exec backend docker ps

# Check sandbox directory
docker-compose exec backend ls -la /tmp/workflow-sandbox/
```

**Solutions:**

**Docker Socket Issues:**
```yaml
# Ensure Docker socket is mounted
services:
  backend:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

**Script Node Issues:**
```bash
# Test script execution manually
docker run --rm -v /tmp/test:/workspace node:18-alpine sh -c "echo 'console.log(\"test\")' > /workspace/script.js && node /workspace/script.js"

# Check script permissions
docker-compose exec backend ls -la /tmp/workflow-sandbox/
```

**Ansible Node Issues:**
```bash
# Check Ansible installation
docker-compose exec backend which ansible-playbook
docker-compose exec backend ansible-playbook --version

# Test SSH connectivity
docker-compose exec backend ssh -o ConnectTimeout=5 user@target-host
```

## 🚀 Performance Problems

### High Memory Usage

**Symptoms:**
- Container out of memory
- Slow response times
- System becomes unresponsive

**Diagnosis:**
```bash
# Monitor memory usage
docker stats

# Check Node.js memory usage
docker-compose exec backend node -e "console.log(process.memoryUsage())"

# Check for memory leaks
docker-compose exec backend node -e "setInterval(() => console.log(process.memoryUsage()), 5000)"
```

**Solutions:**

**Increase Memory Limits:**
```yaml
# docker-compose.yml
services:
  backend:
    mem_limit: 2g
    environment:
      NODE_OPTIONS: "--max-old-space-size=1536"
```

**Database Connection Pooling:**
```javascript
// backend/utils/database.js
const pool = new Pool({
    max: 10,                    // Reduce max connections
    idleTimeoutMillis: 30000,   // Close idle connections
    connectionTimeoutMillis: 2000
});
```

### High CPU Usage

**Symptoms:**
- 100% CPU utilization
- Slow workflow execution
- UI becomes unresponsive

**Diagnosis:**
```bash
# Monitor CPU usage
docker stats
htop

# Check for infinite loops
docker-compose exec backend strace -p $(pgrep node)

# Profile Node.js application
docker-compose exec backend node --prof script.js
```

**Solutions:**

**Optimize Workflows:**
```javascript
// Add delays in loops
for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);
    // Add small delay to prevent CPU hogging
    if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}
```

**Resource Limits:**
```yaml
# docker-compose.yml
services:
  backend:
    cpus: '2.0'
    mem_limit: 2g
```

## 🔐 Security & Authentication

### Authentication Failures

**Symptoms:**
- "Invalid token" errors
- Login failures
- JWT errors

**Diagnosis:**
```bash
# Check JWT secret
docker-compose exec backend printenv | grep JWT

# Verify token structure
echo "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." | base64 -d

# Check user exists
docker-compose exec postgres psql -U postgres -d workflow_automation -c "SELECT * FROM users WHERE email='user@example.com';"
```

**Solutions:**

**Reset JWT Secret:**
```bash
# Generate new secret
openssl rand -base64 32

# Update .env file
JWT_SECRET=new-secret-here

# Restart backend
docker-compose restart backend
```

**Password Reset:**
```sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d workflow_automation

-- Hash new password (use bcrypt)
UPDATE users SET password_hash = '$2b$10$...' WHERE email = 'user@example.com';
```

### Permission Denied Errors

**Symptoms:**
- File access errors
- Docker socket permission denied
- Database permission errors

**Solutions:**

**File Permissions:**
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix Docker socket
sudo chmod 666 /var/run/docker.sock
```

**Database Permissions:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE workflow_automation TO workflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workflow_user;
```

## ❌ Common Error Messages

### "ECONNREFUSED"

**Cause:** Service not running or wrong port
**Solution:**
```bash
# Check service status
docker-compose ps

# Restart service
docker-compose restart service-name

# Check port configuration
netstat -tlnp | grep port-number
```

### "Docker daemon not accessible"

**Cause:** Docker socket not mounted or permissions
**Solution:**
```yaml
# Ensure volume mount in docker-compose.yml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock

# Fix permissions
sudo chmod 666 /var/run/docker.sock
```

### "Node execution failed"

**Cause:** Script errors, missing dependencies, or timeout
**Solution:**
```bash
# Check script syntax
node -c script.js

# Increase timeout
# Update node configuration with longer timeout

# Check dependencies
docker run --rm node:18-alpine npm list
```

### "Database connection pool exhausted"

**Cause:** Too many concurrent connections
**Solution:**
```javascript
// Reduce pool size
const pool = new Pool({
    max: 5,  // Reduce from default 10
    idleTimeoutMillis: 30000
});
```

### "Redis connection lost"

**Cause:** Redis server restart or network issues
**Solution:**
```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Clear Redis data if corrupted
docker-compose exec redis redis-cli FLUSHALL
```

## 🔧 Emergency Recovery

### Complete System Reset

```bash
#!/bin/bash
# emergency-reset.sh

echo "🚨 Emergency system reset..."

# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v --remove-orphans

# Clean Docker system
docker system prune -a -f
docker volume prune -f

# Recreate from scratch
docker-compose up -d

echo "✅ System reset complete"
```

### Backup Before Reset

```bash
#!/bin/bash
# backup-before-reset.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="emergency-backup-${DATE}"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec postgres pg_dump -U postgres workflow_automation > $BACKUP_DIR/database.sql

# Backup volumes
docker-compose exec backend tar -czf - /tmp/workflow-sandbox > $BACKUP_DIR/sandbox.tar.gz

# Backup configuration
cp .env $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/

echo "✅ Backup created in $BACKUP_DIR"
```

## 📞 Getting Help

### Log Collection

```bash
#!/bin/bash
# collect-logs.sh

DATE=$(date +%Y%m%d_%H%M%S)
LOG_DIR="logs-${DATE}"

mkdir -p $LOG_DIR

# Collect all logs
docker-compose logs --no-color > $LOG_DIR/all-services.log
docker-compose logs --no-color frontend > $LOG_DIR/frontend.log
docker-compose logs --no-color backend > $LOG_DIR/backend.log
docker-compose logs --no-color postgres > $LOG_DIR/postgres.log
docker-compose logs --no-color redis > $LOG_DIR/redis.log

# System information
docker version > $LOG_DIR/docker-version.txt
docker-compose version > $LOG_DIR/compose-version.txt
docker system df > $LOG_DIR/docker-system.txt
docker-compose ps > $LOG_DIR/container-status.txt

# Environment
cp .env $LOG_DIR/env-file.txt
printenv | grep -E "(NODE|DOCKER|POSTGRES|REDIS)" > $LOG_DIR/environment.txt

# Create archive
tar -czf logs-${DATE}.tar.gz $LOG_DIR

echo "📋 Logs collected in logs-${DATE}.tar.gz"
```

### Support Information

When reporting issues, include:

1. **Error message** (full stack trace)
2. **Steps to reproduce** 
3. **Environment details** (OS, Docker version)
4. **Logs** (from collect-logs.sh)
5. **Configuration** (.env and docker-compose.yml)
6. **Recent changes** (what was changed before issue)

This troubleshooting guide covers the most common issues and their solutions. Most problems can be resolved by following these procedures systematically.