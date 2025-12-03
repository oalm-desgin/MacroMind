# MacroMind Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.macromind.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.macromind.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.macromind.endpoint
}

output "eks_cluster_version" {
  description = "Kubernetes version of EKS cluster"
  value       = aws_eks_cluster.macromind.version
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "eks_node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.macromind.certificate_authority[0].data
  sensitive   = true
}

output "kubeconfig" {
  description = "kubectl config file contents for this EKS cluster"
  value       = <<-EOT
    apiVersion: v1
    clusters:
    - cluster:
        certificate-authority-data: ${aws_eks_cluster.macromind.certificate_authority[0].data}
        server: ${aws_eks_cluster.macromind.endpoint}
      name: ${aws_eks_cluster.macromind.arn}
    contexts:
    - context:
        cluster: ${aws_eks_cluster.macromind.arn}
        user: ${aws_eks_cluster.macromind.arn}
      name: ${aws_eks_cluster.macromind.arn}
    current-context: ${aws_eks_cluster.macromind.arn}
    kind: Config
    preferences: {}
    users:
    - name: ${aws_eks_cluster.macromind.arn}
      user:
        exec:
          apiVersion: client.authentication.k8s.io/v1beta1
          command: aws
          args:
            - eks
            - get-token
            - --cluster-name
            - ${aws_eks_cluster.macromind.name}
  EOT
  sensitive = true
}

output "configure_kubectl" {
  description = "Command to configure kubectl for the EKS cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.macromind.name} --region ${var.aws_region}"
}

output "node_group_arn" {
  description = "ARN of the EKS node group"
  value       = aws_eks_node_group.main.arn
}

output "node_group_id" {
  description = "ID of the EKS node group"
  value       = aws_eks_node_group.main.id
}

output "spot_node_group_arn" {
  description = "ARN of the spot EKS node group (if enabled)"
  value       = var.enable_spot_instances ? aws_eks_node_group.spot[0].arn : null
}

output "jenkins_security_group_id" {
  description = "Security group ID for Jenkins"
  value       = aws_security_group.jenkins.id
}

output "nat_gateway_ips" {
  description = "Elastic IPs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_eip.nat[*].public_ip : []
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "kms_key_id" {
  description = "KMS key ID for EKS encryption"
  value       = aws_kms_key.eks.id
}

output "kms_key_arn" {
  description = "KMS key ARN for EKS encryption"
  value       = aws_kms_key.eks.arn
}

# Output for Helm deployment
output "helm_config" {
  description = "Configuration values for Helm deployment"
  value = {
    cluster_name   = aws_eks_cluster.macromind.name
    cluster_endpoint = aws_eks_cluster.macromind.endpoint
    cluster_ca     = aws_eks_cluster.macromind.certificate_authority[0].data
    region         = var.aws_region
  }
  sensitive = true
}

