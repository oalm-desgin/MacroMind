# MacroMind Architecture

## System Overview

MacroMind is built using a microservices architecture, with each service responsible for a specific domain. Services communicate via REST APIs and are deployed on Kubernetes for scalability and resilience.

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                        Client Layer                            │
│                     React SPA (Port 80)                        │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                     API Gateway Layer                          │
│              Nginx Ingress Controller (K8s)                    │
│              - Routing                                         │
│              - SSL Termination                                 │
│              - Rate Limiting                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼──────┐ ┌─────▼──────┐ ┌─────▼─────────┐
│  Auth Service    │ │   Meal     │ │  Nutrition    │
│   (FastAPI)      │ │  Planner   │ │  AI Service   │
│                  │ │  Service   │ │   (FastAPI)   │
│  Port: 8000      │ │ (FastAPI)  │ │               │
│                  │ │            │ │  Port: 8002   │
│  - Registration  │ │ Port: 8001 │ │               │
│  - Login/JWT     │ │            │ │  - AI Coach   │
│  - User Profile  │ │ - Meal Gen │ │  - Macro      │
│  - Goals Mgmt    │ │ - AI Plans │ │    Analysis   │
└───────────┬──────┘ └─────┬──────┘ └─────┬─────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                ┌──────────▼──────────┐
                │   PostgreSQL 15     │
                │                     │
                │  - users            │
                │  - user_profiles    │
                │  - meals            │
                │  - meal_plans       │
                │  - chat_messages    │
                │                     │
                │  Port: 5432         │
                └─────────────────────┘
```

## External Dependencies

```
┌──────────────────┐
│   OpenAI API     │
│   (GPT-4o-mini)  │
│                  │
│  - Meal Gen      │
│  - AI Coach      │
└──────────────────┘
```

## Microservices Details

### 1. Auth Service

**Responsibility:** User authentication and authorization

**Technologies:**
- FastAPI
- SQLAlchemy
- python-jose (JWT)
- passlib (BCrypt)

**Key Features:**
- User registration with validation
- JWT token generation (access + refresh)
- Password hashing
- User profile management
- Fitness goals CRUD

**Database Tables:**
- users
- user_profiles

**External Dependencies:** None

---

### 2. Meal Planner Service

**Responsibility:** AI-powered meal plan generation and management

**Technologies:**
- FastAPI
- SQLAlchemy
- OpenAI API

**Key Features:**
- Generate 7-day meal plans
- Personalized based on goals and preferences
- Individual meal swapping
- Macro calculation

**Database Tables:**
- meals
- meal_plans

**External Dependencies:**
- OpenAI API (GPT-4o-mini)
- Auth Service (user verification)

---

### 3. Nutrition AI Service

**Responsibility:** AI coaching and recipe analysis

**Technologies:**
- FastAPI
- SQLAlchemy
- OpenAI API

**Key Features:**
- Real-time AI coach chat
- Recipe macro extraction
- Nutrition advice
- Chat history

**Database Tables:**
- chat_messages

**External Dependencies:**
- OpenAI API (GPT-4o-mini)
- Auth Service (user verification)

---

## Data Flow

### User Registration Flow
```
Client → Auth Service → Database
       ← JWT Token    ←
```

### Meal Plan Generation Flow
```
Client → Meal Planner Service → OpenAI API
       ←                       ← AI Response
       ← Meal Planner Service → Database (save meals)
       ← Generated Plan        ←
```

### AI Chat Flow
```
Client → Nutrition AI Service → OpenAI API
       ←                       ← AI Response
       ← Nutrition AI Service → Database (save chat)
       ← AI Message            ←
