'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { H4, Muted } from '@/components/ui/typography'
import { MapPin, Clock, Users, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Tour } from '@/types/tour'

interface TourCardProps {
  tour: Tour
  showActions?: boolean
}

export default function TourCard({ tour, showActions = true }: TourCardProps) {
  const primaryImage = tour.images?.find(img => img.is_primary) || tour.images?.[0]
  const rating = tour.rating || tour.average_rating || 0
  const reviewCount = tour.review_count || tour.total_reviews || 0
  const tourName = tour.name || tour.title
  const shortDesc = tour.short_description || tour.shortDescription
  const minPart = tour.min_participants || tour.group_size_min
  const maxPart = tour.max_participants || tour.group_size_max
  const durationHours = tour.duration_hours || tour.duration_days * 8

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase()
    switch (upperStatus) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PENDING_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="relative h-48 w-full">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text || tourName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-muted h-full w-full flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(tour.status)}>
            {getTypeLabel(tour.status)}
          </Badge>
        </div>
        {rating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <Muted className="text-xs">({reviewCount})</Muted>
            )}
          </div>
        )}
      </div>

      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <H4 className="line-clamp-2 flex-1">{tourName}</H4>
        </div>
        {tour.destination && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{tour.destination}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {shortDesc && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {shortDesc}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{durationHours} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {minPart}-{maxPart}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Muted className="text-xs">From</Muted>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">
                {tour.currency} {tour.base_price.toFixed(2)}
              </span>
              <Muted className="text-sm">per person</Muted>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {getTypeLabel(tour.type || tour.tour_type)}
          </Badge>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/tours/${tour.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}