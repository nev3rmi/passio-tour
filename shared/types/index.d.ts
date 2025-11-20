export * from './user';
export * from './tour';
export * from './booking';
export * from './payment';
export * from './api';
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FilterParams {
    [key: string]: string | number | boolean | undefined;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}
export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: any;
    timestamp: string;
}
export interface SuccessResponse<T = any> {
    success: true;
    data?: T;
    message?: string;
    timestamp: string;
}
export declare enum EntityStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DRAFT = "draft",
    ARCHIVED = "archived"
}
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed",
    NO_SHOW = "no_show"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum UserRole {
    CUSTOMER = "customer",
    ADMIN = "admin",
    TOUR_OPERATOR = "tour_operator",
    PARTNER = "partner"
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface Address {
    street?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates?: Coordinates;
}
export interface FileUpload {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    key?: string;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
}
export interface AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete';
    oldValues?: any;
    newValues?: any;
    userId?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
//# sourceMappingURL=index.d.ts.map