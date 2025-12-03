# MacroMind Monitoring & Observability

Production-grade monitoring stack for MacroMind on AWS EKS using Prometheus, Grafana, and Alertmanager.

## Overview

This monitoring stack provides:
- **Metrics Collection**: Prometheus scrapes metrics from all MacroMind services
- **Visualization**: Grafana dashboards for real-time monitoring
- **Alerting**: Alertmanager for critical alerts and notifications
- **Kubernetes Metrics**: Node and pod-level resource monitoring

## Components

### 1. Metrics Server
- Provides Kubernetes resource metrics (CPU, memory)
- Required for HPA (Horizontal Pod Autoscaler)
- Deployed in `kube-system` namespace

### 2. Prometheus
- Time-series database for metrics storage
- Scrapes metrics from:
  - Auth Service (port 8000)
  - Meal Planner Service (port 8001)
  - Nutrition AI Service (port 8002)
  - Frontend (port 80)
  - Kubernetes nodes and pods
- 30-day retention period
- Accessible via ClusterIP service

### 3. Grafana
- Visualization and dashboard platform
- Pre-configured dashboards:
  - MacroMind Overview
  - MacroMind Services
  - HPA Scaling Behavior
- Exposed via LoadBalancer (AWS ELB)
- Default credentials: `admin/admin` (CHANGE IN PRODUCTION!)

### 4. Alertmanager
- Handles alert routing and notifications
- Configured for critical and warning alerts
- Webhook-based notifications (email configurable)

## Deployment

### Prerequisites

- Kubernetes cluster (AWS EKS)
- `kubectl` configured
- Access to `monitoring` namespace

### Step 1: Create Namespace

```bash
kubectl apply -f monitoring/namespace.yaml
```

### Step 2: Deploy Metrics Server

```bash
kubectl apply -f monitoring/metrics-server.yaml
```

### Step 3: Deploy Prometheus

```bash
# Create RBAC
kubectl apply -f monitoring/prometheus-rbac.yaml

# Create ServiceAccount
kubectl apply -f monitoring/prometheus-serviceaccount.yaml

# Create ConfigMap
kubectl apply -f monitoring/prometheus-configmap.yaml

# Create Alert Rules
kubectl apply -f monitoring/prometheus-rules.yaml

# Deploy Prometheus
kubectl apply -f monitoring/prometheus-deployment.yaml
```

### Step 4: Deploy Alertmanager

```bash
# Create ConfigMap
kubectl apply -f monitoring/alertmanager-config.yaml

# Deploy Alertmanager
kubectl apply -f monitoring/alertmanager-deployment.yaml
```

### Step 5: Deploy Grafana

```bash
# Create Datasource Config
kubectl apply -f monitoring/grafana-datasource-config.yaml

# Create Dashboard Config
kubectl apply -f monitoring/grafana-dashboard-config.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana-deployment.yaml
```

### Step 6: Expose Grafana (Optional - Ingress)

```bash
kubectl apply -f monitoring/grafana-ingress.yaml
```

## Access

### Prometheus

```bash
# Port forward to access Prometheus UI
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Access at: http://localhost:9090
```

### Grafana

**Option 1: LoadBalancer (AWS)**

```bash
# Get LoadBalancer URL
kubectl get svc -n monitoring grafana

# Access via EXTERNAL-IP
# Default credentials: admin/admin
```

**Option 2: Ingress**

```bash
# Add to /etc/hosts (or DNS)
# grafana.macromind.local -> Ingress IP

# Access at: http://grafana.macromind.local
```

**Option 3: Port Forward**

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80

# Access at: http://localhost:3000
```

### Alertmanager

```bash
# Port forward to access Alertmanager UI
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# Access at: http://localhost:9093
```

## Dashboards

### MacroMind Overview
- API Request Rate
- API Error Rate
- API Latency (95th percentile)
- Pod CPU Usage
- Pod Memory Usage
- AI Request Volume

### MacroMind Services
- Auth Service metrics
- Meal Planner Service metrics
- Nutrition AI Service metrics
- Frontend metrics

### HPA Scaling Behavior
- Pod replica counts
- CPU usage vs HPA targets
- Scaling events

## Alerts

### Critical Alerts
- **PodCrashLooping**: Pod restarting repeatedly
- **HighAPIErrorRate**: Error rate > 5%
- **AIServiceDown**: Nutrition AI service unavailable
- **AuthServiceDown**: Auth service unavailable
- **MealPlannerServiceDown**: Meal Planner service unavailable
- **FrontendDown**: Frontend unavailable

### Warning Alerts
- **HighCPUUsage**: CPU usage > 90%
- **HighMemoryUsage**: Memory usage > 90%
- **HighRequestLatency**: 95th percentile latency > 1s

## Configuration

### Prometheus Scraping

Prometheus automatically discovers pods using Kubernetes service discovery. Services must have:
- Label: `app: <service-name>`
- Annotation: `prometheus.io/scrape: "true"` (optional)
- Metrics endpoint: `/metrics`

### Alertmanager Notifications

Edit `alertmanager-config.yaml` to configure:
- Email notifications (SMTP)
- Slack webhooks
- PagerDuty integration
- Custom webhook endpoints

### Grafana Dashboards

Dashboards are provisioned via ConfigMaps. To add custom dashboards:
1. Create dashboard JSON in Grafana UI
2. Export dashboard JSON
3. Add to `grafana-dashboard-config.yaml`
4. Apply ConfigMap

## Production Considerations

### 1. Persistent Storage

Replace `emptyDir` volumes with PersistentVolumeClaims:

```yaml
# prometheus-deployment.yaml
volumes:
- name: prometheus-storage
  persistentVolumeClaim:
    claimName: prometheus-pvc
```

### 2. Resource Limits

Adjust resource requests/limits based on cluster size:
- Prometheus: 2-4 CPU, 4-8Gi memory
- Grafana: 1-2 CPU, 1-2Gi memory
- Alertmanager: 200m CPU, 256Mi memory

### 3. High Availability

For production:
- Deploy Prometheus with 2+ replicas (requires Thanos)
- Deploy Grafana with 2+ replicas
- Use external storage (S3) for long-term retention

### 4. Security

- Change Grafana default password
- Enable TLS for Grafana ingress
- Use RBAC for Prometheus access
- Encrypt secrets at rest

### 5. Retention

Adjust Prometheus retention:
```yaml
# prometheus-deployment.yaml
args:
  - '--storage.tsdb.retention.time=90d'  # 90 days
```

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Navigate to: http://localhost:9090/targets

# Check service discovery
kubectl get pods -n macromind --show-labels
```

### Grafana Not Loading Dashboards

```bash
# Check ConfigMap
kubectl get configmap -n monitoring grafana-dashboards -o yaml

# Check Grafana logs
kubectl logs -n monitoring deployment/grafana
```

### Alerts Not Firing

```bash
# Check Prometheus rules
kubectl get configmap -n monitoring prometheus-rules -o yaml

# Check Alertmanager
kubectl logs -n monitoring deployment/alertmanager

# Test alert rule
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Navigate to: http://localhost:9090/alerts
```

## Metrics Endpoints

Ensure your services expose metrics at `/metrics`:

### FastAPI Example

```python
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'status', 'service'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['service'])

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

## Next Steps

1. ✅ Monitoring stack deployed
2. ⏭️ Add custom metrics to services
3. ⏭️ Configure alert notifications
4. ⏭️ Set up log aggregation (ELK/Loki)
5. ⏭️ Add distributed tracing (Jaeger)

## Support

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **Alertmanager Docs**: https://prometheus.io/docs/alerting/latest/alertmanager/

