import { create } from 'zustand'
import { authService, User } from '@/services/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login({ email, password })
      set({ user: response.user, isAuthenticated: true, error: null })
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed'
      set({ error: errorMessage, user: null, isAuthenticated: false })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register({ name, email, password })
      set({ user: response.user, isAuthenticated: true, error: null })
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed'
      set({ error: errorMessage, user: null, isAuthenticated: false })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
      set({ user: null, isAuthenticated: false, error: null })
    } catch (error: any) {
      console.error('Logout error:', error)
      // Still clear user even if logout API fails
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  getCurrentUser: async () => {
    if (!authService.isAuthenticated()) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const user = await authService.getCurrentUser()
      set({ user, isAuthenticated: true, error: null })
    } catch (error: any) {
      console.error('Get current user error:', error)
      set({ user: null, isAuthenticated: false, error: error.message })
      // Clear token if user fetch fails
      authService.logout()
    } finally {
      set({ isLoading: false })
    }
  },

  initialize: () => {
    // Check if user is authenticated on app load
    const token = authService.getToken()
    const storedUser = authService.getStoredUser()

    if (token && storedUser) {
      set({ user: storedUser, isAuthenticated: true })
      // Optionally fetch fresh user data in background
      get().getCurrentUser().catch(() => {
        // Silently fail, user will be logged out by getCurrentUser
      })
    } else {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
