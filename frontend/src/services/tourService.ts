import { Tour, TourDetail, TourSearchParams, TourSearchResponse } from '@/types/tour'
import apiClient, { ApiResponse } from '@/lib/api-client'

class TourService {

  async searchTours(params: TourSearchParams = {}): Promise<TourSearchResponse> {
    try {
      const response = await apiClient.get<ApiResponse<TourSearchResponse>>('/tours', {
        params,
      })

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to fetch tours')
    } catch (error: any) {
      console.error('Search tours error:', error)
      throw new Error(error.message || 'Failed to fetch tours')
    }
  }

  async getTourById(id: string): Promise<TourDetail> {
    try {
      const response = await apiClient.get<ApiResponse<TourDetail>>(`/tours/${id}`)

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to fetch tour')
    } catch (error: any) {
      console.error('Get tour by ID error:', error)
      throw new Error(error.message || 'Failed to fetch tour')
    }
  }

  async createTour(tourData: Partial<Tour>): Promise<Tour> {
    try {
      const response = await apiClient.post<ApiResponse<Tour>>('/tours', tourData)

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to create tour')
    } catch (error: any) {
      console.error('Create tour error:', error)
      throw new Error(error.message || 'Failed to create tour')
    }
  }

  async updateTour(id: string, tourData: Partial<Tour>): Promise<Tour> {
    try {
      const response = await apiClient.put<ApiResponse<Tour>>(`/tours/${id}`, tourData)

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to update tour')
    } catch (error: any) {
      console.error('Update tour error:', error)
      throw new Error(error.message || 'Failed to update tour')
    }
  }

  async deleteTour(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/tours/${id}`)

      if (!response.data.success) {
        throw new Error('Failed to delete tour')
      }
    } catch (error: any) {
      console.error('Delete tour error:', error)
      throw new Error(error.message || 'Failed to delete tour')
    }
  }

  /**
   * Get featured tours
   */
  async getFeaturedTours(limit: number = 10): Promise<Tour[]> {
    try {
      const response = await apiClient.get<ApiResponse<Tour[]>>('/tours/featured', {
        params: { limit },
      })

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to fetch featured tours')
    } catch (error: any) {
      console.error('Get featured tours error:', error)
      throw new Error(error.message || 'Failed to fetch featured tours')
    }
  }

  /**
   * Get popular tours
   */
  async getPopularTours(limit: number = 10, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<Tour[]> {
    try {
      const response = await apiClient.get<ApiResponse<Tour[]>>('/tours/popular', {
        params: { limit, timeframe },
      })

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      throw new Error('Failed to fetch popular tours')
    } catch (error: any) {
      console.error('Get popular tours error:', error)
      throw new Error(error.message || 'Failed to fetch popular tours')
    }
  }
}

export const tourService = new TourService()