import { useState } from 'react'
import { useLoginMutation, useGetMeQuery } from '@/api/endpoints/authApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function ApiTest() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation()
  const { data: meData, isLoading: isLoadingMe, error: meError } = useGetMeQuery()

  const handleLogin = async () => {
    try {
      const result = await login({ email, password }).unwrap()
      console.log('Login successful:', result)
      if (result.user && result.empire && result.token) {
        console.log('User:', result.user)
        console.log('Empire:', result.empire)
        console.log('Token:', result.token)
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
          <CardDescription>
            Test the API connection and authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
          </div>
          
          <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full">
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Login...
              </>
            ) : (
              'Test Login'
            )}
          </Button>

          {loginError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Login Failed</p>
                <p className="text-xs text-destructive">
                  {JSON.stringify(loginError, null, 2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auth/Me Endpoint Test</CardTitle>
          <CardDescription>
            Test the /auth/me endpoint (requires authentication)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Status:</span>
            {isLoadingMe ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </Badge>
            ) : meError ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Error
              </Badge>
            ) : meData ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                <CheckCircle className="w-3 h-3" />
                Success
              </Badge>
            ) : (
              <Badge variant="outline">Not Called</Badge>
            )}
          </div>

                {meData && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Response Data:</p>
                    <pre className="text-xs text-green-700 overflow-auto">
                      {JSON.stringify(meData, null, 2)}
                    </pre>
                    {meData.user && meData.empire && (
                      <div className="mt-2 p-2 bg-green-100 rounded">
                        <p className="text-xs font-medium text-green-800">Parsed Data:</p>
                        <pre className="text-xs text-green-700">
                          {JSON.stringify({ user: meData.user, empire: meData.empire }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

          {meError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
              <pre className="text-xs text-red-700 overflow-auto">
                {JSON.stringify(meError, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Current API settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>API URL:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}
              </code>
            </div>
            <div className="flex justify-between">
              <span>WebSocket URL:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
