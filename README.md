# Ultimate CI/CD Pipeline for MERN + AWS + Kubernetes + Terraform

## Project Overview
This setup automates everything:
- Docker builds for frontend & backend
- ECR storage for images
- Terraform for AWS infra (ECR + EKS)
- GitHub Actions for CI/CD
- Kubernetes for deployment & scaling

## Workflow
1. Developer pushes code to main branch.
2. GitHub Actions:
   - Builds Docker images.
   - Pushes to ECR.
   - Deploys to EKS automatically.
3. Ingress exposes the app via AWS ALB.

## Folder Structure
- `/client` → React/Vite Frontend
- `/server` → Express Backend
- `/infra` → Terraform AWS Infra
- `/k8s` → Kubernetes Deployments
- `/.github/workflows` → CI/CD Pipeline
