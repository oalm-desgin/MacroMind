# MacroMind Infrastructure as Code
# Terraform configuration for AWS EKS deployment

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
  
  # Backend configuration (uncomment and configure for remote state)
  # backend "s3" {
  #   bucket = "macromind-terraform-state"
  #   key    = "macromind/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  # }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "MacroMind"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_eks_cluster" "cluster" {
  name = aws_eks_cluster.macromind.name
  depends_on = [aws_eks_cluster.macromind]
}

data "aws_eks_cluster_auth" "cluster" {
  name = aws_eks_cluster.macromind.name
  depends_on = [aws_eks_cluster.macromind]
}

# Configure Kubernetes Provider
provider "kubernetes" {
  host                   = aws_eks_cluster.macromind.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.macromind.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

# Configure Helm Provider
provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.macromind.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.macromind.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

