# MacroMind Kubernetes Manifests

Raw Kubernetes manifests for deploying MacroMind to a Kubernetes cluster (Minikube).

## Prerequisites

- **Minikube** installed and running
- **kubectl** configured to connect to Minikube
- **Nginx Ingress Controller** enabled in Minikube
- **Docker images** built and available (or use Minikube's Docker daemon)

## Quick Start

### 1. Start Minikube

```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192

# Enable ingress addon
minikube addons enable ingress

# Verify
kubectl cluster-info
```

### 2. Build Docker Images in Minikube

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build all images
cd services/auth-service && docker build -t macromind/auth-service:latest .
cd ../meal-planner-service && docker build -t macromind/meal-planner-service:latest .
cd ../nutrition-ai-service && docker build -t macromind/nutrition-ai-service:latest .
cd ../../frontend && docker build -t macromind/frontend:latest .
```

### 3. Create Secrets

```bash
# Create namespace first
kubectl apply -f namespace.yaml

# Create secrets (replace with your actual values)
kubectl create secret generic macromind-secrets \
  --from-literal=postgres-user=macromind \
  --from-literal=postgres-password=your-secure-password \
  --from-literal=database-url=postgresql://macromind:your-secure-password@postgres:5432/macromind \
  --from-literal=jwt-secret-key=your-long-random-secret-key-min-32-chars \
  --from-literal=openai-api-key=sk-your-openai-api-key \
  -n macromind
```

### 4. Deploy All Resources

```bash
# Apply all manifests in order
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml  # Or create manually as above
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

# Wait for postgres to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n macromind --timeout=120s

# Deploy backend services
kubectl apply -f auth-deployment.yaml
kubectl apply -f auth-service.yaml
kubectl apply -f meal-planner-deployment.yaml
kubectl apply -f meal-planner-service.yaml
kubectl apply -f nutrition-ai-deployment.yaml
kubectl apply -f nutrition-ai-service.yaml

# Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Deploy ingress
kubectl apply -f ingress.yaml

# Deploy HPA
kubectl apply -f hpa.yaml
```

### 5. Access Application

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
# Replace <MINIKUBE_IP> with actual IP
echo "<MINIKUBE_IP> macromind.local" | sudo tee -a /etc/hosts

# Access application
open http://macromind.local
```

## File Structure

```
k8s/
├── namespace.yaml                    # Namespace definition
├── configmap.yaml                    # Non-sensitive configuration
├── secrets.yaml                      # Secret template (create manually)
├── postgres-pvc.yaml                 # Persistent volume claim
├── postgres-statefulset.yaml         # PostgreSQL StatefulSet
├── postgres-service.yaml             # PostgreSQL Service
├── auth-deployment.yaml              # Auth service deployment
├── auth-service.yaml                 # Auth service ClusterIP
├── meal-planner-deployment.yaml      # Meal planner deployment
├── meal-planner-service.yaml         # Meal planner ClusterIP
├── nutrition-ai-deployment.yaml      # AI service deployment
├── nutrition-ai-service.yaml         # AI service ClusterIP
├── frontend-deployment.yaml          # Frontend deployment
├── frontend-service.yaml             # Frontend ClusterIP
├── ingress.yaml                      # Nginx Ingress
└── hpa.yaml                          # Horizontal Pod Autoscalers
```

## Resource Requirements

| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|-------------|----------------|-----------|--------------|
| postgres | 250m | 256Mi | 1000m | 1Gi |
| auth-service | 100m | 128Mi | 500m | 512Mi |
| meal-planner-service | 100m | 128Mi | 500m | 512Mi |
| nutrition-ai-service | 100m | 128Mi | 500m | 512Mi |
| frontend | 50m | 64Mi | 200m | 256Mi |

## Health Checks

All services include liveness and readiness probes:

- **PostgreSQL:** `pg_isready` command
- **Backend Services:** HTTP GET to `/health` endpoint
- **Frontend:** HTTP GET to `/` endpoint

## Horizontal Pod Autoscaling

HPA is configured for:
- **auth-service:** 2-5 replicas (CPU 70%, Memory 80%)
- **meal-planner-service:** 2-5 replicas (CPU 70%, Memory 80%)

## Ingress Routing

```
macromind.local/              → frontend:80
macromind.local/api/auth/*    → auth-service:8000
macromind.local/api/meals/*   → meal-planner-service:8001
macromind.local/api/ai/*      → nutrition-ai-service:8002
```

## Verification

```bash
# Check all pods are running
kubectl get pods -n macromind

# Check services
kubectl get svc -n macromind

# Check ingress
kubectl get ingress -n macromind

# Check HPA
kubectl get hpa -n macromind

# View logs
kubectl logs -f deployment/auth-service -n macromind
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n macromind

# Check logs
kubectl logs <pod-name> -n macromind

# Common issues:
# - Image pull errors: Build images in Minikube's Docker
# - CrashLoopBackOff: Check logs and environment variables
# - Pending: Check resource availability
```

### Ingress Not Working

```bash
# Verify ingress controller is running
kubectl get pods -n ingress-nginx

# If not enabled
minikube addons enable ingress

# Check ingress configuration
kubectl describe ingress macromind-ingress -n macromind
```

### Database Connection Issues

```bash
# Verify postgres is running
kubectl get pods -l app=postgres -n macromind

# Check postgres logs
kubectl logs postgres-0 -n macromind

# Test database connection
kubectl exec -it postgres-0 -n macromind -- psql -U macromind -d macromind
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace macromind

# Or delete individually
kubectl delete -f .
```

## Next Steps

For production deployment, consider:
- Using Helm charts (see `helm/macromind/`)
- Setting up proper secrets management
- Configuring resource quotas
- Adding network policies
- Setting up monitoring and logging
