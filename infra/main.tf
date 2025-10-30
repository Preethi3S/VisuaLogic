# ===== IAM Role for EKS =====
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.project_name}-eks-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Principal = { Service = "eks.amazonaws.com" }
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ===== ECR Repositories =====
resource "aws_ecr_repository" "backend_repo" {
  name = "${var.project_name}-backend"
}

resource "aws_ecr_repository" "frontend_repo" {
  name = "${var.project_name}-frontend"
}

# ===== EKS Cluster =====
resource "aws_eks_cluster" "eks_cluster" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = []
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}
