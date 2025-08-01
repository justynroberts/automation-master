# LLM Node Generator - Production Documentation

## Overview

The LLM Node Generator is a sophisticated AI-powered system that allows users to create custom workflow nodes through natural language descriptions. The system integrates multiple LLM providers (Claude, OpenAI, Ollama) to generate production-ready workflow components with proper validation, versioning, and security controls.

## Table of Contents

1. [Architecture](#architecture)
2. [Security Model](#security-model)
3. [API Reference](#api-reference)
4. [Frontend Components](#frontend-components)
5. [Database Schema](#database-schema)
6. [Deployment Guide](#deployment-guide)
7. [Security Considerations](#security-considerations)
8. [Performance Guidelines](#performance-guidelines)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

## Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   LLM Providers │
│   React SPA     │◄──►│   Node.js/Express│◄──►│   Claude/OpenAI │
│                 │    │                 │    │   Ollama        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        
         │                        ▼                        
         │               ┌─────────────────┐              
         │               │   PostgreSQL    │              
         │               │   Database      │              
         │               └─────────────────┘              
         │                                                 
         ▼                                                 
┌─────────────────┐                                       
│   Workflow      │                                       
│   Canvas        │                                       
│   Integration   │                                       
└─────────────────┘                                       
```

### Core Components

#### 1. Node Generator Service (`/backend/services/nodeGenerator.js`)
- **Purpose**: Orchestrates LLM interactions and node creation
- **Responsibilities**:
  - LLM provider abstraction
  - Node template generation
  - Input/output schema creation
  - Execution code generation
  - Version management

#### 2. Dynamic Node Registry (`/frontend/src/services/dynamicNodeRegistry.js`)
- **Purpose**: Manages generated nodes in the frontend
- **Responsibilities**:
  - Node registration and caching
  - Real-time updates
  - Category organization
  - Workflow integration

#### 3. Generated Node Component (`/frontend/src/components/nodes/GeneratedNode.js`)
- **Purpose**: React Flow component for generated nodes
- **Responsibilities**:
  - Dynamic form rendering
  - Input validation
  - Visual representation
  - Configuration management

## Security Model

### Authentication & Authorization

```javascript
// JWT-based authentication with role-based access
const authMiddleware = {
  authenticateApiToken,     // Validates JWT tokens
  requireOwnership,         // Ensures resource ownership
  validateInput            // Sanitizes user input
};
```

### Input Validation Pipeline

1. **Request Validation**: Express-validator schemas
2. **Content Sanitization**: HTML/script tag removal
3. **Schema Validation**: JSON schema enforcement
4. **Code Analysis**: Static analysis for dangerous patterns
5. **Sandboxed Execution**: Isolated execution environment

### Generated Code Security

```javascript
// Security patterns enforced in generated code
const securityPatterns = {
  prohibited: [
    /eval\s*\(/,
    /Function\s*\(/,
    /require\s*\(/,
    /process\.exit/,
    /child_process/,
    /fs\.writeFile/
  ],
  required: [
    'input validation',
    'error handling',
    'return value structure'
  ]
};
```

## API Reference

### Node Generation

#### POST `/api/generated-nodes/generate`

Generate a new workflow node from natural language description.

**Request:**
```json
{
  "request": "Create a Docker container manager with start/stop controls",
  "context": {
    "category": "Infrastructure",
    "complexity": "intermediate"
  }
}
```

**Response:**
```json
{
  "message": "Node generated successfully",
  "node": {
    "id": "uuid",
    "name": "Docker Container Manager",
    "description": "Manages Docker containers with start/stop functionality",
    "category": "Infrastructure",
    "icon": "server",
    "version": 1,
    "node_definition": {...},
    "ui_config": {...},
    "execution_code": "...",
    "input_schema": {...},
    "output_schema": {...}
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Authentication required
- `429`: Rate limit exceeded
- `500`: Generation failed

#### GET `/api/generated-nodes`

Retrieve all generated nodes for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Node Name",
    "description": "Node description",
    "category": "Category",
    "version": 1,
    "is_active": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

#### PUT `/api/generated-nodes/:id`

Update an existing generated node.

**Request:**
```json
{
  "name": "Updated Node Name",
  "description": "Updated description",
  "ui_config": {...},
  "execution_code": "...",
  "changeDescription": "Updated node configuration"
}
```

**Response:**
```json
{
  "message": "Node updated successfully",
  "node": {
    "id": "uuid",
    "version": 2,
    ...
  }
}
```

#### DELETE `/api/generated-nodes/:id`

Soft delete a generated node (sets `is_active` to false).

**Response:**
```json
{
  "message": "Generated node deleted successfully"
}
```

#### POST `/api/generated-nodes/:id/test`

Test execution of a generated node with sample inputs.

**Request:**
```json
{
  "inputs": {
    "container_name": "test-container",
    "action": "start"
  }
}
```

**Response:**
```json
{
  "message": "Node test completed",
  "result": {
    "status": "success",
    "output": {...}
  },
  "executionTime": "1234ms"
}
```

### Version Management

#### GET `/api/generated-nodes/:id/versions`

Get version history for a generated node.

**Response:**
```json
[
  {
    "id": "uuid",
    "version_number": 2,
    "change_description": "Updated configuration",
    "created_at": "2023-01-02T00:00:00Z",
    "created_by": "user-uuid"
  },
  {
    "id": "uuid",
    "version_number": 1,
    "change_description": "Initial version",
    "created_at": "2023-01-01T00:00:00Z",
    "created_by": "user-uuid"
  }
]
```

## Frontend Components

### NodeGenerator Component

Main interface for creating and managing generated nodes.

**Props:**
- None (uses hooks for state management)

**Features:**
- Natural language input with examples
- Real-time generation status
- Node management (edit, duplicate, delete)
- Category-based organization

**Usage:**
```jsx
import NodeGenerator from './components/NodeGenerator';

function App() {
  return (
    <Router>
      <Route path="/node-generator" element={<NodeGenerator />} />
    </Router>
  );
}
```

### GeneratedNode Component

React Flow node component for generated workflow nodes.

**Props:**
```typescript
interface GeneratedNodeProps {
  data: {
    label: string;
    description: string;
    formFields: FormField[];
    inputs: Input[];
    outputs: Output[];
    style: NodeStyle;
    onChange: (data: any) => void;
  };
  selected: boolean;
  id: string;
}
```

**Features:**
- Dynamic form generation
- Input validation
- Configuration panel
- Visual theming
- Handle positioning

### Dynamic Node Integration

Generated nodes are automatically integrated into the workflow canvas:

```javascript
// Node palette integration
const nodeTypes = [
  ...standardNodes,
  ...generatedNodes.map(node => ({
    type: 'generatedNode',
    label: node.name,
    category: node.category,
    icon: node.icon,
    data: node
  }))
];
```

## Database Schema

### Generated Nodes Table

```sql
CREATE TABLE generated_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Custom',
    icon VARCHAR(50) DEFAULT 'box',
    node_definition JSONB NOT NULL,
    ui_config JSONB NOT NULL,
    execution_code TEXT NOT NULL,
    input_schema JSONB NOT NULL,
    output_schema JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Generated Node Versions Table

```sql
CREATE TABLE generated_node_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID REFERENCES generated_nodes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    node_definition JSONB NOT NULL,
    ui_config JSONB NOT NULL,
    execution_code TEXT NOT NULL,
    input_schema JSONB NOT NULL,
    output_schema JSONB NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE
);
```

### Indexes

```sql
CREATE INDEX idx_generated_nodes_user_id ON generated_nodes(user_id);
CREATE INDEX idx_generated_nodes_category ON generated_nodes(category);
CREATE INDEX idx_generated_node_versions_node_id ON generated_node_versions(node_id);
```

## Configuration

### Environment Variables

#### Backend Configuration

```bash
# LLM Provider Configuration
LLM_PROVIDER=claude          # Options: claude, openai, ollama, mock
CLAUDE_API_KEY=sk-ant-...    # Claude API key
OPENAI_API_KEY=sk-...        # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-... # Alternative Claude key name

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workflow_automation
DB_USER=postgres
DB_PASSWORD=your_password

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Frontend Configuration

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api

# Feature Flags
REACT_APP_ENABLE_NODE_GENERATOR=true
REACT_APP_ENABLE_ADVANCED_FEATURES=true
```

### LLM Provider Setup

#### Claude API
1. Visit https://console.anthropic.com/
2. Create an API key
3. Set `LLM_PROVIDER=claude` and `CLAUDE_API_KEY=your_key`

#### OpenAI
1. Visit https://platform.openai.com/
2. Create an API key
3. Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=your_key`

#### Ollama (Local)
1. Install Ollama: `brew install ollama`
2. Start service: `ollama serve`
3. Pull model: `ollama pull llama3.1`
4. Set `LLM_PROVIDER=ollama`

## Performance Guidelines

### Backend Optimization

1. **Database Queries**
   - Use connection pooling
   - Implement query caching for frequent requests
   - Index all foreign keys and search columns

2. **LLM API Calls**
   - Implement request caching
   - Use connection pooling
   - Set appropriate timeouts

3. **Memory Management**
   - Limit generated code size
   - Clean up temporary files
   - Monitor memory usage

### Frontend Optimization

1. **Component Rendering**
   - Use React.memo for node components
   - Implement virtual scrolling for large lists
   - Lazy load node configurations

2. **State Management**
   - Minimize store updates
   - Use selectors for computed values
   - Implement proper memoization

3. **Network Requests**
   - Batch API calls where possible
   - Implement proper loading states
   - Cache generated node data

## Security Considerations

### Critical Security Measures

1. **Code Execution Isolation**
   ```javascript
   // ❌ Never do this in production
   const func = new Function(userCode);
   
   // ✅ Use proper sandboxing
   const result = await sandboxedExecution(userCode, inputs);
   ```

2. **Input Validation**
   ```javascript
   // Comprehensive validation pipeline
   const validationRules = {
     request: {
       type: 'string',
       minLength: 3,
       maxLength: 5000,
       sanitize: true
     },
     executionCode: {
       type: 'string',
       validate: codeSecurityRules,
       sandbox: true
     }
   };
   ```

3. **Authentication & Authorization**
   - All endpoints require valid JWT tokens
   - Resource ownership validation
   - Rate limiting per user
   - API key encryption

### Data Protection

1. **Sensitive Data Handling**
   - Encrypt API keys at rest
   - Hash passwords with bcrypt
   - Sanitize all user inputs
   - Log security events

2. **Database Security**
   - Use parameterized queries
   - Implement row-level security
   - Regular security updates
   - Backup encryption

## Deployment Guide

### Production Deployment

#### Docker Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - LLM_PROVIDER=${LLM_PROVIDER}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    volumes:
      - /app/node_modules
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    restart: unless-stopped
    
  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-node-generator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: llm-node-generator
  template:
    metadata:
      labels:
        app: llm-node-generator
    spec:
      containers:
      - name: backend
        image: automation-master/backend:latest
        ports:
        - containerPort: 5001
        env:
        - name: LLM_PROVIDER
          valueFrom:
            secretKeyRef:
              name: llm-config
              key: provider
        - name: CLAUDE_API_KEY
          valueFrom:
            secretKeyRef:
              name: llm-config
              key: claude-key
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
          requests:
            memory: "512Mi"
            cpu: "250m"
```

### Health Checks

```javascript
// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

app.get('/health/detailed', authenticateApiToken, (req, res) => {
  res.json({
    status: 'OK',
    database: 'connected',
    llm: process.env.LLM_PROVIDER,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});
```

## Monitoring & Logging

### Application Monitoring

```javascript
// Structured logging
const logger = require('winston');

logger.info('Node generation started', {
  userId: req.user.userId,
  request: req.body.request,
  provider: process.env.LLM_PROVIDER,
  timestamp: new Date().toISOString()
});

// Performance monitoring
const startTime = Date.now();
const result = await generateNode(request);
const duration = Date.now() - startTime;

logger.info('Node generation completed', {
  userId: req.user.userId,
  nodeId: result.id,
  duration,
  success: true
});
```

### Metrics Collection

```javascript
// Prometheus metrics
const promClient = require('prom-client');

const nodeGenerationCounter = new promClient.Counter({
  name: 'node_generation_total',
  help: 'Total number of nodes generated',
  labelNames: ['provider', 'category', 'status']
});

const nodeGenerationDuration = new promClient.Histogram({
  name: 'node_generation_duration_seconds',
  help: 'Duration of node generation',
  labelNames: ['provider', 'category']
});
```

### Error Tracking

```javascript
// Error reporting
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Capture errors with context
Sentry.withScope((scope) => {
  scope.setTag('component', 'node-generator');
  scope.setUser({ id: userId });
  scope.setContext('request', { nodeRequest });
  Sentry.captureException(error);
});
```

## Troubleshooting

### Common Issues

#### 1. Node Generation Fails

**Symptoms:**
- 500 errors from generation endpoint
- LLM provider timeouts
- Invalid node format errors

**Solutions:**
```bash
# Check LLM provider status
curl -X POST http://localhost:11434/api/generate  # Ollama
curl -H "Authorization: Bearer $CLAUDE_API_KEY" https://api.anthropic.com/v1/messages  # Claude

# Verify environment variables
echo $LLM_PROVIDER
echo $CLAUDE_API_KEY

# Check logs
docker logs automation-master-backend
tail -f backend/logs/app.log
```

#### 2. Database Connection Issues

**Symptoms:**
- Database connection errors
- Migration failures
- Query timeouts

**Solutions:**
```bash
# Test database connection
psql -h localhost -U postgres -d workflow_automation

# Run migrations
npm run migrate

# Check connection pool
SELECT * FROM pg_stat_activity WHERE datname = 'workflow_automation';
```

#### 3. Frontend Node Integration Issues

**Symptoms:**
- Generated nodes not appearing
- Canvas rendering errors
- Form validation failures

**Solutions:**
```javascript
// Debug node registry
console.log('Loaded nodes:', dynamicNodeRegistry.getAllGeneratedNodes());

// Check API connectivity
fetch('/api/generated-nodes')
  .then(res => res.json())
  .then(console.log);

// Verify node component rendering
const nodeComponent = nodeTypes['generatedNode'];
console.log('Node component:', nodeComponent);
```

### Performance Issues

#### 1. Slow Node Generation

**Causes:**
- LLM provider latency
- Database query performance
- Memory constraints

**Solutions:**
```bash
# Monitor LLM response times
curl -w "@curl-format.txt" -s -o /dev/null http://ollama-endpoint

# Optimize database queries
EXPLAIN ANALYZE SELECT * FROM generated_nodes WHERE user_id = 'uuid';

# Monitor memory usage
docker stats automation-master-backend
```

#### 2. High Memory Usage

**Causes:**
- Large node definitions
- Memory leaks in LLM client
- Unoptimized queries

**Solutions:**
```javascript
// Implement memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    logger.warn('High memory usage', usage);
  }
}, 60000);

// Clean up resources
process.on('exit', () => {
  // Cleanup LLM clients
  ollama.cleanup();
  openai.cleanup();
});
```

## Testing

### Test Suite Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── nodeGenerator.test.js
│   │   └── dynamicNodeRegistry.test.js
│   └── components/
│       ├── NodeGenerator.test.js
│       └── GeneratedNode.test.js
├── integration/
│   ├── api/
│   │   └── generatedNodes.test.js
│   └── workflows/
│       └── nodeIntegration.test.js
├── e2e/
│   ├── nodeGeneration.test.js
│   └── workflowExecution.test.js
└── security/
    ├── inputValidation.test.js
    └── codeExecution.test.js
```

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:security      # Security tests only

# Frontend tests
cd frontend
npm test                   # Jest tests
npm run test:e2e          # Cypress E2E tests
npm run test:coverage     # Coverage report

# Full test suite
npm run test:all          # Run all tests across frontend/backend
```

### Test Coverage Requirements

- **Unit Tests**: 90% code coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Core user workflows
- **Security Tests**: All input validation paths

## Contributing

### Development Setup

1. **Prerequisites**
   ```bash
   node >= 18.0.0
   npm >= 8.0.0
   postgresql >= 14.0
   docker >= 20.0.0
   ```

2. **Installation**
   ```bash
   git clone <repository>
   cd automation-master
   
   # Backend setup
   cd backend
   npm install
   cp .env.example .env  # Configure environment
   npm run migrate
   
   # Frontend setup
   cd ../frontend
   npm install
   ```

3. **Development Workflow**
   ```bash
   # Start development servers
   npm run dev          # Starts both frontend and backend
   npm run dev:backend  # Backend only
   npm run dev:frontend # Frontend only
   
   # Run tests
   npm run test:watch   # Watch mode
   npm run lint         # Code linting
   npm run format       # Code formatting
   ```

### Code Standards

#### JavaScript/TypeScript

```javascript
// Use ESLint + Prettier configuration
// Function naming: camelCase
// Class naming: PascalCase
// Constants: UPPER_SNAKE_CASE

// Example service function
async function generateWorkflowNode(request, userId, options = {}) {
  // Validate inputs
  if (!request || typeof request !== 'string') {
    throw new ValidationError('Request must be a non-empty string');
  }
  
  // Implementation with proper error handling
  try {
    const result = await nodeGenerator.generate(request, userId, options);
    return result;
  } catch (error) {
    logger.error('Node generation failed', { error, userId, request });
    throw new NodeGenerationError('Failed to generate node', { cause: error });
  }
}
```

#### Database Queries

```javascript
// Always use parameterized queries
const query = `
  SELECT n.*, COUNT(v.id) as version_count
  FROM generated_nodes n
  LEFT JOIN generated_node_versions v ON n.id = v.node_id
  WHERE n.user_id = $1 AND n.is_active = $2
  GROUP BY n.id
  ORDER BY n.updated_at DESC
`;

const result = await db.query(query, [userId, true]);
```

#### React Components

```jsx
// Use functional components with hooks
// Implement proper TypeScript interfaces
// Follow React best practices

interface GeneratedNodeProps {
  data: NodeData;
  selected: boolean;
  onUpdate: (data: Partial<NodeData>) => void;
}

const GeneratedNode: React.FC<GeneratedNodeProps> = ({ 
  data, 
  selected, 
  onUpdate 
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Use useMemo for expensive calculations
  const formFields = useMemo(() => 
    generateFormFields(data.inputSchema), 
    [data.inputSchema]
  );
  
  // Use useCallback for event handlers
  const handleConfigToggle = useCallback(() => {
    setIsConfiguring(prev => !prev);
  }, []);
  
  return (
    <div className="generated-node" data-selected={selected}>
      {/* Component JSX */}
    </div>
  );
};
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/node-generator-enhancement
   ```

2. **Development**
   - Write tests first (TDD)
   - Implement feature
   - Ensure all tests pass
   - Run security scan

3. **Code Review Checklist**
   - [ ] Tests cover new functionality
   - [ ] Security considerations addressed
   - [ ] Performance impact assessed
   - [ ] Documentation updated
   - [ ] Breaking changes documented

4. **Merge Requirements**
   - All tests passing
   - Code review approved
   - Security scan passed
   - Documentation updated

### Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Build & Test**
   ```bash
   npm run build
   npm run test:all
   npm run security:scan
   ```

3. **Deploy to Staging**
   ```bash
   npm run deploy:staging
   npm run test:e2e:staging
   ```

4. **Production Deployment**
   ```bash
   npm run deploy:production
   npm run monitor:deployment
   ```

---

## Support

For support and questions:
- **Technical Issues**: Create GitHub issue
- **Security Concerns**: Email security@company.com
- **Feature Requests**: GitHub discussions
- **Documentation**: Contribute to docs/ directory

## License

[Your License Here]

---

*This documentation is maintained by the development team and updated with each release.*