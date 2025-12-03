# Docker Compose Infrastructure Fix Summary

## Overview
Fixed Docker Compose configuration issues related to environment variables, database connections, and service startup order.

## Changes Made

### 1. Created Root-Level `.env` File
Created `.env` file with all required environment variables:
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `DATABASE_URL` - Connection string using `postgres` container hostname
- `JWT_SECRET_KEY` - Required for authentication
- `OPENAI_API_KEY` - Required for AI services

**Important:** Update the `.env` file with your actual values before running Docker Compose.

### 2. Updated `docker-compose.yml`
- Added `env_file: - .env` to all services for environment variable loading
- Verified `postgres:15-alpine` image is used
- Confirmed all services use `depends_on` with `service_healthy` condition
- Fixed health checks to use Python's built-in `urllib` instead of `requests`
- Verified all services are on the same `macromind-network` bridge network

### 3. Added Database Connection Retry Logic
Updated all three service database files (`database.py`) to include:
- Automatic retry logic (5 retries with 2-second delays)
- Connection timeout configuration
- Better error handling and logging

### 4. Environment Variable Distribution
- **postgres**: Uses `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- **auth-service**: Uses `DATABASE_URL`, `JWT_SECRET_KEY` (required)
- **meal-planner-service**: Uses `DATABASE_URL`, `OPENAI_API_KEY`, `JWT_SECRET_KEY`
- **nutrition-ai-service**: Uses `DATABASE_URL`, `OPENAI_API_KEY` (required), `JWT_SECRET_KEY`

### 5. Network Configuration
All services communicate on the `macromind-network` bridge network:
- Services can reach each other by container name
- `DATABASE_URL` uses `postgres` as the hostname (not `localhost`)

## Verification Checklist

### Pre-Deployment
- [ ] Update `.env` file with secure values:
  - [ ] Generate a secure `JWT_SECRET_KEY` (e.g., `openssl rand -hex 32`)
  - [ ] Set a strong `POSTGRES_PASSWORD`
  - [ ] Add your `OPENAI_API_KEY` from https://platform.openai.com/api-keys
  - [ ] Verify `DATABASE_URL` uses `postgres` as hostname

### Docker Compose Startup
- [ ] Run `docker-compose pull` to ensure postgres:15-alpine image is fresh
- [ ] Run `docker-compose up -d` to start all services
- [ ] Check logs: `docker-compose logs -f` to verify:
  - [ ] Postgres starts successfully
  - [ ] All services connect to database (look for "✓ Database connection successful")
  - [ ] No environment variable errors
  - [ ] All health checks pass

### Service Health Checks
- [ ] Verify postgres health: `docker-compose exec postgres pg_isready -U macromind`
- [ ] Check auth-service: `curl http://localhost:8000/health`
- [ ] Check meal-planner-service: `curl http://localhost:8001/health`
- [ ] Check nutrition-ai-service: `curl http://localhost:8002/health`
- [ ] Check frontend: `curl http://localhost:3000`

### Registration Functionality
- [ ] Open frontend: http://localhost:3000
- [ ] Navigate to registration page
- [ ] Create a new account with:
  - Valid email address
  - Password (minimum requirements)
  - Fitness goals and preferences
- [ ] Verify registration succeeds:
  - [ ] No errors in browser console
  - [ ] User is automatically logged in
  - [ ] Redirected to dashboard/home page
  - [ ] Check auth-service logs: `docker-compose logs auth-service` shows successful registration

### AI Chat Functionality
- [ ] Log in with registered account
- [ ] Navigate to AI Chat/Nutrition Coach section
- [ ] Send a test message (e.g., "What are good sources of protein?")
- [ ] Verify AI response:
  - [ ] Response appears within 10-30 seconds
  - [ ] Response is relevant and coherent
  - [ ] No errors in browser console
  - [ ] Check nutrition-ai-service logs: `docker-compose logs nutrition-ai-service` shows successful API call
- [ ] Verify chat history:
  - [ ] Previous messages are saved
  - [ ] Can view chat history

### Database Verification
- [ ] Connect to database: `docker-compose exec postgres psql -U macromind -d macromind`
- [ ] Verify tables exist: `\dt`
- [ ] Check user was created: `SELECT email FROM users;`
- [ ] Check chat messages: `SELECT * FROM chat_messages LIMIT 5;`

### Troubleshooting Commands
If issues occur:
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f nutrition-ai-service

# Restart a specific service
docker-compose restart auth-service

# Rebuild and restart all services
docker-compose down
docker-compose up -d --build

# Check service status
docker-compose ps

# Verify environment variables are loaded
docker-compose exec auth-service env | grep DATABASE_URL
docker-compose exec nutrition-ai-service env | grep OPENAI_API_KEY
```

## Key Configuration Details

### DATABASE_URL Format
```
postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```
**Important:** Uses `postgres` (container name) as hostname, not `localhost`

### Service Dependencies
```
postgres (no dependencies)
  └── auth-service (depends on postgres health)
      └── meal-planner-service (depends on postgres + auth-service health)
      └── nutrition-ai-service (depends on postgres + auth-service health)
          └── frontend (depends on all backend services health)
```

### Ports
- Frontend: http://localhost:3000
- Auth Service: http://localhost:8000
- Meal Planner Service: http://localhost:8001
- Nutrition AI Service: http://localhost:8002
- PostgreSQL: localhost:5432

## Notes
- All services have health check endpoints at `/health`
- Database connection retries automatically (5 attempts, 2-second intervals)
- Services wait for postgres to be healthy before starting
- All services communicate on the same Docker bridge network

