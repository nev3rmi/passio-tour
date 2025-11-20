import { BaseEntity, BookingStatus, EntityStatus } from './index'

export interface Booking extends BaseEntity {
  bookingNumber: string
  userId: string
  tourId: string
  status: BookingStatus
  
  // Booking details
  participants: Participant[]
  totalParticipants: number
  bookingDate: Date
  tourDate: Date
  
  // Pricing
  basePrice: number
  totalPrice: number
  currency: string
  discounts: Discount[]
  taxes: Tax[]
  fees: Fee[]
  
  // Contact and billing
  primaryContact: ContactInfo
  billingAddress: ContactInfo
  emergencyContact?: ContactInfo
  
  // Special requests
  specialRequests?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  
  // Communication
  communicationPreference: 'email' | 'sms' | 'phone'
  notifications: BookingNotification[]
  
  // Review and feedback
  review?: Review
  rating?: number
  feedback?: string
  
  // Metadata
  source: 'website' | 'mobile' | 'partner' | 'admin'
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
  
  // Notes
  internalNotes?: string
  customerNotes?: string
  operatorNotes?: string
  
  // Cancellations
  cancellation?: BookingCancellation
  refunds?: Refund[]
}

export interface Participant {
  id: string
  bookingId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: Date
  age?: number
  gender?: 'male' | 'female' | 'other'
  nationality?: string
  passportNumber?: string
  passportExpiry?: Date
  dietaryRestrictions?: string
  medicalConditions?: string
  tshirtSize?: string
  isPrimary: boolean
}

export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: {
    street?: string
    city: string
    state?: string
    country: string
    postalCode?: string
  }
}

export interface Discount {
  id: string
  type: 'percentage' | 'fixed_amount' | 'early_bird' | 'group' | 'promo_code'
  value: number
  description: string
  code?: string
  reason?: string
  amount: number // Calculated discount amount
}

export interface Tax {
  id: string
  name: string
  type: 'percentage' | 'fixed_amount'
  rate: number
  amount: number
  jurisdiction?: string
}

export interface Fee {
  id: string
  name: string
  type: 'booking' | 'processing' | 'service' | 'insurance'
  amount: number
  description?: string
}

export interface BookingNotification {
  id: string
  bookingId: string
  type: 'booking_confirmation' | 'reminder' | 'update' | 'cancellation' | 'completion'
  channel: 'email' | 'sms' | 'push'
  subject?: string
  message: string
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed'
  retryCount: number
  errorMessage?: string
}

export interface Review {
  id: string
  bookingId: string
  userId: string
  tourId: string
  rating: number // 1-5
  title?: string
  comment: string
  aspects: ReviewAspect[]
  wouldRecommend: boolean
  verified: boolean
  helpful: number
  createdAt: Date
  updatedAt: Date
}

export interface ReviewAspect {
  aspect: 'guide' | 'transportation' | 'food' | 'itinerary' | 'value' | 'overall'
  rating: number // 1-5
  comment?: string
}

export interface BookingCancellation {
  id: string
  bookingId: string
  reason: string
  cancelledBy: 'customer' | 'operator' | 'admin' | 'system'
  cancelledByUserId?: string
  cancelledAt: Date
  refundAmount: number
  refundStatus: 'pending' | 'processed' | 'completed' | 'failed'
  refundMethod?: string
  adminNotes?: string
}

export interface Refund {
  id: string
  bookingId: string
  amount: number
  currency: string
  reason: string
  method: 'original_payment' | 'bank_transfer' | 'store_credit'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
  transactionId?: string
  adminNotes?: string
}

// DTOs for API requests/responses
export interface CreateBookingRequest {
  tourId: string
  tourDate: string
  participants: Omit<Participant, 'id' | 'bookingId' | 'isPrimary'>[]
  primaryContact: Omit<ContactInfo, 'address'>
  billingAddress?: Omit<ContactInfo, 'address'>
  emergencyContact?: Omit<ContactInfo, 'address'>
  specialRequests?: string
  dietaryRestrictions?: string
  communicationPreference: 'email' | 'sms' | 'phone'
  promoCode?: string
  agreeToTerms: boolean
}

export interface UpdateBookingRequest {
  participants?: Omit<Participant, 'id' | 'bookingId'>[]
  specialRequests?: string
  dietaryRestrictions?: string
  communicationPreference?: 'email' | 'sms' | 'phone'
}

export interface CancelBookingRequest {
  reason: string
  refundPreference?: 'original_payment' | 'store_credit'
  adminNotes?: string
}

export interface BookingSearchParams {
  userId?: string
  tourId?: string
  status?: BookingStatus
  bookingDateFrom?: string
  bookingDateTo?: string
  tourDateFrom?: string
  tourDateTo?: string
  participantName?: string
  participantEmail?: string
  bookingNumber?: string
  source?: 'website' | 'mobile' | 'partner' | 'admin'
  sortBy?: 'bookingDate' | 'tourDate' | 'totalPrice' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface BookingListResponse {
  bookings: Booking[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface BookingAvailabilityRequest {
  tourId: string
  date: string
  participants: number
}

export interface BookingAvailabilityResponse {
  available: boolean
  remainingSpots: number
  priceBreakdown: {
    basePrice: number
    participantPrice: number
    fees: Fee[]
    taxes: Tax[]
    discounts: Discount[]
    total: number
  }
  blocked: boolean
  blockedReason?: string
}

export interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  completedBookings: number
  totalRevenue: number
  averageBookingValue: number
  topTours: { tourId: string; title: string; bookings: number }[]
  bookingTrends: {
    date: string
    bookings: number
    revenue: number
  }[]
  cancellationRate: number
  averageRating: number
}

// Waitlist functionality
export interface WaitlistEntry extends BaseEntity {
  tourId: string
  userId: string
  requestedDate: Date
  participants: number
  status: EntityStatus
  notified: boolean
  notifiedAt?: Date
  expiresAt: Date
  notes?: string
}

export interface CreateWaitlistRequest {
  tourId: string
  requestedDate: string
  participants: number
  notes?: string
}

// Bulk operations
export interface BulkBookingUpdate {
  bookingIds: string[]
  action: 'confirm' | 'cancel' | 'update_status'
  parameters?: {
    status?: BookingStatus
    reason?: string
    notes?: string
  }
}

export interface BulkBookingResponse {
  success: string[]
  failed: { id: string; error: string }[]
  totalProcessed: number
}