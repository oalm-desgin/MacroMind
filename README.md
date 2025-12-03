# MacroMind

An AI-powered nutrition and meal planning platform built with microservices architecture.

## Architecture Overview

**Frontend:** React + TailwindCSS + Vite  
**Backend:** Python/FastAPI microservices  
**Database:** PostgreSQL  
**AI:** OpenAI API  
**DevOps:** Docker + Kubernetes + Helm + Jenkins

## Project Structure

```
MacroMind/
├── frontend/                    # React frontend application
├── services/                    # Backend microservices
│   ├── auth-service/           # Authentication and user management
│   ├── meal-planner-service/   # AI meal plan generation
│   └── nutrition-ai-service/   # AI coach and macro analysis
├── db/                         # Database schemas and migrations
├── k8s/                        # Kubernetes manifests
├── helm/                       # Helm charts
├── jenkins/                    # CI/CD pipeline definitions
└── docs/                       # Documentation and diagrams
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes (Minikube)
- kubectl
- Helm 3
- Python 3.11+
- Node.js 18+

### Local Development with Docker Compose
```bash
# Set up environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Access frontend
open http://localhost:3000
```

### Kubernetes Deployment
```bash
# Start Minikube
minikube start --cpus=4 --memory=8192

# Deploy with Helm
helm install macromind ./helm/macromind -n macromind --create-namespace

# Access application
minikube service frontend -n macromind
```

## Services

### Auth Service (Port 8000)
- User registration and authentication
- JWT token management
- User profile and goals management

### Meal Planner Service (Port 8001)
- AI-powered weekly meal plan generation
- Meal swapping and customization
- Macro calculation

### Nutrition AI Service (Port 8002)
- Real-time AI nutrition coach
- Recipe macro analysis
- Personalized recommendations

## Documentation

See [docs/](./docs/) for detailed documentation:
- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Setup](./docs/development.md)

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT token signing
- `OPENAI_API_KEY` - OpenAI API key

## License

Proprietary - Portfolio Project

## Contact

Built for demonstration of full-stack development and DevOps practices.

