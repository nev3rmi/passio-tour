# Data Model: Tour Management System MVP

**Date**: 2025-11-19 | **Feature**: Tour Management System MVP | **Phase**: 1 - Design & Contracts

## Entity Relationship Overview

The Tour Management System implements a multi-tenant architecture serving both inbound (DMC) and outbound tour operators. The data model supports complex booking workflows, inventory management, payment processing, and partner relationships.

## Core Entities

### 1. User Management

#### Users
```typescript
interface User {
  user_id: string;              // UUID primary key
  email: string;                // Unique email address
  password_hash: string;        // Hashed password (bcrypt)
  role: UserRole;               // Enum: customer, dmc_admin, tour_operator, partner_agent, super_admin
  company_name?: string;        // For B2B users
  first_name: string;
  last_name: string;
  phone?: string;
  language_preference: string;   // ISO 639-1 code, default 'en'
  timezone: string;             // IANA timezone
  preferences: UserPreferences; // JSONB: notifications, booking settings
  tenant_id: string;            // For multi-tenancy
  is_active: boolean;           // Account status
  email_verified: boolean;
  last_login?: timestamp;
  created_at: timestamp;
  updated_at: timestamp;
}

enum UserRole {
  CUSTOMER = 'customer',
  DMC_ADMIN = 'dmc_admin',
  TOUR_OPERATOR = 'tour_operator',
  PARTNER_AGENT = 'partner_agent',
  SUPER_ADMIN = 'super_admin'
}

interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    booking_updates: boolean;
    marketing: boolean;
  };
  booking_defaults: {
    currency: string;
    participants: number;
  };
}
```

#### User Sessions
```typescript
interface UserSession {
  session_id: string;           // UUID primary key
  user_id: string;              // Foreign key to users
  token_hash: string;           // Hashed JWT token
  refresh_token_hash: string;   // Hashed refresh token
  ip_address: string;
  user_agent: string;
  expires_at: timestamp;
  created_at: timestamp;
}
```

### 2. Tour and Service Management

#### Tours/Services
```typescript
interface Tour {
  tour_id: string;              // UUID primary key
  tenant_id: string;            // Multi-tenant support
  name: string;                 // Tour/service name
  description: string;          // Detailed description
  short_description: string;    // Brief summary for listings
  type: TourType;               // Enum: inbound_service, outbound_package
  category: string;             // Activity type, destination category
  destination: string;          // Primary destination/location
  duration_hours: number;       // Duration in hours
  difficulty_level: DifficultyLevel; // Enum: easy, moderate, challenging
  min_participants: number;
  max_participants: number;
  base_price: decimal(10,2);    // Base price in cents/currency units
  currency: string;             // ISO 4217 currency code
  languages: string[];          // Available languages
  images: TourImage[];          // Associated images
  inclusions: string[];         // What's included
  exclusions: string[];         // What's not included
  meeting_point: string;        // Meeting location details
  requirements: string[];       // Special requirements, age limits
  cancellation_policy: string;  // Cancellation terms
  supplier_info: SupplierInfo;  // For inbound services
  status: TourStatus;           // Enum: active, inactive, archived, draft
  created_by: string;           // Foreign key to users
  created_at: timestamp;
  updated_at: timestamp;
}

enum TourType {
  INBOUND_SERVICE = 'inbound_service',  // DMC services
  OUTBOUND_PACKAGE = 'outbound_package' // Tour operator packages
}

enum DifficultyLevel {
  EASY = 'easy',
  MODERATE = 'moderate', 
  CHALLENGING = 'challenging'
}

enum TourStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

interface TourImage {
  image_id: string;
  tour_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

interface SupplierInfo {
  supplier_id: string;          // For inbound services
  supplier_name: string;
  contact_email: string;
  contact_phone: string;
  commission_rate: decimal(5,2); // Commission percentage
  payment_terms: string;
}
```

#### Inventory Management
```typescript
interface Inventory {
  inventory_id: string;         // UUID primary key
  tour_id: string;              // Foreign key to tours
  date: date;                   // Specific date
  available_count: number;      // Remaining spots
  max_capacity: number;         // Maximum capacity for this date
  base_price: decimal(10,2);    // Date-specific pricing (optional)
  is_available: boolean;        // Availability flag
  notes?: string;               // Special notes for this date
  updated_at: timestamp;
  updated_by: string;           // Foreign key to users
}

interface SeasonalPricing {
  pricing_id: string;
  tour_id: string;
  season_name: string;
  start_date: date;
  end_date: date;
  price_modifier: decimal(5,2); // Percentage modifier (+/-)
  minimum_participants?: number;
}
```

### 3. Booking Management

