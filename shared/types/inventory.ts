// Tour Management System - Inventory Types and Interfaces
// Date: 2025-11-19 | Feature: Tour Management System MVP

import { SeasonalPricing } from './seasonal-pricing';

export interface Inventory {
  inventory_id: string;
  tour_id: string;
  date: string; // YYYY-MM-DD format
  available_count: number;
  max_capacity: number;
  base_price?: number; // Date-specific pricing override
  is_available: boolean;
  notes?: string;
  updated_at: string;
  updated_by: string;
}

export interface InventorySlot extends Inventory {
  booking_count: number;
  reserved_count: number;
  remaining_count: number;
}

export interface CreateInventorySlot {
  tour_id: string;
  date: string;
  available_count: number;
  max_capacity: number;
  base_price?: number;
  is_available?: boolean;
  notes?: string;
}

export interface UpdateInventorySlot {
  available_count?: number;
  max_capacity?: number;
  base_price?: number;
  is_available?: boolean;
  notes?: string;
}

export interface BulkInventoryUpdate {
  tour_id: string;
  updates: {
    date: string;
    available_count?: number;
    max_capacity?: number;
    base_price?: number;
    is_available?: boolean;
    notes?: string;
  }[];
}

export interface InventoryResponse {
  success: boolean;
  data: InventorySlot;
  message?: string;
}

export interface BulkInventoryResponse {
  success: boolean;
  data: {
    updated: InventorySlot[];
    failed: {
      date: string;
      error: string;
    }[];
  };
  message?: string;
}

export interface CheckAvailabilityRequest {
  tour_id: string;
  date: string;
  participants: number;
}

export interface CheckAvailabilityResponse {
  success: boolean;
  data: {
    tour_id: string;
    date: string;
    requested_participants: number;
    available: boolean;
    remaining_spots: number;
    max_capacity: number;
    price_info?: {
      base_price: number;
      adjusted_price: number;
      currency: string;
    };
  };
}

export interface CheckAvailabilityRangeRequest {
  tour_id: string;
  start_date: string;
  end_date: string;
  participants: number;
}

export interface CheckAvailabilityRangeResponse {
  success: boolean;
  data: {
    tour_id: string;
    date_range: {
      start_date: string;
      end_date: string;
    };
    requested_participants: number;
    availability: InventorySlot[];
    summary: {
      total_dates: number;
      available_dates: number;
      fully_booked_dates: number;
      partially_booked_dates: number;
    };
  };
}

export interface ReserveSlotRequest {
  tour_id: string;
  date: string;
  participants: number;
  booking_id: string;
  expires_at?: string;
}

export interface ReserveSlotResponse {
  success: boolean;
  data: {
    reservation_id: string;
    tour_id: string;
    date: string;
    participants: number;
    expires_at: string;
    remaining_spots: number;
  };
  message?: string;
}

export interface ReleaseReservationRequest {
  reservation_id: string;
  booking_id: string;
}

export interface ReleaseReservationResponse {
  success: boolean;
  data: {
    reservation_id: string;
    participants: number;
    remaining_spots: number;
  };
  message?: string;
}

export interface InventorySearchFilters {
  tour_id?: string;
  start_date?: string;
  end_date?: string;
  is_available?: boolean;
  has_capacity?: boolean;
  price_range?: {
    min?: number;
    max?: number;
  };
}

export interface InventorySearchParams extends InventorySearchFilters {
  page?: number;
  limit?: number;
  sort_by?: 'date' | 'available_count' | 'max_capacity' | 'price';
  sort_order?: 'asc' | 'desc';
}

export interface InventorySearchResponse {
  success: boolean;
  data: {
    inventory: InventorySlot[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      destinations: string[];
      tour_names: string[];
      price_range: {
        min: number;
        max: number;
      };
    };
  };
  message?: string;
}

// Inventory constraints and validation
export const INVENTORY_CONSTRAINTS = {
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 1000,
  MIN_MAX_CAPACITY: 1,
  MAX_MAX_CAPACITY: 10000,
  RESERVATION_EXPIRY_HOURS: 24,
  BULK_UPDATE_MAX_DATES: 365,
  MIN_ADVANCE_BOOKING_DAYS: 0,
  MAX_ADVANCE_BOOKING_DAYS: 365
} as const;

