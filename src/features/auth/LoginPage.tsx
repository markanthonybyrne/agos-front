import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useState } from 'react'
import { useLoginMutation, useRegisterMutation } from '@/api/endpoints/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setCredentials } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, BookOpen, UserPlus, Mail, Lock, User, Crown, Globe, ArrowBigRightDash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brandImages'
// Import background images so Vite bundles them
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'
import splashImage3 from '../../../assets/images/backgrounds/splash_image_3.jpg'
import splashImage4 from '../../../assets/images/backgrounds/splash_image_4.jpg'
import consoleImage from '../../../assets/images/backgrounds/console.jpg'

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

  // Randomly select background on mount
  const [backgroundUrl] = useState(() => {
    const backgrounds = [splashImage1, splashImage2, splashImage3, splashImage4, consoleImage]
    return backgrounds[Math.floor(Math.random() * backgrounds.length)]
  })

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Set register mode if coming from /register route
  useEffect(() => {
    if (location.pathname === '/register') {
      setAuthMode('register')
    } else {
      setAuthMode('login')
    }
  }, [location.pathname])

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
      const result = await login(data).unwrap()
      
      if (result.token && result.user) {
        const credentials = {
          user: result.user,
          empire: result.empire || { id: 0, name: 'Unknown Empire', score: 0, planets_owned: 0, homeworld_planet_id: 0, created_at: new Date().toISOString() },
          token: result.token
        }
        
        dispatch(setCredentials(credentials))
        toast.success('Welcome back, Commander!')
        
        // Small delay to allow blur overlay to appear
        setTimeout(() => {
          const from = (location.state as any)?.from?.pathname || '/holopad'
          navigate(from, { replace: true })
        }, 100)
      } else {
        toast.error('Login failed - invalid response')
      }
    } catch (error: any) {
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
        // Small delay to allow blur overlay to appear
        setTimeout(() => {
          navigate('/holopad', { replace: true })
        }, 100)
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
      className="min-h-screen relative overflow-hidden"
      style={{ 
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Enhanced gradient overlays */}
      <div className="absolute inset-0">
        {/* Primary cyan gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(25, 234, 253, 0.2) 0%, transparent 70%)',
          }}
        />
        {/* Purple accent gradient */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(157, 78, 221, 0.15) 0%, transparent 70%)',
          }}
        />
        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/60" />
      </div>
      
      {/* Animated stars overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.6 + 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Floating cyan particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/10 blur-xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              animation: `float ${Math.random() * 15 + 15}s ease-in-out infinite`,
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
            {/* Logo */}
            <div className="flex justify-center lg:justify-start">
              <img 
                src={BRAND.logo} 
                alt="Astralus" 
                className="h-64 lg:h-96 w-auto object-contain"
              />
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="animate-in fade-in slide-in-from-right-10 duration-700">
            <Card 
              className={cn(
                'w-full max-w-md mx-auto panel-glass surface-gradient card-glow vignette',
                'border-cyan-500/40 shadow-2xl shadow-cyan-500/20',
                'relative overflow-hidden'
              )}
            >
              <CardHeader className="space-y-3 pb-6 border-b border-border/50 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-heading glow-cyan">
                    {authMode === 'login' ? 'Login' : 'Create a New Account'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                    <span className="text-xs text-muted-foreground font-mono">ONLINE</span>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {authMode === 'login' 
                    ? 'The time is now, commander! Enter Astralus.'
                    : 'Join the galaxy and assert your dominance, commander!'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative min-h-[600px] overflow-hidden pt-6">
                {/* Login Form */}
                {authMode === 'login' ? (
                  <div 
                    key="login" 
                    className="absolute inset-0 animate-in fade-in slide-in-from-right-5 duration-500 ease-out"
                  >
                    <div className="space-y-6 p-6">
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Mail className="w-4 h-4 text-cyan-400" />
                            <span>Email Address</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="commander@empire.com"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...loginForm.register('email')}
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {loginForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Lock className="w-4 h-4 text-cyan-400" />
                            <span>Password</span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...loginForm.register('password')}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {loginForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className={cn(
                            'w-full h-12 text-base font-semibold',
                            'bg-cyan-600 hover:bg-cyan-700 text-white',
                            'shadow-lg shadow-cyan-500/30',
                            'transition-all duration-300 group',
                            'border border-cyan-400/30 hover:border-cyan-400/50'
                          )}
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Authenticating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Login to Astralus
                              <ArrowBigRightDash className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>
                      
                      <div className="relative pt-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">Or</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className={cn(
                            'w-full h-11 border-cyan-500/30 hover:border-cyan-500/50',
                            'hover:bg-cyan-500/10 transition-all',
                            'panel-glass'
                          )}
                          onClick={() => setAuthMode('register')}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create New Account
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          onClick={() => navigate('/manual')}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Manual
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
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <User className="w-4 h-4 text-cyan-400" />
                            <span>Username</span>
                          </Label>
                          <Input
                            id="username"
                            placeholder="spacecommander"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...registerForm.register('username')}
                          />
                          {registerForm.formState.errors.username && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {registerForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Mail className="w-4 h-4 text-cyan-400" />
                            <span>Email Address</span>
                          </Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="commander@empire.com"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...registerForm.register('email')}
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {registerForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="empire_name" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Crown className="w-4 h-4 text-cyan-400" />
                            <span>Empire Name</span>
                          </Label>
                          <Input
                            id="empire_name"
                            placeholder="Galactic Empire"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...registerForm.register('empire_name')}
                          />
                          {registerForm.formState.errors.empire_name && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {registerForm.formState.errors.empire_name.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Lock className="w-4 h-4 text-cyan-400" />
                            <span>Password</span>
                          </Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            className={cn(
                              'h-12 bg-background/40 border-border/50',
                              'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                              'transition-all placeholder:text-muted-foreground/60',
                              'panel-glass'
                            )}
                            {...registerForm.register('password')}
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                              <span className="text-xs">⚠</span>
                              {registerForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className={cn(
                            'w-full h-12 text-base font-semibold',
                            'bg-cyan-600 hover:bg-cyan-700 text-white',
                            'shadow-lg shadow-cyan-500/30',
                            'transition-all duration-300 group',
                            'border border-cyan-400/30 hover:border-cyan-400/50'
                          )}
                          disabled={isRegistering}
                        >
                          {isRegistering ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Empire...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                             Create Account
                              <ArrowBigRightDash className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>
                      
                      <div className="relative pt-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">Or</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full h-11 border-cyan-500/30 hover:border-cyan-500/50',
                            'hover:bg-cyan-500/10 transition-all',
                            'panel-glass'
                          )}
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
            opacity: 0.15;
          }
          33% {
            transform: translate(40px, -40px) scale(1.15);
            opacity: 0.25;
          }
          66% {
            transform: translate(-30px, 30px) scale(0.85);
            opacity: 0.2;
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
