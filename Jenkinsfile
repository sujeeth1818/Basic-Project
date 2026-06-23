pipeline {
    agent any

    environment {
        NAMESPACE = "devops-demo"
        KUBE_CONTEXT = "minikube"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test: user-service') {
            steps {
                dir('services/user-service') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Test: product-service') {
            steps {
                dir('services/product-service') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Test: api-gateway') {
            steps {
                dir('services/api-gateway') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    eval $(minikube docker-env)
                    docker build -t user-service:latest ./services/user-service
                    docker build -t product-service:latest ./services/product-service
                    docker build -t api-gateway:latest ./services/api-gateway
                '''
            }
        }

        stage('Provision Infra (Terraform)') {
            steps {
                dir('terraform') {
                    sh '''
                        terraform init -input=false
                        terraform apply -auto-approve -var="kube_context=${KUBE_CONTEXT}" -var="namespace=${NAMESPACE}"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    kubectl --context=${KUBE_CONTEXT} apply -f k8s/user-service.yaml
                    kubectl --context=${KUBE_CONTEXT} apply -f k8s/product-service.yaml
                    kubectl --context=${KUBE_CONTEXT} apply -f k8s/api-gateway.yaml
                '''
            }
        }

        stage('Verify Rollout') {
            steps {
                sh '''
                    kubectl --context=${KUBE_CONTEXT} -n ${NAMESPACE} rollout status deployment/user-service --timeout=90s
                    kubectl --context=${KUBE_CONTEXT} -n ${NAMESPACE} rollout status deployment/product-service --timeout=90s
                    kubectl --context=${KUBE_CONTEXT} -n ${NAMESPACE} rollout status deployment/api-gateway --timeout=90s
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully. Services are deployed to Minikube.'
        }
        failure {
            echo 'Pipeline failed. Check stage logs above.'
        }
    }
}
