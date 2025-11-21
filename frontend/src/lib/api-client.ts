import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// Retry configuration
interface RetryConfig {
  retries: number
  retryDelay: number
  retryCount?: number
}

// API Response types
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// Create axios instance with retry configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Retry configuration per instance
const retryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000, // 1 second
}

// Helper function for exponential backoff
const getRetryDelay = (retryCount: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, retryCount), 10000) // Max 10 seconds
}

// Helper to check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network errors are retryable
    return true
  }

  // Retry on specific HTTP status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504]
  return retryableStatuses.includes(error.response.status)
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Return the data directly for successful responses
    return response
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as InternalAxiosRequestConfig & RetryConfig

    // Initialize retry count
    if (!config.retryCount) {
      config.retryCount = 0
    }

    // Check if we should retry
    const shouldRetry = isRetryableError(error) && config.retryCount < retryConfig.retries

    if (shouldRetry) {
      config.retryCount += 1
      const delay = getRetryDelay(config.retryCount - 1, retryConfig.retryDelay)

      console.log(`Retrying request (${config.retryCount}/${retryConfig.retries}) after ${delay}ms`)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry the request
      return apiClient(config)
    }

    // Handle different error scenarios (after retries exhausted)
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response

      // Handle 401 Unauthorized - redirect to login
      if (status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error('Forbidden: Insufficient permissions')
      }

      // Return structured error
      return Promise.reject({
        message: data?.error?.message || 'An error occurred',
        code: data?.error?.code || 'UNKNOWN_ERROR',
        details: data?.error?.details,
        status,
      })
    } else if (error.request) {
      // Request made but no response (after retries exhausted)
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      })
    } else {
      // Error in request configuration
      return Promise.reject({
        message: error.message || 'Request configuration error',
        code: 'REQUEST_ERROR',
        status: 0,
      })
    }
  }
)

export default apiClient
