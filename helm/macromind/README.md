# MacroMind Helm Chart

Helm chart for deploying MacroMind to Kubernetes.

## Prerequisites

- Kubernetes cluster (Minikube or cloud)
- Helm 3.x installed
- Nginx Ingress Controller enabled
- Docker images built and available

## Installation

### Quick Start

```bash
# 1. Build Docker images (in Minikube)
eval $(minikube docker-env)
docker build -t macromind/auth-service:latest ./services/auth-service
docker build -t macromind/meal-planner-service:latest ./services/meal-planner-service
docker build -t macromind/nutrition-ai-service:latest ./services/nutrition-ai-service
docker build -t macromind/frontend:latest ./frontend

# 2. Install with default values
helm install macromind ./helm/macromind \
  --set secrets.postgresPassword=your-secure-password \
  --set secrets.jwtSecretKey=your-long-random-secret-key \
  --set secrets.openaiApiKey=sk-your-openai-key \
  -n macromind --create-namespace

# 3. Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n macromind --timeout=300s

# 4. Access application
# Add to /etc/hosts: <MINIKUBE_IP> macromind.local
open http://macromind.local
```

### Development Installation

```bash
# Install with development values (fewer replicas, no HPA)
helm install macromind ./helm/macromind \
  -f helm/macromind/values-dev.yaml \
  --set secrets.postgresPassword=dev-password \
  --set secrets.jwtSecretKey=dev-secret-key \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind --create-namespace
```

## Configuration

### Values File

Edit `values.yaml` or override with `--set`:

```bash
helm install macromind ./helm/macromind \
  --set authService.replicas=3 \
  --set frontend.replicas=3 \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind
```

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `authService.replicas` | Auth service replica count | 2 |
| `mealPlannerService.replicas` | Meal planner replica count | 2 |
| `nutritionAIService.replicas` | AI service replica count | 2 |
| `frontend.replicas` | Frontend replica count | 2 |
| `postgres.persistence.size` | Database storage size | 10Gi |
| `ingress.hosts[0].host` | Ingress hostname | macromind.local |
| `secrets.postgresPassword` | Database password | CHANGE_THIS_PASSWORD |
| `secrets.jwtSecretKey` | JWT signing key | CHANGE_THIS |
| `secrets.openaiApiKey` | OpenAI API key | sk-YOUR_KEY |

## Upgrading

```bash
# Upgrade with new values
helm upgrade macromind ./helm/macromind \
  --set secrets.openaiApiKey=sk-new-key \
  -n macromind

# Upgrade with values file
helm upgrade macromind ./helm/macromind \
  -f helm/macromind/values-dev.yaml \
  -n macromind
```

## Uninstallation

```bash
# Uninstall chart
helm uninstall macromind -n macromind

# Delete namespace (removes all resources)
kubectl delete namespace macromind
```

## Chart Structure

```
helm/macromind/
├── Chart.yaml                          # Chart metadata
├── values.yaml                         # Default values
├── values-dev.yaml                     # Development overrides
└── templates/
    ├── _helpers.tpl                    # Template helpers
    ├── namespace.yaml                  # Namespace
    ├── configmap.yaml                  # ConfigMap
    ├── secrets.yaml                    # Secrets
    ├── postgres-pvc.yaml               # PostgreSQL PVC
    ├── postgres-statefulset.yaml       # PostgreSQL StatefulSet
    ├── postgres-service.yaml           # PostgreSQL Service
    ├── deployments/
    │   ├── auth-deployment.yaml
    │   ├── meal-planner-deployment.yaml
    │   ├── nutrition-ai-deployment.yaml
    │   └── frontend-deployment.yaml
    ├── services/
    │   ├── auth-service.yaml
    │   ├── meal-planner-service.yaml
    │   ├── nutrition-ai-service.yaml
    │   └── frontend-service.yaml
    ├── ingress.yaml                    # Ingress
    └── hpa.yaml                        # Horizontal Pod Autoscalers
```

## Features

### Automatic Scaling

HPA is enabled for:
- **auth-service:** 2-5 replicas based on CPU (70%) and Memory (80%)
- **meal-planner-service:** 2-5 replicas based on CPU (70%) and Memory (80%)

### Health Checks

All services include:
- **Liveness probes:** Restart unhealthy pods
- **Readiness probes:** Only route traffic to ready pods

### Persistent Storage

PostgreSQL uses a PersistentVolumeClaim (10Gi) that survives pod restarts.

### Ingress Routing

All traffic routes through Nginx Ingress:
- `/` → frontend
- `/api/auth/*` → auth-service
- `/api/meals/*` → meal-planner-service
- `/api/ai/*` → nutrition-ai-service

## Troubleshooting

### View Chart Values

```bash
# Show computed values
helm get values macromind -n macromind

# Show all possible values
helm show values ./helm/macromind
```

### Check Release Status

```bash
# List releases
helm list -n macromind

# Get release status
helm status macromind -n macromind

# View release history
helm history macromind -n macromind
```

### Debug Template Rendering

```bash
# Dry-run to see rendered templates
helm install macromind ./helm/macromind \
  --dry-run --debug \
  --set secrets.openaiApiKey=sk-test \
  -n macromind

# Template specific file
helm template macromind ./helm/macromind \
  --show-only templates/deployments/auth-deployment.yaml
```

## Production Recommendations

1. **Secrets Management:**
   - Use external secrets manager (Vault, AWS Secrets Manager)
   - Don't commit secrets to Git
   - Rotate secrets regularly

2. **Resource Limits:**
   - Adjust based on actual usage
   - Monitor with Prometheus/Grafana
   - Set appropriate requests/limits

3. **High Availability:**
   - Use multiple replicas (already configured)
   - Enable pod disruption budgets
   - Use anti-affinity rules

4. **Security:**
   - Enable network policies
   - Use RBAC for service accounts
   - Scan images for vulnerabilities
   - Enable Pod Security Standards

5. **Monitoring:**
   - Set up Prometheus metrics
   - Configure alerting
   - Monitor HPA behavior
   - Track resource usage

## Examples

### Install with Custom Image Registry

```bash
helm install macromind ./helm/macromind \
  --set imageRegistry=your-registry.com \
  --set authService.image.repository=your-registry.com/macromind/auth-service \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind
```

### Install with Resource Overrides

```bash
helm install macromind ./helm/macromind \
  --set authService.resources.limits.memory=1Gi \
  --set authService.resources.limits.cpu=1000m \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind
```

### Install with Disabled Components

```bash
helm install macromind ./helm/macromind \
  --set nutritionAIService.enabled=false \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind
```

