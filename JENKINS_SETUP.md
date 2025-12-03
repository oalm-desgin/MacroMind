# MacroMind Jenkins CI/CD Setup Guide

Complete guide for setting up and using Jenkins CI/CD pipelines for MacroMind.

## Overview

MacroMind uses Jenkins for continuous integration and deployment with:
- **Root Pipeline:** Detects changes and triggers service pipelines
- **Service Pipelines:** Build, test, and deploy individual services
- **Automated Testing:** Unit tests before deployment
- **Docker Builds:** Images tagged with git commit SHA
- **Kubernetes Deployment:** Helm-based deployment
- **Smoke Tests:** Health check verification
- **Automatic Rollback:** On deployment failure

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Git Repository                         │
│              (GitHub/GitLab)                        │
└───────────────────┬─────────────────────────────────┘
                    │ Webhook
                    ↓
┌─────────────────────────────────────────────────────┐
│              Jenkins (Kubernetes)                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Root Pipeline (Jenkinsfile)          │  │
│  │  - Detect changes                             │  │
│  │  - Trigger service pipelines                  │  │
│  └───────┬──────────┬──────────┬────────────────┘  │
│          │          │          │                    │
│  ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐ ┌────────┐ │
│  │  Auth    │ │  Meal   │ │   AI    │ │Frontend│ │
│  │ Service  │ │ Planner │ │ Service │ │        │ │
│  │Pipeline  │ │Pipeline │ │Pipeline │ │Pipeline│ │
│  └──────┬───┘ └────┬────┘ └───┬─────┘ └───┬────┘ │
│         │          │          │            │      │
│         └──────────┼──────────┼────────────┘      │
│                    │          │                    │
│         ┌───────────▼──────────▼────────────┐      │
│         │  1. Checkout                      │      │
│         │  2. Unit Tests                    │      │
│         │  3. Build Docker Image             │      │
│         │  4. Push to Registry              │      │
│         │  5. Deploy via Helm               │      │
│         │  6. Smoke Test                    │      │
│         │  7. Rollback on Failure           │      │
│         └──────────────────────────────────┘      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│         Kubernetes Cluster                          │
│         (MacroMind Namespace)                        │
│                                                      │
│  - auth-service (updated)                            │
│  - meal-planner-service (updated)                    │
│  - nutrition-ai-service (updated)                    │
│  - frontend (updated)                                │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- Kubernetes cluster (Minikube or cloud)
- kubectl configured
- Helm 3 installed
- Docker registry (local or remote)
- Git repository
- Jenkins plugins installed

## Installation Steps

### Step 1: Deploy Jenkins

```bash
# Apply Jenkins manifests
kubectl apply -f jenkins/jenkins-pvc.yaml
kubectl apply -f jenkins/jenkins-serviceaccount.yaml
kubectl apply -f jenkins/jenkins-deployment.yaml
kubectl apply -f jenkins/jenkins-service.yaml

# Wait for Jenkins to be ready
kubectl wait --for=condition=ready pod -l app=jenkins --timeout=300s

# Get admin password
kubectl exec -it deployment/jenkins -- \
  cat /var/jenkins_home/secrets/initialAdminPassword

# Access Jenkins
MINIKUBE_IP=$(minikube ip)
echo "Jenkins URL: http://${MINIKUBE_IP}:30080"
```

### Step 2: Initial Jenkins Configuration

1. **Access Jenkins:** Open `http://<minikube-ip>:30080`
2. **Unlock:** Enter admin password
3. **Install Plugins:** Install suggested plugins
4. **Create Admin:** Set up admin user
5. **Configure URL:** Set Jenkins URL

### Step 3: Install Required Plugins

Go to **Manage Jenkins → Plugins → Available**:

- ✅ **Pipeline**
- ✅ **Docker Pipeline**
- ✅ **Kubernetes CLI**
- ✅ **Git**
- ✅ **GitHub** (if using GitHub)
- ✅ **Credentials Binding**
- ✅ **Timestamper**

### Step 4: Configure Credentials

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**

#### Docker Registry Credentials
- **Kind:** Username with password
- **ID:** `docker-credentials`
- **Username:** Docker registry username
- **Password:** Docker registry password/token
- **Description:** Docker registry credentials

