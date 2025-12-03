# MacroMind Jenkins CI/CD Setup

Complete guide for setting up Jenkins CI/CD pipelines for MacroMind.

## Prerequisites

- Kubernetes cluster (Minikube or cloud)
- kubectl configured
- Helm 3 installed
- Docker registry accessible (local or remote)
- Git repository with webhook support (optional)

## Quick Start

### 1. Deploy Jenkins to Kubernetes

```bash
# Apply Jenkins manifests
kubectl apply -f jenkins/jenkins-pvc.yaml
kubectl apply -f jenkins/jenkins-serviceaccount.yaml
kubectl apply -f jenkins/jenkins-deployment.yaml
kubectl apply -f jenkins/jenkins-service.yaml

# Wait for Jenkins to be ready
kubectl wait --for=condition=ready pod -l app=jenkins --timeout=300s

# Get Jenkins admin password
kubectl exec -it deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword

# Access Jenkins
MINIKUBE_IP=$(minikube ip)
echo "Jenkins URL: http://${MINIKUBE_IP}:30080"
```

### 2. Initial Jenkins Setup

1. Open Jenkins URL: `http://<minikube-ip>:30080`
2. Enter admin password from step above
3. Install suggested plugins
4. Create admin user
5. Configure Jenkins URL

### 3. Install Required Plugins

Go to **Manage Jenkins → Plugins → Available** and install:

- **Pipeline** (usually pre-installed)
- **Docker Pipeline**
- **Kubernetes CLI**
- **Git**
- **GitHub** (if using GitHub)
- **Credentials Binding**
- **Timestamper**

### 4. Configure Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials**:

#### Docker Registry Credentials
- **Kind:** Username with password
- **ID:** `docker-credentials`
- **Username:** Your Docker registry username
- **Password:** Your Docker registry password/token

#### Docker Registry URL (Optional)
- **Kind:** Secret text
- **ID:** `docker-registry-url`
- **Secret:** Your Docker registry URL (e.g., `localhost:5000` or `docker.io`)

### 5. Create Pipeline Jobs

#### Root Pipeline (Monorepo)
1. **New Item** → **Pipeline** → Name: `macromind-root`
2. **Pipeline** → Definition: **Pipeline script from SCM**
3. **SCM:** Git
4. **Repository URL:** Your Git repository
5. **Script Path:** `Jenkinsfile`
6. **Save**

#### Service Pipelines
Create separate pipeline jobs for each service:

1. **New Item** → **Pipeline** → Name: `macromind-auth-service`
2. **Pipeline** → Definition: **Pipeline script from SCM**
3. **SCM:** Git
4. **Repository URL:** Your Git repository
5. **Script Path:** `services/auth-service/Jenkinsfile`
6. **Save**

Repeat for:
- `macromind-meal-planner-service` → `services/meal-planner-service/Jenkinsfile`
- `macromind-nutrition-ai-service` → `services/nutrition-ai-service/Jenkinsfile`
- `macromind-frontend` → `frontend/Jenkinsfile`

### 6. Configure Git Webhook (Optional)

#### GitHub
1. Go to repository → **Settings → Webhooks**
2. **Add webhook**
3. **Payload URL:** `http://<jenkins-ip>:30080/github-webhook/`
4. **Content type:** application/json
5. **Events:** Just the push event
6. **Save**

#### GitLab
1. Go to repository → **Settings → Webhooks**
2. **URL:** `http://<jenkins-ip>:30080/project/macromind-root`
3. **Trigger:** Push events
4. **Save**

## Pipeline Workflow

### Root Pipeline (Jenkinsfile)

1. **Checkout** - Clone repository
2. **Detect Changes** - Identify which services changed
3. **Trigger Service Pipelines** - Build only changed services

### Service Pipeline (per-service Jenkinsfile)

1. **Checkout** - Clone repository
2. **Unit Tests** - Run pytest (Python) or npm test (Frontend)
3. **Build Docker Image** - Build with commit SHA tag
4. **Push Image** - Push to Docker registry
5. **Deploy to Kubernetes** - Helm upgrade
6. **Smoke Test** - Verify health endpoint
7. **Rollback** - Automatic rollback on failure

## Manual Trigger

### Trigger Root Pipeline
```bash
# Build all services
curl -X POST http://<jenkins-ip>:30080/job/macromind-root/build \
  --user admin:password
```

