import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLoginMutation } from '@/api/endpoints/authApi'
import { useAppDispatch } from '@/app/hooks'
import { store } from '@/app/store'
import { setCredentials } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const backgroundUrl = new URL('../../../assets/images/background.jpg', import.meta.url).href

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Attempting login with:', data)
      const result = await login(data).unwrap()
      console.log('Login result:', result)
      
      // Handle the direct API response structure
      if (result.token && result.user) {
        console.log('Login successful, dispatching credentials...', { user: result.user, empire: result.empire, token: result.token })
        
        const credentials = {
          user: result.user,
          empire: result.empire || { id: 0, name: 'Unknown Empire', score: 0, planets_owned: 0, homeworld_planet_id: 0, created_at: new Date().toISOString() },
          token: result.token
        }
        
        console.log('Dispatching credentials:', credentials)
        dispatch(setCredentials(credentials))
        
        // Check Redux state after dispatch
        setTimeout(() => {
          console.log('Redux state after dispatch:', { 
            isAuthenticated: store.getState().auth.isAuthenticated,
            token: !!store.getState().auth.token,
            user: !!store.getState().auth.user,
            empire: !!store.getState().auth.empire
          })
        }, 50)
        
        toast.success('Welcome back, Commander!')
        
        // Small delay to ensure Redux state is updated
        setTimeout(() => {
          const from = (location.state as any)?.from?.pathname || '/holopad'
          console.log('Navigating to:', from)
          navigate(from, { replace: true })
        }, 200)
      } else {
        console.log('Invalid response structure:', result)
        toast.error('Login failed - invalid response')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      // Handle API error response structure
      if (error?.data?.status === 'error') {
        toast.error(error.data.message || 'Login failed')
      } else {
        toast.error(error?.data?.message || 'Login failed')
      }
    }
  }

  return (
    <div
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-3xl font-heading glow-cyan">EmpireQuest</CardTitle>
                <CardDescription>Login to your command center</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="commander@empire.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  
                  {/* Debug button */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      console.log('Current Redux state:', store.getState().auth)
                      console.log('LocalStorage:', {
                        token: localStorage.getItem('token'),
                        user: localStorage.getItem('user'),
                        empire: localStorage.getItem('empire')
                      })
                    }}
                    className="w-full mt-2"
                  >
                    Debug Auth State
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  <button
                    onClick={() => navigate('/register')}
                    className="text-primary hover:underline"
                  >
                    Don't have an account? Register
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

