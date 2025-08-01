# Hooksley Platform Automation Environment Documentation

## Architecture Overview

This is a full-stack workflow automation platform with the following components:

### 🏗️ Core Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React App     │◄──►│   Node.js API   │◄──►│   PostgreSQL    │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │ Workflow Exec   │
                       │   Port: 6379    │    │   Container     │
                       └─────────────────┘    └─────────────────┘
```

## 🐳 Docker Services

### 1. Frontend Service (`automation-master-frontend-1`)
- **Image**: Custom React build
- **Port**: 3000 (host) → 3000 (container)
- **Purpose**: User interface for workflow creation and management
- **Technology**: React 18, Lucide React icons, React Flow (replaced with custom sequence canvas)
- **Features**:
  - Uber-inspired dark theme UI
  - Vertical sequence workflow canvas
  - AI-powered code generation
  - Import/export workflows
  - Real-time execution monitoring

### 2. Backend Service (`automation-master-backend-1`)
- **Image**: Custom Node.js build
- **Port**: 3001 (host) → 3001 (container)
- **Purpose**: REST API server and workflow execution engine
- **Technology**: Node.js, Express, JWT authentication
- **Features**:
  - User authentication & authorization
  - Workflow CRUD operations
  - Docker-based workflow execution
  - Real-time execution logs
  - File upload/download

### 3. Database Service (`automation-master-postgres-1`)
- **Image**: postgres:15
- **Port**: 5432 (host) → 5432 (container)
- **Purpose**: Primary data storage
- **Database**: `workflow_automation`
- **Tables**:
  - `users` - User accounts and profiles
  - `workflows` - Workflow definitions (JSON)
  - `executions` - Execution history and status
  - `execution_logs` - Real-time execution logs
  - `api_tokens` - User API tokens

### 4. Cache Service (`automation-master-redis-1`)
- **Image**: redis:7-alpine
- **Port**: 6379 (host) → 6379 (container)
- **Purpose**: Session storage and caching
- **Usage**: JWT refresh tokens, execution state cache

### 5. Workflow Executor Container (`workflow-executor:latest`)
- **Image**: Custom execution environment
- **Purpose**: Isolated code execution sandbox
- **Languages Supported**: Python 3.10.12, JavaScript (Node.js), Bash
- **Security**: Isolated from main services, sandboxed execution with resource limits
- **Status**: ✅ **OPERATIONAL** - Docker CLI + shared volume for file access
- **Resource Limits**: 128MB memory, 50% CPU, network isolation, read-only filesystem

## 📁 Directory Structure

```
automation-master/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── CodeEditor.js          # IDE-style code editor with AI
│   │   │   ├── ExecutionMonitor.js    # Real-time execution viewer
│   │   │   ├── NodeEditor.js          # Workflow node editor
│   │   │   ├── SequenceWorkflowCanvas.js  # Vertical workflow builder
│   │   │   ├── WorkflowManager.js     # Main workflow interface
│   │   │   └── Particles.js           # Background effects
│   │   ├── contexts/         # React contexts
│   │   │   └── AuthContext.js         # Authentication state
│   │   ├── pages/            # Route components
│   │   │   ├── Login.js               # Login page
│   │   │   ├── Register.js            # Registration page
│   │   │   └── Dashboard.js           # Main dashboard
│   │   └── services/         # API clients
│   │       ├── api.js                 # HTTP client with interceptors
│   │       └── workflowService.js     # Workflow-specific API calls
├── backend/                  # Node.js API server
│   ├── routes/               # Express route handlers
│   │   ├── auth.js                    # Authentication endpoints
│   │   ├── workflows.js               # Workflow CRUD operations
│   │   ├── executions.js              # Execution management
│   │   └── users.js                   # User profile management
│   ├── middleware/           # Express middleware
│   │   ├── auth.js                    # JWT verification
│   │   └── validation.js              # Request validation
│   ├── services/             # Business logic
│   │   ├── workflowEngine.js          # Workflow execution engine
│   │   ├── dockerService.js           # Docker container management
│   │   └── logService.js              # Execution logging
│   └── database/             # Database configuration
│       ├── connection.js              # PostgreSQL connection
│       └── migrations.sql             # Database schema
├── docker-compose.yml        # Service orchestration
├── Dockerfile.frontend       # Frontend container build
├── Dockerfile.backend        # Backend container build
├── Dockerfile.executor       # ⚠️ MISSING - Execution container build
└── ENVIRONMENT.md            # This documentation
```

## 🔧 Key Features

### Workflow Canvas
- **Type**: Vertical sequence-based (replaced React Flow node graph)
- **Interface**: Drag & drop steps in vertical sequence
- **Node Types**: Manual, Script (Python/JS/Bash), API, Database, File, Timer
- **Editing**: Inline editing with expandable details

### Code Editor
- **Type**: IDE-style with syntax highlighting
- **Features**: Line numbers, auto-indent, fullscreen mode
- **AI Integration**: Claude API for code generation
- **Languages**: Python, JavaScript, Bash with language-specific prompts

### Execution Engine
- **Method**: Docker container isolation
- **Container**: `workflow-executor:latest`
- **Security**: Sandboxed execution environment
- **Logging**: Real-time log streaming to UI

### Authentication
- **Method**: JWT with refresh tokens
- **Storage**: Access tokens (15min), Refresh tokens (7 days)
- **Security**: bcrypt password hashing (12 rounds)

## 🚀 Starting the Environment

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down
```

