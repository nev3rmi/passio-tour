export interface SeasonalPricing {
    pricing_id: string;
    tour_id: string;
    season_name: string;
    start_date: string;
    end_date: string;
    price_modifier: number;
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
export declare const COMMON_SEASONS: readonly ["High Season", "Low Season", "Peak Season", "Shoulder Season", "Winter", "Spring", "Summer", "Autumn", "Holiday Season", "Weekend", "Weekday"];
export declare const SEASONAL_PRICING_CONSTRAINTS: {
    readonly MIN_PRICE_MODIFIER: -50;
    readonly MAX_PRICE_MODIFIER: 200;
    readonly MIN_PARTICIPANTS: 1;
    readonly MAX_PARTICIPANTS: 1000;
    readonly MAX_SEASONS_PER_TOUR: 10;
    readonly MIN_SEASON_DURATION_DAYS: 1;
    readonly MAX_SEASON_DURATION_DAYS: 365;
};
export declare const validateSeasonalPricing: (start_date: string, end_date: string, price_modifier: number) => {
    isValid: boolean;
    errors: string[];
};
export declare const isDateInSeason: (date: string, season: SeasonalPricing) => boolean;
export declare const getActiveSeasonsForDate: (date: string, seasons: SeasonalPricing[]) => SeasonalPricing[];
export declare const calculateSeasonalPrice: (base_price: number, date: string, seasons: SeasonalPricing[]) => {
    adjusted_price: number;
    applied_seasons: SeasonalPricing[];
};
export { validateSeasonalPricing, isDateInSeason, getActiveSeasonsForDate, calculateSeasonalPrice };
//# sourceMappingURL=seasonal-pricing.d.ts.map