#!/bin/bash

# Sprint Planning Tool - Kubernetes Deployment Script
# Usage: ./deploy.sh [build|deploy|status|logs|delete]

set -e

NAMESPACE="sprint-planning"
DOCKER_USER="${DOCKER_USER:-your-dockerhub-username}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function check_requirements() {
    print_info "Checking requirements..."

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "docker not found. Please install Docker."
        exit 1
    fi

    print_info "All requirements met."
}

function build_images() {
    print_info "Building Docker images..."

    # Backend
    print_info "Building backend image..."
    cd ../backend
    docker build -t $DOCKER_USER/sprint-planning-backend:latest .

    # Frontend
    print_info "Building frontend image..."
    cd ../frontend
    docker build -t $DOCKER_USER/sprint-planning-frontend:latest .

    cd ../k8s
    print_info "Images built successfully!"
}

function push_images() {
    print_info "Pushing Docker images..."

    docker push $DOCKER_USER/sprint-planning-backend:latest
    docker push $DOCKER_USER/sprint-planning-frontend:latest

    print_info "Images pushed successfully!"
}

function deploy() {
    print_info "Deploying to Kubernetes..."

    # Apply namespace first
    kubectl apply -f namespace.yaml

    # Apply all other resources
    # kubectl apply -f postgres.yaml  # Using external Akamai managed PostgreSQL
    kubectl apply -f backend.yaml
    kubectl apply -f frontend.yaml
    kubectl apply -f ingress.yaml

    print_info "Deployment complete!"
    print_info "Waiting for pods to be ready..."

    # kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s  # External DB
    kubectl wait --for=condition=ready pod -l app=backend -n $NAMESPACE --timeout=120s
    kubectl wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=120s

    print_info "All pods are ready!"
}

function show_status() {
    print_info "Checking deployment status..."

    echo ""
    print_info "Pods:"
    kubectl get pods -n $NAMESPACE

    echo ""
    print_info "Services:"
    kubectl get svc -n $NAMESPACE

    echo ""
    print_info "Ingress:"
    kubectl get ingress -n $NAMESPACE

    echo ""
    print_info "External Access:"
    EXTERNAL_IP=$(kubectl get ingress -n $NAMESPACE sprint-planning-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -n "$EXTERNAL_IP" ]; then
        echo "Access your application at: http://$EXTERNAL_IP"
    else
        print_warn "External IP not yet assigned. Wait a few moments and run './deploy.sh status' again."
    fi
}

function show_logs() {
    print_info "Showing logs (Ctrl+C to exit)..."

    echo ""
    echo "Select component:"
    echo "1) Backend"
    echo "2) Frontend"
    echo "3) All"
    read -p "Enter choice: " choice

    case $choice in
        1)
            kubectl logs -n $NAMESPACE -l app=backend -f
            ;;
        2)
            kubectl logs -n $NAMESPACE -l app=frontend -f
            ;;
        3)
            kubectl logs -n $NAMESPACE -l app=backend -f &
            kubectl logs -n $NAMESPACE -l app=frontend -f &
            wait
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

function delete_deployment() {
    print_warn "This will delete ALL resources in the $NAMESPACE namespace."
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "Deleting deployment..."
        kubectl delete namespace $NAMESPACE
        print_info "Deployment deleted."
    else
        print_info "Deletion cancelled."
    fi
}

# Main script
case "${1:-}" in
    build)
        check_requirements
        build_images
        ;;
    push)
        check_requirements
        push_images
        ;;
    build-push)
        check_requirements
        build_images
        push_images
        ;;
    deploy)
        check_requirements
        deploy
        show_status
        ;;
    all)
        check_requirements
        build_images
        push_images
        deploy
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    delete)
        delete_deployment
        ;;
    *)
        echo "Sprint Planning Tool - Kubernetes Deployment"
        echo ""
        echo "Usage: $0 {build|push|build-push|deploy|all|status|logs|delete}"
        echo ""
        echo "Commands:"
        echo "  build       - Build Docker images locally"
        echo "  push        - Push Docker images to registry"
        echo "  build-push  - Build and push images"
        echo "  deploy      - Deploy to Kubernetes cluster"
        echo "  all         - Build, push, and deploy (full pipeline)"
        echo "  status      - Show deployment status"
        echo "  logs        - View logs from pods"
        echo "  delete      - Delete all resources"
        echo ""
        echo "Environment Variables:"
        echo "  DOCKER_USER - Docker Hub username (default: your-dockerhub-username)"
        echo ""
        echo "Example:"
        echo "  DOCKER_USER=johndoe $0 all"
        exit 1
        ;;
esac
