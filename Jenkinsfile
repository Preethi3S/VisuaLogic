pipeline {
    agent any

    environment {
        REGISTRY = "your-dockerhub-username"
        SERVER_IMAGE = "visuaLogic-server"
        CLIENT_IMAGE = "visuaLogic-client"
        SONARQUBE = "SonarQube"  // Name of SonarQube server in Jenkins config
    }

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/your-username/visuaLogic.git'
            }
        }

        stage('Install & Unit Tests') {
            steps {
                sh '''
                    echo "Installing server dependencies and running tests"
                    cd server
                    npm install
                    npm test
                    cd ../client
                    npm install
                    npm test
                '''
            }
        }

        stage('Code Quality - SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        cd server
                        sonar-scanner \
                        -Dsonar.projectKey=visuaLogic-server \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=$SONAR_HOST_URL \
                        -Dsonar.login=$SONAR_AUTH_TOKEN
                        
                        cd ../client
                        sonar-scanner \
                        -Dsonar.projectKey=visuaLogic-client \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=$SONAR_HOST_URL \
                        -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Docker Build & Security Scan') {
            steps {
                sh '''
                    echo "Building Docker images"
                    docker build -t $REGISTRY/$SERVER_IMAGE:latest ./server
                    docker build -t $REGISTRY/$CLIENT_IMAGE:latest ./client
                    
                    echo "Scanning server image for vulnerabilities"
                    trivy image --exit-code 1 $REGISTRY/$SERVER_IMAGE:latest
                    
                    echo "Scanning client image for vulnerabilities"
                    trivy image --exit-code 1 $REGISTRY/$CLIENT_IMAGE:latest
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "Logging into DockerHub"
                        docker login -u $DOCKER_USER -p $DOCKER_PASS
                        docker push $REGISTRY/$SERVER_IMAGE:latest
                        docker push $REGISTRY/$CLIENT_IMAGE:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    kubectl apply -f k8s/
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}
