# Deployment Guide

Complete guide for deploying MacroMind to Kubernetes (Minikube).

## Prerequisites

- Docker Desktop or Docker Engine
- Minikube 1.32+
- kubectl 1.28+
- Helm 3.13+
- 8GB RAM minimum
- 4 CPU cores recommended

## Quick Start

### 1. Start Minikube

```bash
# Start with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify installation
kubectl cluster-info
```

### 2. Build Docker Images

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build auth service
cd services/auth-service
docker build -t macromind/auth-service:latest .

# Build meal planner service
cd ../meal-planner-service
docker build -t macromind/meal-planner-service:latest .

# Build nutrition AI service
cd ../nutrition-ai-service
docker build -t macromind/nutrition-ai-service:latest .

# Build frontend
cd ../../frontend
docker build -t macromind/frontend:latest .
```

### 3. Create Secrets

```bash
# Create namespace
kubectl create namespace macromind

# Create secrets
kubectl create secret generic macromind-secrets \
  --from-literal=database-url='postgresql://macromind:SecurePass123@postgres:5432/macromind' \
  --from-literal=jwt-secret='your-super-secret-jwt-key-change-in-production' \
  --from-literal=openai-api-key='sk-your-openai-api-key-here' \
  -n macromind

# Verify secrets
kubectl get secrets -n macromind
```

### 4. Deploy with Helm

```bash
# From project root
helm install macromind ./helm/macromind -n macromind

# Watch pods come up
kubectl get pods -n macromind -w
```

### 5. Access Application

```bash
# Get Minikube IP
minikube ip

# Add to hosts file (Linux/Mac: /etc/hosts, Windows: C:\Windows\System32\drivers\etc\hosts)
# Replace <MINIKUBE_IP> with actual IP
echo "<MINIKUBE_IP> macromind.local" | sudo tee -a /etc/hosts

# Access application
open http://macromind.local
```

## Detailed Deployment Steps

### Option A: Kubernetes Manifests (Manual)

```bash
# Apply manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml  # Edit secrets first!
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for postgres to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n macromind --timeout=120s

# Deploy services
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/meal-planner-deployment.yaml
kubectl apply -f k8s/meal-planner-service.yaml
kubectl apply -f k8s/nutrition-ai-deployment.yaml
kubectl apply -f k8s/nutrition-ai-service.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Enable autoscaling
kubectl apply -f k8s/hpa-auth.yaml
kubectl apply -f k8s/hpa-meal-planner.yaml
```

### Option B: Helm Chart (Recommended)

```bash
# Install with default values
helm install macromind ./helm/macromind -n macromind --create-namespace

# Or with custom values
helm install macromind ./helm/macromind \
  -f helm/macromind/values-dev.yaml \
  --set image.tag=v1.0.0 \
  -n macromind
```

## Verification

### Check Pod Status

```bash
# All pods should be Running
kubectl get pods -n macromind

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# auth-service-xxx                    1/1     Running   0          2m
# auth-service-yyy                    1/1     Running   0          2m
# meal-planner-service-xxx            1/1     Running   0          2m
# meal-planner-service-yyy            1/1     Running   0          2m
# nutrition-ai-service-xxx            1/1     Running   0          2m
# nutrition-ai-service-yyy            1/1     Running   0          2m
# frontend-xxx                        1/1     Running   0          2m
# frontend-yyy                        1/1     Running   0          2m
# postgres-0                          1/1     Running   0          5m
```

### Check Services

```bash
kubectl get svc -n macromind

# Expected output:
# NAME                    TYPE        CLUSTER-IP       PORT(S)
# postgres                ClusterIP   10.96.x.x        5432/TCP
# auth-service            ClusterIP   10.96.x.x        8000/TCP
# meal-planner-service    ClusterIP   10.96.x.x        8001/TCP
# nutrition-ai-service    ClusterIP   10.96.x.x        8002/TCP
# frontend                ClusterIP   10.96.x.x        80/TCP
```

### Check Ingress

```bash
kubectl get ingress -n macromind

# Get ingress details
kubectl describe ingress macromind-ingress -n macromind
```

### Test Health Endpoints

```bash
# Test auth service
kubectl port-forward svc/auth-service 8000:8000 -n macromind
curl http://localhost:8000/health

# Test meal planner service
kubectl port-forward svc/meal-planner-service 8001:8001 -n macromind
curl http://localhost:8001/health

