"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVENTORY_ERROR_CODES = exports.getDatePricing = exports.isDateToday = exports.isDateInPast = exports.generateDateRange = exports.calculateNewAvailableCount = exports.getAvailableSpots = exports.isSlotAvailable = exports.calculateUtilization = exports.validateDateRange = exports.validateInventorySlot = exports.BOOKING_STATES = exports.INVENTORY_CONSTRAINTS = void 0;
exports.INVENTORY_CONSTRAINTS = {
    MIN_PARTICIPANTS: 1,
    MAX_PARTICIPANTS: 1000,
    MIN_MAX_CAPACITY: 1,
    MAX_MAX_CAPACITY: 10000,
    RESERVATION_EXPIRY_HOURS: 24,
    BULK_UPDATE_MAX_DATES: 365,
    MIN_ADVANCE_BOOKING_DAYS: 0,
    MAX_ADVANCE_BOOKING_DAYS: 365
};
exports.BOOKING_STATES = {
    RESERVED: 'reserved',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
};
const validateInventorySlot = (available_count, max_capacity) => {
    const errors = [];
    if (available_count < exports.INVENTORY_CONSTRAINTS.MIN_PARTICIPANTS) {
        errors.push(`Available count must be at least ${exports.INVENTORY_CONSTRAINTS.MIN_PARTICIPANTS}`);
    }
    if (available_count > max_capacity) {
        errors.push('Available count cannot exceed maximum capacity');
    }
    if (max_capacity < exports.INVENTORY_CONSTRAINTS.MIN_MAX_CAPACITY) {
        errors.push(`Maximum capacity must be at least ${exports.INVENTORY_CONSTRAINTS.MIN_MAX_CAPACITY}`);
    }
    if (max_capacity > exports.INVENTORY_CONSTRAINTS.MAX_MAX_CAPACITY) {
        errors.push(`Maximum capacity cannot exceed ${exports.INVENTORY_CONSTRAINTS.MAX_MAX_CAPACITY}`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateInventorySlot = validateInventorySlot;
const validateDateRange = (start_date, end_date) => {
    const errors = [];
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
    if (daysDiff > exports.INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES) {
        errors.push(`Date range cannot exceed ${exports.INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES} days`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateDateRange = validateDateRange;
const calculateUtilization = (booked, max_capacity) => {
    return max_capacity > 0 ? (booked / max_capacity) * 100 : 0;
};
exports.calculateUtilization = calculateUtilization;
const isSlotAvailable = (available_count, requested_participants) => {
    return available_count >= requested_participants;
};
exports.isSlotAvailable = isSlotAvailable;
const getAvailableSpots = (inventory) => {
    return inventory.available_count;
};
exports.getAvailableSpots = getAvailableSpots;
const calculateNewAvailableCount = (current_available, change, max_capacity) => {
    const new_count = current_available + change;
    return Math.max(0, Math.min(new_count, max_capacity));
};
exports.calculateNewAvailableCount = calculateNewAvailableCount;
const generateDateRange = (start_date, end_date) => {
    const dates = [];
    const start = new Date(start_date);
    const end = new Date(end_date);
    const current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};
exports.generateDateRange = generateDateRange;
const isDateInPast = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
};
exports.isDateInPast = isDateInPast;
const isDateToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
};
exports.isDateToday = isDateToday;
const getDatePricing = (base_price, date, seasonal_pricing) => {
    let adjusted_price = base_price;
    const pricing_rules = {};
    if (seasonal_pricing) {
        const adjustment = base_price * (seasonal_pricing.price_modifier / 100);
        adjusted_price = base_price + adjustment;
        pricing_rules.seasonal_pricing = seasonal_pricing;
    }
    const daysUntilTour = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilTour > 30) {
        pricing_rules.advance_booking_bonus = 5;
        adjusted_price = adjusted_price * 0.95;
    }
    if (daysUntilTour <= 7 && daysUntilTour >= 0) {
        pricing_rules.last_minute_discount = 10;
        adjusted_price = adjusted_price * 0.90;
    }
    return {
        date,
        base_price,
        adjusted_price,
        currency: 'USD',
        pricing_rules
    };
};
exports.getDatePricing = getDatePricing;
exports.INVENTORY_ERROR_CODES = {
    INVENTORY_NOT_FOUND: 'INVENTORY_NOT_FOUND',
    INSUFFICIENT_CAPACITY: 'INSUFFICIENT_CAPACITY',
    DATE_IN_PAST: 'DATE_IN_PAST',
    INVALID_CAPACITY: 'INVALID_CAPACITY',
    RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
    RESERVATION_CONFLICT: 'RESERVATION_CONFLICT',
    BULK_UPDATE_LIMIT_EXCEEDED: 'BULK_UPDATE_LIMIT_EXCEEDED',
    SEASONAL_PRICING_CONFLICT: 'SEASONAL_PRICING_CONFLICT'
};
//# sourceMappingURL=inventory.js.map