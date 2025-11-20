'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">Passio Tour</div>
          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/tours">Tours</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto py-12">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Tours <span className="text-blue-600">Effortlessly</span> 🚀
          </h1>
          <p className="text-sm text-green-600 font-semibold">✅ Hot Reload Working!</p>
          <p className="text-xl text-gray-600 mb-10">
            The all-in-one platform for Destination Management Companies and Tour Operators
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/tours">Browse Tours</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
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

      <footer className="bg-gray-100 py-8 mt-12">
        <div className="container mx-auto text-center text-gray-600">
          <p>© {new Date().getFullYear()} Passio Tour. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}