# MacroMind Terraform Infrastructure

Infrastructure as Code for deploying MacroMind to AWS EKS.

## Overview

This Terraform configuration provisions:
- **VPC** with public and private subnets
- **Internet Gateway** and **NAT Gateways**
- **EKS Cluster** (managed Kubernetes)
- **Node Groups** with auto-scaling
- **Security Groups** for cluster and nodes
- **KMS Encryption** for EKS secrets
- **CloudWatch Logging** for EKS control plane

## Prerequisites

- **Terraform** 1.5.0+
- **AWS CLI** configured with credentials
- **kubectl** installed
- **AWS Account** with appropriate permissions
- **EC2 Key Pair** (optional, for SSH access)

## Quick Start

### 1. Configure Variables

```bash
cd terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
# IMPORTANT: Do not commit terraform.tfvars to Git
```

### 2. Initialize Terraform

```bash
# Initialize Terraform
terraform init

# Verify configuration
terraform validate
terraform plan
```

### 3. Deploy Infrastructure

```bash
# Review the plan
terraform plan

# Apply infrastructure
terraform apply

# Type 'yes' to confirm
```

### 4. Configure kubectl

```bash
# Get the configure command from outputs
terraform output configure_kubectl

# Or run directly
aws eks update-kubeconfig --name macromind-cluster --region us-east-1

# Verify connection
kubectl get nodes
```

### 5. Deploy MacroMind

After infrastructure is ready, deploy the application:

```bash
# Using Helm (recommended)
helm install macromind ../helm/macromind \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind --create-namespace

# Or using raw manifests
kubectl apply -f ../k8s/
```

## Configuration

### Required Variables

Edit `terraform.tfvars`:

```hcl
aws_region  = "us-east-1"
environment = "production"
```

### Optional Variables

- `vpc_cidr` - VPC CIDR block (default: 10.0.0.0/16)
- `node_group_desired_size` - Number of nodes (default: 2)
- `enable_spot_instances` - Use spot instances (default: false)
- `enable_cluster_autoscaler` - Enable autoscaling (default: true)

## Infrastructure Components

### VPC and Networking

- **VPC:** 10.0.0.0/16 (configurable)
- **Public Subnets:** 2 subnets across AZs
- **Private Subnets:** 2 subnets across AZs
- **Internet Gateway:** For public subnet access
- **NAT Gateways:** For private subnet internet access
- **Route Tables:** Separate for public and private

### EKS Cluster

- **Managed Kubernetes:** AWS EKS
- **Version:** 1.28 (configurable)
- **Endpoint:** Public and private access
- **Encryption:** KMS key for secrets
- **Logging:** CloudWatch logs (optional)

### Node Groups

- **Instance Types:** t3.medium, t3.large (configurable)
- **Capacity:** ON_DEMAND or SPOT
- **Auto-scaling:** 1-5 nodes (configurable)
- **Disk Size:** 50GB (configurable)
- **Spot Node Group:** Optional for cost savings

### Security

- **Security Groups:** Separate for cluster and nodes
- **Network Policies:** Private subnets for nodes
- **KMS Encryption:** For EKS secrets
- **Access Control:** CIDR-based restrictions

## Outputs

After deployment, Terraform outputs:

- `kubeconfig` - Complete kubectl configuration
- `configure_kubectl` - Command to configure kubectl
- `eks_cluster_endpoint` - Cluster API endpoint
- `vpc_id` - VPC ID
- `public_subnet_ids` - Public subnet IDs
- `private_subnet_ids` - Private subnet IDs

View all outputs:
```bash
terraform output
```

## Cost Optimization

### Development Environment

```hcl
# terraform.tfvars
environment           = "dev"
node_group_desired_size = 1
node_group_min_size     = 1
node_group_max_size     = 2
single_nat_gateway      = true  # Single NAT Gateway
enable_spot_instances    = true  # Use spot instances
```

### Production Environment

```hcl
# terraform.tfvars
environment           = "production"
node_group_desired_size = 3
node_group_min_size     = 2
node_group_max_size     = 10
single_nat_gateway      = false  # High availability
enable_spot_instances    = false  # Stable instances
```

## Security Best Practices

### 1. Restrict Access

