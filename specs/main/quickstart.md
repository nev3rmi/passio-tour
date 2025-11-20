# Tour Management System - Quick Start Guide

**Date**: 2025-11-19 | **Feature**: Tour Management System MVP | **Phase**: 1 - Design & Contracts

## Overview

Welcome to the Tour Management System MVP development! This guide will help you get started with setting up your development environment and understanding the system architecture.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Redis Cache   │◄─────────────┘
                        │   (Caching)     │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  File Storage   │
                        │   (AWS S3)      │
                        └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, Express.js, TypeScript
- **Database**: PostgreSQL 15, Redis (caching)
- **Authentication**: JWT tokens, bcrypt password hashing
- **Payment Processing**: Stripe API, PayPal API
- **File Storage**: AWS S3 or compatible storage
- **Testing**: Jest, React Testing Library, Cypress
- **Deployment**: Docker, AWS/GCP, CI/CD pipeline

## Prerequisites

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn/pnpm)
- **PostgreSQL**: Version 15 or higher
- **Redis**: Version 6.0 or higher
- **Git**: Latest version

### Required Accounts & API Keys
- **Stripe**: Payment processing account
- **PayPal**: Payment processing account (optional)
- **AWS S3**: File storage (or compatible service)
- **SendGrid/AWS SES**: Email service
- **Twilio**: SMS service (optional)

## Local Development Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd tour-management-system

# Install dependencies
npm install
# or
yarn install
# or  
pnpm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tour_management
DATABASE_SSL=false

# Redis Configuration  
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Payment Gateway Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Application Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb tour_management

# Run database migrations
npm run migrate:up

# Seed database with sample data (optional)
npm run seed

# Or use Docker for easier setup
docker run --name tour-postgres -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=tour_management -p 5432:5432 -d postgres:15

docker run --name tour-redis -p 6379:6379 -d redis:6
```

### 4. Start Development Servers

```bash
# Start backend server (in one terminal)
npm run dev:backend

# Start frontend server (in another terminal)
npm run dev:frontend

# Or start both simultaneously
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## Project Structure

```
tour-management-system/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── api/            # API routes and controllers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── migrations/     # Database migration scripts
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Frontend utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── assets/         # Static assets
│   ├── tests/              # Frontend tests
│   └── package.json
├── shared/                 # Shared utilities and types
│   ├── types/              # Shared TypeScript definitions
│   ├── utils/              # Shared utility functions
│   └── constants/          # Shared constants
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
└── README.md
```

## Key Development Workflows

### 1. Creating a New Tour (API Flow)
```javascript
// 1. Create tour via API
const tour = await fetch('/api/v1/tours', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'City Walking Tour',
    description: 'Explore the historic city center',
    type: 'outbound_package',
    category: 'cultural',
    destination: 'Paris',
    duration_hours: 3,
    min_participants: 1,
    max_participants: 15,
    base_price: 45.00,
    currency: 'EUR'
  })
});

// 2. Set up inventory
await fetch(`/api/v1/tours/${tour.id}/inventory`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    date: '2025-12-15',
    available_count: 10,
    max_capacity: 15
  })
});
```

### 2. Booking Flow (Frontend Integration)
```typescript
// React component for tour booking
import { useState } from 'react';
import { useTours } from './hooks/useTours';
import { useBookings } from './hooks/useBookings';

export const TourBooking: React.FC = () => {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    tour_id: '',
    travel_date: '',
    participants: 1,
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  
  const { searchTours } = useTours();
  const { createBooking } = useBookings();
  
  const handleBooking = async () => {
    try {
      const booking = await createBooking(bookingData);
      // Redirect to payment or confirmation
      window.location.href = `/booking-confirmation/${booking.id}`;
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };
  
  return (
    <div>
      {/* Tour selection and booking form */}
    </div>
  );
};
```

### 3. Payment Processing Integration
```javascript
// Stripe payment integration
import Stripe from '@stripe/stripe-js';

const stripe = Stripe('pk_test_your_publishable_key');

const processPayment = async (bookingId, paymentMethodId) => {
  try {
    // Create payment intent
    const response = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        booking_id: bookingId,
        payment_method: {
          type: 'card',
          token: paymentMethodId
        }
      })
    });
    
    const payment = await response.json();
    
    if (payment.status === 'completed') {
      // Payment successful - redirect to confirmation
      window.location.href = `/booking-confirmation/${bookingId}`;
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## API Testing with Postman

### Import Collection
1. Download the Postman collection from `/docs/postman/tour-management-api.json`
2. Import into Postman
3. Set up environment variables:
   - `base_url`: `http://localhost:3000/v1`
   - `auth_token`: (will be set after login)

