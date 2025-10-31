import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useState } from 'react'
import { useRegisterMutation } from '@/api/endpoints/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setCredentials } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
// Import background images so Vite bundles them
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  empire_name: z.string().min(3, 'Empire name must be at least 3 characters'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  
  // Check if user is already authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)

  // Randomly select background on mount
  const [backgroundUrl] = useState(() => {
    const backgrounds = [splashImage1, splashImage2]
    return backgrounds[Math.floor(Math.random() * backgrounds.length)]
  })

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect to holopad if already authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      navigate('/holopad', { replace: true })
    }
  }, [isAuthenticated, token, navigate])

  // Early return to prevent rendering if already authenticated
  if (isAuthenticated && token) {
    return null
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register(data).unwrap()
      if (result.user && result.empire && result.token) {
        dispatch(setCredentials({
          user: result.user,
          empire: result.empire,
          token: result.token
        }))
        toast.success(`Welcome, ${result.empire.name}!`)
        navigate('/holopad', { replace: true })
      } else {
        toast.error('Registration failed - invalid response')
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { status?: string; message?: string } }
        if (apiError.data?.status === 'error') {
          toast.error(apiError.data.message || 'Registration failed')
        } else {
          toast.error(apiError.data?.message || 'Registration failed')
        }
      } else {
        toast.error('Registration failed')
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-heading glow-cyan">Join agameof.space</CardTitle>
          <CardDescription>Create your empire and conquer the galaxy</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="spacecommander"
                {...registerForm('username')}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="commander@empire.com"
                {...registerForm('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="empire_name">Empire Name</Label>
              <Input
                id="empire_name"
                placeholder="Galactic Empire"
                {...registerForm('empire_name')}
              />
              {errors.empire_name && (
                <p className="text-sm text-destructive">{errors.empire_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...registerForm('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Empire...' : 'Register'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Already have an account? Login
            </button>
            <div>
              <button
                onClick={() => navigate('/manual')}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                Read Player Manual
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

