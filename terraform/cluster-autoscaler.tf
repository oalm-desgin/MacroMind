# Cluster Autoscaler Configuration
# Optional: Deploy cluster autoscaler for automatic node scaling

# IAM Policy for Cluster Autoscaler
resource "aws_iam_policy" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  
  name        = "${var.project_name}-cluster-autoscaler-policy"
  description = "IAM policy for cluster autoscaler"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-cluster-autoscaler-policy"
  }
}

# IAM Role for Cluster Autoscaler Service Account
resource "aws_iam_role" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  
  name = "${var.project_name}-cluster-autoscaler-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(aws_eks_cluster.macromind.identity[0].oidc[0].issuer, "https://", "")}"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_eks_cluster.macromind.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
            "${replace(aws_eks_cluster.macromind.identity[0].oidc[0].issuer, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-cluster-autoscaler-role"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  
  policy_arn = aws_iam_policy.cluster_autoscaler[0].arn
  role       = aws_iam_role.cluster_autoscaler[0].name
}

# OIDC Provider for EKS (required for IRSA - IAM Roles for Service Accounts)
# Note: EKS creates OIDC provider automatically, but we need to register it in IAM
data "tls_certificate" "eks" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  
  url = aws_eks_cluster.macromind.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = length(data.tls_certificate.eks) > 0 ? [data.tls_certificate.eks[0].certificates[0].sha1_fingerprint] : []
  url             = aws_eks_cluster.macromind.identity[0].oidc[0].issuer
  
  tags = {
    Name = "${var.project_name}-eks-oidc-provider"
  }
  
  depends_on = [aws_eks_cluster.macromind]
}

# Note: Cluster Autoscaler deployment is done via Helm after infrastructure is ready
# See README.md for deployment instructions

