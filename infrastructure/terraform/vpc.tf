# VPC and Networking Configuration for ROM Platform

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-vpc"
    },
    var.additional_tags
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-igw"
    },
    var.additional_tags
  )
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = var.azs_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
      Tier = "Public"
    },
    var.additional_tags
  )
}

# Private Subnets (for ECS and RDS)
resource "aws_subnet" "private" {
  count = var.azs_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}"
      Tier = "Private"
    },
    var.additional_tags
  )
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.azs_count
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
    },
    var.additional_tags
  )
}

# NAT Gateway (for private subnet internet access)
resource "aws_nat_gateway" "main" {
  count = var.azs_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
    },
    var.additional_tags
  )
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-public-rt"
    },
    var.additional_tags
  )
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count = var.azs_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  count  = var.azs_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
    },
    var.additional_tags
  )
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count = var.azs_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs (for security monitoring)
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-flow-log"
    },
    var.additional_tags
  )
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/${var.project_name}-${var.environment}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-vpc-flow-log"
    },
    var.additional_tags
  )
}

resource "aws_iam_role" "vpc_flow_log" {
  name = "${var.project_name}-${var.environment}-vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.additional_tags
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "${var.project_name}-${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
