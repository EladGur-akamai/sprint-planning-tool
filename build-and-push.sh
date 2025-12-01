#!/bin/bash

# Sprint Planning Tool - Docker Build and Push Script
# Usage: ./build-and-push.sh [backend|frontend|all]

set -e

# Configuration
DOCKER_USER="${DOCKER_USER:-dambo14}"
BACKEND_IMAGE="$DOCKER_USER/sprint-planning-backend"
FRONTEND_IMAGE="$DOCKER_USER/sprint-planning-frontend"
TAG="${TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

function print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    print_info "Docker is ready."
}

function docker_login() {
    print_step "Checking Docker Hub authentication..."

    if ! docker info | grep -q "Username: $DOCKER_USER"; then
        print_warn "Not logged in to Docker Hub. Attempting login..."
        docker login
    else
        print_info "Already logged in as $DOCKER_USER"
    fi
}

function build_backend() {
    print_step "Building multi-platform backend Docker image..."

    cd backend

    # Build and push for both AMD64 and ARM64 platforms
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t $BACKEND_IMAGE:$TAG \
        --push \
        .

    cd ..

    print_info "Backend image built and pushed successfully!"
    echo "  Image: $BACKEND_IMAGE:$TAG"
    echo "  Platforms: linux/amd64, linux/arm64"
}

function build_frontend() {
    print_step "Building multi-platform frontend Docker image..."

    cd frontend

    # Build and push for both AMD64 and ARM64 platforms
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t $FRONTEND_IMAGE:$TAG \
        --push \
        .

    cd ..

    print_info "Frontend image built and pushed successfully!"
    echo "  Image: $FRONTEND_IMAGE:$TAG"
    echo "  Platforms: linux/amd64, linux/arm64"
}

function push_backend() {
    # No longer needed - buildx pushes automatically
    print_info "Backend image already pushed during build"
}

function push_frontend() {
    # No longer needed - buildx pushes automatically
    print_info "Frontend image already pushed during build"
}

function show_images() {
    print_step "Docker images created:"
    echo ""
    docker images | grep -E "REPOSITORY|sprint-planning"
    echo ""
}

function update_k8s_manifests() {
    print_step "Updating Kubernetes manifests with image references..."

    # Update backend.yaml
    sed -i.bak "s|image: .*sprint-planning-backend.*|image: $BACKEND_IMAGE:$TAG|g" k8s/backend.yaml

    # Update frontend.yaml
    sed -i.bak "s|image: .*sprint-planning-frontend.*|image: $FRONTEND_IMAGE:$TAG|g" k8s/frontend.yaml

    # Remove backup files
    rm -f k8s/*.bak

    print_info "Kubernetes manifests updated!"
}

function show_summary() {
    echo ""
    echo "======================================"
    print_info "Build and Push Complete!"
    echo "======================================"
    echo ""
    echo "Backend Image:  $BACKEND_IMAGE:$TAG"
    echo "Frontend Image: $FRONTEND_IMAGE:$TAG"
    echo ""
    echo "Next Steps:"
    echo "1. Review k8s manifests (images have been updated automatically)"
    echo "2. Update passwords in k8s/postgres.yaml and k8s/backend.yaml"
    echo "3. Deploy to Kubernetes:"
    echo "   cd k8s"
    echo "   ./deploy.sh deploy"
    echo ""
}

# Main script
print_info "Sprint Planning Tool - Docker Build & Push"
print_info "Docker User: $DOCKER_USER"
print_info "Tag: $TAG"
echo ""

check_docker
docker_login

case "${1:-all}" in
    backend)
        build_backend
        push_backend
        update_k8s_manifests
        show_images
        show_summary
        ;;
    frontend)
        build_frontend
        push_frontend
        update_k8s_manifests
        show_images
        show_summary
        ;;
    all)
        build_backend
        build_frontend
        push_backend
        push_frontend
        update_k8s_manifests
        show_images
        show_summary
        ;;
    *)
        echo "Usage: $0 {backend|frontend|all}"
        echo ""
        echo "Build and push Docker images for Sprint Planning Tool"
        echo ""
        echo "Commands:"
        echo "  backend   - Build and push only backend"
        echo "  frontend  - Build and push only frontend"
        echo "  all       - Build and push both (default)"
        echo ""
        echo "Environment Variables:"
        echo "  DOCKER_USER - Docker Hub username (default: dambo14)"
        echo "  TAG         - Docker image tag (default: latest)"
        echo ""
        echo "Examples:"
        echo "  $0 all                    # Build and push everything"
        echo "  $0 backend                # Build and push only backend"
        echo "  TAG=v1.0.0 $0 all         # Build with custom tag"
        exit 1
        ;;
esac
