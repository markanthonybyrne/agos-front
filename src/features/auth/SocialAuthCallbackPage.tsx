import { useEffect, useState, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSocialCallbackMutation } from '@/api/endpoints/authApi'
import { useAppDispatch } from '@/app/hooks'
import { setCredentials, setVerificationPending } from '@/app/slices/authSlice'
import { SocialAuthCallbackRequest, SocialAuthResponse } from '@/types/api.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CallbackStatus = 'pending' | 'success' | 'error'

export function SocialAuthCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<CallbackStatus>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [providerName, setProviderName] = useState<string | null>(null)
  const [socialCallback] = useSocialCallbackMutation()
  const hasProcessedRef = useRef(false)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])

  useEffect(() => {
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    const providerParam = params.get('provider')?.toLowerCase() || null
    const providerError = params.get('error')
    const code = params.get('code')
    const accessToken = params.get('access_token')
    const oauthDenied = params.get('error_description')

    setProviderName(providerParam)

    if (providerError) {
      const errorLabel =
        providerError === 'access_denied' || oauthDenied
          ? 'Authorization was declined. Please approve access to continue.'
          : 'The provider returned an error. Please try again.'
      setErrorMessage(errorLabel)
      setStatus('error')
      toast.error(errorLabel)
      return
    }

    if (!providerParam) {
      const errorLabel = 'Missing provider information. Please restart the sign-in process.'
      setErrorMessage(errorLabel)
      setStatus('error')
      toast.error(errorLabel)
      return
    }

    if (!code && !accessToken) {
      const errorLabel = 'No authorization credentials were returned. Please try signing in again.'
      setErrorMessage(errorLabel)
      setStatus('error')
      toast.error(errorLabel)
      return
    }

    const payload: SocialAuthCallbackRequest = {}
    if (code) {
      payload.code = code
      payload.redirect_uri = `${window.location.origin}/auth/callback?provider=${providerParam}`
    }
    if (accessToken) {
      payload.access_token = accessToken
    }

    let isActive = true

    const completeCallback = async () => {
      try {
        const response = await socialCallback({
          provider: providerParam,
          payload,
        }).unwrap()

        if (!isActive) return

        handleSuccessfulAuth(response)
      } catch (error: any) {
        if (!isActive) return
        handleCallbackError(error)
      }
    }

    completeCallback()

    return () => {
      isActive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleSuccessfulAuth = (response: SocialAuthResponse) => {
    if (!response?.token || !response?.user) {
      const errorLabel = 'Authentication response was incomplete. Please try again.'
      setErrorMessage(errorLabel)
      setStatus('error')
      toast.error(errorLabel)
      return
    }

    const fallbackEmpire = {
      id: 0,
      name: response.empire?.name || `${response.user.username}'s Empire`,
      score: response.empire?.score ?? 0,
      planets_owned: response.empire?.planets_owned ?? 0,
      homeworld_planet_id: response.empire?.homeworld_planet_id ?? 0,
      created_at: response.empire?.created_at || new Date().toISOString(),
    }

    dispatch(
      setCredentials({
        user: response.user,
        empire: response.empire || fallbackEmpire,
        token: response.token,
      }),
    )

    if (response.meta?.is_new_user) {
      sessionStorage.setItem('sso_new_user', 'true')
      toast.success('Welcome to Astralus! Preparing your new empire...')
    } else {
      toast.success('Authentication complete. Welcome back, Commander!')
    }

    setStatus('success')

    const redirectParam = params.get('redirect_to')
    const target =
      redirectParam && redirectParam.startsWith('/') ? redirectParam : '/map'
    setTimeout(() => {
      navigate(target, { replace: true })
    }, 750)
  }

  const handleCallbackError = (error: any) => {
    const statusCode = error?.status ?? error?.error?.status
    const errorCode = error?.data?.code ?? error?.error?.data?.code
    let message = 'We could not complete your sign-in. Please try again.'

    if (errorCode === 'EMAIL_NOT_VERIFIED') {
      const email = error?.data?.email ?? error?.data?.pending_email
      dispatch(setVerificationPending({ email }))
      message = error?.data?.message || 'Please verify your email before logging in.'
      setErrorMessage(message)
      setStatus('error')
      toast.warning(message)
      return
    }

    if (statusCode === 404) {
      message = 'This sign-in provider is currently disabled. Please choose another option.'
    } else if (statusCode === 422) {
      message = 'Your authorization code is invalid or expired. Please restart the sign-in process.'
    } else if (error?.data?.message) {
      message = error.data.message
    }

    setErrorMessage(message)
    setStatus('error')
    toast.error(message)
  }

  const handleReturnToLogin = () => {
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(12,26,52,0.9),rgba(4,10,22,0.96))] flex items-center justify-center p-6">
      <Card className="panel-glass surface-gradient card-glow max-w-lg w-full border border-cyan-500/30">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-center text-xl font-semibold text-white tracking-[0.35em] uppercase">
            Secure Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 px-8">
          {status === 'pending' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
              <div>
                <p className="text-lg font-semibold text-white">
                  Completing authentication
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {providerName
                    ? `Finalizing your ${providerName.charAt(0).toUpperCase() + providerName.slice(1)} sign-in...`
                    : 'Finalizing your sign-in...'}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center space-y-4 text-white">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <div>
                <p className="text-lg font-semibold">Authentication complete</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting you to the command console...
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-4 border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/10"
                onClick={() => navigate('/map', { replace: true })}
              >
                Continue to Astralus
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-center space-y-5">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <div>
                <p className="text-lg font-semibold text-white">We couldn’t sign you in</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorMessage ||
                    'An unexpected error occurred while completing your sign-in. Please try again.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  type="button"
                  className={cn(
                    'w-full h-11 font-semibold',
                    'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-500/30',
                  )}
                  onClick={handleReturnToLogin}
                >
                  Return to Login
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-11 text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  onClick={() => window.location.replace('/register')}
                >
                  Need an account? Create one
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

