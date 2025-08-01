# 🚀 Workflow Automation Tool - Quick Start

## ✅ Services Running

Your visual workflow automation tool is now running locally:

- **Frontend**: http://localhost:3000 
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 🌐 Access the Application

1. **Open your browser** and go to: http://localhost:3000
2. **Register a new account** or use the login form
3. **Start building workflows** with the visual canvas

## 📡 API Endpoints Available

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/user/profile` - Get user profile
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

## 🔧 Development Commands

- **Start both services**: `npm run dev`
- **Start frontend only**: `cd frontend && npm start`
- **Start backend only**: `cd backend && npm run dev`
- **Build frontend**: `cd frontend && npm run build`

## 🗄️ Database Setup (Optional)

The app works without a database, but for full functionality:

```bash
# Option 1: Use Docker Compose (includes PostgreSQL + Redis)
docker-compose up

# Option 2: Manual PostgreSQL setup
createdb workflow_automation
# Tables will be created automatically
```

## 🚀 What You Can Do Now

1. **Visit the frontend** at http://localhost:3000
2. **Register an account** to test authentication
3. **View the dashboard** (workflows list)
4. **Test the API** with curl or Postman

## 🛠️ Project Structure

```
automation-master/
├── frontend/         # React app (localhost:3000)
├── backend/          # Node.js API (localhost:3001)
├── docker/           # Script execution containers
├── database/         # PostgreSQL schema
└── docker-compose.yml # Full development environment
```

The foundation is ready for building workflow features! 🎉