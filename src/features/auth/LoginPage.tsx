import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useState, useRef } from 'react'
import { useLoginMutation, useRegisterMutation, useGetSocialRedirectMutation, useResendVerificationEmailMutation } from '@/api/endpoints/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setCredentials, setVerificationPending, clearVerificationPending } from '@/app/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, BookOpen, UserPlus, Mail, Lock, User, Crown, Globe, ArrowBigRightDash, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brandImages'
// Import background images so Vite bundles them
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'
import splashImage3 from '../../../assets/images/backgrounds/splash_image_3.jpg'
import splashImage4 from '../../../assets/images/backgrounds/splash_image_4.jpg'
import consoleImage from '../../../assets/images/backgrounds/console.jpg'
import welcomeBackAudio from '../../../assets/audio/welcome_back.mp3'

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

const SOCIAL_PROVIDER_CONFIG = {
  google: {
    loginLabel: 'Continue with Google',
    registerLabel: 'Sign up with Google',
    className: 'bg-white/95 text-gray-900 border border-white/30 hover:bg-white focus-visible:ring-[#4285F4]',
    icon: <GoogleLogo className="h-4 w-4" />,
  },
  discord: {
    loginLabel: 'Continue with Discord',
    registerLabel: 'Sign up with Discord',
    className: 'bg-[#5865F2]/90 text-white border border-[#5865F2]/40 hover:bg-[#5865F2] focus-visible:ring-[#5865F2]',
    icon: <DiscordLogo className="h-4 w-4" />,
  },
} as const

type SocialProviderKey = keyof typeof SOCIAL_PROVIDER_CONFIG

