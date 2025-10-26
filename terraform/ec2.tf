resource "aws_instance" "jenkins_instance" {
  ami           = "ami-0abcdef1234567890"  # Amazon Linux 2
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.visuaLogic_subnet.id
  security_groups = [aws_security_group.jenkins_sg.name]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              
              # Install Docker
              amazon-linux-extras install docker -y
              systemctl enable docker
              systemctl start docker
              
              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/download/v2.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              
              # Install Jenkins
              wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
              rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
              yum install jenkins java-11-openjdk -y
              systemctl enable jenkins
              systemctl start jenkins
              
              # Install kubectl
              curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
              chmod +x kubectl
              mv kubectl /usr/local/bin/
              
              # Install Trivy
              curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
              
              # Install Node.js & npm
              curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
              yum install -y nodejs
              
              # Start Jenkins at boot
              systemctl start jenkins
              EOF

  tags = {
    Name = "visuaLogic-Jenkins"
  }
}
