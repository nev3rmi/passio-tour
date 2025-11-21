import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tourService } from '@/services/tourService'
import { Tour, TourDetail, TourSearchParams, TourSearchResponse } from '@/types/tour'
import React from 'react'

export const useTours = (params?: TourSearchParams) => {
  return useQuery<TourSearchResponse, Error>({
    queryKey: ['tours', params],
    queryFn: () => tourService.searchTours(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useTour = (id: string) => {
  return useQuery<TourDetail, Error>({
    queryKey: ['tour', id],
    queryFn: () => tourService.getTourById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useCreateTour = () => {
  const queryClient = useQueryClient()
  
  return useMutation<Tour, Error, Partial<Tour>>({
    mutationFn: (tourData) => tourService.createTour(tourData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] })
    },
  })
}

export const useUpdateTour = () => {
  const queryClient = useQueryClient()
  
  return useMutation<Tour, Error, { id: string; data: Partial<Tour> }>({
    mutationFn: ({ id, data }) => tourService.updateTour(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tours'] })
      queryClient.invalidateQueries({ queryKey: ['tour', data.id] })
    },
  })
}

export const useDeleteTour = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: (id) => tourService.deleteTour(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] })
    },
  })
}

export const useTourStats = () => {
  const { data, isLoading, error } = useTours({ limit: 1000 })
  
  const stats = React.useMemo(() => {
    if (!data?.tours) {
      return {
        totalTours: 0,
        averagePrice: 0,
        tourTypes: {} as Record<string, number>,
        destinations: [] as string[],
      }
    }
    
    const totalTours = data.tours.length
    const totalPrice = data.tours.reduce((sum, tour) => sum + (tour.base_price || 0), 0)
    const averagePrice = totalPrice / totalTours
    
    const tourTypes = data.tours.reduce((acc, tour) => {
      const tourType = tour.type || tour.tour_type || 'UNKNOWN'
      acc[tourType] = (acc[tourType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const destinations = Array.from(new Set(data.tours.map(tour => tour.destination).filter(Boolean))) as string[]
    
    return {
      totalTours,
      averagePrice,
      tourTypes,
      destinations,
    }
  }, [data])
  
  return {
    stats,
    isLoading,
    error,
  }
}