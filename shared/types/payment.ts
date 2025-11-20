import { BaseEntity, PaymentStatus } from './index'

export interface Payment extends BaseEntity {
  bookingId: string
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  gateway: PaymentGateway
  
  // Transaction details
  transactionId?: string
  gatewayTransactionId?: string
  referenceId?: string
  
  // Payment gateway specific data
  gatewayData?: Record<string, any>
  
  // Refund information
  refunds: Refund[]
  refundedAmount: number
  
  // Customer details
  customerDetails?: PaymentCustomerDetails
  
  // Billing information
  billingAddress?: PaymentBillingAddress
  
  // Security and compliance
  fraudScore?: number
  riskLevel: 'low' | 'medium' | 'high'
  fraudFlags?: string[]
  
  // Metadata
  description: string
  metadata?: Record<string, any>
  
  // Webhooks and notifications
  webhookEvents: PaymentWebhookEvent[]
  
  // Fees and charges
  fees: PaymentFee[]
  netAmount: number // amount - fees
  
  // Timestamps
  authorizedAt?: Date
  capturedAt?: Date
  failedAt?: Date
  refundedAt?: Date
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTO = 'crypto',
  CASH = 'cash',
  STORE_CREDIT = 'store_credit',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  BRAINTREE = 'braintree',
  ADYEN = 'adyen',
  RAZORPAY = 'razorpay',
  MANUAL = 'manual', // For offline payments
}

export interface PaymentCustomerDetails {
  name: string
  email: string
  phone?: string
  ipAddress?: string
  userAgent?: string
  billingCountry?: string
  taxId?: string
}

export interface PaymentBillingAddress {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface PaymentFee {
  id: string
  type: 'stripe_fee' | 'paypal_fee' | 'processing_fee' | 'currency_conversion'
  amount: number
  currency: string
  description: string
  percentage?: number
}

export interface PaymentWebhookEvent {
  id: string
  paymentId: string
  event: PaymentWebhookEventType
  gateway: PaymentGateway
  data: Record<string, any>
  processed: boolean
  processedAt?: Date
  errorMessage?: string
  retryCount: number
  createdAt: Date
}

export enum PaymentWebhookEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  CHARGE_SUCCEEDED = 'charge.succeeded',
  CHARGE_FAILED = 'charge.failed',
  REFUND_CREATED = 'refund.created',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  PAYPAL_PAYMENT_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED',
  PAYPAL_PAYMENT_DENIED = 'PAYMENT.CAPTURE.DENIED',
  PAYPAL_REFUND_COMPLETED = 'PAYMENT.CAPTURE.REFUNDED',
}

// Enhanced refund interface for payments
export interface PaymentRefund extends BaseEntity {
  paymentId: string
  bookingId: string
  amount: number
  currency: string
  reason: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  // Gateway details
  gateway: PaymentGateway
  gatewayRefundId?: string
  transactionId?: string
  
  // Customer communication
  notificationSent: boolean
  customerNotifiedAt?: Date
  
  // Admin details
  requestedByUserId?: string
  approvedByUserId?: string
  processedByUserId?: string
  adminNotes?: string
  
  // Financial details
  feeRefund: number
  netRefundAmount: number
  
  // Timestamps
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
  failedAt?: Date
}

// Payment intent for secure payment processing
export interface PaymentIntent {
  id: string
  bookingId: string
  amount: number
  currency: string
  gateway: PaymentGateway
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded'
  
  // Client secret for frontend payment processing
  clientSecret?: string
  
  // Payment method
  paymentMethod?: {
    type: string
    card?: {
      brand: string
      last4: string
      expMonth: number
      expYear: number
    }
  }
  
  // Error information
  lastPaymentError?: {
    code: string
    message: string
    type: 'card_error' | 'validation_error' | 'api_error' | 'api_connection_error' | 'api_error' | 'authentication_error' | 'idempotency_error' | 'invalid_request_error'
  }
  
  createdAt: Date
  expiresAt: Date
}

// DTOs for API requests/responses
export interface CreatePaymentRequest {
  bookingId: string
  amount: number
  currency: string
  method: PaymentMethod
  gateway: PaymentGateway
  returnUrl?: string
  cancelUrl?: string
  metadata?: Record<string, any>
  description?: string
}

export interface ProcessPaymentRequest {
  paymentIntentId: string
  paymentMethodId?: string
  billingAddress?: PaymentBillingAddress
  savePaymentMethod?: boolean
}

export interface CreateRefundRequest {
  paymentId: string
  amount?: number // If not provided, full refund
  reason: string
  notifyCustomer?: boolean
  adminNotes?: string
}

export interface RefundListRequest {
  paymentId?: string
  bookingId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  createdFrom?: string
  createdTo?: string
  sortBy?: 'createdAt' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface PaymentListRequest {
  bookingId?: string
  status?: PaymentStatus
  gateway?: PaymentGateway
  method?: PaymentMethod
  amountMin?: number
  amountMax?: number
  createdFrom?: string
  createdTo?: string
  sortBy?: 'createdAt' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface PaymentListResponse {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface RefundListResponse {
  refunds: PaymentRefund[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Payment analytics and reporting
export interface PaymentStats {
  totalPayments: number
  totalAmount: number
  successfulPayments: number
  failedPayments: number
  refundedAmount: number
  averagePaymentValue: number
  paymentMethodsBreakdown: {
    method: PaymentMethod
    count: number
    amount: number
  }[]
  gatewayBreakdown: {
    gateway: PaymentGateway
    count: number
    amount: number
  }[]
  monthlyTrends: {
    month: string
    payments: number
    amount: number
  }[]
  fraudMetrics: {
    totalFlagged: number
    blockedPayments: number
    chargebackRate: number
  }
}

// Stripe-specific types
export interface StripePaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  card?: {
    brand: string
    country: string
    exp_month: number
    exp_year: number
    fingerprint: string
    funding: string
    last4: string
  }
  billing_details: {
    address: PaymentBillingAddress
    email: string
    name: string
    phone?: string
  }
}

// PayPal-specific types
export interface PayPalPaymentMethod {
  id: string
  payer_id: string
  payer_email_address: string
  payer_name: {
    given_name: string
    surname: string
  }
}

// Subscription and recurring payment types
export interface PaymentSubscription extends BaseEntity {
  customerId: string
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'
  planId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialStart?: Date
  trialEnd?: Date
}

export interface PaymentPlan extends BaseEntity {
  name: string
  description?: string
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
  trialPeriodDays?: number
  active: boolean
}