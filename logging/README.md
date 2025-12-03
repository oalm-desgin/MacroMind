# MacroMind Centralized Logging with Loki

Production-grade centralized logging solution using Loki + Promtail for MacroMind services.

## Overview

Loki is a horizontally-scalable, highly-available log aggregation system inspired by Prometheus. Promtail is the agent that ships logs from Kubernetes pods to Loki.

## Architecture

```
Kubernetes Pods → Promtail (DaemonSet) → Loki → Grafana
```

- **Promtail**: Runs as DaemonSet on each node, collects logs from pods
- **Loki**: Stores and indexes logs
- **Grafana**: Visualizes logs with Loki datasource

## Components

### 1. Loki
- Log storage and indexing
- 30-day retention (configurable)
- ClusterIP service on port 3100

### 2. Promtail
- Log collection agent
- Runs as DaemonSet (one per node)
- Collects logs from:
  - auth-service
  - meal-planner-service
  - nutrition-ai-service
  - frontend

### 3. Grafana Integration
- Loki datasource automatically configured
- Logs searchable in Grafana Explore

## Deployment

### Step 1: Deploy Loki

```bash
# Create ConfigMap
kubectl apply -f logging/loki-config.yaml

# Deploy Loki
kubectl apply -f logging/loki-deployment.yaml

# Verify
kubectl get pods -n monitoring -l app=loki
kubectl get svc -n monitoring loki
```

### Step 2: Deploy Promtail

```bash
# Create ConfigMap
kubectl apply -f logging/promtail-configmap.yaml

# Deploy Promtail DaemonSet
kubectl apply -f logging/promtail-daemonset.yaml

# Verify (should be one pod per node)
kubectl get pods -n monitoring -l app=promtail
```

### Step 3: Configure Grafana

```bash
# Add Loki datasource
kubectl apply -f logging/grafana-loki-datasource.yaml

# Restart Grafana to load datasource
kubectl rollout restart deployment/grafana -n monitoring
```

## Accessing Logs

### Via Grafana

1. **Access Grafana**: `http://<grafana-loadbalancer-ip>` or port-forward
2. **Navigate to Explore**: Click "Explore" in left menu
3. **Select Loki**: Choose "Loki" datasource
4. **Query Logs**: Use LogQL queries (see examples below)

### Via Port Forward

```bash
# Port forward to Loki
kubectl port-forward -n monitoring svc/loki 3100:3100

# Query logs via API
curl "http://localhost:3100/loki/api/v1/query_range?query={app=\"auth-service\"}&limit=100"
```

## LogQL Query Examples

### Basic Queries

```logql
# All logs from auth-service
{app="auth-service"}

# Logs with error level
{app="auth-service"} |= "error"

# Logs from specific pod
{pod="auth-service-xxxxx"}

# Logs from namespace
{namespace="macromind"}
```

### Filtered Queries

```logql
# Errors in auth-service
{app="auth-service"} |= "error" | json | level="error"

# Registration requests
{app="auth-service"} |= "register" | json

# High latency requests (>1s)
{app="meal-planner-service"} | json | duration > 1000

# OpenAI API calls
{app="nutrition-ai-service"} |= "openai" | json
```

### Aggregations

```logql
# Count logs per service
sum(count_over_time({namespace="macromind"}[5m])) by (app)

# Error rate per service
sum(rate({namespace="macromind"} |= "error" [5m])) by (app)

# Top error messages
topk(10, sum(count_over_time({namespace="macromind"} |= "error" [1h])) by (message))
```

### Time Range Queries

```logql
# Last 5 minutes
{app="auth-service"} [5m]

# Last hour
{app="meal-planner-service"} [1h]

# Specific time range
{app="nutrition-ai-service"} [2024-01-01T00:00:00Z:2024-01-01T23:59:59Z]
```

## Service-Specific Queries

### Auth Service

```logql
# Registration attempts
{app="auth-service"} |= "register" | json

# Login attempts
{app="auth-service"} |= "login" | json

# JWT token issues
{app="auth-service"} |= "token" | json

# Database errors
{app="auth-service"} |= "database" | json | level="error"
```

### Meal Planner Service

```logql
# Meal generation requests
{app="meal-planner-service"} |= "generate" | json

# OpenAI API calls
{app="meal-planner-service"} |= "openai" | json

# Meal swap requests
{app="meal-planner-service"} |= "swap" | json
```

### Nutrition AI Service

```logql
# AI chat messages
{app="nutrition-ai-service"} |= "chat" | json

# Recipe analysis
{app="nutrition-ai-service"} |= "analyze" | json

# Rate limit hits
{app="nutrition-ai-service"} |= "rate limit" | json
```