## 👤 Default Users

The system comes with pre-configured test users:

```
Email: test@example.com
Password: password123

Email: justynroberts@gmail.com
Password: [user-defined]
```

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432 (workflow_automation)
- **Redis**: localhost:6379
- **Health Check**: http://localhost:3001/api/health

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Workflows Table
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,  -- Contains nodes and edges
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Executions Table
```sql
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

## 🔍 Troubleshooting Guide

### ⚠️ Common Issues

#### 1. "Python3: not found" / "No such file or directory" Errors ✅ **FIXED**
**Cause**: 
- Backend container missing Docker CLI, falling back to unsafe execution
- File sharing issue between backend and executor containers
**Solution**: 
- Added Docker CLI to backend Dockerfile
- Added shared volume mount `/tmp/workflow-sandbox` in docker-compose.yml
- Rebuilt and recreated backend container
**Status**: Docker-based sandboxed execution fully operational

#### 2. Login Not Working
**Symptoms**: Can't authenticate users
**Check**:
- Backend container running on port 3001
- Database connection healthy
- Frontend compiled without errors
- CORS configuration correct

#### 3. Workflows Not Loading
**Symptoms**: Empty workflow list
**Check**:
- Database tables exist and populated
- User has workflows associated
- API endpoints responding correctly

#### 4. Import/Export Errors
**Symptoms**: Import fails or export downloads empty
**Check**:
- File format is valid JSON
- Workflow structure matches expected schema
- User permissions for workflow access

#### 5. AI Code Generation Not Working
**Symptoms**: Generate button fails
**Check**:
- Claude API key configured in localStorage
- API key has valid permissions
- Network connectivity to Anthropic API

### 🔧 Debug Commands

```bash
# Check container health
docker-compose ps
docker-compose logs [service-name]

# Database inspection
docker exec -it automation-master-postgres-1 psql -U postgres -d workflow_automation

# Test API endpoints
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'

# Check container resources
docker stats

# Restart specific service
docker-compose restart [service-name]
```

### 🐳 Executor Container Requirements

The missing `workflow-executor:latest` container needs:
- **Base**: Ubuntu or Alpine Linux
- **Languages**: Python 3.x, Node.js 18+, Bash
- **Packages**: pip, npm, common utilities
- **Security**: Non-root user, limited permissions
- **Networking**: Isolated from other services

## 🔐 Security Considerations

1. **Code Execution**: Sandboxed in isolated Docker containers
2. **Authentication**: JWT tokens with short expiry
3. **Database**: Parameterized queries prevent SQL injection
4. **API**: Rate limiting and input validation
5. **CORS**: Configured for localhost development
6. **Secrets**: Environment variables for sensitive data

## 🎯 Feature Roadmap

### Current Features ✅
- User authentication & authorization
- Vertical sequence workflow builder
- Real-time execution monitoring
- AI-powered code generation
- Workflow import/export
- Dark theme UI

### Missing/Incomplete ❌
- Scheduled workflow execution
- Workflow templates library
- Advanced debugging tools
- Production deployment configuration
- Email notifications for executions
- User management (admin panel)
- Workflow versioning

---

*Last Updated: June 13, 2025*
*Version: 1.0*