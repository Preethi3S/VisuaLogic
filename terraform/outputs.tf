output "jenkins_public_ip" {
  value = aws_instance.jenkins_instance.public_ip
}
