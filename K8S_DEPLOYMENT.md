# MacroMind Kubernetes Deployment Guide

Complete guide for deploying MacroMind to Kubernetes (Minikube) using raw manifests or Helm charts.

## Prerequisites

- **Minikube** 1.32+ ([Install Minikube](https://minikube.sigs.k8s.io/docs/start/))
- **kubectl** 1.28+ ([Install kubectl](https://kubernetes.io/docs/tasks/tools/))
- **Helm** 3.13+ ([Install Helm](https://helm.sh/docs/intro/install/))
- **Docker** (for building images)

## Quick Start (5 minutes)

### Option A: Using Helm (Recommended)

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192
minikube addons enable ingress

# 2. Build images in Minikube
eval $(minikube docker-env)
docker build -t macromind/auth-service:latest ./services/auth-service
docker build -t macromind/meal-planner-service:latest ./services/meal-planner-service
docker build -t macromind/nutrition-ai-service:latest ./services/nutrition-ai-service
docker build -t macromind/frontend:latest ./frontend

# 3. Install with Helm
helm install macromind ./helm/macromind \
  --set secrets.postgresPassword=SecurePass123! \
  --set secrets.jwtSecretKey=$(openssl rand -hex 32) \
  --set secrets.openaiApiKey=sk-your-openai-key \
  -n macromind --create-namespace

# 4. Wait for pods
kubectl wait --for=condition=ready pod --all -n macromind --timeout=300s

# 5. Access application
MINIKUBE_IP=$(minikube ip)
echo "$MINIKUBE_IP macromind.local" | sudo tee -a /etc/hosts
open http://macromind.local
```

### Option B: Using Raw Manifests

```bash
# 1. Start Minikube (same as above)
minikube start --cpus=4 --memory=8192
minikube addons enable ingress

# 2. Build images (same as above)
eval $(minikube docker-env)
# ... build images ...

# 3. Create secrets
kubectl create namespace macromind
kubectl create secret generic macromind-secrets \
  --from-literal=postgres-user=macromind \
  --from-literal=postgres-password=SecurePass123! \
  --from-literal=database-url=postgresql://macromind:SecurePass123!@postgres:5432/macromind \
  --from-literal=jwt-secret-key=$(openssl rand -hex 32) \
  --from-literal=openai-api-key=sk-your-openai-key \
  -n macromind

# 4. Apply manifests
kubectl apply -f k8s/

# 5. Wait and access (same as above)
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Kubernetes Cluster (Minikube)           │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Nginx Ingress Controller              │  │
│  │         (macromind.local)                      │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                               │
│        ┌─────────────┼─────────────┐                │
│        │             │             │                │
│  ┌─────▼─────┐  ┌───▼────┐  ┌────▼─────┐         │
│  │ Frontend  │  │  Auth  │  │   Meal   │         │
│  │  (2 pods) │  │ (2-5)  │  │ Planner  │         │
│  └───────────┘  └────────┘  │  (2-5)    │         │
│                              └──────────┘         │
│        ┌─────────────┐                            │
│        │ Nutrition   │                            │
│        │ AI (2 pods) │                            │
│        └──────┬──────┘                            │
│               │                                    │
│        ┌──────▼──────┐                            │
│        │ PostgreSQL  │                            │
│        │ (StatefulSet)│                            │
│        │  (PVC: 10Gi) │                            │
│        └─────────────┘                            │
└─────────────────────────────────────────────────────┘
```

## Deployment Methods

### Method 1: Helm Chart (Recommended)

**Advantages:**
- Parameterized configuration
- Easy upgrades and rollbacks
- Environment-specific values
- Template-based (DRY principle)

**Usage:**
```bash
# Install
helm install macromind ./helm/macromind \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind --create-namespace

# Upgrade
helm upgrade macromind ./helm/macromind \
  --set authService.replicas=3 \
  -n macromind

# Uninstall
helm uninstall macromind -n macromind
```

### Method 2: Raw Manifests

**Advantages:**
- Full control over resources
- No Helm dependency
- Easy to understand
- Direct kubectl apply

**Usage:**
```bash
# Apply all
kubectl apply -f k8s/

# Apply specific resource
kubectl apply -f k8s/auth-deployment.yaml

# Delete all
kubectl delete -f k8s/
```

## Resource Configuration

### Pod Resources

| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|-------------|----------------|-----------|--------------|
| postgres | 250m | 256Mi | 1000m | 1Gi |
| auth-service | 100m | 128Mi | 500m | 512Mi |
| meal-planner-service | 100m | 128Mi | 500m | 512Mi |
| nutrition-ai-service | 100m | 128Mi | 500m | 512Mi |
| frontend | 50m | 64Mi | 200m | 256Mi |

### Replica Counts

| Service | Production | Development |
|---------|------------|-------------|
| postgres | 1 | 1 |
| auth-service | 2 (HPA: 2-5) | 1 |
| meal-planner-service | 2 (HPA: 2-5) | 1 |
| nutrition-ai-service | 2 | 1 |
| frontend | 2 | 1 |

## Health Checks

All services include comprehensive health checks:

### Liveness Probes
- **Purpose:** Restart unhealthy pods
- **Backend:** HTTP GET `/health` (30s initial delay)
- **Frontend:** HTTP GET `/` (10s initial delay)
- **Postgres:** `pg_isready` command (30s initial delay)

### Readiness Probes
- **Purpose:** Only route traffic to ready pods
- **Backend:** HTTP GET `/health` (10s initial delay)
- **Frontend:** HTTP GET `/` (5s initial delay)
- **Postgres:** `pg_isready` command (10s initial delay)

## Horizontal Pod Autoscaling

HPA is configured for high-traffic services:

### Auth Service HPA
- **Min Replicas:** 2
- **Max Replicas:** 5
- **CPU Target:** 70%
- **Memory Target:** 80%
- **Scale Up:** Aggressive (100% or +2 pods per 15s)
- **Scale Down:** Conservative (50% per 60s, 5min stabilization)

### Meal Planner Service HPA
- Same configuration as auth-service

## Ingress Configuration

### Routing Rules

```
macromind.local/              → frontend:80
macromind.local/api/auth/*    → auth-service:8000
macromind.local/api/meals/*   → meal-planner-service:8001
macromind.local/api/ai/*      → nutrition-ai-service:8002
```

### Setup Steps

1. **Enable Ingress in Minikube:**
   ```bash
   minikube addons enable ingress
   ```

2. **Add to /etc/hosts:**
   ```bash
   MINIKUBE_IP=$(minikube ip)
   echo "$MINIKUBE_IP macromind.local" | sudo tee -a /etc/hosts
   ```

3. **Verify Ingress:**
   ```bash
   kubectl get ingress -n macromind
   kubectl describe ingress macromind-ingress -n macromind
   ```

## Secrets Management

### Creating Secrets

**Option 1: kubectl create**
```bash
kubectl create secret generic macromind-secrets \
  --from-literal=postgres-password=SecurePass123! \
  --from-literal=jwt-secret-key=$(openssl rand -hex 32) \
  --from-literal=openai-api-key=sk-your-key \
  -n macromind
```

**Option 2: Helm --set**
```bash
helm install macromind ./helm/macromind \
  --set secrets.postgresPassword=SecurePass123! \
  --set secrets.jwtSecretKey=$(openssl rand -hex 32) \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind
```

**Option 3: Helm values file**
```yaml
# secrets.yaml (DO NOT COMMIT)
secrets:
  postgresPassword: "SecurePass123!"
  jwtSecretKey: "your-long-random-secret"
  openaiApiKey: "sk-your-key"
```

```bash
helm install macromind ./helm/macromind \
  -f secrets.yaml \
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
# meal-planner-service-xxx            1/1     Running   0          2m
# nutrition-ai-service-xxx            1/1     Running   0          2m
# frontend-xxx                        1/1     Running   0          2m
# postgres-0                          1/1     Running   0          5m
```

### Check Services

```bash
kubectl get svc -n macromind

# All should be ClusterIP type
```

### Check Ingress

```bash
kubectl get ingress -n macromind
kubectl describe ingress macromind-ingress -n macromind
```

### Check HPA

```bash
kubectl get hpa -n macromind
kubectl describe hpa auth-service-hpa -n macromind
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n macromind

# Check logs
kubectl logs <pod-name> -n macromind

# Common issues:
# - ImagePullBackOff: Build images in Minikube's Docker
# - CrashLoopBackOff: Check logs and environment variables
# - Pending: Check resource availability
```

### Ingress Not Working

```bash
# Verify ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress macromind-ingress -n macromind

# Test ingress
curl -H "Host: macromind.local" http://$(minikube ip)
```

### Database Connection Issues

```bash
# Check postgres pod
kubectl get pods -l app=postgres -n macromind

# View postgres logs
kubectl logs postgres-0 -n macromind

# Test connection
kubectl exec -it postgres-0 -n macromind -- psql -U macromind -d macromind
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa auth-service-hpa -n macromind

# Check metrics server
kubectl top pods -n macromind

# Verify metrics-server is installed
kubectl get deployment metrics-server -n kube-system
```

## Upgrading

### Using Helm

```bash
# Upgrade with new values
helm upgrade macromind ./helm/macromind \
  --set authService.image.tag=v1.1.0 \
  --set secrets.openaiApiKey=sk-new-key \
  -n macromind

# Rollback if needed
helm rollback macromind -n macromind
```

### Using Raw Manifests

```bash
# Update deployment
kubectl set image deployment/auth-service \
  auth-service=macromind/auth-service:v1.1.0 \
  -n macromind

# Check rollout status
kubectl rollout status deployment/auth-service -n macromind

# Rollback if needed
kubectl rollout undo deployment/auth-service -n macromind
```

## Cleanup

### Using Helm

```bash
# Uninstall chart
helm uninstall macromind -n macromind

# Delete namespace (removes everything)
kubectl delete namespace macromind
```

### Using Raw Manifests

```bash
# Delete all resources
kubectl delete -f k8s/

# Delete namespace
kubectl delete namespace macromind
```

## Production Considerations

### Security

- [ ] Use external secrets manager (Vault, AWS Secrets Manager)
- [ ] Enable RBAC for service accounts
- [ ] Configure network policies
- [ ] Scan images for vulnerabilities
- [ ] Enable Pod Security Standards
- [ ] Use TLS/SSL certificates

### High Availability

- [ ] Use multiple availability zones
- [ ] Configure pod disruption budgets
- [ ] Set up anti-affinity rules
- [ ] Use persistent volumes with replication

### Monitoring

- [ ] Install Prometheus and Grafana
- [ ] Set up alerting rules
- [ ] Monitor HPA behavior
- [ ] Track resource usage
- [ ] Set up log aggregation

### Backup

- [ ] Configure database backups
- [ ] Backup persistent volumes
- [ ] Test restore procedures
- [ ] Document disaster recovery

## Next Steps

After successful deployment:
1. Register a user at http://macromind.local/auth
2. Generate a meal plan
3. Chat with AI coach
4. Monitor resource usage
5. Test autoscaling under load

## Support

- Check pod logs: `kubectl logs -f <pod-name> -n macromind`
- View events: `kubectl get events -n macromind --sort-by='.lastTimestamp'`
- Describe resources: `kubectl describe <resource> <name> -n macromind`

