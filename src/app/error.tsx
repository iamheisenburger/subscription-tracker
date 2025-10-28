'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Application error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold font-sans">Something went wrong!</h1>
          <p className="text-muted-foreground font-sans">
            We apologize for the inconvenience. An error occurred while processing your request.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}







