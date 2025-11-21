'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth(true) // Require authentication

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <main className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </main>
      </LayoutWrapper>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <LayoutWrapper user={user} background="white">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600 mt-2">No active tours yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600 mt-2">Total bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">$0</p>
              <p className="text-sm text-gray-600 mt-2">Total revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={() => router.push('/tours/create')}>Create New Tour</Button>
              <Button variant="outline">View Bookings</Button>
              <Button variant="outline">Reports</Button>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </LayoutWrapper>
  )
}
