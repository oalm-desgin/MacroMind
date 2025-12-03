# Development Setup Guide

Complete guide for setting up MacroMind for local development.

## Prerequisites

### Required Software

- **Python 3.11+** - Backend services
- **Node.js 18+** - Frontend application
- **PostgreSQL 15+** - Database
- **Docker & Docker Compose** - Containerization
- **Git** - Version control

### Optional Software

- **Minikube** - Local Kubernetes (for K8s testing)
- **kubectl** - Kubernetes CLI
- **Helm 3** - Kubernetes package manager
- **Postman** or **Insomnia** - API testing

## Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone <repository-url>
cd MacroMind
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Start All Services

```bash
# Start everything with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
open http://localhost:3000
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec auth-service python -m alembic upgrade head
```

That's it! The application should be running at `http://localhost:3000`.

## Manual Development Setup

For individual service development without Docker.

### Backend Setup

#### 1. Set Up Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

#### 2. Install PostgreSQL

```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Mac (Homebrew)
brew install postgresql@15

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # Mac
```

#### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE macromind;
CREATE USER macromind WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE macromind TO macromind;
\q

# Load schema
psql -U macromind -d macromind -f db/schema.sql
```

#### 4. Set Up Auth Service

```bash
cd services/auth-service

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --reload --port 8000

# Test
curl http://localhost:8000/health
```

#### 5. Set Up Meal Planner Service

```bash
cd services/meal-planner-service

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --reload --port 8001

# Test
curl http://localhost:8001/health
```

#### 6. Set Up Nutrition AI Service

```bash
cd services/nutrition-ai-service

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --reload --port 8002

# Test
curl http://localhost:8002/health
```

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend

# Install packages
npm install
```

#### 2. Configure Environment

```bash
# Create .env file
cat > .env << EOL
VITE_AUTH_SERVICE_URL=http://localhost:8000
VITE_MEAL_PLANNER_SERVICE_URL=http://localhost:8001
VITE_NUTRITION_AI_SERVICE_URL=http://localhost:8002
EOL
```

#### 3. Start Development Server

```bash
npm run dev

# Open browser
open http://localhost:5173
```

## Project Structure

```
MacroMind/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Screen components
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Helper functions
│   │   ├── App.jsx            # Main app
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── services/
│   ├── auth-service/
│   │   ├── main.py            # FastAPI app
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── auth.py            # Auth logic
│   │   ├── database.py        # DB connection
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── meal-planner-service/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── meal_generator.py # AI meal generation
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── nutrition-ai-service/
│       ├── main.py
│       ├── ai_coach.py        # AI coach logic
│       ├── requirements.txt
│       └── Dockerfile
│
├── db/
│   ├── schema.sql             # Database schema
│   └── migrations/            # Migration scripts
│
├── k8s/                       # Kubernetes manifests
├── helm/                      # Helm charts
├── jenkins/                   # CI/CD pipelines
├── docs/                      # Documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Test locally
docker-compose up -d

# Commit changes
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Running Tests

```bash
# Backend tests (pytest)
cd services/auth-service
pytest tests/

# Frontend tests (future)
cd frontend
npm test
```

### 3. Code Formatting

```bash
# Python (Black)
cd services/auth-service
black .

# Python (isort - import sorting)
isort .

# JavaScript/React (Prettier)
cd frontend
npm run format
```

### 4. Linting

```bash
# Python (flake8)
cd services/auth-service
flake8 .

# JavaScript (ESLint)
cd frontend
npm run lint
```

## Database Management

### Viewing Data

```bash
# Connect to database
psql -U macromind -d macromind

# List tables
\dt

# View users
SELECT * FROM users;

# View meals
SELECT * FROM meals LIMIT 10;

# Exit
\q
```

### Database Migrations (Future)

```bash
# Create migration
cd services/auth-service
alembic revision -m "Add new column"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Reset Database

```bash
# Drop and recreate
psql -U postgres
DROP DATABASE macromind;
CREATE DATABASE macromind;
GRANT ALL PRIVILEGES ON DATABASE macromind TO macromind;
\q

# Reload schema
psql -U macromind -d macromind -f db/schema.sql
```

## API Testing

### Using curl

```bash
# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fitness_goal": "cut",
    "dietary_preference": "none"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Use token (replace TOKEN)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import API collection (future: add collection file)
2. Set environment variables
3. Use collections for common requests

## Debugging

### Backend Debugging

```bash
# Run with debugger
cd services/auth-service
python -m debugpy --listen 5678 --wait-for-client -m uvicorn main:app --reload

# Or add to code:
import debugpy
debugpy.listen(5678)
debugpy.wait_for_client()
```

### Frontend Debugging

```bash
# Use React Developer Tools (browser extension)
# Use browser console
# Add breakpoints in browser DevTools
```

### Docker Debugging

```bash
# View container logs
docker-compose logs -f auth-service

# Execute command in container
docker-compose exec auth-service bash

# Inspect container
docker inspect macromind_auth-service_1
```

## Common Issues & Solutions

### Issue: Port already in use

```bash
# Find process using port
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>
```

### Issue: Database connection failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
# Verify database exists
psql -U postgres -l
```

### Issue: OpenAI API errors

```bash
# Verify API key in .env
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: Module not found (Python)

```bash
# Verify virtual environment is activated
which python

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables Reference

### Backend Services

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/macromind

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=sk-your-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Environment
ENVIRONMENT=development
```

### Frontend

```env
VITE_AUTH_SERVICE_URL=http://localhost:8000
VITE_MEAL_PLANNER_SERVICE_URL=http://localhost:8001
VITE_NUTRITION_AI_SERVICE_URL=http://localhost:8002
```

## Next Steps

1. Read [Architecture Documentation](./architecture.md)
2. Review [API Documentation](./api.md)
3. Check [Deployment Guide](./deployment.md)
4. Start building features!

## Getting Help

- Check documentation in `docs/`
- Review error logs
- Search GitHub issues (future)
- Check Stack Overflow for common issues

