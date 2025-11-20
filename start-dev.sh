#!/bin/bash

# Passio Tour - Development Start Script
# Starts the application without Docker for quick development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🎯 Passio Tour - Quick Development Start"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is running (via Docker)
print_status "Checking database services..."
if ! docker-compose ps postgres | grep -q "Up (healthy)"; then
    print_status "Starting database services..."
    docker-compose up -d postgres redis
    print_success "Database services started"
else
    print_success "Database services are already running"
fi

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 5

# Install backend dependencies if needed
print_status "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install --include=dev
    cd ..
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Install frontend dependencies if needed
print_status "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install --include=dev
    cd ..
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Start the development servers
echo ""
print_status "Starting development servers..."
echo ""

# Function to handle cleanup
cleanup() {
    print_warning "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
print_status "Starting backend server (http://localhost:5000)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background  
print_status "Starting frontend server (http://localhost:3000)..."
cd frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo ""
print_success "🎉 Development servers are running!"
echo ""
echo "📝 Available URLs:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:5000"
echo "  • Database Admin: http://localhost:8080 (Adminer)"
echo "  • Redis Admin: http://localhost:8081 (Redis Commander)"
echo ""
echo "📁 Development Features:"
echo "  • Hot reload enabled for both frontend and backend"
echo "  • Database migrations: npm run migrate (in backend folder)"
echo "  • API tests: npm test (in backend folder)"
echo ""
print_warning "Press Ctrl+C to stop all servers"
echo ""

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID