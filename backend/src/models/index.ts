// Model exports
export { default as UserModel } from './UserModel'
export { default as TourModel } from './TourModel'

// Type exports for convenience
export type {
  CreateUserData,
  UpdateUserData,
  UserFilters,
  PaginationOptions,
  PaginatedResult
} from './UserModel'

export type {
  CreateTourData,
  UpdateTourData,
  TourFilters,
  PaginationOptions as TourPaginationOptions,
  PaginatedResult as TourPaginatedResult
} from './TourModel'