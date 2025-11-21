'use client'

import LayoutWrapper from '@/components/layout/LayoutWrapper'
import TourList from '@/components/tours/TourList'
import { H1, Lead } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function ToursPage() {
  return (
    <LayoutWrapper background="white">
      <main className="container mx-auto py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <H1>Browse Tours</H1>
              <Lead>Discover amazing experiences around the world</Lead>
            </div>
            <Button asChild size="lg">
              <Link href="/tours/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Tour
              </Link>
            </Button>
          </div>

          {/* Tours List */}
          <TourList 
            showViewToggle={true}
            showLoadMore={true}
          />
        </div>
      </main>
    </LayoutWrapper>
  )
}