# Test nutrition AI service
kubectl port-forward svc/nutrition-ai-service 8002:8002 -n macromind
curl http://localhost:8002/health
```

### Check Logs

```bash
# View logs for specific pod
kubectl logs -f <pod-name> -n macromind

# View logs for all auth service pods
kubectl logs -l app=auth-service -n macromind --tail=50

# Stream logs
kubectl logs -f deployment/auth-service -n macromind
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n macromind

# Common issues:
# - Image pull errors: Verify images are built in Minikube's Docker
# - CrashLoopBackOff: Check logs and environment variables
# - Pending: Check resource availability
```

### Database Connection Issues

```bash
# Verify postgres is running
kubectl get pods -l app=postgres -n macromind

# Check postgres logs
kubectl logs postgres-0 -n macromind

# Test database connection
kubectl exec -it postgres-0 -n macromind -- psql -U macromind -d macromind

# Verify secrets
kubectl get secret macromind-secrets -n macromind -o yaml
```

### Ingress Not Working

```bash
# Verify ingress controller is running
kubectl get pods -n ingress-nginx

# If not enabled
minikube addons enable ingress

# Check ingress configuration
kubectl describe ingress macromind-ingress -n macromind

# Verify /etc/hosts entry
ping macromind.local
```

### Service Not Accessible

```bash
# Port forward to bypass ingress
kubectl port-forward svc/frontend 3000:80 -n macromind
open http://localhost:3000

# Check service endpoints
kubectl get endpoints -n macromind
```

## Updating Deployment

### Update Application

```bash
# Build new images
eval $(minikube docker-env)
docker build -t macromind/auth-service:v1.1.0 ./services/auth-service

# Update deployment
kubectl set image deployment/auth-service \
  auth-service=macromind/auth-service:v1.1.0 \
  -n macromind

# Or with Helm
helm upgrade macromind ./helm/macromind \
  --set auth.image.tag=v1.1.0 \
  -n macromind
```

### Update Configuration

```bash
# Edit configmap
kubectl edit configmap service-config -n macromind

# Restart pods to pick up changes
kubectl rollout restart deployment/auth-service -n macromind
```

### Update Secrets

```bash
# Delete and recreate secret
kubectl delete secret macromind-secrets -n macromind
kubectl create secret generic macromind-secrets \
  --from-literal=... \
  -n macromind

# Restart deployments
kubectl rollout restart deployment -n macromind
```

## Scaling

### Manual Scaling

```bash
# Scale up auth service
kubectl scale deployment auth-service --replicas=5 -n macromind

# Scale down
kubectl scale deployment auth-service --replicas=2 -n macromind
```

### Autoscaling (HPA)

```bash
# HPA is configured for auth and meal-planner services
kubectl get hpa -n macromind

# View autoscaling details
kubectl describe hpa auth-service-hpa -n macromind

# Generate load to test autoscaling
kubectl run -it --rm load-generator --image=busybox /bin/sh
# Inside pod:
while true; do wget -q -O- http://auth-service:8000/health; done
```

## Cleanup

### Uninstall Application

```bash
# With Helm
helm uninstall macromind -n macromind

# Or with kubectl
kubectl delete namespace macromind
```

### Stop Minikube

```bash
minikube stop
```

### Delete Minikube Cluster

```bash
minikube delete
```

## Production Considerations

### Cloud Deployment

For production cloud deployment (GCP, AWS, Azure):

1. Use managed Kubernetes (GKE, EKS, AKS)
2. Use managed PostgreSQL (Cloud SQL, RDS, Azure Database)
3. Use proper SSL certificates
4. Configure proper resource limits
5. Set up monitoring and alerting
6. Configure backup and disaster recovery
7. Use secrets management (Vault, Cloud Secret Manager)
8. Set up CI/CD pipeline
9. Enable network policies
10. Configure logging aggregation

### Security Hardening

- Enable RBAC
- Use Pod Security Policies
- Scan images for vulnerabilities
- Rotate secrets regularly
- Use network policies
- Enable audit logging
- Use private container registry
- Implement rate limiting
- Enable WAF at ingress

### Performance Optimization

- Use connection pooling
- Enable caching (Redis)
- Optimize database queries
- Use read replicas
- Configure proper resource requests/limits
- Enable cluster autoscaling
- Use CDN for static assets

