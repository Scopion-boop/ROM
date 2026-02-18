# Output values for ROM Platform infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS endpoint address"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.postgres.db_name
}

output "rds_secret_arn" {
  description = "ARN of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB for Route53"
  value       = aws_lb.main.zone_id
}

output "alb_url" {
  description = "Full HTTPS URL of the ALB"
  value       = "https://${aws_lb.main.dns_name}"
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

# ECR Outputs
output "ecr_repository_url_api" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

# S3 Outputs
output "backup_bucket_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.backups.bucket
}

# CloudWatch Outputs
output "api_log_group_name" {
  description = "Name of the API CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

# Secrets Manager Outputs
output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "api_security_group_id" {
  description = "ID of the API security group"
  value       = aws_security_group.api.id
}

# Cost Estimation Output
output "estimated_monthly_cost" {
  description = "Estimated monthly AWS cost (USD)"
  value       = "~$250 (RDS: $100, ECS: $70, ALB: $30, Other: $50)"
}

# Deployment Commands
output "deployment_commands" {
  description = "Commands for deployment"
  value = <<-EOT
    # 1. Build and push Docker images:
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.api.repository_url}
    docker build -t ${aws_ecr_repository.api.repository_url}:${var.api_image_tag} -f apps/api/Dockerfile .
    docker push ${aws_ecr_repository.api.repository_url}:${var.api_image_tag}

    # 2. Update ECS service:
    aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.api.name} --force-new-deployment --region ${var.aws_region}

    # 3. Check deployment status:
    aws ecs describe-services --cluster ${aws_ecs_cluster.main.name} --services ${aws_ecs_service.api.name} --region ${var.aws_region}

    # 4. Access application:
    curl https://${aws_lb.main.dns_name}/api/health
  EOT
}
