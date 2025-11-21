import apiClient, { ApiResponse } from '@/lib/api-client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  companyName?: string
  phone?: string
}

export interface User {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: string
  roles?: string[]
  company_name?: string
  phone?: string
  email_verified: boolean
  phone_verified?: boolean
  status: string
  created_at: string
  updated_at?: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresIn?: number
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials
      )

      if (response.data.success && response.data.data) {
        const authData = response.data.data

        // Store token
        if (authData.token) {
          localStorage.setItem('token', authData.token)
        }

        // Store user data
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user))
        }

        return authData
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        data
      )

      if (response.data.success && response.data.data) {
        const authData = response.data.data

        // Store token if auto-login
        if (authData.token) {
          localStorage.setItem('token', authData.token)
        }

        // Store user data
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user))
        }

        return authData
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Registration failed')
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await apiClient.post('/auth/logout').catch(() => {
        // Ignore errors on logout endpoint
      })
    } finally {
      // Always clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me')

      if (response.data.success && response.data.data) {
        const user = response.data.data

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(user))

        return user
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      console.error('Get current user error:', error)
      throw new Error(error.message || 'Failed to fetch user data')
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        '/auth/profile',
        data
      )

      if (response.data.success && response.data.data) {
        const user = response.data.data

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(user))

        return user
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error(error.message || 'Failed to update profile')
    }
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/auth/change-password',
        {
          currentPassword,
          newPassword,
        }
      )

      if (!response.data.success) {
        throw new Error('Failed to change password')
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      throw new Error(error.message || 'Failed to change password')
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/auth/forgot-password',
        { email }
      )

      if (!response.data.success) {
        throw new Error('Failed to send password reset email')
      }
    } catch (error: any) {
      console.error('Request password reset error:', error)
      throw new Error(error.message || 'Failed to send password reset email')
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/auth/reset-password',
        {
          token,
          password: newPassword,
        }
      )

      if (!response.data.success) {
        throw new Error('Failed to reset password')
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      throw new Error(error.message || 'Failed to reset password')
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/auth/verify-email',
        { token }
      )

      if (!response.data.success) {
        throw new Error('Failed to verify email')
      }
    } catch (error: any) {
      console.error('Verify email error:', error)
      throw new Error(error.message || 'Failed to verify email')
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('token')
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null

    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
}

export const authService = new AuthService()
