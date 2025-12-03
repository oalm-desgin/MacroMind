# EKS Cluster and Kubernetes Resources

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-eks-cluster-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-eks-cluster-role"
  }
}

# Attach AWS managed policy for EKS cluster
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# EKS Cluster
resource "aws_eks_cluster" "macromind" {
  name     = var.eks_cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_cluster_version
  
  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.allowed_cidr_blocks
  }
  
  enabled_cluster_log_types = var.enable_cluster_logging ? var.cluster_log_types : []
  
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_cluster
  ]
  
  tags = {
    Name = var.eks_cluster_name
  }
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks_cluster" {
  count = var.enable_cluster_logging ? 1 : 0
  
  name              = "/aws/eks/${var.eks_cluster_name}/cluster"
  retention_in_days = 7
  
  tags = {
    Name = "${var.project_name}-eks-logs"
  }
}

# KMS Key for EKS Encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project_name}-eks-kms-key"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${var.project_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# IAM Role for EKS Node Group
resource "aws_iam_role" "eks_node_group" {
  name = "${var.project_name}-eks-node-group-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-eks-node-group-role"
  }
}

# Attach AWS managed policies for node group
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.macromind.name
  node_group_name = "${var.project_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.eks_cluster_version
  
  capacity_type  = var.node_group_capacity_type
  instance_types = var.node_group_instance_types
  disk_size      = var.node_group_disk_size
  
  scaling_config {
    desired_size = var.node_group_desired_size
    min_size     = var.node_group_min_size
    max_size     = var.node_group_max_size
  }
  
  update_config {
    max_unavailable = 1
  }
  
  remote_access {
    ec2_ssh_key = var.enable_ssh_access && var.ssh_key_name != "" ? var.ssh_key_name : null
  }
  
  labels = {
    role = "general"
  }
  
  tags = {
    Name = "${var.project_name}-node-group"
    "k8s.io/cluster-autoscaler/enabled" = var.enable_cluster_autoscaler ? "true" : "false"
    "k8s.io/cluster-autoscaler/${var.eks_cluster_name}" = "owned"
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Spot Instance Node Group (Optional, for cost optimization)
resource "aws_eks_node_group" "spot" {
  count = var.enable_spot_instances ? 1 : 0
  
  cluster_name    = aws_eks_cluster.macromind.name
  node_group_name = "${var.project_name}-spot-node-group"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.eks_cluster_version
  
  capacity_type  = "SPOT"
  instance_types = var.spot_instance_types
  disk_size      = var.node_group_disk_size
  
  scaling_config {
    desired_size = 1
    min_size     = 0
    max_size     = 3
  }
  
  update_config {
    max_unavailable = 1
  }
  
  labels = {
    role = "spot"
  }
  
  taints {
    key    = "spot"
    value  = "true"
    effect = "NO_SCHEDULE"
  }
  
  tags = {
    Name = "${var.project_name}-spot-node-group"
    "k8s.io/cluster-autoscaler/enabled" = var.enable_cluster_autoscaler ? "true" : "false"
    "k8s.io/cluster-autoscaler/${var.eks_cluster_name}" = "owned"
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Security Group for EKS Cluster
# Note: EKS automatically creates a security group for the cluster
# This is an additional security group for custom rules if needed
resource "aws_security_group" "eks_cluster" {
  name        = "${var.project_name}-eks-cluster-sg"
  description = "Additional security group for EKS cluster (EKS creates its own automatically)"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-eks-cluster-sg"
  }
}

# Security Group Rule: Allow HTTPS from nodes
resource "aws_security_group_rule" "eks_cluster_ingress_nodes_https" {
  description              = "Allow nodes to communicate with cluster API server"
  from_port                = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  to_port                  = 443
  type                     = "ingress"
}

# Security Group for EKS Nodes
resource "aws_security_group" "eks_nodes" {
  name        = "${var.project_name}-eks-nodes-sg"
  description = "Security group for EKS nodes"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-eks-nodes-sg"
    "kubernetes.io/cluster/${var.eks_cluster_name}" = "owned"
  }
}

# Security Group Rule: Allow nodes to communicate with each other
resource "aws_security_group_rule" "eks_nodes_ingress_self" {
  description              = "Allow nodes to communicate with each other"
  from_port                = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_nodes.id
  to_port                  = 65535
  type                     = "ingress"
}

# Security Group Rule: Allow cluster to communicate with nodes
resource "aws_security_group_rule" "eks_nodes_ingress_cluster" {
  description              = "Allow cluster to communicate with nodes"
  from_port                = 1025
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
  to_port                  = 65535
  type                     = "ingress"
}

# Security Group for Jenkins (if needed)
resource "aws_security_group" "jenkins" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Security group for Jenkins"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "Jenkins HTTP"
    from_port   = var.jenkins_node_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  ingress {
    description = "Jenkins JNLP"
    from_port   = 50000
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-jenkins-sg"
  }
}