#### Docker Registry URL (Optional)
- **Kind:** Secret text
- **ID:** `docker-registry-url`
- **Secret:** Docker registry URL (e.g., `localhost:5000`, `docker.io`)
- **Description:** Docker registry URL

### Step 5: Create Pipeline Jobs

#### Root Pipeline

1. **New Item** → **Pipeline**
2. **Name:** `macromind-root`
3. **Pipeline** → **Definition:** Pipeline script from SCM
4. **SCM:** Git
5. **Repository URL:** Your Git repository URL
6. **Credentials:** Add if private repo
7. **Branch:** `*/main` or `*/master`
8. **Script Path:** `Jenkinsfile`
9. **Save**

#### Service Pipelines

Create 4 separate pipeline jobs:

**Auth Service:**
- **Name:** `macromind-auth-service`
- **Script Path:** `services/auth-service/Jenkinsfile`

**Meal Planner Service:**
- **Name:** `macromind-meal-planner-service`
- **Script Path:** `services/meal-planner-service/Jenkinsfile`

**Nutrition AI Service:**
- **Name:** `macromind-nutrition-ai-service`
- **Script Path:** `services/nutrition-ai-service/Jenkinsfile`

**Frontend:**
- **Name:** `macromind-frontend`
- **Script Path:** `frontend/Jenkinsfile`

### Step 6: Configure Git Webhook (Optional)

#### GitHub

1. Repository → **Settings → Webhooks → Add webhook**
2. **Payload URL:** `http://<jenkins-ip>:30080/github-webhook/`
3. **Content type:** `application/json`
4. **Events:** Just the `push` event
5. **Active:** ✅
6. **Add webhook**

#### GitLab

1. Repository → **Settings → Webhooks**
2. **URL:** `http://<jenkins-ip>:30080/project/macromind-root`
3. **Trigger:** Push events
4. **Add webhook**

## Pipeline Workflow

### Root Pipeline Flow

```
1. Checkout repository
   ↓
2. Detect changed files
   ↓
3. Determine which services changed
   ↓
4. Trigger service pipelines (only changed services)
   ↓
5. Wait for all pipelines to complete
```

### Service Pipeline Flow

```
1. Checkout repository
   ↓
2. Run unit tests (pytest / npm test)
   ↓
3. Build Docker image (tagged with commit SHA)
   ↓
4. Push image to registry
   ↓
5. Deploy to Kubernetes (Helm upgrade)
   ↓
6. Wait for pods to be ready
   ↓
7. Run smoke test (health endpoint)
   ↓
8. Success ✅ or Rollback ❌
```

## Usage

### Automatic Build (Webhook)

When you push to Git:
1. Webhook triggers root pipeline
2. Root pipeline detects changes
3. Only changed service pipelines run
4. Services deploy automatically

### Manual Build

#### Build All Services
```bash
# Trigger root pipeline
curl -X POST http://<jenkins-ip>:30080/job/macromind-root/build \
  --user admin:password
```

#### Build Specific Service
```bash
# Trigger auth service pipeline
curl -X POST http://<jenkins-ip>:30080/job/macromind-auth-service/build \
  --user admin:password
```

#### Build from Jenkins UI
1. Go to Jenkins dashboard
2. Click on pipeline job
3. Click **Build Now**

### Build with Parameters

Each service pipeline accepts:
- `GIT_COMMIT` - Full commit SHA
- `GIT_COMMIT_SHORT` - Short commit SHA
- `GIT_BRANCH` - Branch name

## Image Tagging

Images are tagged with:
- **Commit SHA:** `macromind/auth-service:abc1234`
- **Latest:** `macromind/auth-service:latest`

Example:
```bash
macromind/auth-service:abc1234  # Specific commit
macromind/auth-service:latest    # Latest build
```

## Deployment Process

### Helm Deployment

Each pipeline runs:
```bash
helm upgrade --install macromind helm/macromind \
  --namespace macromind \
  --set authService.image.tag=abc1234 \
  --wait --timeout 5m
```

### Automatic Rollback