#### Bookings
```typescript
interface Booking {
  booking_id: string;           // UUID primary key
  booking_reference: string;    // Human-readable booking ID
  tenant_id: string;
  tour_id: string;              // Foreign key to tours
  customer_id: string;          // Foreign key to users
  agent_id?: string;            // For partner agent bookings
  booking_date: timestamp;      // When booking was made
  travel_date: date;            // Scheduled travel date
  participants: number;         // Number of people
  total_amount: decimal(10,2);  // Total booking cost
  currency: string;             // Payment currency
  status: BookingStatus;        // Current booking status
  payment_status: PaymentStatus;// Payment status
  special_requests?: string;    // Customer special requirements
  emergency_contact: EmergencyContact;
  participant_details: ParticipantDetail[]; // Individual participant info
  voucher_url?: string;         // Generated voucher link
  cancellation_reason?: string; // If cancelled
  cancelled_by?: string;        // Who cancelled
  cancelled_at?: timestamp;
  created_at: timestamp;
  updated_at: timestamp;
}

enum BookingStatus {
  PENDING = 'pending',          // Awaiting confirmation
  CONFIRMED = 'confirmed',      // Confirmed by supplier
  CANCELLED = 'cancelled',      // Cancelled booking
  COMPLETED = 'completed',      // Tour/service completed
  NO_SHOW = 'no_show'          // Customer didn't show
}

enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',          // Partial payment made
  PAID = 'paid',                // Fully paid
  REFUNDED = 'refunded',        // Fully refunded
  PARTIAL_REFUND = 'partial_refund' // Partial refund
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface ParticipantDetail {
  participant_id: string;
  booking_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: date;
  passport_number?: string;
  dietary_restrictions?: string;
  special_requirements?: string;
}
```

#### Booking Items (for package bookings)
```typescript
interface BookingItem {
  item_id: string;              // UUID primary key
  booking_id: string;           // Foreign key to bookings
  tour_id: string;              // Foreign key to tours
  service_date: date;           // Date for this service
  participants: number;         // Participants for this item
  unit_price: decimal(10,2);    // Price per participant
  total_price: decimal(10,2);   // Total for this item
  status: BookingItemStatus;    // Status of this booking component
  notes?: string;
  created_at: timestamp;
}

enum BookingItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}
```

### 4. Payment Processing

#### Payments
```typescript
interface Payment {
  payment_id: string;           // UUID primary key
  booking_id: string;           // Foreign key to bookings
  payment_reference: string;    // Gateway payment ID
  amount: decimal(10,2);        // Payment amount
  currency: string;             // Payment currency
  gateway: PaymentGateway;      // Enum: stripe, paypal
  gateway_transaction_id: string; // External transaction ID
  payment_method: PaymentMethod; // Card, digital wallet, etc.
  status: PaymentStatus;        // Payment processing status
  failure_reason?: string;      // If payment failed
  processed_at?: timestamp;
  refunded_at?: timestamp;
  refund_amount?: decimal(10,2);
  fees: decimal(10,2);          // Processing fees
  net_amount: decimal(10,2);    // Amount after fees
  created_at: timestamp;
  updated_at: timestamp;
}

enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal'
}

interface PaymentMethod {
  type: string;                 // card, bank_transfer, digital_wallet
  last_four?: string;           // For card payments
  brand?: string;               // Visa, Mastercard, etc.
  expiry_month?: number;
  expiry_year?: number;
}
```

#### Invoices
```typescript
interface Invoice {
  invoice_id: string;           // UUID primary key
  booking_id: string;           // Foreign key to bookings
  invoice_number: string;       // Human-readable invoice ID
  invoice_date: date;
  due_date: date;
  subtotal: decimal(10,2);
  tax_amount: decimal(10,2);
  total_amount: decimal(10,2);
  currency: string;
  status: InvoiceStatus;        // Enum: draft, sent, paid, overdue, cancelled
  pdf_url?: string;             // Generated PDF location
  created_at: timestamp;
  updated_at: timestamp;
}

enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}
```

### 5. Partner Management (B2B)

#### Partners
```typescript
interface Partner {
  partner_id: string;           // UUID primary key
  tenant_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: Address;
  partner_type: PartnerType;    // Enum: travel_agent, tour_operator, wholesaler
  commission_rate: decimal(5,2); // Default commission rate
  credit_limit: decimal(10,2);  // Credit limit for bookings
  payment_terms: string;        // Payment terms
  status: PartnerStatus;        // Enum: active, inactive, suspended
  contract_start_date: date;
  contract_end_date?: date;
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}

enum PartnerType {
  TRAVEL_AGENT = 'travel_agent',
  TOUR_OPERATOR = 'tour_operator',
  WHOLESALER = 'wholesaler'
}

enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

interface Address {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}
```

#### Partner Commission Tracking
```typescript
interface Commission {
  commission_id: string;        // UUID primary key
  booking_id: string;           // Foreign key to bookings
  partner_id: string;           // Foreign key to partners
  commission_rate: decimal(5,2); // Applied commission rate
  gross_amount: decimal(10,2);  // Booking total
  commission_amount: decimal(10,2); // Commission calculated
  currency: string;
  status: CommissionStatus;     // Enum: pending, approved, paid
  calculated_at: timestamp;
  approved_at?: timestamp;
  paid_at?: timestamp;
}

enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid'
}
```

