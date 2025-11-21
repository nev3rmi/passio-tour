'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { H1, H2, Lead } from '@/components/ui/typography'
import Link from 'next/link'
import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function HomePage() {
  return (
    <LayoutWrapper background="gradient">
      <main className="container mx-auto py-12">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <H1 className="text-primary">
            Manage Your Tours <span className="text-blue-600">Effortlessly</span>
          </H1>
          <Lead>
            The all-in-one platform for Destination Management Companies and Tour Operators
          </Lead>
          <div className="flex justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/tours">Browse Tours</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20">
          <H2 className="text-center mb-12">Key Features</H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Tour Management</CardTitle>
                <CardDescription>Create and manage your tour offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Comprehensive tools to build, edit, and manage your tour inventory with ease.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Booking System</CardTitle>
                <CardDescription>Real-time booking and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Manage bookings seamlessly with real-time inventory tracking and notifications.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>Secure and integrated payments</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Accept payments through secure, integrated payment gateways instantly.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </LayoutWrapper>
  )
}