```

## Security Architecture

### Authentication Flow
```
1. User Login → Auth Service
2. Auth Service validates credentials
3. Generate JWT with user_id, email, role
4. Return access_token (30 min) + refresh_token (7 days)
5. Client stores tokens in localStorage
6. All subsequent requests include Bearer token
7. Each service validates JWT before processing
```

### Authorization
- JWT contains user_id for user-specific data
- Role-based access control (RBAC) for admin features (post-MVP)
- Each service validates token independently

### Data Security
- Passwords hashed with BCrypt (12 rounds)
- JWT secrets stored in Kubernetes Secrets
- Database credentials in K8s Secrets
- CORS configured for frontend origin only
- Rate limiting on AI endpoints

## Deployment Architecture

### Kubernetes Resources

```
Namespace: macromind

StatefulSet:
  - postgres (1 replica, 10Gi PVC)

Deployments:
  - auth-service (2 replicas)
  - meal-planner-service (2 replicas)
  - nutrition-ai-service (2 replicas)
  - frontend (2 replicas)

Services (ClusterIP):
  - postgres-service (port 5432)
  - auth-service (port 8000)
  - meal-planner-service (port 8001)
  - nutrition-ai-service (port 8002)
  - frontend-service (port 80)

Ingress:
  - macromind.local → frontend-service
  - macromind.local/api/auth → auth-service
  - macromind.local/api/meals → meal-planner-service
  - macromind.local/api/ai → nutrition-ai-service

Secrets:
  - macromind-secrets (database-url, jwt-secret, openai-api-key)

ConfigMaps:
  - service-config (service URLs, CORS origins)

HPA (Horizontal Pod Autoscaler):
  - auth-service (2-5 replicas, 70% CPU)
  - meal-planner-service (2-5 replicas, 70% CPU)
```

### Resource Requirements

| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|-------------|----------------|-----------|--------------|
| Auth | 100m | 128Mi | 500m | 512Mi |
| Meal Planner | 100m | 128Mi | 500m | 512Mi |
| Nutrition AI | 100m | 128Mi | 500m | 512Mi |
| Frontend | 50m | 64Mi | 200m | 256Mi |
| PostgreSQL | 250m | 256Mi | 1000m | 1Gi |

## CI/CD Pipeline

```
GitHub Push
    ↓
Jenkins Webhook
    ↓
Checkout Code
    ↓
Build Docker Image
    ↓
Run Tests (pytest)
    ↓
Push to Registry
    ↓
Deploy to K8s (Helm)
    ↓
Smoke Tests
    ↓
Notify Success/Failure
```

## Scalability Considerations

### Horizontal Scaling
- All services are stateless (except postgres)
- HPA configured for auto-scaling
- Load balanced via K8s services

### Database Scaling
- PostgreSQL StatefulSet for persistence
- Connection pooling in SQLAlchemy
- Indexes on frequently queried columns
- Future: Read replicas for analytics

### Caching Strategy (Future)
- Redis for session management
- Cache meal plans for quick retrieval
- Cache AI responses for common questions

## Monitoring & Observability (Future)

### Logging
- Centralized logging with ELK stack
- Structured JSON logs
- Log aggregation by service

### Metrics
- Prometheus for metrics collection
- Grafana dashboards
- Key metrics: request rate, latency, error rate

### Tracing
- Distributed tracing with Jaeger
- Trace requests across services

## Disaster Recovery

### Backup Strategy
- Daily PostgreSQL backups
- Kubernetes persistent volume snapshots
- Configuration stored in Git

### High Availability
- Multiple replicas per service
- Database failover (future)
- Multi-zone deployment (production)

## Technology Choices Rationale

**Why FastAPI?**
- High performance async framework
- Automatic API documentation (Swagger/OpenAPI)
- Excellent typing support with Pydantic
- Easy OpenAI integration

**Why React?**
- Large ecosystem and community
- Component-based architecture
- Excellent developer experience
- Wide adoption in industry

**Why Microservices?**
- Independent scaling
- Technology flexibility
- Fault isolation
- Team autonomy

**Why Kubernetes?**
- Industry-standard orchestration
- Declarative configuration
- Self-healing capabilities
- Demonstrates DevOps skills

**Why PostgreSQL?**
- ACID compliance
- JSON support (JSONB for ingredients)
- Mature and reliable
- Excellent performance

