# MacroMind Canary Deployments

Safe canary deployment strategy for MacroMind services with weighted traffic splitting.

## Overview

Canary deployments allow you to gradually roll out new versions of services to a small percentage of users before full deployment. This reduces risk and allows for early detection of issues.

## Architecture

- **Stable Version**: Production deployment (80% traffic)
- **Canary Version**: New version deployment (20% traffic)
- **Traffic Splitting**: Managed via Nginx Ingress annotations

## Services with Canary Support

1. **auth-service** - Authentication and user management
2. **meal-planner-service** - AI meal planning
3. **nutrition-ai-service** - AI nutrition coaching

## Deployment

### Step 1: Update Stable Deployments

Ensure your stable deployments have the `version: stable` label:

```yaml
metadata:
  labels:
    app: auth-service
    version: stable
```

### Step 2: Deploy Canary Versions

```bash
# Deploy canary deployments
kubectl apply -f canary/auth-service-canary-deployment.yaml
kubectl apply -f canary/meal-planner-service-canary-deployment.yaml
kubectl apply -f canary/nutrition-ai-service-canary-deployment.yaml
```

### Step 3: Configure Traffic Splitting

**Option A: Weight-Based Routing (Recommended)**

```bash
# Apply canary ingress with 20% traffic
kubectl apply -f canary/canary-ingress.yaml

# Adjust traffic percentage
kubectl annotate ingress macromind-canary-ingress \
  -n macromind \
  nginx.ingress.kubernetes.io/canary-weight="20" --overwrite
```

**Option B: Header-Based Routing**

For testing with specific users:

```yaml
annotations:
  nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
  nginx.ingress.kubernetes.io/canary-by-header-value: "true"
```

Then send requests with header:
```bash
curl -H "X-Canary: true" http://macromind.local/api/auth/register
```

### Step 4: Monitor Canary Deployment

```bash
# Check canary pod status
kubectl get pods -n macromind -l version=canary

# Check canary service logs
kubectl logs -n macromind -l app=auth-service,version=canary -f

# Monitor metrics
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Query: rate(http_requests_total{version="canary"}[5m])
```

## Traffic Percentage Management

### Increase Canary Traffic

```bash
# 20% -> 50%
kubectl annotate ingress macromind-canary-ingress \
  -n macromind \
  nginx.ingress.kubernetes.io/canary-weight="50" --overwrite

# 50% -> 100% (full rollout)
kubectl annotate ingress macromind-canary-ingress \
  -n macromind \
  nginx.ingress.kubernetes.io/canary-weight="100" --overwrite
```

### Rollback to Stable

```bash
# Set canary weight to 0
kubectl annotate ingress macromind-canary-ingress \
  -n macromind \
  nginx.ingress.kubernetes.io/canary-weight="0" --overwrite

# Delete canary deployments
kubectl delete -f canary/auth-service-canary-deployment.yaml
kubectl delete -f canary/meal-planner-service-canary-deployment.yaml
kubectl delete -f canary/nutrition-ai-service-canary-deployment.yaml
```

## Verification Steps

### 1. Verify Canary Pods Running

```bash
kubectl get pods -n macromind -l version=canary
```

Expected output:
```
NAME                                      READY   STATUS    RESTARTS   AGE
auth-service-canary-xxxxx                 1/1     Running   0          5m
meal-planner-service-canary-xxxxx         1/1     Running   0          5m
nutrition-ai-service-canary-xxxxx         1/1     Running   0          5m
```

### 2. Verify Traffic Splitting

```bash
# Check ingress annotations
kubectl get ingress macromind-canary-ingress -n macromind -o yaml

# Send test requests and check which pods receive traffic
for i in {1..10}; do
  curl http://macromind.local/api/auth/health
done

# Check pod logs to see traffic distribution
kubectl logs -n macromind -l app=auth-service,version=stable --tail=5
kubectl logs -n macromind -l app=auth-service,version=canary --tail=5
```

### 3. Monitor Error Rates

```bash
# Check error rates for canary vs stable
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Query in Prometheus:
# rate(http_requests_total{status=~"5..",version="canary"}[5m])
# vs
# rate(http_requests_total{status=~"5..",version="stable"}[5m])
```

### 4. Check Grafana Dashboards

- Navigate to Grafana
- View "MacroMind Services" dashboard
- Compare metrics between `version=stable` and `version=canary`

## Best Practices

### 1. Gradual Rollout

1. **Start Small**: Begin with 5-10% traffic
2. **Monitor**: Watch for 15-30 minutes
3. **Increase**: Gradually increase to 20%, 50%, 100%
4. **Full Rollout**: Once stable, promote canary to stable

### 2. Monitoring Checklist

- [ ] Error rates are similar or lower
- [ ] Response times are acceptable
- [ ] No increase in 5xx errors
- [ ] CPU/Memory usage is normal
- [ ] Database connections are stable
- [ ] No user complaints

### 3. Rollback Criteria

Rollback immediately if:
- Error rate increases > 5%
- Response time increases > 50%
- Critical bugs discovered
- Service becomes unavailable

### 4. Promotion Process

Once canary is stable:

```bash
# 1. Update stable deployment image
kubectl set image deployment/auth-service \
  auth-service=macromind/auth-service:canary \
  -n macromind

# 2. Scale down canary
kubectl scale deployment auth-service-canary --replicas=0 -n macromind

# 3. Remove canary ingress
kubectl delete -f canary/canary-ingress.yaml

# 4. Update stable labels
kubectl label deployment auth-service version=stable -n macromind --overwrite
```

## Troubleshooting

### Canary Not Receiving Traffic

```bash
# Check ingress annotations
kubectl get ingress -n macromind -o yaml | grep canary

# Verify canary service exists
kubectl get svc -n macromind -l version=canary

# Check pod labels
kubectl get pods -n macromind -l version=canary --show-labels
```

### Traffic Not Splitting Correctly

```bash
# Verify Nginx Ingress Controller supports canary
kubectl get deployment -n ingress-nginx nginx-ingress-controller -o yaml | grep canary

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller | grep canary
```

### Canary Pods Crashing

```bash
# Check pod status
kubectl get pods -n macromind -l version=canary

# Check logs
kubectl logs -n macromind -l version=canary --tail=100

# Check events
kubectl get events -n macromind --sort-by='.lastTimestamp' | grep canary
```

## Advanced: Service Mesh Integration

For more advanced traffic splitting, consider using:
- **Istio**: VirtualService with weighted routing
- **Linkerd**: Traffic splitting with service profiles
- **Consul Connect**: Service intentions with traffic policies

Example Istio VirtualService:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: auth-service
  namespace: macromind
spec:
  hosts:
  - auth-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: auth-service-canary
      weight: 100
  - route:
    - destination:
        host: auth-service
      weight: 80
    - destination:
        host: auth-service-canary
      weight: 20
```

## Related Files

- `canary/auth-service-canary-deployment.yaml`
- `canary/meal-planner-service-canary-deployment.yaml`
- `canary/nutrition-ai-service-canary-deployment.yaml`
- `canary/canary-ingress.yaml`
- `k8s/ingress.yaml` (main ingress for stable)

## Support

- **Nginx Ingress Canary**: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary
- **Kubernetes Deployments**: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