### Sample API Calls

#### 1. User Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### 2. Create Tour
```http
POST /tours
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "name": "Historic City Tour",
  "description": "Guided walking tour of historic downtown",
  "type": "outbound_package",
  "category": "cultural",
  "destination": "Boston",
  "duration_hours": 2.5,
  "min_participants": 2,
  "max_participants": 12,
  "base_price": 65.00,
  "currency": "USD"
}
```

#### 3. Check Availability
```http
GET /tours/{tour_id}/availability?start_date=2025-12-01&end_date=2025-12-31&participants=4
Authorization: Bearer {{auth_token}}
```

#### 4. Create Booking
```http
POST /bookings
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "tour_id": "123e4567-e89b-12d3-a456-426614174000",
  "travel_date": "2025-12-15",
  "participants": 4,
  "special_requests": "Wheelchair accessible",
  "emergency_contact": {
    "name": "John Smith",
    "phone": "+1234567890",
    "relationship": "tour organizer"
  }
}
```

## Development Best Practices

### Code Style and Standards
- **TypeScript**: Use strict TypeScript for type safety
- **ESLint**: Follow established linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for code quality

### Testing Strategy
- **Unit Tests**: Test individual functions and components (90% coverage target)
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows
- **Contract Tests**: Validate API contracts and schemas

### Error Handling
- Use consistent error response format
- Implement proper logging for debugging
- Handle edge cases and validation errors
- Use appropriate HTTP status codes

### Security Guidelines
- Validate all input data
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Use HTTPS in production
- Keep dependencies updated

### Performance Optimization
- Implement database indexing strategy
- Use Redis for caching frequently accessed data
- Optimize images and static assets
- Implement pagination for large datasets
- Use database connection pooling

## Common Development Tasks

### Adding a New API Endpoint
1. Define schema in `/shared/types/api.ts`
2. Create route handler in `/backend/src/api/routes/`
3. Add controller logic in `/backend/src/api/controllers/`
4. Update OpenAPI specification in `/specs/main/contracts/`
5. Add tests in `/backend/tests/`

### Adding a New Frontend Component
1. Create component in `/frontend/src/components/`
2. Add TypeScript interfaces in `/frontend/src/types/`
3. Create storybook stories for UI components (optional)
4. Add tests in `/frontend/src/components/__tests__/`

### Database Migrations
```bash
# Create new migration
npm run migrate:create -- --name add_tour_ratings

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo service postgresql status

# Reset database (development only)
npm run migrate:down
npm run migrate:up
npm run seed
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Clear Redis cache (development only)
redis-cli FLUSHALL
```

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear frontend build cache
rm -rf frontend/node_modules frontend/build
cd frontend && npm install && npm run build
```

#### Payment Gateway Issues
- Verify API keys are correct and active
- Check webhook endpoints are accessible
- Ensure proper SSL certificate for production
- Review Stripe/PayPal dashboard for error logs

### Getting Help

1. **Documentation**: Check `/docs/` directory for detailed guides
2. **API Documentation**: Visit `/api/docs` when server is running
3. **Issues**: Create GitHub issues for bugs or feature requests
4. **Team Chat**: Use team communication channels for quick questions

## Deployment Checklist

### Pre-Production
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Performance testing passed
- [ ] Documentation updated

### Production Deployment
```bash
# Build applications
npm run build

# Run database migrations
npm run migrate:up

# Start production servers
npm run start:prod

# Monitor application
npm run monitor
```

## Next Steps

1. **Review the Data Model**: Study `/specs/main/data-model.md` for detailed entity relationships
2. **Explore API Contracts**: Review `/specs/main/contracts/tour-management-api.yaml` for endpoint details
3. **Set up Development Environment**: Follow the setup instructions above
4. **Review Research Findings**: Check `/specs/main/research.md` for technical decisions and rationale
5. **Start with First Feature**: Choose a small feature to implement first (e.g., user registration)

Welcome to the team! Feel free to reach out with any questions or if you need clarification on any part of the system.