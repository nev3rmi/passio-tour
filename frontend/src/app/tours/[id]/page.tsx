'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'
import apiClient from '@/lib/api-client'
import {
  MapPin, Clock, Users, Calendar, DollarSign, Star,
  CheckCircle, XCircle, Share2, Heart
} from 'lucide-react'

interface Tour {
  id: string
  title: string
  name: string
  tour_type: string
  status: string
  short_description: string
  long_description?: string
  base_price: number
  currency: string
  duration_days: number
  duration_nights: number
  max_group_size?: number
  destination?: string
  images?: string[]
  rating?: number
  reviews_count?: number
  highlights?: string[]
  included?: string[]
  not_included?: string[]
}

export default function TourDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(1)

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/tours/${params.id}`)

        if (response.data.success) {
          setTour(response.data.data)
        } else {
          setError('Tour not found')
        }
      } catch (err: any) {
        console.error('Error fetching tour:', err)
        setError(err.message || 'Failed to load tour details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTour()
  }, [params.id])

  const handleBooking = () => {
    if (!selectedDate) {
      alert('Please select a date')
      return
    }
    // Navigate to booking page or show booking modal
    alert(`Booking ${guestCount} guest(s) for ${tour?.title} on ${selectedDate}`)
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-8">
          <TourDetailsSkeleton />
        </div>
      </LayoutWrapper>
    )
  }

  if (error || !tour) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tour Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The tour you are looking for does not exist.'}</p>
              <Button onClick={() => router.push('/tours')}>
                Back to Tours
              </Button>
            </div>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  const totalPrice = tour.base_price * guestCount

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tour.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                  tour.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tour.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tour.tour_type}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{tour.title}</h1>
              {tour.destination && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{tour.destination}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Rating */}
          {tour.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-semibold">{tour.rating}</span>
              </div>
              {tour.reviews_count && (
                <span className="text-gray-600">
                  ({tour.reviews_count} reviews)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {tour.images && tour.images.length > 0 ? (
                  <img
                    src={tour.images[0]}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">About This Tour</h2>
                <p className="text-gray-700 mb-4">{tour.short_description}</p>
                {tour.long_description && (
                  <p className="text-gray-600">{tour.long_description}</p>
                )}
              </CardContent>
            </Card>

            {/* Tour Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Tour Highlights</h2>
                  <ul className="space-y-2">
                    {tour.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* What's Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {tour.included && tour.included.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">What's Included</h3>
                    <ul className="space-y-2">
                      {tour.included.map((item, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {tour.not_included && tour.not_included.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">What's Not Included</h3>
                    <ul className="space-y-2">
                      {tour.not_included.map((item, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">
                      {tour.currency} {tour.base_price.toLocaleString()}
                    </span>
                    <span className="text-gray-600">per person</span>
                  </div>
                </div>

                {/* Tour Info */}
                <div className="space-y-4 mb-6 pb-6 border-b">
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-3 text-gray-400" />
                    <span>
                      {tour.duration_days} {tour.duration_days === 1 ? 'day' : 'days'}
                      {tour.duration_nights > 0 && ` / ${tour.duration_nights} ${tour.duration_nights === 1 ? 'night' : 'nights'}`}
                    </span>
                  </div>
                  {tour.max_group_size && (
                    <div className="flex items-center text-gray-700">
                      <Users className="h-5 w-5 mr-3 text-gray-400" />
                      <span>Max {tour.max_group_size} people</span>
                    </div>
                  )}
                </div>

                {/* Booking Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        id="guests"
                        min="1"
                        max={tour.max_group_size || 50}
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Price */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">
                      {tour.currency} {tour.base_price.toLocaleString()} × {guestCount} guest{guestCount > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold">
                      {tour.currency} {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{tour.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full mb-3"
                  size="lg"
                  onClick={handleBooking}
                >
                  Book Now
                </Button>

                <p className="text-xs text-center text-gray-600">
                  You won't be charged yet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

function TourDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
