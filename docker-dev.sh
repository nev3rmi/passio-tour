#!/bin/bash

# Passio Tour - Docker Development Management Script
# This script helps manage Docker services for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker from https://docker.com/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop or the Docker daemon."
        exit 1
    fi
    
    print_success "Docker is available and running"
}

# Function to check if Docker Compose is available
check_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_success "Docker Compose is available: $COMPOSE_CMD"
}

# Function to start services
start_services() {
    print_status "Starting Passio Tour services..."
    
    # Create necessary directories
    mkdir -p backend/logs backend/uploads
    mkdir -p backend/database/init
    mkdir -p docker/redis
    
    # Load Docker environment
    if [ -f .env.docker ]; then
        print_status "Loading Docker environment variables..."
        export $(grep -v '^#' .env.docker | xargs)
    fi
    
    # Start services
    $COMPOSE_CMD up -d
    
    print_success "Services started successfully!"
    
    # Show service URLs
    echo ""
    print_status "Service URLs:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  API Docs:    http://localhost:5000/api"
    echo "  Database:    http://localhost:8080 (Adminer)"
    echo "  Redis:       http://localhost:8081 (Redis Commander)"
    echo "  Email UI:    http://localhost:8025 (Mailhog)"
    echo "  MinIO:       http://localhost:9001 (MinIO Console)"
    echo ""
}

# Function to stop services
stop_services() {
    print_status "Stopping Passio Tour services..."
    $COMPOSE_CMD down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting Passio Tour services..."
    $COMPOSE_CMD restart
    print_success "Services restarted successfully!"
}

# Function to rebuild services
rebuild_services() {
    print_status "Rebuilding Passio Tour services..."
    $COMPOSE_CMD down
    $COMPOSE_CMD build --no-cache
    $COMPOSE_CMD up -d
    print_success "Services rebuilt and started successfully!"
}

# Function to show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        $COMPOSE_CMD logs -f
    else
        print_status "Showing logs for $service..."
        $COMPOSE_CMD logs -f "$service"
    fi
}

# Function to check service status
check_status() {
    print_status "Checking service status..."
    $COMPOSE_CMD ps
    echo ""
    
    # Check health of critical services
    print_status "Checking service health..."
    
    # Check PostgreSQL
    if $COMPOSE_CMD exec -T postgres pg_isready -U postgres -d passio_tour &> /dev/null; then
        print_success "PostgreSQL: Healthy"
    else
        print_error "PostgreSQL: Unhealthy"
    fi
    
    # Check Redis
    if $COMPOSE_CMD exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis: Healthy"
    else
        print_error "Redis: Unhealthy"
    fi
    
    # Check Backend
    if curl -f http://localhost:5000/health &> /dev/null; then
        print_success "Backend API: Healthy"
    else
        print_warning "Backend API: Not responding"
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend: Healthy"
    else
        print_warning "Frontend: Not responding"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests with Docker..."
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.test.yml --profile test-only up --build --abort-on-container-exit
    print_success "Tests completed!"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    read -p "This will remove all containers, volumes, and networks. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $COMPOSE_CMD down -v --remove-orphans
        $COMPOSE_CMD system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show help
show_help() {
    echo "Passio Tour - Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  rebuild   Rebuild and start services"
    echo "  logs      Show logs (optional: specify service name)"
    echo "  status    Check service status and health"
    echo "  test      Run tests"
    echo "  cleanup   Remove all containers, volumes, and networks"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 status"
    echo ""
}

# Main function
main() {
    case "${1:-help}" in
        start)
            check_docker
            check_compose
            start_services
            ;;
        stop)
            check_docker
            check_compose
            stop_services
            ;;
        restart)
            check_docker
            check_compose
            restart_services
            ;;
        rebuild)
            check_docker
            check_compose
            rebuild_services
            ;;
        logs)
            check_docker
            check_compose
            show_logs "$2"
            ;;
        status)
            check_docker
            check_compose
            check_status
            ;;
        test)
            check_docker
            check_compose
            run_tests
            ;;
        cleanup)
            check_docker
            check_compose
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"