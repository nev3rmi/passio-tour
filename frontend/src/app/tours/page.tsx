'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, Users } from 'lucide-react'

interface Tour {
  id: string
  title: string
  slug: string
  description: string
  base_price: number
  type: string
  difficulty_level: string
  duration_days: number
  min_group_size: number
  max_group_size: number
  is_active: boolean
  operator: {
    full_name: string
  }
  images: Array<{
    url: string
    alt_text: string
    is_primary: boolean
  }>
  categories: Array<{
    category: {
      name: string
      slug: string
    }
  }>
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/tours')
        if (!response.ok) {
          throw new Error('Failed to fetch tours')
        }
        const data = await response.json()
        setTours(data.tours || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTours()
  }, [])

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'challenging':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'beach':
        return 'bg-blue-100 text-blue-800'
      case 'adventure':
        return 'bg-orange-100 text-orange-800'
      case 'cultural':
        return 'bg-purple-100 text-purple-800'
      case 'city':
        return 'bg-indigo-100 text-indigo-800'
      case 'historical':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tours...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Tours</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our carefully curated collection of tours designed to create unforgettable experiences.
        </p>
      </div>

      {/* Tours Grid */}
      {tours.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tours available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => {
            const primaryImage = tour.images.find(img => img.is_primary) || tour.images[0]
            
            return (
              <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {primaryImage && (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Tour Image</span>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getTypeColor(tour.type)}>
                      {tour.type.charAt(0).toUpperCase() + tour.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(tour.difficulty_level)}>
                      {tour.difficulty_level.charAt(0).toUpperCase() + tour.difficulty_level.slice(1)}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl mb-2">{tour.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    by {tour.operator.full_name}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {tour.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {tour.duration_days} day{tour.duration_days !== 1 ? 's' : ''}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {tour.min_group_size}-{tour.max_group_size} people
                    </div>

                    {tour.categories.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {tour.categories.map(cat => cat.category.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${tour.base_price}
                      <span className="text-sm font-normal text-gray-500">/person</span>
                    </div>
                    
                    <Link href={`/tours/${tour.slug}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}