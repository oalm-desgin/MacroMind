# MacroMind Docker Setup Guide

Complete guide for running MacroMind with Docker Compose.

## Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **OpenAI API Key** ([Get API Key](https://platform.openai.com/api-keys))

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd MacroMind
```

### 2. Initialize Environment
```bash
# Option A: Use Makefile (recommended)
make init

# Option B: Manual setup
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `.env` file and add your OpenAI API key:
```bash
# Required: Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here

# Optional: Change database password (recommended for production)
POSTGRES_PASSWORD=your-secure-password-here

# Optional: Change JWT secret (recommended for production)
JWT_SECRET_KEY=your-long-random-secret-key-here
```

### 4. Start Services
```bash
# Option A: Use Makefile
make up

# Option B: Use docker-compose directly
docker-compose up -d
```

### 5. Access Application
- **Frontend:** http://localhost:3000
- **Auth API Docs:** http://localhost:8000/docs
- **Meal Planner API Docs:** http://localhost:8001/docs
- **Nutrition AI API Docs:** http://localhost:8002/docs

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                     │
│                  (macromind-network)                 │
│                                                      │
│  ┌──────────────┐                                   │
│  │   Frontend   │  (Nginx + React)                  │
│  │  Port: 3000  │  Proxies API requests             │
│  └──────┬───────┘                                   │
│         │                                            │
│    ┌────┼────────────────┐                          │
│    │    │                │                          │
│  ┌─▼────▼───┐  ┌────────▼┐  ┌─────────────┐       │
│  │   Auth   │  │  Meal   │  │ Nutrition   │       │
│  │ Service  │  │ Planner │  │ AI Service  │       │
│  │  :8000   │  │  :8001  │  │   :8002     │       │
│  └─────┬────┘  └────┬────┘  └──────┬──────┘       │
│        │            │               │               │
│        └────────────┼───────────────┘               │
│                     │                                │
│              ┌──────▼──────┐                        │
│              │  PostgreSQL │                        │
│              │    :5432    │                        │
│              │  (Volume)   │                        │
│              └─────────────┘                        │
└─────────────────────────────────────────────────────┘
```

## Services

### PostgreSQL Database
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Volume:** `macromind_postgres_data` (persistent)
- **Health Check:** Every 10s

### Auth Service
- **Build:** `services/auth-service/`
- **Port:** 8000
- **Depends On:** postgres
- **Health Check:** Every 30s

### Meal Planner Service
- **Build:** `services/meal-planner-service/`
- **Port:** 8001
- **Depends On:** postgres, auth-service
- **Health Check:** Every 30s
- **Requires:** OpenAI API key

### Nutrition AI Service
- **Build:** `services/nutrition-ai-service/`
- **Port:** 8002
- **Depends On:** postgres, auth-service
- **Health Check:** Every 30s
- **Requires:** OpenAI API key

### Frontend
- **Build:** `frontend/` (Multi-stage: React build + Nginx)
- **Port:** 3000 (external) → 80 (internal)
- **Depends On:** All backend services
- **Features:**
  - Nginx reverse proxy for API calls
  - SPA routing support
  - Gzip compression
  - Security headers

## Commands Reference

### Using Makefile (Recommended)

```bash
make help          # Show all available commands
make init          # Initialize project (first time)
make build         # Build all Docker images
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make logs          # Show logs from all services
make logs-auth     # Show logs from auth service only
make clean         # Remove all containers and volumes
make rebuild       # Rebuild everything from scratch
make ps            # Show running containers
make test          # Run tests
make shell-db      # Open PostgreSQL shell
make backup-db     # Backup database
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec auth-service /bin/sh
```

## Development Mode

For development with hot reload:

```bash
# Start in development mode
make dev

# Or with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Development features:**
- Frontend hot reload (Vite)
- Backend hot reload (uvicorn --reload)
- Volume mounts for code changes
- Frontend on port 5173 (Vite default)

## Environment Variables