export const BOOKING_STATES = {
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

export type BookingState = typeof BOOKING_STATES[keyof typeof BOOKING_STATES];

export interface InventoryReservation {
  reservation_id: string;
  booking_id: string;
  tour_id: string;
  date: string;
  participants: number;
  reserved_at: string;
  expires_at: string;
  state: BookingState;
}

export interface InventoryStats {
  tour_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  total_capacity: number;
  total_booked: number;
  total_available: number;
  average_utilization: number; // percentage
  peak_dates: {
    date: string;
    utilization: number;
  }[];
  low_performance_dates: {
    date: string;
    utilization: number;
  }[];
}

// Validation functions
export const validateInventorySlot = (
  available_count: number, 
  max_capacity: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (available_count < INVENTORY_CONSTRAINTS.MIN_PARTICIPANTS) {
    errors.push(`Available count must be at least ${INVENTORY_CONSTRAINTS.MIN_PARTICIPANTS}`);
  }

  if (available_count > max_capacity) {
    errors.push('Available count cannot exceed maximum capacity');
  }

  if (max_capacity < INVENTORY_CONSTRAINTS.MIN_MAX_CAPACITY) {
    errors.push(`Maximum capacity must be at least ${INVENTORY_CONSTRAINTS.MIN_MAX_CAPACITY}`);
  }

  if (max_capacity > INVENTORY_CONSTRAINTS.MAX_MAX_CAPACITY) {
    errors.push(`Maximum capacity cannot exceed ${INVENTORY_CONSTRAINTS.MAX_MAX_CAPACITY}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDateRange = (
  start_date: string, 
  end_date: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime())) {
    errors.push('Invalid start date format');
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid end date format');
  }

  if (start > end) {
    errors.push('Start date must be before or equal to end date');
  }

  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES) {
    errors.push(`Date range cannot exceed ${INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES} days`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility functions
export const calculateUtilization = (
  booked: number, 
  max_capacity: number
): number => {
  return max_capacity > 0 ? (booked / max_capacity) * 100 : 0;
};

export const isSlotAvailable = (
  available_count: number, 
  requested_participants: number
): boolean => {
  return available_count >= requested_participants;
};

export const getAvailableSpots = (
  inventory: InventorySlot
): number => {
  return inventory.available_count;
};

export const calculateNewAvailableCount = (
  current_available: number,
  change: number,
  max_capacity: number
): number => {
  const new_count = current_available + change;
  return Math.max(0, Math.min(new_count, max_capacity));
};

export const generateDateRange = (
  start_date: string,
  end_date: string
): string[] => {
  const dates: string[] = [];
  const start = new Date(start_date);
  const end = new Date(end_date);
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const isDateInPast = (date: string): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const isDateToday = (date: string): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
};

// Pricing integration
export interface DatePricingInfo {
  date: string;
  base_price: number;
  adjusted_price: number;
  currency: string;
  pricing_rules: {
    seasonal_pricing?: SeasonalPricing;
    last_minute_discount?: number;
    advance_booking_bonus?: number;
  };
}

export const getDatePricing = (
  base_price: number,
  date: string,
  seasonal_pricing?: SeasonalPricing
): DatePricingInfo => {
  let adjusted_price = base_price;
  const pricing_rules: any = {};

  // Apply seasonal pricing if available
  if (seasonal_pricing) {
    const adjustment = base_price * (seasonal_pricing.price_modifier / 100);
    adjusted_price = base_price + adjustment;
    pricing_rules.seasonal_pricing = seasonal_pricing;
  }

  // Apply advance booking bonus if applicable
  const daysUntilTour = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilTour > 30) {
    pricing_rules.advance_booking_bonus = 5; // 5% discount
    adjusted_price = adjusted_price * 0.95;
  }

  // Apply last-minute discount if within 7 days
  if (daysUntilTour <= 7 && daysUntilTour >= 0) {
    pricing_rules.last_minute_discount = 10; // 10% discount
    adjusted_price = adjusted_price * 0.90;
  }

  return {
    date,
    base_price,
    adjusted_price,
    currency: 'USD', // This would be dynamic
    pricing_rules
  };
};

// Error types
export interface InventoryError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export const INVENTORY_ERROR_CODES = {
  INVENTORY_NOT_FOUND: 'INVENTORY_NOT_FOUND',
  INSUFFICIENT_CAPACITY: 'INSUFFICIENT_CAPACITY',
  DATE_IN_PAST: 'DATE_IN_PAST',
  INVALID_CAPACITY: 'INVALID_CAPACITY',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
  RESERVATION_CONFLICT: 'RESERVATION_CONFLICT',
  BULK_UPDATE_LIMIT_EXCEEDED: 'BULK_UPDATE_LIMIT_EXCEEDED',
  SEASONAL_PRICING_CONFLICT: 'SEASONAL_PRICING_CONFLICT'
} as const;

// Export utility functions
export {
  validateInventorySlot,
  validateDateRange,
  calculateUtilization,
  isSlotAvailable,
  getAvailableSpots,
  calculateNewAvailableCount,
  generateDateRange,
  isDateInPast,
  isDateToday,
  getDatePricing
};
