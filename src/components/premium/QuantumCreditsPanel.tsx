import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  useGetQuantumCreditsQuery,
  useGetQuantumCreditPackagesQuery,
  useCreateQuantumCreditPurchaseIntentMutation,
  useClaimDailyLoginMutation,
} from '@/api/endpoints/premiumApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'
import {
  Calendar,
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Sparkles,
  ShoppingCart,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { QuantumCreditPackage } from '@/types/api.types'
import { cn } from '@/lib/utils'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js'

interface CheckoutState {
  package: QuantumCreditPackage
  clientSecret: string
  publishableKey: string
  purchaseId: string
}

export function QuantumCreditsPanel() {
  const { data, isLoading, refetch } = useGetQuantumCreditsQuery(undefined, {
    pollingInterval: 60000, // Poll every 60 seconds when panel is open
  })
  const {
    data: packagesData,
    isLoading: packagesLoading,
    isError: packagesError,
  } = useGetQuantumCreditPackagesQuery()
  const [createPurchaseIntent, { isLoading: isCreatingPurchase }] =
    useCreateQuantumCreditPurchaseIntentMutation()
  const [claimDailyLogin, { isLoading: isClaiming }] = useClaimDailyLoginMutation()
  const [checkout, setCheckout] = useState<CheckoutState | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const checkoutCardRef = useRef<HTMLDivElement | null>(null)
  const [selectedPackageKey, setSelectedPackageKey] = useState<string | null>(null)
  const [pendingPurchase, setPendingPurchase] = useState<{ expectedCredits: number; previousBalance: number } | null>(null)
  const [purchaseAlert, setPurchaseAlert] = useState<string | null>(null)
  const pendingTimeoutRef = useRef<number | null>(null)

  const paymentAppearance = useMemo(
    () => ({
      theme: 'night' as const,
      variables: {
        colorPrimary: '#22d3ee',
        colorText: '#e2e8f0',
        colorDanger: '#f87171',
        borderRadius: '12px',
        fontFamily: 'Space Grotesk, system-ui, sans-serif',
      },
      rules: {
        '.Input': {
          backgroundColor: 'rgba(7,17,29,0.85)',
          color: '#e2e8f0',
        },
        '.Input--invalid': {
          color: '#fca5a5',
        },
        '.Label': {
          color: '#94a3b8',
        },
      },
    }),
    [],
  )

  const stripeOptions: StripeElementsOptions | undefined = useMemo(
    () =>
      checkout
        ? {
            clientSecret: checkout.clientSecret,
            appearance: paymentAppearance,
          }
        : undefined,
    [checkout, paymentAppearance],
  )

  const handleClaimDaily = async () => {
    try {
      const result = await claimDailyLogin().unwrap()
      toast.success(
        `Daily bonus claimed! +${result.data?.reward || 0} QC (Balance: ${result.data?.new_balance || 0})`
      )
      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to claim daily bonus'
      toast.error(errorMessage)
    }
  }

  const handlePurchaseIntentError = (error: any) => {
    const status = error?.status
    const code = error?.data?.code || error?.data?.error || error?.data?.reason
    let message = 'Unable to prepare checkout. Please try again.'

    if (code === 'UNKNOWN_PACKAGE' || status === 422) {
      message = 'This bundle is no longer available. Please choose another option.'
    } else if (code === 'PAYMENT_INTENT_FAILED' || status === 502) {
      message = 'We could not start the payment session. Please review your payment details and try again.'
    } else if (error?.data?.message) {
      message = error.data.message
    }

    console.error('[QuantumCredits] Purchase intent failed:', error)
    toast.error(message)
  }

  const handleSelectPackage = async (pkg: QuantumCreditPackage) => {
    if (checkout && checkout.package.key === pkg.key) {
      return
    }

    setSelectedPackageKey(pkg.key)
    setCheckout(null)
    setStripePromise(null)
    setCheckoutStatus('preparing')
    setCheckoutError(null)

    try {
      const response = await createPurchaseIntent({ package: pkg.key }).unwrap()

      if (!response?.client_secret || !response?.publishable_key) {
        throw new Error('Invalid purchase intent response')
      }

      const promise = loadStripe(response.publishable_key)
      setStripePromise(promise)
      console.debug('[QuantumCredits] Stripe promise created', {
        packageKey: pkg.key,
        paymentIntent: response.payment_intent,
      })
      setCheckout({
        package: pkg,
        clientSecret: response.client_secret,
        publishableKey: response.publishable_key,
        purchaseId: response.purchase_id,
      })

      promise.then((stripe) => {
        if (!stripe) {
          console.error('[QuantumCredits] Stripe initialisation failed (null instance)')
          setCheckout(null)
          setStripePromise(null)
          setSelectedPackageKey(null)
          setCheckoutStatus('error')
          setCheckoutError('Stripe checkout could not be initialised. Please try again later.')
          toast.error('Stripe checkout could not be initialised. Please try again later.')
        } else {
          console.debug('[QuantumCredits] Stripe initialised successfully')
          setCheckoutStatus('ready')
        }
      })
    } catch (error: any) {
      setSelectedPackageKey(null)
      setCheckout(null)
      setStripePromise(null)
      setCheckoutStatus('error')
      handlePurchaseIntentError(error)
    }
  }

  const handleCheckoutSuccess = () => {
    if (checkout) {
      toast.success(
        `Payment authorized! ${checkout.package.credits.toLocaleString()} QC will be added shortly.`,
      )
      setPendingPurchase({
        expectedCredits: checkout.package.credits,
        previousBalance: balance,
      })
      setPurchaseAlert(null)
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
      }
      pendingTimeoutRef.current = window.setTimeout(() => {
        setPurchaseAlert(
          'Your purchase is still processing. If the charge was declined, your balance will remain unchanged and Stripe will email you with more details.',
        )
      }, 15000)
    } else {
      toast.success('Payment authorized successfully.')
    }

    setCheckout(null)
    setStripePromise(null)
    setSelectedPackageKey(null)
    setCheckoutStatus('idle')
    void refetch()
    setTimeout(() => {
      void refetch()
    }, 3000)
  }

  const handleCheckoutCancel = () => {
    setCheckout(null)
    setStripePromise(null)
    setSelectedPackageKey(null)
    if (pendingTimeoutRef.current) {
      window.clearTimeout(pendingTimeoutRef.current)
      pendingTimeoutRef.current = null
    }
    setPendingPurchase(null)
    setPurchaseAlert(null)
    setCheckoutStatus('idle')
    setCheckoutError(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const balance = data?.balance ?? 0
  const canClaim = data?.can_claim_daily ?? false
  const streak = data?.daily_login_streak ?? 0
  const transactions = data?.transactions ?? []
  const packages = packagesData ?? []

  useEffect(() => {
    if (!pendingPurchase) {
      return
    }

    const targetBalance = pendingPurchase.previousBalance + pendingPurchase.expectedCredits
    if (balance >= targetBalance) {
      setPendingPurchase(null)
      setPurchaseAlert(null)
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
    }
  }, [balance, pendingPurchase])

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!checkout || checkoutStatus === 'idle') return
    const node = checkoutCardRef.current
    if (!node) return
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [checkout, checkoutStatus])

  const formatPrice = (pkg: QuantumCreditPackage) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: pkg.currency || 'USD',
      }).format((pkg.price || 0) / 100)
    } catch {
      return `${(pkg.price || 0) / 100} ${pkg.currency ?? ''}`.trim()
    }
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src={getQuantumCreditsImage()}
              alt="Quantum Credits"
              className="w-8 h-8"
            />
            <span>Quantum Credits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-cyan-400">{balance}</p>
              <p className="text-sm text-muted-foreground mt-1">Available Balance</p>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Catalogue */}
      <Card className="panel-glass border-cyan-400/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            Quantum Credit Bundles
          </CardTitle>
          <CardDescription>
            Choose a bundle to instantly bolster your empire&apos;s resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packagesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : packagesError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Premium bundles are temporarily unavailable. Please try again later.
            </div>
          ) : packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bundles are currently available. Please check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {packages.map((pkg) => {
                const isSelected = selectedPackageKey === pkg.key
                return (
                  <div
                    key={pkg.key}
                    className={cn(
                      'relative overflow-hidden glass-section border-cyan-500/25 p-4 transition-all duration-300',
                      isSelected && 'border-cyan-300/70 shadow-[0_0_25px_rgba(34,211,238,0.35)]',
                      pkg.most_popular && 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.25)]',
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                            {formatPrice(pkg)}
                          </p>
                        </div>
                        {pkg.badge || pkg.most_popular ? (
                          <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/40">
                            {pkg.badge || 'Most Popular'}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-baseline gap-2 text-cyan-300">
                        <Coins className="w-5 h-5 text-cyan-200" />
                        <span className="text-2xl font-bold tracking-tight">
                          {pkg.credits.toLocaleString()} QC
                        </span>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                      {pkg.perks && pkg.perks.length > 0 && (
                        <ul className="space-y-1 text-xs text-muted-foreground/80">
                          {pkg.perks.map((perk, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-cyan-300" />
                              {perk}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full h-11 text-sm font-semibold border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/10',
                          isSelected && 'bg-cyan-500/10',
                        )}
                        onClick={() => handleSelectPackage(pkg)}
                        disabled={isCreatingPurchase}
                      >
                        {isCreatingPurchase && selectedPackageKey === pkg.key ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Preparing Checkout...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isSelected ? 'Selected Bundle' : 'Select Bundle'}
                          </>
                        )}
                      </Button>
                    </div>
                    {isCreatingPurchase && selectedPackageKey === pkg.key && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {purchaseAlert && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/15 p-4 text-sm text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{purchaseAlert}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-amber-100 hover:text-amber-50 hover:bg-amber-500/20"
              onClick={() => setPurchaseAlert(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {checkoutStatus === 'error' && checkoutError && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {checkoutError}
        </div>
      )}

      {checkout && stripePromise && stripeOptions && (
        <Card className="panel-glass border-purple-400/30" ref={checkoutCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-100">
              <ShoppingCart className="w-5 h-5 text-purple-300" />
              Complete Purchase
            </CardTitle>
            <CardDescription>
              {checkout.package.name} • {formatPrice(checkout.package)} •{' '}
              {checkout.package.credits.toLocaleString()} QC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkoutStatus !== 'ready' && (
              <div className="flex items-center gap-3 rounded-xl border border-purple-300/30 bg-purple-500/10 p-3 text-sm text-purple-100">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initialising secure payment form…</span>
              </div>
            )}
            <Elements
              key={checkout.clientSecret}
              stripe={stripePromise}
              options={stripeOptions}
            >
              <QuantumCreditCheckoutForm
                pkg={checkout.package}
                priceLabel={formatPrice(checkout.package)}
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
              />
            </Elements>
            <p className="text-xs text-muted-foreground text-center">
              Secure payments are processed by Stripe. Quantum Credits appear in your balance as soon
              as the payment is authorized.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Daily Login Section */}
      <Card className="panel-glass border-yellow/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            Daily Login Bonus
          </CardTitle>
          <CardDescription>
            Claim your daily reward and build your streak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium">Current Streak: {streak} days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {streak < 7
                  ? `Day ${streak + 1} reward: 1 QC (${7 - streak} days until 2 QC/day)`
                  : 'Day 7+ reward: 2 QC per day'}
              </p>
            </div>
            <Button
              onClick={handleClaimDaily}
              disabled={!canClaim || isClaiming}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
            >
              {isClaiming ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : canClaim ? (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Claim Daily Bonus
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Already Claimed
                </>
              )}
            </Button>
          </div>
          {!canClaim && data?.last_daily_login_claim && (
            <p className="text-xs text-muted-foreground">
              Last claimed: {formatDistanceToNow(new Date(data.last_daily_login_claim), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="panel-glass border-border/20">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Last 20 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction, index) => {
                const isPositive = transaction.amount > 0
                const formattedReason = transaction.reason
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())
                const metadata = transaction.metadata as Record<string, any> | undefined
                const receiptUrl =
                  typeof metadata?.receipt_url === 'string'
                    ? metadata.receipt_url
                    : typeof metadata?.receipt === 'string'
                      ? metadata.receipt
                      : null
                const isRefund =
                  transaction.amount < 0 &&
                  (transaction.reason?.toLowerCase().includes('refund') ||
                    transaction.type === 'adjusted')
                const amountBadgeClass = isPositive
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : isRefund
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium truncate">{formattedReason}</p>
                          {isRefund && (
                            <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/40">
                              Refund
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(transaction.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {receiptUrl && (
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                            >
                              View receipt
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={isPositive ? 'default' : 'destructive'}
                      className={amountBadgeClass}
                    >
                      {isPositive ? '+' : ''}{transaction.amount} QC
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface QuantumCreditCheckoutFormProps {
  pkg: QuantumCreditPackage
  priceLabel: string
  onSuccess: () => void
  onCancel: () => void
}

function QuantumCreditCheckoutForm({
  pkg,
  priceLabel,
  onSuccess,
  onCancel,
}: QuantumCreditCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setMessage('Payment services are still initialising. Please wait a moment and try again.')
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    })

    if (error) {
      const friendlyMessage =
        error.message || 'Payment failed. Please review your details and try again.'
      setMessage(friendlyMessage)
      toast.error(friendlyMessage)
      setIsSubmitting(false)
      return
    }

    const status = paymentIntent?.status
    if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
      onSuccess()
    } else {
      const statusMessage = `Payment status: ${status ?? 'unknown'}. Please contact support if this persists.`
      setMessage(statusMessage)
      toast.error(statusMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 text-sm text-purple-100">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-base">{pkg.name}</span>
          <span>{priceLabel}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-cyan-200">
          <Coins className="w-4 h-4" />
          <span>{pkg.credits.toLocaleString()} Quantum Credits</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          className="flex-1 border border-cyan-500/30 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
          disabled={isSubmitting || !stripe || !elements}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authorizing…
            </>
          ) : (
            <>
              Complete Purchase&nbsp;
              <span className="font-semibold">{priceLabel}</span>
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

