import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  context?: string
  showRetry?: boolean
  showHome?: boolean
  showReport?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  context = 'Something went wrong',
  showRetry = true,
  showHome = true,
  showReport = false,
}: ErrorFallbackProps) {
  const handleReportError = () => {
    // In a real app, this would send error reports to a service like Sentry
    console.error('Error reported:', error)
    alert('Error reported. Thank you for helping us improve!')
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="panel-glass border-destructive/20 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Oops! {context}</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Don't worry, your progress is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Error:</strong> {error.message}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            {showRetry && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {showHome && (
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
            
            {showReport && (
              <Button variant="outline" onClick={handleReportError} className="w-full">
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>If this problem persists, please contact support.</p>
            <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<ErrorFallbackProps>
    context?: string
    onError?: (error: Error, errorInfo: any) => void
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}
