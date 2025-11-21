import { Tour, TourDetail, TourSearchParams, TourSearchResponse } from '@/types/tour'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
}

class TourService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || 'Request failed')
    }
    
    return response.json()
  }

  async searchTours(params: TourSearchParams = {}): Promise<TourSearchResponse> {
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    
    const endpoint = `/tours${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request<ApiResponse<TourSearchResponse>>(endpoint)
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch tours')
    }
    
    return response.data
  }

  async getTourById(id: string): Promise<TourDetail> {
    const response = await this.request<ApiResponse<TourDetail>>(`/tours/${id}`)
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch tour')
    }
    
    return response.data
  }

  async createTour(tourData: Partial<Tour>): Promise<Tour> {
    const token = localStorage.getItem('token')
    
    const response = await this.request<ApiResponse<Tour>>('/tours', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tourData),
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create tour')
    }
    
    return response.data
  }

  async updateTour(id: string, tourData: Partial<Tour>): Promise<Tour> {
    const token = localStorage.getItem('token')
    
    const response = await this.request<ApiResponse<Tour>>(`/tours/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tourData),
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update tour')
    }
    
    return response.data
  }

  async deleteTour(id: string): Promise<void> {
    const token = localStorage.getItem('token')
    
    const response = await this.request<ApiResponse<void>>(`/tours/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete tour')
    }
  }
}

export const tourService = new TourService()