```hcl
# In terraform.tfvars
allowed_cidr_blocks = ["YOUR_IP/32"]  # Your IP only
```

### 2. Enable Encryption

```hcl
# Already enabled by default
# KMS key is created automatically
```

### 3. Enable Logging

```hcl
enable_cluster_logging = true
cluster_log_types      = ["api", "audit", "authenticator"]
```

### 4. Use Private Endpoints

The cluster is configured with both public and private endpoints. For maximum security, restrict public access:

```hcl
# In kubernetes.tf, modify:
endpoint_public_access  = false  # Private only
```

## State Management

### Local State (Default)

State is stored locally in `terraform.tfstate`.

### Remote State (Recommended for Teams)

Uncomment backend configuration in `main.tf`:

```hcl
backend "s3" {
  bucket = "macromind-terraform-state"
  key    = "macromind/terraform.tfstate"
  region = "us-east-1"
  encrypt = true
}
```

Create S3 bucket first:
```bash
aws s3 mb s3://macromind-terraform-state --region us-east-1
aws s3api put-bucket-encryption \
  --bucket macromind-terraform-state \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

## Updating Infrastructure

```bash
# Review changes
terraform plan

# Apply updates
terraform apply

# Update specific resource
terraform apply -target=aws_eks_node_group.main
```

## Destroying Infrastructure

```bash
# WARNING: This will delete everything!
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_eks_node_group.main
```

## Troubleshooting

### Terraform Init Fails

```bash
# Clear cache and retry
rm -rf .terraform
terraform init
```

### EKS Cluster Creation Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check IAM permissions
# Required: EKS, EC2, IAM, VPC permissions

# View CloudFormation events (EKS uses CloudFormation)
aws cloudformation describe-stack-events \
  --stack-name eksctl-macromind-cluster
```

### Node Group Not Joining

```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name macromind-cluster \
  --nodegroup-name macromind-node-group

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids <security-group-id>

# Verify IAM roles
aws iam get-role --role-name macromind-eks-node-group-role
```

### kubectl Connection Fails

```bash
# Reconfigure kubectl
aws eks update-kubeconfig --name macromind-cluster --region us-east-1

# Test connection
kubectl get nodes

# Check AWS credentials
aws eks describe-cluster --name macromind-cluster
```

## Integration with Jenkins

After infrastructure is provisioned:

1. **Update Jenkins deployment** to use EKS:
   ```bash
   kubectl apply -f ../jenkins/
   ```

2. **Jenkins will automatically:**
   - Build Docker images
   - Push to registry
   - Deploy via Helm to EKS cluster

3. **No changes needed** to Jenkinsfiles - they work with any Kubernetes cluster

## Integration with Helm

The Helm chart works seamlessly with this infrastructure:

```bash
# Deploy with Helm
helm install macromind ../helm/macromind \
  --set secrets.openaiApiKey=sk-your-key \
  -n macromind --create-namespace
```

## Monitoring

### CloudWatch Logs

EKS control plane logs are sent to CloudWatch:
- Log Group: `/aws/eks/macromind-cluster/cluster`
- Retention: 7 days (configurable)

### View Logs

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /aws/eks/macromind-cluster/cluster

# View logs
aws logs tail /aws/eks/macromind-cluster/cluster --follow
```

## Cost Estimation

Approximate monthly costs (us-east-1):

- **EKS Cluster:** ~$73/month (control plane)
- **NAT Gateway:** ~$32/month per gateway
- **EC2 Instances:** ~$30/month per t3.medium
- **EBS Volumes:** ~$5/month per 50GB
- **Data Transfer:** Variable

**Total (2 nodes, 1 NAT):** ~$200-300/month

Use spot instances and single NAT gateway for dev to reduce costs.

## Next Steps

1. ✅ Infrastructure provisioned
2. ✅ kubectl configured
3. ⏭️ Deploy MacroMind application (Helm or K8s manifests)
4. ⏭️ Configure Jenkins CI/CD
5. ⏭️ Set up monitoring and alerting

## Support

- **Terraform Docs:** https://www.terraform.io/docs
- **AWS EKS Docs:** https://docs.aws.amazon.com/eks/
- **Troubleshooting:** Check CloudWatch logs and EKS events

