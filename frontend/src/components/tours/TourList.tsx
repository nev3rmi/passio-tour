'use client'

import { useState } from 'react'
import { useTours } from '@/hooks/useTours'
import TourCard from './TourCard'
import LoadingState from '@/components/layout/LoadingState'
import ErrorState from '@/components/layout/ErrorState'
import { Button } from '@/components/ui/button'
import { H2, Muted } from '@/components/ui/typography'
import { Grid, List } from 'lucide-react'
import { TourSearchParams } from '@/types/tour'

interface TourListProps {
  searchParams?: TourSearchParams
  showViewToggle?: boolean
  showLoadMore?: boolean
}

export default function TourList({ 
  searchParams = {}, 
  showViewToggle = true,
  showLoadMore = true 
}: TourListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  
  const params = { ...searchParams, page }
  const { data, isLoading, error, isFetching } = useTours(params)

  if (isLoading && page === 1) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error.message} />
  }

  if (!data || data.tours.length === 0) {
    return (
      <div className="text-center py-12">
        <Muted>No tours found matching your criteria.</Muted>
      </div>
    )
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  const hasMore = data.pagination.totalPages > page

  return (
    <div className="space-y-6">
      {showViewToggle && (
        <div className="flex items-center justify-between">
          <H2>Tours ({data.pagination.total})</H2>
          <div className="flex items-center gap-2">
            <Muted className="text-sm">View:</Muted>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }>
        {data.tours.map((tour) => (
          <div key={tour.id} className={viewMode === 'list' ? 'w-full' : ''}>
            <TourCard tour={tour} />
          </div>
        ))}
      </div>

      {showLoadMore && hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isFetching}
            variant="outline"
          >
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}