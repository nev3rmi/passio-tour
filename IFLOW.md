# Passio Tour Management System - Development Context

## Project Overview

The Passio Tour Management System is a full-stack web application designed for both inbound (Destination Management Company) and outbound tour operators. It serves as a unified platform supporting B2B and B2C booking operations, allowing tour operators to manage inventory, process bookings, handle payments, and manage customer relationships with minimal operational overhead.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL 15 with advanced features
- **Caching**: Redis
- **File Storage**: AWS S3 compatible (MinIO for development)
- **Payment Processing**: Stripe API
- **Authentication**: JWT tokens
- **Real-time**: Socket.io
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS with Headless UI components

### Architecture
- **Frontend**: React-based SPA with routing via React Router DOM
- **Backend**: Express.js API with modular structure (controllers, routes, services, middleware)
- **Shared**: TypeScript type definitions used across frontend and backend
- **Database**: PostgreSQL with custom ENUMs, triggers, and complex constraints

## Building and Running

### Quick Start (Recommended)
```bash
# Start development servers using the provided script
./start-dev.sh
```

### Alternative Start Methods
```bash
# Method 1: Using npm scripts
npm run dev

# Method 2: Individual components
npm run dev:frontend  # Start frontend only
npm run dev:backend  # Start backend only

# Method 3: Using Docker Compose with auto-reload
docker-compose up

# Method 4: Docker Compose with hot reload
docker-compose -f docker-compose.dev.yml up
```

### Docker Development with Auto-Reload
The project includes Docker configurations for development with automatic code reloading:

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Start specific service with reload
docker-compose -f docker-compose.dev.yml up backend
docker-compose -f docker-compose.dev.yml up frontend

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

**Features:**
- **Hot Reload**: Code changes automatically rebuild and restart containers
- **Volume Mounting**: Local source code is mounted into containers
- **Development Tools**: Includes debugging and inspection tools
- **Environment Isolation**: Separate development environment configuration

**Note:** The Docker development setup provides hot reload functionality for both frontend and backend services. When you make changes to your code, the containers will automatically detect the changes and rebuild/restart, providing a seamless development experience without manual container restarts.

### Development Commands
```bash
# Install dependencies for all workspaces
npm run install:all

# Build the project
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Run database migrations
cd backend && npm run migrate
```

### Available Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)
- **Email Testing**: http://localhost:8025 (Mailhog)

### Docker Service Ports
When using Docker Compose:
- **Frontend**: http://localhost:3000 (React dev server)
- **Backend API**: http://localhost:5000 (Node.js with hot reload)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO (S3)**: http://localhost:9000 (Access Key: minioadmin, Secret: minioadmin)
- **Adminer**: http://localhost:8080 (Database admin)
- **Redis Commander**: http://localhost:8081 (Redis admin)
- **Mailhog**: http://localhost:8025 (Email testing)

## Development Conventions

### Code Structure
- **Frontend** (`/frontend`): React components, pages, hooks, services
- **Backend** (`/backend`): API routes, controllers, models, services, middleware, database migrations
- **Shared** (`/shared`): TypeScript type definitions used by both frontend and backend
- **Specs** (`/specs`): Project specifications, plans, and task lists

### Project Workspaces
The project uses npm workspaces with three main areas:
1. `frontend` - React application
2. `backend` - Express API server
3. `shared` - Shared types and utilities

### Database Schema
Three main tables form the core of the system:
1. **tours** - Tour management with detailed attributes, pricing, and metadata
2. **tour_images** - Media management for tours with different types and sizes
3. **inventory** - Real-time availability tracking for tour dates

### Environment Configuration
- Environment files: `.env.development`, `.env.production`, `.env.example`
- Configuration is managed through `config` directory in backend
- Validation of environment variables is performed at startup

### Testing Strategy
- Unit tests with Jest (backend)
- Component tests with Vitest (frontend)
- Integration and E2E tests with Cypress
- Code coverage requirements (90% minimum)

## Key Features

### Tour Management
- Complete tour creation and management system
- Support for both inbound services and outbound packages
- Rich media handling with multiple image types
- Advanced pricing options with seasonal adjustments

### Booking System
- Real-time availability management
- Comprehensive booking workflow
- Multiple payment options
- Review and feedback system

### User Management
- Role-based access control (admin, dmc, tour operator, partner agent, customer)
- Authentication and authorization
- Profile management

### Real-time Features
- WebSocket integration for live updates
- Inventory synchronization
- Booking notifications

### API Design
- RESTful API with versioning
- Comprehensive error handling
- Input validation with Express Validator
- Rate limiting and security middleware