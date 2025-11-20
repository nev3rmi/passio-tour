// Tour Management System - Seasonal Pricing Types and Interfaces
// Date: 2025-11-19 | Feature: Tour Management System MVP

export interface SeasonalPricing {
  pricing_id: string;
  tour_id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_modifier: number; // Percentage modifier (+/-)
  minimum_participants?: number;
  maximum_participants?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonalPricing {
  tour_id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_modifier: number;
  minimum_participants?: number;
  maximum_participants?: number;
  is_active?: boolean;
}

export interface UpdateSeasonalPricing {
  season_name?: string;
  start_date?: string;
  end_date?: string;
  price_modifier?: number;
  minimum_participants?: number;
  maximum_participants?: number;
  is_active?: boolean;
}

export interface SeasonalPricingResponse {
  success: boolean;
  data: SeasonalPricing;
  message?: string;
}

export interface SeasonalPricingSearchResponse {
  success: boolean;
  data: {
    seasonal_pricing: SeasonalPricing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

// Common season names
export const COMMON_SEASONS = [
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
] as const;

// Validation constraints
export const SEASONAL_PRICING_CONSTRAINTS = {
  MIN_PRICE_MODIFIER: -50, // -50%
  MAX_PRICE_MODIFIER: 200, // +200%
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 1000,
  MAX_SEASONS_PER_TOUR: 10,
  MIN_SEASON_DURATION_DAYS: 1,
  MAX_SEASON_DURATION_DAYS: 365
} as const;

// Utility functions
export const validateSeasonalPricing = (
  start_date: string,
  end_date: string,
  price_modifier: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Date validation
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (start >= end) {
    errors.push('Start date must be before end date');
  }

  if (end < new Date()) {
    errors.push('End date cannot be in the past');
  }

  // Price modifier validation
  if (price_modifier < SEASONAL_PRICING_CONSTRAINTS.MIN_PRICE_MODIFIER) {
    errors.push(`Price modifier cannot be less than ${SEASONAL_PRICING_CONSTRAINTS.MIN_PRICE_MODIFIER}%`);
  }

  if (price_modifier > SEASONAL_PRICING_CONSTRAINTS.MAX_PRICE_MODIFIER) {
    errors.push(`Price modifier cannot be greater than ${SEASONAL_PRICING_CONSTRAINTS.MAX_PRICE_MODIFIER}%`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isDateInSeason = (
  date: string,
  season: SeasonalPricing
): boolean => {
  const checkDate = new Date(date);
  const startDate = new Date(season.start_date);
  const endDate = new Date(season.end_date);

  return checkDate >= startDate && checkDate <= endDate;
};

export const getActiveSeasonsForDate = (
  date: string,
  seasons: SeasonalPricing[]
): SeasonalPricing[] => {
  return seasons.filter(season => 
    season.is_active && isDateInSeason(date, season)
  );
};

export const calculateSeasonalPrice = (
  base_price: number,
  date: string,
  seasons: SeasonalPricing[]
): { adjusted_price: number; applied_seasons: SeasonalPricing[] } => {
  const activeSeasons = getActiveSeasonsForDate(date, seasons);
  let adjusted_price = base_price;
  const applied_seasons: SeasonalPricing[] = [];

  for (const season of activeSeasons) {
    const modifier = season.price_modifier / 100;
    const priceAdjustment = base_price * modifier;
    adjusted_price += priceAdjustment;
    applied_seasons.push(season);
  }

  return { adjusted_price, applied_seasons };
};

// Export utility functions
export {
  validateSeasonalPricing,
  isDateInSeason,
  getActiveSeasonsForDate,
  calculateSeasonalPrice
};
