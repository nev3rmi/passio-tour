#!/bin/bash

# Passio Tour Management System - Development Setup Script
# This script helps set up the development environment

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d 'v' -f 2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is not compatible. Please install Node.js 18+"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        return 1
    fi
}

# Function to check if npm is available
check_npm() {
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm version $NPM_VERSION is available"
        return 0
    else
        print_error "npm is not available. Please install npm"
        return 1
    fi
}

# Function to check if PostgreSQL is running
check_postgresql() {
    if command_exists psql; then
        if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            print_success "PostgreSQL is running on port 5432"
            return 0
        else
            print_warning "PostgreSQL is not running on port 5432"
            print_status "Please start PostgreSQL or update DATABASE_HOST in .env file"
            return 1
        fi
    else
        print_warning "psql command not found. PostgreSQL may not be installed"
        return 1
    fi
}

# Function to check if Redis is running
check_redis() {
    if command_exists redis-cli; then
        if redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is running"
            return 0
        else
            print_warning "Redis is not running"
            print_status "Please start Redis or update REDIS_HOST in .env file"
            return 1
        fi
    else
        print_warning "redis-cli command not found. Redis may not be installed"
        return 1
    fi
}

# Function to create .env file
setup_environment() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_success "Created .env file"
        print_warning "Please update the .env file with your specific configuration"
        print_status "Make sure to set strong passwords for DATABASE_PASSWORD, JWT_SECRET, and SESSION_SECRET"
    else
        print_success ".env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing root dependencies..."
    npm install
    
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    print_success "All dependencies installed"
}

# Function to setup git hooks
setup_git_hooks() {
    if [ -d .git ]; then
        print_status "Setting up git hooks..."
        chmod +x .husky/pre-commit
        chmod +x .husky/pre-push
        chmod +x .husky/commit-msg
        print_success "Git hooks configured"
    else
        print_warning "Not a git repository. Skipping git hooks setup"
    fi
}

# Function to create required directories
create_directories() {
    print_status "Creating required directories..."
    
    # Create uploads directory
    mkdir -p backend/uploads
    
    # Create logs directory
    mkdir -p backend/logs
    
    # Create test directories
    mkdir -p backend/test-results
    mkdir -p frontend/cypress/videos
    mkdir -p frontend/cypress/screenshots
    
    print_success "Required directories created"
}

# Function to display next steps
show_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update the .env file with your configuration:"
    echo "   - Set DATABASE_PASSWORD to a secure password"
    echo "   - Set JWT_SECRET to a strong secret (minimum 32 characters)"
    echo "   - Set SESSION_SECRET to a strong secret (minimum 32 characters)"
    echo "   - Verify DATABASE_HOST and DATABASE_NAME if using remote database"
    echo ""
    echo "2. Start the development servers:"
    echo "   npm run dev          # Start both frontend and backend"
    echo "   npm run dev:backend  # Start only backend"
    echo "   npm run dev:frontend # Start only frontend"
    echo ""
    echo "3. Development URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   API Documentation: http://localhost:5000/api"
    echo ""
    echo "4. Database setup:"
    echo "   Create a PostgreSQL database named 'passio_tour'"
    echo "   Or update DATABASE_NAME in .env file"
    echo ""
    echo "5. Useful commands:"
    echo "   npm run lint         # Run linting"
    echo "   npm run test         # Run tests"
    echo "   npm run type-check   # Type check"
    echo "   npm run build        # Build for production"
    echo ""
    echo "For more information, see:"
    echo "- docs/environment-config.md for environment setup"
    echo "- docs/README.md for project documentation"
    echo ""
}

# Main setup function
main() {
    echo "=============================================="
    echo "  Passio Tour Management System Setup"
    echo "=============================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        exit 1
    fi
    
    check_npm
    check_postgresql
    check_redis
    
    echo ""
    
    # Setup environment
    setup_environment
    
    # Install dependencies
    install_dependencies
    
    # Setup git hooks
    setup_git_hooks
    
    # Create directories
    create_directories
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"