### Frontend

```logql
# Frontend errors
{app="frontend"} |= "error" | json

# 404 errors
{app="frontend"} | json | status=404

# API call failures
{app="frontend"} |= "failed" | json
```

## Grafana Dashboard Integration

### Create Log Panel

1. **Create Dashboard**: New Dashboard → Add Panel
2. **Select Data Source**: Choose "Loki"
3. **Enter Query**: `{app="auth-service"}`
4. **Visualization**: Select "Logs"
5. **Save**: Save dashboard

### Logs + Metrics Correlation

Combine Loki logs with Prometheus metrics:

```logql
# Show logs when error rate spikes
{app="auth-service"} |= "error"
# Add Prometheus query in same panel:
# rate(http_requests_total{status=~"5..",app="auth-service"}[5m])
```

## Configuration

### Retention Period

Edit `logging/loki-config.yaml`:

```yaml
table_manager:
  retention_period: 720h  # 30 days (default)
  # Change to: 168h for 7 days, 2160h for 90 days
```

### Log Limits

Edit `logging/loki-config.yaml`:

```yaml
limits_config:
  ingestion_rate_mb: 16      # MB per second
  ingestion_burst_size_mb: 32 # Burst size
  max_line_size: 256KB        # Max log line size
```

### Promtail Scraping

Edit `logging/promtail-configmap.yaml` to:
- Add new services
- Change log paths
- Add custom labels
- Filter logs

## Troubleshooting

### Loki Not Receiving Logs

```bash
# Check Loki status
kubectl get pods -n monitoring -l app=loki
kubectl logs -n monitoring -l app=loki --tail=50

# Check Loki API
kubectl port-forward -n monitoring svc/loki 3100:3100
curl http://localhost:3100/ready
```

### Promtail Not Collecting Logs

```bash
# Check Promtail pods (should be one per node)
kubectl get pods -n monitoring -l app=promtail

# Check Promtail logs
kubectl logs -n monitoring -l app=promtail --tail=100

# Verify pod labels match relabel configs
kubectl get pods -n macromind --show-labels
```

### Logs Not Appearing in Grafana

```bash
# Verify Loki datasource
kubectl get configmap -n monitoring grafana-loki-datasource -o yaml

# Check Grafana logs
kubectl logs -n monitoring -l app=grafana --tail=50

# Test Loki connection from Grafana pod
kubectl exec -n monitoring -it deployment/grafana -- \
  curl http://loki:3100/ready
```

### High Memory Usage

```bash
# Check Loki memory
kubectl top pods -n monitoring -l app=loki

# Reduce retention or increase limits
# Edit logging/loki-config.yaml
```

## Production Considerations

### 1. Persistent Storage

Replace `emptyDir` with PersistentVolumeClaim:

```yaml
volumes:
- name: loki-storage
  persistentVolumeClaim:
    claimName: loki-pvc
```

### 2. High Availability

- Deploy Loki with 2+ replicas
- Use shared storage (NFS, EBS)
- Configure replication factor > 1

### 3. Performance Tuning

```yaml
limits_config:
  ingestion_rate_mb: 32      # Increase for high volume
  max_query_parallelism: 64  # Increase for faster queries
```

### 4. Security

- Enable authentication in Loki
- Use TLS for Loki API
- Restrict Promtail RBAC permissions

## Integration with Monitoring

### Alert on Log Patterns

Create Prometheus alert based on Loki logs:

```yaml
# prometheus-rules.yaml
- alert: HighErrorRateInLogs
  expr: |
    sum(rate({namespace="macromind"} |= "error" [5m])) by (app) > 10
  for: 5m
  labels:
    severity: warning
```

## Next Steps

1. ✅ Loki deployed
2. ✅ Promtail collecting logs
3. ✅ Grafana configured
4. ⏭️ Create custom log dashboards
5. ⏭️ Set up log-based alerts
6. ⏭️ Integrate with incident management

## Related Files

- `logging/loki-deployment.yaml`
- `logging/loki-config.yaml`
- `logging/promtail-daemonset.yaml`
- `logging/promtail-configmap.yaml`
- `logging/grafana-loki-datasource.yaml`
- `monitoring/grafana-deployment.yaml`

## Support

- **Loki Docs**: https://grafana.com/docs/loki/latest/
- **LogQL**: https://grafana.com/docs/loki/latest/logql/
- **Promtail**: https://grafana.com/docs/loki/latest/clients/promtail/

