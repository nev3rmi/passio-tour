'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, User, LogOut, Settings, HelpCircle, ChevronDown } from 'lucide-react'

interface NavigationProps {
  user?: {
    id: string
    name: string
    email: string
    role?: string
  }
}

export default function Navigation({ user }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
    setIsMobileMenuOpen(false)
  }

  const isActive = (path: string) => pathname === path

  const navigationLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/tours', label: 'Tours', icon: null },
    { href: '/dashboard', label: 'Dashboard', icon: null },
  ]

  const userMenuItems = [
    {
      label: 'Profile',
      icon: User,
      onClick: () => router.push('/profile')
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => router.push('/settings')
    },
    {
      label: 'Help',
      icon: HelpCircle,
      onClick: () => router.push('/help')
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: handleLogout
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-blue-600">Passio Tour</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActive(link.href)
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.name}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                      Dashboard
                    </Link>
                  </Button>
                </div>

                {/* Mobile Menu Button */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Welcome back</p>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <nav className="space-y-4">
                      {navigationLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block py-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                            isActive(link.href)
                              ? 'text-blue-600'
                              : 'text-gray-700'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t pt-4 mt-6">
                      <div className="space-y-2">
                        {userMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              item.onClick()
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center space-x-3 w-full p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                {/* Authentication Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>

                {/* Mobile Auth Menu */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <nav className="space-y-4">
                      {navigationLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block py-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                            isActive(link.href)
                              ? 'text-blue-600'
                              : 'text-gray-700'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t pt-4 mt-6 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          router.push('/login')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => {
                          router.push('/register')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}