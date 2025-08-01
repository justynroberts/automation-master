# Automation Master Platform

A powerful workflow automation platform built with React and Node.js that allows users to create, manage, and execute complex automation workflows with a visual drag-and-drop interface.

## 🚀 Features

### Core Functionality
- **Visual Workflow Builder**: Drag-and-drop interface for creating complex workflows
- **Node-Based Architecture**: Modular system with support for various node types
- **Real-time Execution**: Live workflow execution with monitoring and logging
- **User Input Handling**: Modal forms for collecting user input during workflow execution
- **Variable System**: Dynamic variable resolution between workflow steps

### Node Types
- **API Nodes**: GET/POST requests with variable substitution
- **Script Nodes**: JavaScript, Python, Bash execution in sandboxed environments
- **Transform Nodes**: Data transformation using jq, JSONPath, and JavaScript
- **Conditional Logic**: Branching workflows based on conditions
- **User Input**: Interactive forms for mid-workflow data collection
- **Output Nodes**: Screen output, Slack integration, email notifications
- **Generated Nodes**: AI-powered custom node generation

### Security & Performance
- **JWT Authentication**: Secure user authentication and authorization
- **Docker Sandboxing**: Isolated execution environment for scripts
- **Rate Limiting**: API protection against abuse
- **Concurrent Execution**: Multi-workflow execution with queue management
- **Database Logging**: Comprehensive execution and audit logs

## 🏗️ Architecture

```
├── backend/                 # Node.js/Express API server
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic and AI integration
│   ├── utils/              # Database and utility functions
│   └── server.js           # Application entry point
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API service layer
└── database/               # PostgreSQL schema and migrations
```

## 🛠️ Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (v13+ recommended)
- Docker (optional, for sandboxed execution)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd automation-master
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database and run migrations
   createdb automation_db
   # Import schema from database/ directory
   ```

### Production Deployment

1. **Environment Configuration**
   ```bash
   # Backend
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/db
   JWT_SECRET=your-secure-secret
   
   # Frontend
   REACT_APP_API_URL=https://your-api-domain.com/api
   ```

2. **Build and Start**
   ```bash
   # Frontend build
   cd frontend && npm run build
   
   # Backend production
   cd backend && npm run prod
   ```

## 📋 Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PORT` | Server port | No | 5001 |
| `NODE_ENV` | Environment mode | No | development |
| `CORS_ORIGIN` | Allowed CORS origins | No | * |
| `DOCKER_ENABLED` | Enable Docker sandboxing | No | true |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | Yes | - |
| `PORT` | Frontend port | No | 5002 |

## 🔐 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Route-level access control
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Cross-origin request protection
- **Helmet Security**: Security headers and protection
- **Sandboxed Execution**: Docker-based script isolation
- **SQL Injection Prevention**: Parameterized queries

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Workflows
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Executions
- `GET /api/executions` - List executions
- `GET /api/executions/:id` - Get execution details
- `GET /api/executions/:id/logs` - Get execution logs

## 🎯 Usage Examples

### Creating a Simple API Workflow

1. **Add API GET Node**: Fetch data from an external API
2. **Add Transform Node**: Process the response data
3. **Add API POST Node**: Send processed data to another service
4. **Add Screen Output**: Display results

### User Input Workflow

1. **Add User Input Node**: Configure form fields
2. **Add Script Node**: Process user input
3. **Add Conditional Node**: Branch based on input
4. **Add Output Node**: Display personalized results

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Style
- ESLint configuration for JavaScript
- Prettier for code formatting
- Consistent naming conventions

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📊 Monitoring & Logs

- **Execution Logs**: Detailed workflow execution tracking
- **Node Logs**: Individual node execution details
- **Error Handling**: Comprehensive error reporting
- **Performance Metrics**: Execution time tracking

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection**: Verify PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Ensure ports 5001 (backend) and 5002 (frontend) are available
3. **Docker Issues**: Check Docker daemon is running for sandboxed execution
4. **CORS Errors**: Verify CORS_ORIGIN configuration matches frontend URL

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For support and questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Built with**: React, Node.js, PostgreSQL, Docker