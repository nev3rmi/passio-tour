export declare enum TourType {
    INBOUND_SERVICE = "inbound_service",
    OUTBOUND_PACKAGE = "outbound_package"
}
export declare enum DifficultyLevel {
    EASY = "easy",
    MODERATE = "moderate",
    CHALLENGING = "challenging"
}
export declare enum TourStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive",
    ARCHIVED = "archived"
}
export declare enum TourCategory {
    CULTURAL = "cultural",
    ADVENTURE = "adventure",
    MUSEUM = "museum",
    HISTORICAL = "historical",
    FOOD = "food",
    NATURE = "nature",
    URBAN = "urban",
    RELIGIOUS = "religious",
    ENTERTAINMENT = "entertainment",
    SPORTS = "sports",
    WELLNESS = "wellness",
    SHOPPING = "shopping"
}
export interface TourImage {
    image_id: string;
    tour_id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
    display_order: number;
    created_at?: string;
}
export interface SupplierInfo {
    supplier_id?: string;
    supplier_name?: string;
    contact_email?: string;
    contact_phone?: string;
    commission_rate?: number;
    payment_terms?: string;
}
export interface TourSummary {
    tour_id: string;
    name: string;
    short_description?: string;
    destination: string;
    category: string;
    type: TourType;
    base_price: number;
    currency: string;
    duration_hours: number;
    min_participants: number;
    max_participants: number;
    images: TourImage[];
    rating?: number;
    review_count?: number;
    status?: TourStatus;
}
export interface TourCreate {
    name: string;
    description: string;
    short_description?: string;
    type: TourType;
    category: string;
    destination: string;
    duration_hours: number;
    min_participants: number;
    max_participants: number;
    base_price: number;
    currency: string;
    difficulty_level?: DifficultyLevel;
    languages?: string[];
    inclusions?: string[];
    exclusions?: string[];
    meeting_point?: string;
    requirements?: string[];
    cancellation_policy?: string;
    supplier_info?: SupplierInfo;
    images?: Omit<TourImage, 'image_id' | 'tour_id'>[];
}
export interface TourUpdate {
    name?: string;
    description?: string;
    short_description?: string;
    category?: string;
    destination?: string;
    duration_hours?: number;
    min_participants?: number;
    max_participants?: number;
    base_price?: number;
    currency?: string;
    difficulty_level?: DifficultyLevel;
    languages?: string[];
    inclusions?: string[];
    exclusions?: string[];
    meeting_point?: string;
    requirements?: string[];
    cancellation_policy?: string;
    supplier_info?: SupplierInfo;
    status?: TourStatus;
    images?: Omit<TourImage, 'image_id' | 'tour_id'>[];
}
export interface Tour extends TourSummary {
    description: string;
    difficulty_level?: DifficultyLevel;
    languages: string[];
    inclusions: string[];
    exclusions: string[];
    meeting_point?: string;
    requirements: string[];
    cancellation_policy?: string;
    supplier_info?: SupplierInfo;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface TourDetail extends Tour {
    availability_summary?: {
        next_available_date?: string;
        available_dates_count?: number;
        price_range?: {
            min: number;
            max: number;
        };
    };
    supplier_info?: SupplierInfo;
}
export interface TourSearchFilters {
    search?: string;
    destination?: string;
    category?: string;
    type?: TourType;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    end_date?: string;
    participants?: number;
    difficulty_level?: DifficultyLevel;
    languages?: string[];
    min_rating?: number;
    max_duration?: number;
    min_duration?: number;
}
export interface TourSearchParams extends TourSearchFilters {
    page?: number;
    limit?: number;
    sort_by?: 'name' | 'price' | 'rating' | 'duration' | 'created_at';
    sort_order?: 'asc' | 'desc';
}
export interface TourSearchResponse {
    tours: TourSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        destinations: string[];
        categories: string[];
        price_range: {
            min: number;
            max: number;
        };
    };
    sort_options: {
        field: string;
        label: string;
    }[];
}
export interface PriceRange {
    min: number;
    max: number;
    currency: string;
}
export interface TourStats {
    total_tours: number;
    active_tours: number;
    draft_tours: number;
    archived_tours: number;
    average_price: number;
    average_rating: number;
    total_reviews: number;
    most_popular_destination: string;
    most_popular_category: string;
}
export interface PopularTours {
    ranking_id: string;
    date: string;
    tour_id: string;
    booking_count: number;
    revenue: number;
    rank_position: number;
    created_at: string;
}
export interface TourAvailabilitySlot {
    tour_id: string;
    date: string;
    available_count: number;
    max_capacity: number;
    is_available: boolean;
    base_price?: number;
    notes?: string;
}
export interface TourFormData extends TourCreate {
}
export interface TourSearchFormData {
    search: string;
    destination: string;
    category: string;
    participants: number;
    travel_date: string;
    price_range: [number, number];
    duration_range: [number, number];
    difficulty_level?: DifficultyLevel;
    languages?: string[];
    sort_by: string;
    sort_order: 'asc' | 'desc';
}
export type TourCreateInput = TourCreate;
export type TourUpdateInput = TourUpdate;
export type TourSearchInput = TourSearchParams;
export type TourListItem = TourSummary;
export type TourDetailItem = TourDetail;
export interface CreateTourResponse {
    success: boolean;
    data: Tour;
    message?: string;
}
export interface UpdateTourResponse {
    success: boolean;
    data: Tour;
    message?: string;
}
export interface GetTourResponse {
    success: boolean;
    data: TourDetail;
    message?: string;
}
export interface SearchToursResponse {
    success: boolean;
    data: TourSearchResponse;
    message?: string;
}
export interface DeleteTourResponse {
    success: boolean;
    message: string;
}
export interface TourError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export declare const DEFAULT_TOUR_LIMITS: {
    readonly MIN_NAME_LENGTH: 3;
    readonly MAX_NAME_LENGTH: 255;
    readonly MIN_DESCRIPTION_LENGTH: 10;
    readonly MAX_DESCRIPTION_LENGTH: 2000;
    readonly MIN_SHORT_DESCRIPTION_LENGTH: 10;
    readonly MAX_SHORT_DESCRIPTION_LENGTH: 500;
    readonly MIN_PRICE: 0;
    readonly MAX_PRICE: 10000;
    readonly MIN_PARTICIPANTS: 1;
    readonly MAX_PARTICIPANTS: 500;
    readonly MIN_DURATION_HOURS: 0.5;
    readonly MAX_DURATION_HOURS: 72;
    readonly MIN_LANGUAGE_LENGTH: 2;
    readonly MAX_LANGUAGE_LENGTH: 5;
    readonly MAX_LANGUAGES: 10;
    readonly MAX_INCLUSIONS: 20;
    readonly MAX_EXCLUSIONS: 20;
    readonly MAX_REQUIREMENTS: 10;
    readonly MAX_IMAGES: 20;
};
export declare const SUPPORTED_CURRENCIES: readonly ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL"];
export declare const SUPPORTED_LANGUAGES: readonly ["en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi"];
export declare const TOUR_CATEGORIES: TourCategory[];
export declare const DIFFICULTY_LEVELS: DifficultyLevel[];
export declare const TOUR_TYPES: TourType[];
export declare const TOUR_STATUSES: TourStatus[];
export declare const validateTourName: (name: string) => boolean;
export declare const validateTourPrice: (price: number) => boolean;
export declare const validateParticipantRange: (min: number, max: number) => boolean;
export declare const validateDuration: (duration: number) => boolean;
export declare const isValidCurrency: (currency: string) => currency is "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "CNY" | "INR" | "BRL" | "CHF";
export declare const isValidLanguage: (language: string) => language is "en" | "es" | "fr" | "de" | "it" | "pt" | "ru" | "zh" | "ja" | "ko" | "ar" | "hi";
export declare const DEFAULT_TOUR_VALUES: {
    readonly status: TourStatus.DRAFT;
    readonly difficulty_level: DifficultyLevel.MODERATE;
    readonly languages: readonly ["en"];
    readonly inclusions: readonly [];
    readonly exclusions: readonly [];
    readonly requirements: readonly [];
    readonly images: readonly [];
};
export type { TourCreateInput, TourUpdateInput, TourSearchInput, TourListItem, TourDetailItem };
//# sourceMappingURL=tour.d.ts.map