# Deployment Guide

## 🚀 Overview

This guide covers how to deploy the Workflow Automation Platform in various environments, from local development to production deployments with high availability and security.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)

## ⚡ Quick Start

### Prerequisites

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**
- **8GB RAM minimum** (recommended 16GB)
- **4 CPU cores minimum**

### 1-Minute Setup

```bash
# Clone repository
git clone https://github.com/your-org/automation-master.git
cd automation-master

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Default Credentials

Create your first user by registering at http://localhost:3000/register

## 🛠️ Local Development

### Development Setup

```bash
# Clone and setup
git clone https://github.com/your-org/automation-master.git
cd automation-master

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies (if needed)
cd frontend && npm install
cd ../backend && npm install
```

### Development Environment Features

- **Hot Reload**: Frontend and backend auto-restart on changes
- **Debug Mode**: Detailed logging and error messages
- **Volume Mounts**: Source code mounted for real-time editing
- **Exposed Ports**: All services accessible from host

### Working with the Development Environment

```bash
# View real-time logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Access database directly
docker-compose exec postgres psql -U postgres -d workflow_automation

# Access Redis CLI
docker-compose exec redis redis-cli

# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## 🏭 Production Deployment

### Production Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (nginx/ALB)   │
                    └─────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   │   Frontend 1    │ │   Frontend 2    │ │   Frontend N    │
   │   (React)       │ │   (React)       │ │   (React)       │
   └─────────────────┘ └─────────────────┘ └─────────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌─────────────────┐
                    │  Backend API    │
                    │  (Node.js)      │
                    └─────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   │   PostgreSQL    │ │     Redis       │ │    Docker       │
   │   (Primary)     │ │   (Queue)       │ │  (Execution)    │
   └─────────────────┘ └─────────────────┘ └─────────────────┘
            │
   ┌─────────────────┐
   │   PostgreSQL    │
   │   (Replica)     │
   └─────────────────┘
```

### Docker Swarm Deployment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    image: automation-frontend:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      NODE_ENV: production
      REACT_APP_API_URL: https://api.yourdomain.com
    networks:
      - frontend

  backend:
    image: automation-backend:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - sandbox-data:/tmp/workflow-sandbox
    networks:
      - frontend
      - backend

  postgres:
    image: postgres:15
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
    volumes:
      - redis-data:/data
    networks:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    networks:
      - frontend

volumes:
  postgres-data:
  redis-data:
  sandbox-data:

networks:
  frontend:
  backend:
```

### Kubernetes Deployment

Create Kubernetes manifests:

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: automation-platform

---
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: automation-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: automation-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REACT_APP_API_URL
          value: "https://api.yourdomain.com"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

---
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: automation-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: automation-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock

---
# services.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: automation-platform
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: automation-platform
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

## 🔧 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname
POSTGRES_DB=workflow_automation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://host:port
REDIS_HOST=redis
REDIS_PORT=6379

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret

# API Keys (optional)
CLAUDE_API_KEY=your-anthropic-claude-api-key

# Application
NODE_ENV=production
PORT=3001
REACT_APP_API_URL=https://api.yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Environment-Specific Configurations

#### Development (.env.development)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password123@postgres:5432/workflow_automation
REDIS_URL=redis://redis:6379
JWT_SECRET=development-jwt-secret
REACT_APP_API_URL=http://localhost:3001/api
LOG_LEVEL=debug
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/workflow_automation
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=${STAGING_JWT_SECRET}
REACT_APP_API_URL=https://staging-api.yourdomain.com
LOG_LEVEL=info
```

#### Production (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
REACT_APP_API_URL=https://api.yourdomain.com
LOG_LEVEL=warn
SENTRY_DSN=${SENTRY_DSN}
```

## 🗄️ Database Setup

### PostgreSQL Production Configuration

