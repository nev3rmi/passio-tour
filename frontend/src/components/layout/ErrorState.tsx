import { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  description?: string
  error?: string
  onRetry?: () => void
  action?: ReactNode
  className?: string
}

export default function ErrorState({ 
  title = 'Something went wrong',
  description = 'Please try again later or contact support if the problem persists.',
  error,
  onRetry,
  action,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen px-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">{title}</CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <code className="text-sm text-red-600">{error}</code>
            </div>
          )}
          <div className="flex justify-center space-x-4">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {action}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}