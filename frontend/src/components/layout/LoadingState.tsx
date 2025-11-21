import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
      <div className={`flex flex-col items-center justify-center space-y-4 ${sizeClasses[size]} ${textClasses[size]}`}>
        <Loader2 className="animate-spin text-blue-600" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}