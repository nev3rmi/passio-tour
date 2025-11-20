import { SeasonalPricing } from './seasonal-pricing';
export interface Inventory {
    inventory_id: string;
    tour_id: string;
    date: string;
    available_count: number;
    max_capacity: number;
    base_price?: number;
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
export declare const INVENTORY_CONSTRAINTS: {
    readonly MIN_PARTICIPANTS: 1;
    readonly MAX_PARTICIPANTS: 1000;
    readonly MIN_MAX_CAPACITY: 1;
    readonly MAX_MAX_CAPACITY: 10000;
    readonly RESERVATION_EXPIRY_HOURS: 24;
    readonly BULK_UPDATE_MAX_DATES: 365;
    readonly MIN_ADVANCE_BOOKING_DAYS: 0;
    readonly MAX_ADVANCE_BOOKING_DAYS: 365;
};
export declare const BOOKING_STATES: {
    readonly RESERVED: "reserved";
    readonly CONFIRMED: "confirmed";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
};
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
    average_utilization: number;
    peak_dates: {
        date: string;
        utilization: number;
    }[];
    low_performance_dates: {
        date: string;
        utilization: number;
    }[];
}
export declare const validateInventorySlot: (available_count: number, max_capacity: number) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateDateRange: (start_date: string, end_date: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const calculateUtilization: (booked: number, max_capacity: number) => number;
export declare const isSlotAvailable: (available_count: number, requested_participants: number) => boolean;
export declare const getAvailableSpots: (inventory: InventorySlot) => number;
export declare const calculateNewAvailableCount: (current_available: number, change: number, max_capacity: number) => number;
export declare const generateDateRange: (start_date: string, end_date: string) => string[];
export declare const isDateInPast: (date: string) => boolean;
export declare const isDateToday: (date: string) => boolean;
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
export declare const getDatePricing: (base_price: number, date: string, seasonal_pricing?: SeasonalPricing) => DatePricingInfo;
export interface InventoryError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export declare const INVENTORY_ERROR_CODES: {
    readonly INVENTORY_NOT_FOUND: "INVENTORY_NOT_FOUND";
    readonly INSUFFICIENT_CAPACITY: "INSUFFICIENT_CAPACITY";
    readonly DATE_IN_PAST: "DATE_IN_PAST";
    readonly INVALID_CAPACITY: "INVALID_CAPACITY";
    readonly RESERVATION_EXPIRED: "RESERVATION_EXPIRED";
    readonly RESERVATION_CONFLICT: "RESERVATION_CONFLICT";
    readonly BULK_UPDATE_LIMIT_EXCEEDED: "BULK_UPDATE_LIMIT_EXCEEDED";
    readonly SEASONAL_PRICING_CONFLICT: "SEASONAL_PRICING_CONFLICT";
};
export { validateInventorySlot, validateDateRange, calculateUtilization, isSlotAvailable, getAvailableSpots, calculateNewAvailableCount, generateDateRange, isDateInPast, isDateToday, getDatePricing };
//# sourceMappingURL=inventory.d.ts.map