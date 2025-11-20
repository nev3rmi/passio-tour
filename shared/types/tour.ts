// Tour Management System - Tour Types and Interfaces
// Date: 2025-11-19 | Feature: Tour Management System MVP

export enum TourType {
  INBOUND_SERVICE = 'inbound_service',
  OUTBOUND_PACKAGE = 'outbound_package'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MODERATE = 'moderate',
  CHALLENGING = 'challenging'
}

export enum TourStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum TourCategory {
  CULTURAL = 'cultural',
  ADVENTURE = 'adventure',
  MUSEUM = 'museum',
  HISTORICAL = 'historical',
  FOOD = 'food',
  NATURE = 'nature',
  URBAN = 'urban',
  RELIGIOUS = 'religious',
  ENTERTAINMENT = 'entertainment',
  SPORTS = 'sports',
  WELLNESS = 'wellness',
  SHOPPING = 'shopping'
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
  commission_rate?: number; // Percentage
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

// Form validation schemas
export interface TourFormData extends TourCreate {
  // Form-specific extensions
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

// Utility types
export type TourCreateInput = TourCreate;
export type TourUpdateInput = TourUpdate;
export type TourSearchInput = TourSearchParams;
export type TourListItem = TourSummary;
export type TourDetailItem = TourDetail;

// API Response types
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

// Constants
export const DEFAULT_TOUR_LIMITS = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_SHORT_DESCRIPTION_LENGTH: 10,
  MAX_SHORT_DESCRIPTION_LENGTH: 500,
  MIN_PRICE: 0,
  MAX_PRICE: 10000,
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 500,
  MIN_DURATION_HOURS: 0.5,
  MAX_DURATION_HOURS: 72,
  MIN_LANGUAGE_LENGTH: 2,
  MAX_LANGUAGE_LENGTH: 5,
  MAX_LANGUAGES: 10,
  MAX_INCLUSIONS: 20,
  MAX_EXCLUSIONS: 20,
  MAX_REQUIREMENTS: 10,
  MAX_IMAGES: 20
} as const;

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL'
] as const;

export const SUPPORTED_LANGUAGES = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'
] as const;

export const TOUR_CATEGORIES = Object.values(TourCategory);

export const DIFFICULTY_LEVELS = Object.values(DifficultyLevel);

export const TOUR_TYPES = Object.values(TourType);

export const TOUR_STATUSES = Object.values(TourStatus);

// Validation helpers
export const validateTourName = (name: string): boolean => {
  return name.length >= DEFAULT_TOUR_LIMITS.MIN_NAME_LENGTH && 
         name.length <= DEFAULT_TOUR_LIMITS.MAX_NAME_LENGTH;
};

export const validateTourPrice = (price: number): boolean => {
  return price >= DEFAULT_TOUR_LIMITS.MIN_PRICE && 
         price <= DEFAULT_TOUR_LIMITS.MAX_PRICE;
};

export const validateParticipantRange = (min: number, max: number): boolean => {
  return min >= DEFAULT_TOUR_LIMITS.MIN_PARTICIPANTS && 
         max <= DEFAULT_TOUR_LIMITS.MAX_PARTICIPANTS &&
         min <= max;
};

export const validateDuration = (duration: number): boolean => {
  return duration >= DEFAULT_TOUR_LIMITS.MIN_DURATION_HOURS && 
         duration <= DEFAULT_TOUR_LIMITS.MAX_DURATION_HOURS;
};

export const isValidCurrency = (currency: string): currency is typeof SUPPORTED_CURRENCIES[number] => {
  return SUPPORTED_CURRENCIES.includes(currency as any);
};

export const isValidLanguage = (language: string): language is typeof SUPPORTED_LANGUAGES[number] => {
  return SUPPORTED_LANGUAGES.includes(language as any);
};

// Default values
export const DEFAULT_TOUR_VALUES = {
  status: TourStatus.DRAFT,
  difficulty_level: DifficultyLevel.MODERATE,
  languages: ['en'],
  inclusions: [],
  exclusions: [],
  requirements: [],
  images: []
} as const;

// Export all types for easy importing
export type {
  TourCreateInput,
  TourUpdateInput,
  TourSearchInput,
  TourListItem,
  TourDetailItem
};
