# MacroMind Documentation

Comprehensive documentation for the MacroMind platform.

## Contents

- [Architecture](./architecture.md) - System architecture and component overview
- [API Documentation](./api.md) - REST API endpoints and schemas
- [Deployment Guide](./deployment.md) - Kubernetes and Helm deployment
- [Development Setup](./development.md) - Local development environment setup
- [Database Schema](./database.md) - Database design and relationships
- [DevOps Pipeline](./devops.md) - CI/CD pipeline and automation

## Quick Links

### For Developers
- [Development Setup](./development.md) - Get started with local development
- [API Documentation](./api.md) - API reference for frontend integration

### For DevOps
- [Deployment Guide](./deployment.md) - Deploy to Kubernetes
- [DevOps Pipeline](./devops.md) - Jenkins CI/CD configuration

### For Architects
- [Architecture](./architecture.md) - System design and microservices
- [Database Schema](./database.md) - Data model and relationships

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│              Port 80 (Nginx in production)               │
└────────────────────┬────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │   Ingress   │
              │   Gateway   │
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐  ┌────▼───┐  ┌────▼────┐
   │  Auth  │  │  Meal  │  │   AI    │
   │Service │  │Planner │  │ Service │
   │ :8000  │  │ :8001  │  │  :8002  │
   └────┬───┘  └────┬───┘  └────┬────┘
        │           │            │
        └───────────┼────────────┘
                    │
              ┌─────▼──────┐
              │ PostgreSQL │
              │   :5432    │
              └────────────┘
```

## Technology Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- React Router
- Axios
- Recharts

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- OpenAI API

**DevOps:**
- Docker
- Kubernetes (Minikube)
- Helm 3
- Jenkins
- Terraform (planned)

## MVP Features

✅ User authentication (JWT)  
✅ Fitness goal management  
✅ AI-powered weekly meal plans  
✅ Individual meal swapping  
✅ AI nutrition coach chat  
✅ Dashboard with progress tracking  

## Post-MVP Features

⬜ Recipe upload with image analysis  
⬜ Grocery list generation  
⬜ Advanced analytics and charts  
⬜ Notifications and event processing  
⬜ Terraform infrastructure provisioning  
⬜ Centralized logging and monitoring  

## Contributing

This is a portfolio project. For questions or collaboration, see README.md in root directory.

## License

Proprietary - Portfolio Project