### Required
- `OPENAI_API_KEY` - Your OpenAI API key

### Optional (but recommended for production)
- `POSTGRES_PASSWORD` - Database password (default: password)
- `JWT_SECRET_KEY` - JWT signing secret (default: dev key)
- `POSTGRES_USER` - Database user (default: macromind)
- `POSTGRES_DB` - Database name (default: macromind)

### Auto-configured
- `DATABASE_URL` - Constructed from postgres settings
- `CORS_ORIGINS` - Allowed CORS origins
- `JWT_ALGORITHM` - JWT algorithm (HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiry (30 min)

## Troubleshooting

### Services won't start
```bash
# Check logs
make logs

# Check individual service
make logs-auth

# Verify .env file exists and has OPENAI_API_KEY
cat .env | grep OPENAI_API_KEY
```

### Database connection errors
```bash
# Check if postgres is healthy
docker-compose ps

# Wait for postgres to be fully ready (takes ~10-15 seconds)
docker-compose logs postgres

# Restart services
make restart
```

### Port conflicts
If ports 3000, 8000, 8001, 8002, or 5432 are already in use:

**Option 1:** Stop conflicting services
```bash
# Find process using port
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>
```

**Option 2:** Change ports in `docker-compose.yml`
```yaml
ports:
  - "3001:80"  # Use port 3001 instead of 3000
```

### Frontend can't connect to backend
```bash
# Check if all services are healthy
docker-compose ps

# Verify Nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check network connectivity
docker-compose exec frontend ping auth-service
```

### OpenAI API errors
```bash
# Verify API key is set
docker-compose exec meal-planner-service printenv OPENAI_API_KEY

# Check API key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Build failures
```bash
# Clean build cache and rebuild
docker-compose down
docker system prune -a
make rebuild

# Or rebuild specific service
docker-compose build --no-cache auth-service
```

## Data Management

### Backup Database
```bash
# Using Makefile
make backup-db

# Manual backup
docker-compose exec postgres pg_dump -U macromind macromind > backup.sql
```

### Restore Database
```bash
# Stop services
docker-compose down

# Remove old volume
docker volume rm macromind_postgres_data

# Start postgres only
docker-compose up -d postgres

# Wait for postgres to be ready
sleep 10

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U macromind -d macromind
```

### Reset Everything
```bash
# Remove all containers, volumes, and networks
make clean

# Rebuild from scratch
make init
make up
```

## Production Deployment

### Security Checklist
- [ ] Change `POSTGRES_PASSWORD` to strong password
- [ ] Change `JWT_SECRET_KEY` to random 32+ character string
- [ ] Use HTTPS (add SSL termination)
- [ ] Set `ENVIRONMENT=production`
- [ ] Restrict CORS origins
- [ ] Use Docker secrets for sensitive data
- [ ] Enable firewall rules
- [ ] Regular database backups
- [ ] Monitor logs and health checks

### Performance Optimization
```yaml
# Add to docker-compose.yml for production
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## Health Checks

All services include health checks:

```bash
# Check health status
docker-compose ps

# Expected output:
# NAME                  STATUS
# macromind_postgres    Up (healthy)
# macromind_auth        Up (healthy)
# macromind_meal_planner Up (healthy)
# macromind_nutrition_ai Up (healthy)
# macromind_frontend    Up (healthy)
```

## Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 auth-service

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 auth-service
```

## Next Steps

After successful deployment:
1. Register a user at http://localhost:3000/auth
2. Login and explore dashboard
3. Generate a meal plan (may take 10-30 seconds)
4. Chat with AI nutrition coach
5. Monitor logs for any issues

## Support

- Check service logs: `make logs`
- Verify health: `docker-compose ps`
- Test APIs: Visit `/docs` endpoints
- Database shell: `make shell-db`

## Clean Up

```bash
# Stop services (keep data)
make down

# Stop and remove all data
make clean

# Remove all Docker images
docker-compose down --rmi all
```