### 6. Communication & Notifications

#### Notifications
```typescript
interface Notification {
  notification_id: string;      // UUID primary key
  recipient_id: string;         // Foreign key to users
  booking_id?: string;          // Related booking (optional)
  type: NotificationType;       // Enum: booking_confirmation, payment_received, tour_reminder
  title: string;
  message: string;
  channels: NotificationChannel[]; // Email, SMS, in-app
  is_read: boolean;
  sent_at?: timestamp;
  read_at?: timestamp;
  created_at: timestamp;
}

enum NotificationType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  TOUR_REMINDER = 'tour_reminder',
  TOUR_CANCELLED = 'tour_cancelled',
  BOOKING_CANCELLED = 'booking_cancelled'
}

enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push'
}
```

### 7. Reporting & Analytics

#### System Metrics
```typescript
interface BookingMetrics {
  metric_id: string;            // UUID primary key
  date: date;                   // Date for metrics
  tenant_id: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_revenue: decimal(12,2);
  average_booking_value: decimal(10,2);
  conversion_rate: decimal(5,2); // Percentage
  created_at: timestamp;
}

interface PopularTours {
  ranking_id: string;
  date: date;
  tenant_id: string;
  tour_id: string;              // Foreign key to tours
  booking_count: number;
  revenue: decimal(12,2);
  rank_position: number;
  created_at: timestamp;
}
```

## Database Relationships

### Key Relationships
- **Users** → **Bookings**: One-to-Many (User can have multiple bookings)
- **Tours** → **Bookings**: One-to-Many (Tour can have multiple bookings)
- **Tours** → **Inventory**: One-to-Many (Tour has inventory for multiple dates)
- **Bookings** → **Payments**: One-to-Many (Booking can have multiple payments)
- **Partners** → **Bookings**: One-to-Many (Partner can have multiple bookings)
- **Bookings** → **BookingItems**: One-to-Many (For package bookings)

### Multi-Tenancy
All entities include `tenant_id` for data isolation between different tour operators and DMCs. Row-level security policies ensure tenants can only access their own data.

## Validation Rules

### Business Rules
1. **Booking Constraints**: 
   - Participants must be between min_participants and max_participants
   - Travel date must be in the future
   - Total amount must match sum of participants × unit price

2. **Inventory Management**:
   - available_count cannot exceed max_capacity
   - Inventory cannot be negative
   - Availability updates must respect booking commitments

3. **Payment Processing**:
   - Total payment amounts cannot exceed booking total
   - Refunds cannot exceed payment amounts
   - Failed payments must be logged with reasons

4. **Partner Management**:
   - Commission rates must be between 0% and 100%
   - Credit limits must be positive values
   - Partner contracts must have valid date ranges

### Data Integrity
- Foreign key constraints enforce referential integrity
- Check constraints validate enum values and business rules
- Triggers automatically update timestamps and calculated fields
- Unique constraints prevent duplicate data (email, booking references)

## Indexing Strategy

### Performance Indexes
```sql
-- User lookup indexes
CREATE INDEX idx_users_email ON users (email) WHERE is_active = true;
CREATE INDEX idx_users_tenant ON users (tenant_id, role);

-- Tour search and filtering
CREATE INDEX idx_tours_search ON tours USING GIN (to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_tours_tenant_type ON tours (tenant_id, type, status);
CREATE INDEX idx_tours_category_dest ON tours (category, destination);

-- Booking performance
CREATE INDEX idx_bookings_customer_date ON bookings (customer_id, travel_date);
CREATE INDEX idx_bookings_tenant_status ON bookings (tenant_id, status, booking_date);
CREATE INDEX idx_bookings_tour_date ON bookings (tour_id, travel_date);

-- Inventory queries
CREATE INDEX idx_inventory_tour_date ON inventory (tour_id, date) WHERE is_available = true;

-- Payment tracking
CREATE INDEX idx_payments_booking ON payments (booking_id, status);
CREATE INDEX idx_payments_gateway ON payments (gateway, processed_at);

-- Partner operations
CREATE INDEX idx_partners_tenant ON partners (tenant_id, status);
CREATE INDEX idx_commission_partner ON commission (partner_id, status, calculated_at);
```

## Migration Strategy

### Database Migrations
1. **Base Schema**: Users, Tours, Bookings, Payments core tables
2. **Inventory System**: Inventory, SeasonalPricing tables
3. **Partner Management**: Partners, Commission tracking
4. **Communication**: Notifications, User preferences
5. **Analytics**: Metrics tables, partitioning strategy
6. **Performance**: Indexes, triggers, stored procedures

### Data Evolution
- **Versioning**: Schema version tracking for migration management
- **Backwards Compatibility**: Feature flags for gradual rollout
- **Testing**: Migration testing in staging environment
- **Rollback Plans**: Automated rollback procedures for failed migrations

This data model provides a comprehensive foundation for the Tour Management System while maintaining flexibility for future enhancements and scaling requirements.