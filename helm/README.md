# Helm Charts

Helm charts for deploying MacroMind to Kubernetes.

## Structure

```
helm/
└── macromind/
    ├── Chart.yaml           # Chart metadata
    ├── values.yaml          # Default configuration values
    ├── values-dev.yaml      # Development overrides
    ├── values-prod.yaml     # Production overrides
    └── templates/
        ├── _helpers.tpl     # Template helpers
        ├── namespace.yaml
        ├── secrets.yaml
        ├── configmap.yaml
        ├── postgres/
        │   ├── statefulset.yaml
        │   ├── service.yaml
        │   └── pvc.yaml
        ├── auth/
        │   ├── deployment.yaml
        │   └── service.yaml
        ├── meal-planner/
        │   ├── deployment.yaml
        │   └── service.yaml
        ├── nutrition-ai/
        │   ├── deployment.yaml
        │   └── service.yaml
        ├── frontend/
        │   ├── deployment.yaml
        │   └── service.yaml
        └── ingress.yaml
```

## Usage

### Install Chart

```bash
# Install with default values
helm install macromind ./helm/macromind -n macromind --create-namespace

# Install with development values
helm install macromind ./helm/macromind -f helm/macromind/values-dev.yaml -n macromind

# Install with custom values
helm install macromind ./helm/macromind --set image.tag=v1.0.0 -n macromind
```

### Upgrade Chart

```bash
helm upgrade macromind ./helm/macromind -n macromind
```

### Uninstall Chart

```bash
helm uninstall macromind -n macromind
```

### View Values

```bash
# Show computed values
helm get values macromind -n macromind

# Show all values
helm show values ./helm/macromind
```

## Configuration

Key configuration values in `values.yaml`:

- `image.repository` - Docker image repository
- `image.tag` - Image tag/version
- `replicaCount` - Number of replicas per service
- `resources` - CPU/memory requests and limits
- `autoscaling.enabled` - Enable HPA
- `ingress.host` - Application hostname
- `postgres.persistence.size` - Database storage size

## Secrets

Secrets should be provided during installation:

```bash
helm install macromind ./helm/macromind \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.jwtSecret="your-secret" \
  --set secrets.openaiApiKey="sk-..." \
  -n macromind
```

Or create a `secrets.yaml` file (DO NOT commit):

```yaml
secrets:
  databaseUrl: postgresql://...
  jwtSecret: your-secret
  openaiApiKey: sk-...
```

Then install:

```bash
helm install macromind ./helm/macromind -f secrets.yaml -n macromind
```