```sql
-- Create production database
CREATE DATABASE workflow_automation;
CREATE USER workflow_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE workflow_automation TO workflow_user;

-- Connect to database
\c workflow_automation

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_workflows_user_active ON workflows(user_id, is_active);
CREATE INDEX CONCURRENTLY idx_executions_workflow_status ON executions(workflow_id, status);
CREATE INDEX CONCURRENTLY idx_execution_logs_execution_timestamp ON execution_logs(execution_id, timestamp);
```

### Database Connection Pooling

Update backend configuration:

```javascript
// backend/utils/database.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                    // Maximum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Return error after 2s if no connection
    maxUses: 7500,              // Close connection after 7500 queries
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});
```

### Database Migrations

Create migration system:

```bash
# Create migration
mkdir -p backend/migrations
cat > backend/migrations/001_initial_schema.sql << EOF
-- Initial schema migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- ... rest of schema
);
EOF

# Run migrations
node backend/scripts/migrate.js
```

## 🔒 SSL/TLS Configuration

### Nginx SSL Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:3001;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
    
    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;
        
        # SSL Configuration
        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/certs/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### Let's Encrypt SSL

```bash
# Install certbot
apt update && apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 📊 Monitoring & Logging

### Application Monitoring

#### Health Check Endpoints

Backend health checks:

```javascript
// backend/routes/health.js
router.get('/health', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0',
        checks: {}
    };
    
    try {
        // Database check
        await query('SELECT 1');
        health.checks.database = 'OK';
    } catch (error) {
        health.checks.database = 'ERROR';
        health.status = 'ERROR';
    }
    
    try {
        // Redis check
        await redis.ping();
        health.checks.redis = 'OK';
    } catch (error) {
        health.checks.redis = 'ERROR';
        health.status = 'ERROR';
    }
    
    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
});
```

#### Prometheus Metrics

```javascript
// backend/middleware/metrics.js
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

const workflowExecutions = new client.Counter({
    name: 'workflow_executions_total',
    help: 'Total number of workflow executions',
    labelNames: ['status']
});

module.exports = {
    httpRequestDuration,
    workflowExecutions,
    register: client.register
};
```

### Centralized Logging

#### ELK Stack Configuration

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

volumes:
  elasticsearch-data:
```

#### Structured Logging

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'workflow-backend',
        version: process.env.APP_VERSION
    },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});

module.exports = logger;
```

## 💾 Backup & Recovery

### Database Backups

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
BACKUP_FILE="${BACKUP_DIR}/workflow_automation_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp "${BACKUP_FILE}.gz" s3://your-backup-bucket/database/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Automated Backup Script

```bash
# Add to crontab
0 2 * * * /scripts/backup-database.sh
0 3 * * 0 /scripts/backup-volumes.sh
```

### Recovery Procedures

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop application
docker-compose down

# Restore database
gunzip -c $BACKUP_FILE | psql $DATABASE_URL

# Start application
docker-compose up -d

echo "Database restored from $BACKUP_FILE"
```

## 🚀 Performance Optimization

### Production Optimizations

```javascript
// backend/server.js - Production optimizations
if (process.env.NODE_ENV === 'production') {
    // Enable trust proxy
    app.set('trust proxy', 1);
    
    // Stricter rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use('/api/', limiter);
    
    // Compression
    const compression = require('compression');
    app.use(compression());
    
    // Static file caching
    app.use(express.static('public', {
        maxAge: '1d',
        etag: true
    }));
}
```

### Frontend Optimization

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Troubleshooting

### Common Issues

**Issue: Container fails to start**
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose restart service-name
```

**Issue: Database connection fails**
```bash
# Test database connectivity
docker-compose exec backend psql $DATABASE_URL

# Check database logs
docker-compose logs postgres
```

**Issue: High memory usage**
```bash
# Monitor container resources
docker-compose exec backend htop

# Check Node.js heap usage
docker-compose exec backend node -e "console.log(process.memoryUsage())"
```

This deployment guide provides comprehensive instructions for deploying the Workflow Automation Platform in any environment, from development to enterprise production deployments.