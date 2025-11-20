"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSeasonalPrice = exports.getActiveSeasonsForDate = exports.isDateInSeason = exports.validateSeasonalPricing = exports.SEASONAL_PRICING_CONSTRAINTS = exports.COMMON_SEASONS = void 0;
exports.COMMON_SEASONS = [
    'High Season',
    'Low Season',
    'Peak Season',
    'Shoulder Season',
    'Winter',
    'Spring',
    'Summer',
    'Autumn',
    'Holiday Season',
    'Weekend',
    'Weekday'
];
exports.SEASONAL_PRICING_CONSTRAINTS = {
    MIN_PRICE_MODIFIER: -50,
    MAX_PRICE_MODIFIER: 200,
    MIN_PARTICIPANTS: 1,
    MAX_PARTICIPANTS: 1000,
    MAX_SEASONS_PER_TOUR: 10,
    MIN_SEASON_DURATION_DAYS: 1,
    MAX_SEASON_DURATION_DAYS: 365
};
const validateSeasonalPricing = (start_date, end_date, price_modifier) => {
    const errors = [];
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start >= end) {
        errors.push('Start date must be before end date');
    }
    if (end < new Date()) {
        errors.push('End date cannot be in the past');
    }
    if (price_modifier < exports.SEASONAL_PRICING_CONSTRAINTS.MIN_PRICE_MODIFIER) {
        errors.push(`Price modifier cannot be less than ${exports.SEASONAL_PRICING_CONSTRAINTS.MIN_PRICE_MODIFIER}%`);
    }
    if (price_modifier > exports.SEASONAL_PRICING_CONSTRAINTS.MAX_PRICE_MODIFIER) {
        errors.push(`Price modifier cannot be greater than ${exports.SEASONAL_PRICING_CONSTRAINTS.MAX_PRICE_MODIFIER}%`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateSeasonalPricing = validateSeasonalPricing;
const isDateInSeason = (date, season) => {
    const checkDate = new Date(date);
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);
    return checkDate >= startDate && checkDate <= endDate;
};
exports.isDateInSeason = isDateInSeason;
const getActiveSeasonsForDate = (date, seasons) => {
    return seasons.filter(season => season.is_active && (0, exports.isDateInSeason)(date, season));
};
exports.getActiveSeasonsForDate = getActiveSeasonsForDate;
const calculateSeasonalPrice = (base_price, date, seasons) => {
    const activeSeasons = (0, exports.getActiveSeasonsForDate)(date, seasons);
    let adjusted_price = base_price;
    const applied_seasons = [];
    for (const season of activeSeasons) {
        const modifier = season.price_modifier / 100;
        const priceAdjustment = base_price * modifier;
        adjusted_price += priceAdjustment;
        applied_seasons.push(season);
    }
    return { adjusted_price, applied_seasons };
};
exports.calculateSeasonalPrice = calculateSeasonalPrice;
//# sourceMappingURL=seasonal-pricing.js.map