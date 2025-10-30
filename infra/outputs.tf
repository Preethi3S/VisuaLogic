output "ecr_backend_url" {
  value = aws_ecr_repository.backend_repo.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend_repo.repository_url
}

output "eks_cluster_name" {
  value = aws_eks_cluster.eks_cluster.name
}