const SUPPORTED_SOCIAL_PROVIDERS = Object.keys(SOCIAL_PROVIDER_CONFIG) as SocialProviderKey[]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [getSocialRedirect] = useGetSocialRedirectMutation()
  const [resendVerificationEmail, { isLoading: isResendingVerification }] = useResendVerificationEmailMutation()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [activeSocialProvider, setActiveSocialProvider] = useState<SocialProviderKey | null>(null)
  const verificationRequired = useAppSelector((state) => state.auth.verificationRequired)
  const pendingVerificationEmail = useAppSelector((state) => state.auth.pendingVerificationEmail)
  const [resendCooldown, setResendCooldown] = useState(0)
  const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Check if user is already authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)
  const socialProviders = useAppSelector((state) => state.auth.socialProviders)
  const availableSocialProviders = socialProviders.filter((provider): provider is SocialProviderKey =>
    SUPPORTED_SOCIAL_PROVIDERS.includes(provider as SocialProviderKey)
  )
  const hasSocialProviders = availableSocialProviders.length > 0

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

  const handleSocialAuth = async (provider: SocialProviderKey) => {
    const redirectUri = `${window.location.origin}/auth/callback?provider=${provider}`
    try {
      setActiveSocialProvider(provider)
      const result = await getSocialRedirect({
        provider,
        redirectUri,
      }).unwrap()

      if (result?.authorization_url) {
        window.location.href = result.authorization_url
      } else {
        throw new Error('Missing authorization URL')
      }
    } catch (error: any) {
      const status = error?.status
      if (status === 404) {
        toast.error('This sign-in method is currently unavailable.')
      } else if (status === 422) {
        toast.error('The provider denied access. Please grant the requested permissions and try again.')
      } else {
        toast.error('Unable to start social sign-in. Please try again.')
      }
      console.error('[Auth] Social redirect failed', error)
    } finally {
      setActiveSocialProvider((current) => (current === provider ? null : current))
    }
  }

  const renderDivider = (label: string) => (
    <div className="relative pt-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase tracking-[0.45em]">
        <span className="bg-card px-3 py-1 text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
    </div>
  )

  const renderSocialButtons = (mode: 'login' | 'register') => {
    if (!hasSocialProviders) return null
    return (
      <div className="space-y-3">
        {availableSocialProviders.map((provider) => {
          const config = SOCIAL_PROVIDER_CONFIG[provider]
          const isActive = activeSocialProvider === provider
          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              disabled={isActive}
              onClick={() => handleSocialAuth(provider)}
              className={cn(
                'w-full h-11 justify-center gap-3 text-sm font-semibold transition-all duration-200',
                'bg-gray-900/80 border border-white/10 text-white hover:bg-gray-800/80',
                'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                config.className,
                isActive && 'opacity-70 pointer-events-none'
              )}
            >
              {isActive ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </span>
              ) : (
                <>
                  {config.icon}
                  <span>{mode === 'login' ? config.loginLabel : config.registerLabel}</span>
                </>
              )}
            </Button>
          )
        })}
      </div>
    )
  }

  // Set register mode if coming from /register route
  useEffect(() => {
    if (verificationRequired) {
      setAuthMode('login')
      return
    }

    if (location.pathname === '/register') {
      setAuthMode('register')
    } else {
      setAuthMode('login')
    }
  }, [location.pathname, verificationRequired])

  // Redirect to map if already authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      navigate('/map', { replace: true })
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
          empire:
            result.empire || {
              id: 0,
              name: 'Unknown Empire',
              score: 0,
              planets_owned: 0,
              homeworld_planet_id: 0,
              created_at: new Date().toISOString(),
            },
          token: result.token,
        }
        
        dispatch(clearVerificationPending())
        dispatch(setCredentials(credentials))
        toast.success('Welcome back, Commander!')
        
        // Play welcome audio
        try {
          const audio = new Audio(welcomeBackAudio)
          audio.volume = 0.7 // Set volume to 70%
          audio.play().catch((error) => {
            // Audio play failed (likely due to browser autoplay policy)
            console.debug('Could not play welcome audio:', error)
          })
        } catch (error) {
          console.debug('Error loading welcome audio:', error)
        }
        
        // Small delay to allow blur overlay to appear
        setTimeout(() => {
          const from = (location.state as any)?.from?.pathname || '/map'
          navigate(from, { replace: true })
        }, 100)
      } else {
        toast.error('Login failed - invalid response')
      }
    } catch (error: any) {
      if (error?.data?.code === 'EMAIL_NOT_VERIFIED') {
        dispatch(setVerificationPending({ email: data.email }))
        setAuthMode('login')
        if (resendCooldown <= 0) {
          setResendCooldown(60)
        }
        toast.warning(error?.data?.message || 'Please verify your email before logging in.')
        return
      }

      const validationMessages = extractValidationMessages(error)
      if (validationMessages.length > 0) {
        toast.error(validationMessages.join('\n'))
        return
      }

      toast.error(error?.data?.message || 'Login failed')
    }
  }

  const onRegister = async (data: RegisterFormData) => {
    try {
      await register(data).unwrap()
      dispatch(setVerificationPending({ email: data.email }))
      setAuthMode('login')
      loginForm.setValue('email', data.email)
      loginForm.setValue('password', '')
      registerForm.reset()
      toast.success('Account created! Check your inbox to verify your email before logging in.')
      setResendCooldown(60)
      navigate('/login', { replace: true })
    } catch (error: unknown) {
      const validationMessages = extractValidationMessages(error)
      if (validationMessages.length > 0) {
        toast.error(validationMessages.join('\n'))
        return
      }

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

  const extractValidationMessages = (error: unknown): string[] => {
    if (!error || typeof error !== 'object') return []
    const apiError = error as { data?: { code?: string; message?: string; details?: Record<string, string[]> } }
    if (apiError.data?.code !== 'VALIDATION_ERROR' || !apiError.data.details) {
      return []
    }

    return Object.values(apiError.data.details)
      .flat()
      .filter((message): message is string => Boolean(message))
  }

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || resendCooldown > 0) return

    try {
      await resendVerificationEmail({ email: pendingVerificationEmail }).unwrap()
      toast.success(`Verification email resent to ${pendingVerificationEmail}.`)
      setResendCooldown(60)
    } catch (error: any) {
      const messages = extractValidationMessages(error)
      if (messages.length > 0) {
        toast.error(messages.join('\n'))
        return
      }
      toast.error(error?.data?.message || 'Unable to resend verification email. Please try again shortly.')
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current)
        resendCooldownRef.current = null
      }
      return
    }

    if (resendCooldownRef.current) {
      return
    }

    resendCooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => {
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current)
        resendCooldownRef.current = null
      }
    }
  }, [resendCooldown])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const verifiedParam = params.get('verified')
    const messageParam = params.get('message')

    if (verifiedParam === '1') {
      toast.success(messageParam || 'Email verified – you can log in now.')
      dispatch(clearVerificationPending())
      setResendCooldown(0)
      loginForm.reset()
      params.delete('verified')
      params.delete('message')
      navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
    } else if (verifiedParam === '0') {
      toast.error(messageParam || 'Email verification failed. Please try again or resend the email.')
      params.delete('verified')
      params.delete('message')
      navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
    }
  }, [dispatch, location.pathname, location.search, navigate, loginForm])

  useEffect(() => {
    if (verificationRequired && pendingVerificationEmail) {
      loginForm.setValue('email', pendingVerificationEmail)
    }
  }, [verificationRequired, pendingVerificationEmail, loginForm])

  useEffect(() => {
    const state = location.state as { reason?: string; message?: string } | null
    if (state?.reason === 'EMAIL_NOT_VERIFIED') {
      toast.warning(state.message || 'Please verify your email before logging in.')
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

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
                alt="A Game Of Space" 
                className="h-64 lg:h-96 w-auto object-contain"
              />
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="animate-in fade-in slide-in-from-right-10 duration-700">
            <Card 
              className={cn(
                'w-full max-w-md mx-auto panel-glass surface-gradient card-glow vignette',
                'border-0 shadow-2xl shadow-cyan-500/20',
                'relative overflow-hidden',
                'bg-gray-900/95 backdrop-blur-md'
              )}
            >
              <CardHeader className="space-y-3 pb-6 border-b border-cyan-500/20 relative">
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
                      {hasSocialProviders && (
                        <div className="space-y-3">
                          {renderSocialButtons('login')}
                          {renderDivider('Or continue with email')}
                        </div>
                      )}
                      {verificationRequired && (
                        <div className="space-y-3 rounded-lg border border-amber-400/40 bg-amber-950/20 p-4 text-sm text-amber-100">
                          <div className="font-semibold text-amber-200">Email verification required</div>
                          <p className="leading-relaxed text-amber-100/90">
                            We sent a verification link to{' '}
                            <span className="font-mono font-semibold text-amber-200">
                              {pendingVerificationEmail || 'your email address'}
                            </span>.
                            Please confirm your email to continue.
                          </p>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-amber-200/80">
                              {resendCooldown > 0
                                ? `You can resend another email in ${resendCooldown}s.`
                                : 'Didn’t receive it? Resend the verification email.'}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isResendingVerification || resendCooldown > 0}
                                onClick={handleResendVerification}
                                className="border-amber-400/40 text-amber-100 hover:bg-amber-500/10"
                              >
                                {isResendingVerification
                                  ? 'Sending…'
                                  : resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : 'Resend verification email'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-amber-200 hover:text-amber-50"
                                onClick={() => {
                                  dispatch(clearVerificationPending())
                                  setResendCooldown(0)
                                }}
                              >
                                Use a different email
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                            'bg-cyan-400 text-gray-900',
                            'border-0 shadow-[0_0_4px_rgba(0,255,255,0.3)]',
                            'hover:bg-cyan-300 hover:shadow-[0_0_8px_rgba(0,255,255,0.5)]',
                            'transition-all duration-300 group'
                          )}
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
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
                      
                      {renderDivider('More options')}

                      <div className="space-y-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className={cn(
                            'w-full h-11 bg-gray-700/90 border-0',
                            'hover:bg-gray-600/90 hover:shadow-[0_0_4px_rgba(0,255,255,0.2)]',
                            'transition-all'
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
                      {hasSocialProviders && (
                        <div className="space-y-3">
                          {renderSocialButtons('register')}
                          {renderDivider('Or enlist with email')}
                        </div>
                      )}
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                              'h-12 bg-gray-800/60 border-0',
                              'focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[0_0_8px_rgba(0,255,255,0.4)]',
                              'transition-all placeholder:text-muted-foreground/60',
                              'backdrop-blur-md'
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
                            'bg-cyan-400 text-gray-900',
                            'border-0 shadow-[0_0_4px_rgba(0,255,255,0.3)]',
                            'hover:bg-cyan-300 hover:shadow-[0_0_8px_rgba(0,255,255,0.5)]',
                            'transition-all duration-300 group'
                          )}
                          disabled={isRegistering}
                        >
                          {isRegistering ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
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
                      
                      {renderDivider('Already enlisted?')}

                      <div className="space-y-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full h-11 bg-gray-700/90 border-0',
                            'hover:bg-gray-600/90 hover:shadow-[0_0_4px_rgba(0,255,255,0.2)]',
                            'transition-all'
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

interface SocialLogoProps {
  className?: string
}

function GoogleLogo({ className }: SocialLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.489 12.272c0-.85-.075-1.472-.239-2.118H12v4.016h6.54c-.132 1.047-.844 2.626-2.422 3.676l-.022.145 3.518 2.726.244.024c2.243-2.068 3.631-5.108 3.631-8.469Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.295 0 6.067-1.093 8.09-2.982l-3.855-2.987c-1.035.703-2.425 1.194-4.235 1.194-3.237 0-5.981-2.13-6.964-5.076l-.144.012-3.77 2.915-.049.135C2.975 21.626 7.125 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.036 13.149a7.214 7.214 0 0 1-.377-2.307c0-.804.139-1.582.365-2.307l-.006-.155-3.828-2.964-.125.059A11.955 11.955 0 0 0 0 10.842c0 1.928.466 3.749 1.265 5.366l3.771-2.915Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.74c2.292 0 3.833.96 4.713 1.763l3.439-3.362C18.052 1.229 15.295 0 12 0 7.125 0 2.975 2.374 1.265 6.134l3.758 2.97C6.986 6.159 9.73 4.74 12 4.74Z"
      />
    </svg>
  )
}

function DiscordLogo({ className }: SocialLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M20.317 4.369A19.791 19.791 0 0 0 16.557 3l-.183.203c2.176.67 3.28 1.63 3.28 1.63-1.364-.75-2.593-1.125-3.781-1.276a14.537 14.537 0 0 0-6.531.25c-.123.029-.237.062-.356.093l-.024.006c-.07.018-.109.03-.109.03s1.087-.974 3.44-1.652L12.065 3c-.453.003-2.879.059-5.433 1.718 0 0-2.816 5.141-2.816 11.444 0 0 1.645 2.834 5.98 2.973 0 0 .726-.873 1.314-1.623-2.493-.741-3.436-2.289-3.436-2.289s.194.135.542.327l.019.011c.045.026.09.05.136.075.391.209.781.372 1.143.506.64.246 1.4.492 2.291.663a13.03 13.03 0 0 0 5.217-.048c.433-.082.873-.199 1.332-.35.228-.072.468-.159.72-.273l.046-.02s-.964 1.573-3.514 2.301c.588.748 1.3 1.601 1.3 1.601 4.335-.139 5.98-2.973 5.98-2.973 0-6.303-2.816-11.444-2.816-11.444ZM9.548 13.737c-.978 0-1.777-.893-1.777-1.99 0-1.098.782-2.005 1.777-2.005s1.79.907 1.777 2.004c0 1.098-.782 1.991-1.777 1.991Zm4.895 0c-.978 0-1.777-.893-1.777-1.99 0-1.098.781-2.005 1.777-2.005 1.004 0 1.79.907 1.777 2.004 0 1.098-.773 1.991-1.777 1.991Z"
      />
    </svg>
  )
}
