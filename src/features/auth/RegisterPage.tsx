import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterMutation } from '@/api/endpoints/authApi'
import { useAppDispatch } from '@/app/hooks'
import { setCredentials } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

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

  const backgroundUrl = new URL('../../../assets/images/background.jpg', import.meta.url).href

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

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
    } catch (error: any) {
      if (error?.data?.status === 'error') {
        toast.error(error.data.message || 'Registration failed')
      } else {
        toast.error(error?.data?.message || 'Registration failed')
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-heading glow-cyan">Join EmpireQuest</CardTitle>
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
          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Already have an account? Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