On deployment failure:
```bash
helm rollback macromind -n macromind
```

## Smoke Tests

Each service includes smoke tests:

**Backend Services:**
```bash
kubectl port-forward svc/auth-service 8000:8000
curl http://localhost:8000/health
```

**Frontend:**
```bash
kubectl port-forward svc/frontend 80:80
curl http://localhost/
```

Tests retry up to 5 times with 10-second intervals.

## Monitoring

### View Build Status

**Jenkins Dashboard:**
- Green ✅ = Success
- Red ❌ = Failed
- Blue 🔵 = In Progress

### View Build Logs

1. Click on pipeline job
2. Click on build number
3. Click **Console Output**

### View Pipeline Stages

1. Click on build number
2. Click **Pipeline Steps**
3. See each stage status

## Troubleshooting

### Jenkins Pod Not Starting

```bash
# Check pod status
kubectl get pods -l app=jenkins

# View logs
kubectl logs -f deployment/jenkins

# Check events
kubectl describe pod -l app=jenkins
```

### Pipeline Fails at Checkout

- Verify Git repository URL is correct
- Check credentials if private repository
- Verify branch name exists

### Pipeline Fails at Tests

```bash
# Run tests manually
kubectl exec -it deployment/jenkins -- bash
cd /var/jenkins_home/workspace/macromind-auth-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest tests/
```

### Pipeline Fails at Docker Build

```bash
# Verify Docker socket
kubectl exec -it deployment/jenkins -- ls -la /var/run/docker.sock

# Check Docker credentials in Jenkins UI
# Manage Jenkins → Credentials → Verify docker-credentials
```

### Pipeline Fails at Helm Deploy

```bash
# Verify kubectl access
kubectl exec -it deployment/jenkins -- kubectl get pods -n macromind

# Check Helm is installed
kubectl exec -it deployment/jenkins -- helm version

# Verify service account permissions
kubectl describe clusterrolebinding jenkins-cluster-role-binding
```

### Smoke Test Fails

```bash
# Check pod status
kubectl get pods -n macromind

# Check service endpoints
kubectl get endpoints -n macromind

# Test health endpoint manually
kubectl port-forward svc/auth-service 8000:8000 -n macromind
curl http://localhost:8000/health
```

## Best Practices

### Security
- ✅ Use Jenkins credentials store
- ✅ Never hardcode secrets
- ✅ Rotate credentials regularly
- ✅ Use RBAC for Kubernetes
- ✅ Limit service account permissions

### Performance
- ✅ Build only changed services
- ✅ Use Docker layer caching
- ✅ Parallel execution where possible
- ✅ Clean workspace after builds
- ✅ Limit build history

### Reliability
- ✅ Automatic rollback on failure
- ✅ Retry logic for smoke tests
- ✅ Health checks before deployment
- ✅ Wait for pods to be ready
- ✅ Timeout configurations

## Advanced Configuration

### Custom Image Registry

Edit pipeline environment:
```groovy
environment {
    DOCKER_REGISTRY = 'your-registry.com'
}
```

### Custom Kubernetes Namespace

Edit pipeline environment:
```groovy
environment {
    K8S_NAMESPACE = 'macromind-staging'
}
```

### Build Notifications

Add to post section:
```groovy
post {
    success {
        emailext(
            subject: "✅ Build Success: ${env.JOB_NAME}",
            body: "Build ${env.BUILD_NUMBER} succeeded!",
            to: "team@example.com"
        )
    }
}
```

## Cleanup

```bash
# Delete Jenkins deployment
kubectl delete -f jenkins/

# Delete Jenkins data (WARNING: Deletes all data)
kubectl delete pvc jenkins-pvc
```

## Next Steps

1. ✅ Set up webhook for automatic builds
2. ✅ Configure build notifications
3. ✅ Add integration tests
4. ✅ Set up staging environment
5. ✅ Configure branch protection
6. ✅ Add build badges to README

## Support

- **Jenkins Logs:** `kubectl logs -f deployment/jenkins`
- **Pipeline Logs:** View in Jenkins UI
- **Kubernetes Events:** `kubectl get events -n macromind`
- **Build History:** View in Jenkins dashboard

