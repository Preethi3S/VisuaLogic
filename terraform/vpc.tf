resource "aws_vpc" "visuaLogic_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "visuaLogicVPC"
  }
}

resource "aws_subnet" "visuaLogic_subnet" {
  vpc_id            = aws_vpc.visuaLogic_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-south-1a"
  tags = {
    Name = "visuaLogicSubnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.visuaLogic_vpc.id
  tags = {
    Name = "visuaLogicIGW"
  }
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.visuaLogic_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "visuaLogicRoute" }
}

resource "aws_route_table_association" "route_assoc" {
  subnet_id      = aws_subnet.visuaLogic_subnet.id
  route_table_id = aws_route_table.route_table.id
}
