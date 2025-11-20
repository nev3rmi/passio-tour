import { BaseEntity, UserRole, EntityStatus, NotificationPreferences, Address } from './index';
export interface User extends BaseEntity {
    email: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    status: EntityStatus;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    language: string;
    timezone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLoginAt?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
    preferences: UserPreferences;
    addresses: UserAddress[];
    emergencyContacts: EmergencyContact[];
    metadata?: Record<string, any>;
}
export interface UserPreferences extends NotificationPreferences {
    currency: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    theme: 'light' | 'dark' | 'system';
    marketingOptIn: boolean;
    dataSharingOptIn: boolean;
}
export interface UserAddress extends Address {
    id: string;
    userId: string;
    type: 'home' | 'work' | 'billing' | 'shipping';
    isDefault: boolean;
    label?: string;
}
export interface EmergencyContact {
    id: string;
    userId: string;
    fullName: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
}
export interface CreateUserRequest {
    email: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    password: string;
    role?: UserRole;
    phone?: string;
    dateOfBirth?: string;
    language?: string;
    timezone?: string;
    marketingOptIn?: boolean;
}
export interface UpdateUserRequest {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    language?: string;
    timezone?: string;
    preferences?: Partial<UserPreferences>;
}
export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface RegisterRequest extends CreateUserRequest {
    confirmPassword: string;
    agreeToTerms: boolean;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}
export interface LoginResponse {
    user: Omit<User, 'password' | 'passwordHash'>;
    tokens: AuthTokens;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
export interface ChangeEmailRequest {
    newEmail: string;
    password: string;
}
export interface VerifyEmailRequest {
    token: string;
}
export interface ResendVerificationRequest {
    email: string;
}
export interface DeleteAccountRequest {
    password: string;
    confirmationText: string;
}
export interface UserStats {
    totalBookings: number;
    totalSpent: number;
    averageRating: number;
    memberSince: Date;
    lastBookingAt?: Date;
    favoriteDestinations: string[];
}
export interface UserSearchParams {
    query?: string;
    role?: UserRole;
    status?: EntityStatus;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    sortBy?: 'fullName' | 'email' | 'createdAt' | 'lastLoginAt';
    sortOrder?: 'asc' | 'desc';
}
export interface UserListResponse {
    users: Omit<User, 'password' | 'passwordHash'>[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface UserSession extends BaseEntity {
    userId: string;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastUsedAt?: Date;
}
export interface AuthenticatedRequest {
    user: User;
    token?: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
    iat: number;
    exp: number;
}
//# sourceMappingURL=user.d.ts.map