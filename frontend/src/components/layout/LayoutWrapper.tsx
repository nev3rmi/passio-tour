import { React, ReactNode } from 'react'
import Navigation from './Navigation'
import Footer from './Footer'

interface LayoutWrapperProps {
  children: ReactNode
  user?: {
    id: string
    name: string
    email: string
    role?: string
  }
  showNavigation?: boolean
  showFooter?: boolean
  className?: string
  background?: 'gradient' | 'white' | 'gray'
}

export default function LayoutWrapper({
  children,
  user,
  showNavigation = true,
  showFooter = true,
  className = '',
  background = 'gradient'
}: LayoutWrapperProps) {
  const getBackgroundClass = () => {
    switch (background) {
      case 'gradient':
        return 'bg-gradient-to-b from-blue-50 via-white to-white min-h-screen'
      case 'white':
        return 'bg-white min-h-screen'
      case 'gray':
        return 'bg-gray-50 min-h-screen'
      default:
        return 'bg-gradient-to-b from-blue-50 via-white to-white min-h-screen'
    }
  }

  return (
    <div className={`${getBackgroundClass()} ${className}`}>
      {showNavigation && <Navigation user={user} />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}