import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useState } from 'react'
import { useLoginMutation, useRegisterMutation } from '@/api/endpoints/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { store } from '@/app/store'
import { setCredentials } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Rocket, Sparkles, Shield, Zap, ArrowRight, BookOpen, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  empire_name: z.string().min(3, 'Empire name must be at least 3 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Check if user is already authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)

  const backgroundUrl = new URL('../../../assets/images/background.jpg', import.meta.url).href

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormData>({
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

  const onLogin = async (data: LoginFormData) => {
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

  const onRegister = async (data: RegisterFormData) => {
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
      className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* Static gradient overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at center, rgba(25, 234, 253, 0.15) 0%, transparent 60%)',
        }}
      />
      
      {/* Animated stars overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/20 blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-10 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm text-cyan-400 font-mono">agameof.space</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-heading font-bold tracking-tight">
                <span className="block glow-cyan">EmpireQuest</span>
                <span className="block text-4xl lg:text-5xl mt-2 text-primary/80">The Final Rebirth</span>
              </h1>
              
              <p className="text-xl text-white max-w-lg mx-auto lg:mx-0">
                Return to your empire. Command your fleets. Conquer the galaxy. Join the final rebirth of EmpireQuest.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
                <Rocket className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-semibold">Fleet Command</span>
                <span className="text-xs text-muted-foreground">Build & deploy</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
                <Shield className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-sm font-semibold">Alliance Power</span>
                <span className="text-xs text-muted-foreground">Join forces</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
                <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                <span className="text-sm font-semibold">Real-Time</span>
                <span className="text-xs text-muted-foreground">Live updates</span>
              </div>
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="animate-in fade-in slide-in-from-right-10 duration-700">
            <Card className="w-full max-w-md mx-auto panel-glass border-primary/30 shadow-2xl shadow-primary/20 card-glow vignette">
              <CardHeader className="space-y-3 pb-6 transition-all duration-500">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-heading glow-cyan transition-all duration-500">
                    {authMode === 'login' ? 'Access Portal' : 'Create Empire'}
                  </CardTitle>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                </div>
                <CardDescription className="text-base transition-all duration-500">
                  {authMode === 'login' 
                    ? 'Enter your credentials to access your command center'
                    : 'Join the galaxy and establish your empire'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative min-h-[600px] overflow-hidden">
                {/* Login Form */}
                {authMode === 'login' ? (
                  <div 
                    key="login" 
                    className="absolute inset-0 animate-in fade-in slide-in-from-right-5 duration-500 ease-out"
                  >
                    <div className="space-y-6 p-6">
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                          <span>Email Address</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="commander@empire.com"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...loginForm.register('email')}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                          <span>Password</span>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...loginForm.register('password')}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 group"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Authenticating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Login to your account
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </form>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                        onClick={() => setAuthMode('register')}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create New Empire
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        onClick={() => navigate('/manual')}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Player Manual
                      </Button>
                    </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    key="register" 
                    className="absolute inset-0 animate-in fade-in slide-in-from-left-5 duration-500 ease-out"
                  >
                    <div className="space-y-6 p-6">
                      {/* Register Form */}
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2">
                          <span>Username</span>
                        </Label>
                        <Input
                          id="username"
                          placeholder="spacecommander"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...registerForm.register('username')}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-sm font-semibold flex items-center gap-2">
                          <span>Email Address</span>
                        </Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="commander@empire.com"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...registerForm.register('email')}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="empire_name" className="text-sm font-semibold flex items-center gap-2">
                          <span>Empire Name</span>
                        </Label>
                        <Input
                          id="empire_name"
                          placeholder="Galactic Empire"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...registerForm.register('empire_name')}
                        />
                        {registerForm.formState.errors.empire_name && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {registerForm.formState.errors.empire_name.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-sm font-semibold flex items-center gap-2">
                          <span>Password</span>
                        </Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          {...registerForm.register('password')}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="text-xs">⚠</span>
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 group"
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating Empire...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Create Empire
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </form>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                        onClick={() => setAuthMode('login')}
                      >
                        Already have an account? Login
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        onClick={() => navigate('/manual')}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Player Manual
                      </Button>
                    </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.3;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  )
}