### Trigger Specific Service
```bash
# Build auth service only
curl -X POST http://<jenkins-ip>:30080/job/macromind-auth-service/build \
  --user admin:password
```

## Pipeline Parameters

Each service pipeline accepts:
- `GIT_COMMIT` - Full commit SHA
- `GIT_COMMIT_SHORT` - Short commit SHA (for image tag)
- `GIT_BRANCH` - Branch name

## Environment Variables

Pipelines use these environment variables:

- `DOCKER_REGISTRY` - Docker registry URL (from credentials)
- `DOCKER_CREDENTIALS` - Docker credentials ID
- `K8S_NAMESPACE` - Kubernetes namespace (default: macromind)
- `HELM_CHART_PATH` - Path to Helm chart (default: helm/macromind)

## Image Tagging Strategy

Images are tagged with:
- **Commit SHA:** `macromind/auth-service:abc1234`
- **Latest:** `macromind/auth-service:latest`

## Deployment Strategy

### Helm Upgrade
```bash
helm upgrade --install macromind helm/macromind \
  --set authService.image.tag=abc1234 \
  --wait --timeout 5m
```

### Automatic Rollback
On deployment failure:
```bash
helm rollback macromind -n macromind
```

## Smoke Tests

Each service pipeline includes smoke tests:

- **Backend Services:** `curl http://localhost:8000/health`
- **Frontend:** `curl http://localhost/`

Tests retry up to 5 times with 10-second intervals.

## Troubleshooting

### Jenkins Pod Not Starting

```bash
# Check pod status
kubectl get pods -l app=jenkins

# View logs
kubectl logs -l app=jenkins

# Check PVC
kubectl get pvc jenkins-pvc
```

### Pipeline Fails at Docker Build

```bash
# Verify Docker socket is mounted
kubectl exec -it deployment/jenkins -- ls -la /var/run/docker.sock

# Check Docker credentials
# Go to Jenkins → Credentials → Verify docker-credentials exists
```

### Pipeline Fails at Helm Deploy

```bash
# Verify kubectl access
kubectl exec -it deployment/jenkins -- kubectl get pods -n macromind

# Check Helm is installed in Jenkins pod
kubectl exec -it deployment/jenkins -- helm version

# Verify service account permissions
kubectl describe clusterrolebinding jenkins-cluster-role-binding
```

### Tests Fail

```bash
# Run tests manually in Jenkins pod
kubectl exec -it deployment/jenkins -- bash
cd /var/jenkins_home/workspace/macromind-auth-service
# Run test commands
```

### Image Push Fails

```bash
# Verify Docker registry credentials
# Check credentials in Jenkins UI

# Test registry connection
kubectl exec -it deployment/jenkins -- docker login <registry-url>
```

## Best Practices

### Security
- ✅ Use Jenkins credentials store (never hardcode secrets)
- ✅ Rotate credentials regularly
- ✅ Use RBAC for Kubernetes access
- ✅ Limit Jenkins service account permissions
- ✅ Use secrets management for sensitive data

### Performance
- ✅ Build only changed services (root pipeline)
- ✅ Use Docker layer caching
- ✅ Parallel pipeline execution where possible
- ✅ Clean workspace after builds
- ✅ Limit build history (logRotator)

### Reliability
- ✅ Automatic rollback on failure
- ✅ Retry logic for smoke tests
- ✅ Health checks before deployment
- ✅ Wait for pods to be ready
- ✅ Timeout configurations

## Monitoring

### View Build History
- Go to Jenkins → Job → **Build History**

### View Build Logs
- Click on build number → **Console Output**

### View Pipeline Stages
- Click on build number → **Pipeline Steps**

## Cleanup

```bash
# Delete Jenkins deployment
kubectl delete -f jenkins/

# Delete Jenkins data (WARNING: Deletes all Jenkins data)
kubectl delete pvc jenkins-pvc
```

## Next Steps

1. Set up webhook for automatic builds
2. Configure build notifications (email, Slack)
3. Set up build badges
4. Configure branch protection
5. Add integration tests
6. Set up staging environment

## Support

- Jenkins logs: `kubectl logs -f deployment/jenkins`
- Pipeline logs: View in Jenkins UI
- Kubernetes events: `kubectl get events -n macromind`
