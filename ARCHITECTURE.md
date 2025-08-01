# Workflow Automation Platform - Architecture Guide

## 🏗️ System Overview

The Workflow Automation Platform is a modern, Docker-based automation system that allows users to create, execute, and manage complex workflows through a visual interface. It supports multiple execution environments, real-time monitoring, and extensive integrations.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Security Model](#security-model)
7. [Scalability Considerations](#scalability-considerations)

## 🎯 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄───┤   (Node.js)     │◄───┤   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Redis         │    │   Docker        │
                    │   (Queue)       │    │   (Execution)   │
                    │   Port: 6379    │    │   Socket        │
                    └─────────────────┘    └─────────────────┘
```

## 🔧 Core Components

### Frontend (React Application)

**Location:** `/frontend/`
**Port:** `3000`
**Purpose:** User interface for workflow creation and management

**Key Components:**
- **WorkflowManager**: Main dashboard for workflow CRUD operations
- **SequenceWorkflowCanvas**: Visual workflow editor with drag-and-drop
- **EnhancedNodeEditor**: Comprehensive node configuration panel
- **CodeEditor**: Syntax-highlighted code editor with AI assistance
- **ExecutionViewer**: Real-time workflow execution monitoring

**State Management:**
- **Zustand**: Global state management for workflows, nodes, and execution
- **Local Storage**: Persistent user preferences and API keys

### Backend (Node.js API)

**Location:** `/backend/`
**Port:** `3001`
**Purpose:** API server, workflow engine, and execution orchestration

**Key Services:**
- **WorkflowEngine**: Core execution engine with node handlers
- **SandboxEngine**: Secure Docker-based code execution
- **AuthService**: JWT-based authentication and authorization
- **QueueService**: Bull queue for background job processing

**API Routes:**
- `/api/auth/*` - Authentication (login, register, tokens)
- `/api/workflows/*` - Workflow CRUD operations
- `/api/executions/*` - Execution management and monitoring
- `/api/ai/*` - AI code generation with Claude API
- `/api/user/*` - User profile and API token management

### Database (PostgreSQL)

**Location:** Docker container
**Port:** `5432`
**Purpose:** Persistent data storage

**Core Tables:**
- `users` - User accounts and profiles
- `workflows` - Workflow definitions and metadata
- `executions` - Workflow execution records
- `execution_logs` - Real-time execution logging
- `node_logs` - Individual node execution logs
- `api_tokens` - User API keys for external access

### Queue System (Redis + Bull)

**Location:** Docker container
**Port:** `6379`
**Purpose:** Background job processing and execution queuing

**Job Types:**
- Workflow execution jobs
- Scheduled workflow triggers
- Email notifications
- File processing tasks

### Execution Environment (Docker)

**Purpose:** Isolated, secure code execution
**Features:**
- Sandboxed script execution (JavaScript, Python, Bash)
- Network isolation
- Resource limitations
- Temporary file handling

## 🔄 Data Flow

### 1. Workflow Creation Flow

```
User Interface → React State → API Call → Database Storage
     ↓               ↓            ↓            ↓
Drag & Drop → Node Config → POST /workflows → PostgreSQL
```

1. User drags nodes from palette to canvas
2. Node configuration stored in React state
3. Save triggers API call to backend
4. Workflow definition stored in PostgreSQL

### 2. Workflow Execution Flow

```
User Trigger → Queue Job → Engine Processing → Node Execution → Result Storage
     ↓           ↓              ↓                 ↓               ↓
Execute Btn → Bull Queue → WorkflowEngine → NodeHandlers → Database/Logs
```

1. User clicks execute or scheduled trigger fires
2. Execution job queued in Redis
3. WorkflowEngine processes job
4. Individual nodes executed via handlers
5. Results and logs stored in database

### 3. Node Execution Flow

```
Node Data → Handler Selection → Environment Setup → Code Execution → Result Processing
    ↓              ↓                 ↓                ↓                ↓
JSON Config → NodeHandler → Docker/Local → Script/API → Response/Error
```

## 💻 Technology Stack

### Frontend Stack
- **React 18**: Modern React with hooks and context
- **Zustand**: Lightweight state management
- **React Flow**: Visual workflow editor (alternative canvas)
- **Lucide React**: Consistent icon library
- **Axios**: HTTP client with interceptors
- **UUID**: Unique identifier generation

### Backend Stack
- **Node.js 18**: Runtime environment
- **Express**: Web framework with middleware
- **PostgreSQL**: Primary database
- **Redis**: Queue and caching
- **Bull**: Job queue processing
- **JWT**: Authentication tokens
- **Docker**: Containerization and sandboxing
- **Multer**: File upload handling

### DevOps Stack
- **Docker Compose**: Multi-container orchestration
- **Nodemon**: Development auto-restart
- **Morgan**: HTTP request logging
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Workflows Table
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB, -- Workflow nodes and connections
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Executions Table
```sql
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationship Diagram

```
users (1) ──────── (∞) workflows
  │                       │
  │                       │
  └── (∞) api_tokens      └── (∞) executions
                               │
                               ├── (∞) execution_logs
                               └── (∞) node_logs
```

## 🔒 Security Model

### Authentication
- **JWT Tokens**: Stateless authentication with access/refresh pattern
- **Password Hashing**: bcrypt with salt rounds
- **API Tokens**: Long-lived tokens for external integrations

### Authorization
- **User Isolation**: Users can only access their own workflows
- **Resource Ownership**: Middleware validates resource ownership
- **Rate Limiting**: Express middleware prevents abuse

### Execution Security
- **Docker Sandboxing**: Isolated execution environments
- **Network Restrictions**: Limited outbound connections
- **Resource Limits**: CPU, memory, and time constraints
- **File System Isolation**: Temporary directories with cleanup

### Data Security
- **Input Validation**: Express-validator for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS Configuration**: Controlled cross-origin access

## 📈 Scalability Considerations

### Horizontal Scaling

**Frontend:**
- Static asset serving via CDN
- Multiple React app instances behind load balancer
- Client-side routing for reduced server load

**Backend:**
- Stateless API design for load balancing
- Redis session storage for shared state
- Database connection pooling

**Database:**
- Read replicas for query scaling
- Connection pooling with pg library
- Query optimization with indexes

### Vertical Scaling

**Resource Optimization:**
- Node.js clustering for CPU utilization
- Memory management with garbage collection tuning
- Database query optimization

### Queue Scaling

**Bull Queue Features:**
- Multiple worker processes
- Job prioritization
- Retry mechanisms
- Dead letter queues

### Monitoring & Observability

**Logging:**
- Structured logging with Winston
- Request/response logging with Morgan
- Error tracking and alerting

**Metrics:**
- Execution time tracking
- Queue depth monitoring
- Error rate monitoring
- Resource utilization metrics

## 🔄 Extension Points

### Adding New Node Types
1. Create node handler in `WorkflowEngine`
2. Add UI configuration in `EnhancedNodeEditor`
3. Update node palette in `SequenceWorkflowCanvas`
4. Add default data structure

### Custom Integrations
1. Create service wrapper in `/backend/services/`
2. Add configuration options to node editor
3. Implement error handling and logging
4. Add authentication if required

### New Execution Environments
1. Extend `SandboxEngine` with new container
2. Add environment selection to script nodes
3. Implement resource management
4. Add monitoring and logging

## 📚 Development Guidelines

### Code Organization
- **Feature-based folders**: Group related components
- **Shared utilities**: Common functions in `/utils/`
- **Service layer**: Business logic in `/services/`
- **Clear separation**: UI, API, and data layers

### Error Handling
- **Graceful degradation**: Continue workflow on non-critical errors
- **Detailed logging**: Capture context for debugging
- **User feedback**: Clear error messages in UI
- **Recovery mechanisms**: Retry and fallback strategies

### Performance Optimization
- **Lazy loading**: Load components on demand
- **Database indexes**: Optimize common queries
- **Caching strategies**: Redis for frequently accessed data
- **Asset optimization**: Minimize bundle size

This architecture provides a solid foundation for building sophisticated automation workflows while maintaining security, scalability, and maintainability.