'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * Custom hook to check authentication status
 * Automatically redirects to login if not authenticated
 */
export function useAuth(requireAuth: boolean = true): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsLoading(false)
        if (requireAuth) {
          router.push('/login')
        }
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Unauthorized')
        }

        const data = await response.json()
        setUser(data.user)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        localStorage.removeItem('token')
        setIsLoading(false)
        if (requireAuth) {
          router.push('/login')
        }
      }
    }

    checkAuth()
  }, [router, requireAuth])

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  }
}
