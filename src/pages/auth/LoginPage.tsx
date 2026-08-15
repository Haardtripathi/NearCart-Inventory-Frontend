import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BellRing, Boxes, CheckCircle2, Package2, Store } from 'lucide-react'

import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { useLoginMutation, useSendEmailOtpMutation, useVerifyEmailOtpMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { BreadcrumbTrail } from '@/components/common'
import { FormField } from '@/components/forms'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { parseApiError } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginLocationState {
  justRegisteredEmail?: string
}

export function LoginPage() {
  const { t } = useTranslation(['auth'])
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const loginMutation = useLoginMutation()
  const sendOtpMutation = useSendEmailOtpMutation()
  const verifyOtpMutation = useVerifyEmailOtpMutation()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Set only when login() 403s specifically because the account isn't verified yet (see
  // backend auth.service.ts's login() — that's the only 403 it throws, so the status code alone
  // is a reliable signal). The backend's error message points people at a raw API path
  // ("Request a new code via /auth/send-otp") that no UI ever called — this inline panel is the
  // small, targeted fix: let the user actually request + enter that code without leaving login.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // RegisterOrganizationOwnerPage no longer gets a session back from registration (the account
  // isn't email-verified yet — see auth.service.ts's registerOrganizationOwner) — it redirects
  // here with the just-registered email in location state instead. Reuse this page's existing
  // unverified-login OTP panel rather than building a second verification UI: pre-fill the email
  // and open the "enter your code" panel directly.
  //
  // Bug found 2026-08-08 via real signup UI testing: this used to also fire its own
  // sendOtpMutation here to email a code — but registerOrganizationOwner() on the backend
  // (auth.service.ts) already calls sendEmailVerificationOtp() itself as the last step of
  // registration, before this redirect even happens. That first send is the one that actually
  // reaches the user's inbox. Firing a second send-otp here almost always hit
  // OTP_RESEND_COOLDOWN_SECONDS (60s default — nobody takes that long to land on the next page),
  // so essentially every brand-new signup immediately saw a red "Please wait a bit before
  // requesting another code" error toast seconds after successfully creating their account, for
  // no real reason (the first code was already valid and delivered). Just open the panel with the
  // email pre-filled instead of redundantly re-sending; the existing "Resend code" button still
  // works normally if the user actually needs a fresh one.
  const justRegisteredHandledRef = useRef(false)

  useEffect(() => {
    const state = location.state as LoginLocationState | null
    const email = state?.justRegisteredEmail

    if (!email || justRegisteredHandledRef.current) return
    justRegisteredHandledRef.current = true

    form.setValue('email', email)
    setUnverifiedEmail(email)
    setOtpCode('')
    // Clear the navigation state so a refresh or revisiting /login later doesn't reopen it.
    navigate(location.pathname, { replace: true, state: null })
    // Intentionally run once on mount only — this consumes one-shot navigation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    setUnverifiedEmail(null)

    try {
      await loginMutation.mutateAsync(values)
      toast.success('Logged in successfully')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const { message, statusCode } = parseApiError(error)

      if (statusCode === 403) {
        setUnverifiedEmail(values.email)
        setOtpCode('')
        sendOtpMutation.mutate(
          { email: values.email },
          {
            onError: (otpError) => {
              toast.error(parseApiError(otpError).message || 'Unable to send a verification code right now.')
            },
          },
        )
        return
      }

      toast.error(message || t('auth:invalidCredentials'))
    }
  })

  function handleResendOtp() {
    if (!unverifiedEmail) return

    sendOtpMutation.mutate(
      { email: unverifiedEmail },
      {
        onSuccess: () => toast.success('A new code has been sent to your email.'),
        onError: (otpError) => {
          toast.error(parseApiError(otpError).message || 'Unable to send a verification code right now.')
        },
      },
    )
  }

  function handleVerifyOtp() {
    if (!unverifiedEmail || otpCode.trim().length !== 6) return

    verifyOtpMutation.mutate(
      { email: unverifiedEmail, code: otpCode.trim() },
      {
        onSuccess: async () => {
          setUnverifiedEmail(null)

          // The auto-retry login below only has a real password to submit when the user
          // typed one into *this* form before hitting the 403 (the "existing account, just
          // unverified" path). When we got here via RegisterOrganizationOwnerPage's redirect
          // (see the justRegisteredEmail effect above), only the email was ever populated —
          // the password never leaves that page/navigation state — so form.getValues().password
          // is still '' here. Submitting that always 400s Zod's min-8-chars check on /auth/login,
          // which used to surface as a confusing generic error with no working form. Detect that
          // case and just hand the (pre-filled-email) form back for the user to type their
          // password into, instead of guessing at a password we were never given.
          const password = form.getValues('password')

          if (!password) {
            toast.success('Email verified! Enter your password below to sign in.')
            return
          }

          toast.success('Email verified — signing you in…')

          try {
            await loginMutation.mutateAsync(form.getValues())
            navigate('/dashboard', { replace: true })
          } catch (error) {
            // Verified, but the auto-retry login failed for some other reason (e.g. the
            // password field changed in the meantime) — fall back to asking them to submit
            // the form again rather than silently stranding them.
            toast.error(parseApiError(error).message || 'Verified. Please sign in again.')
          }
        },
        onError: (otpError) => {
          toast.error(parseApiError(otpError).message || 'Invalid or expired code.')
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff5ea_0%,#f8fafc_48%,#f3f6fb_100%)]">
      <PublicNavbar />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <BreadcrumbTrail items={[{ label: 'Sign in' }]} />

          <div className="stagger-in grid w-full gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="order-2 space-y-5 lg:order-1">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm">
                  Welcome back
                </div>
                <h1 className="text-[2.2rem] font-semibold tracking-tight text-slate-900 sm:text-[3rem]">
                  Keep stock updates moving without the daily mess
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  Sign in to continue managing products, stock quantity, low stock items, and branch-level inventory work in one simple workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'Local shop friendly', value: 'Made for practical daily work', icon: Store },
                  { title: 'Clear stock visibility', value: 'Know what is low right away', icon: BellRing },
                  { title: 'Products stay organized', value: 'Categories, brands, and variants', icon: Boxes },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <Card key={item.title} className="rounded-[1.5rem] border-white/80 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.value}</p>
                    </Card>
                  )
                })}
              </div>

              <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,231,0.9))] p-6 shadow-[0_24px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/25">
                    <Package2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">What you can pick up right away</h2>
                    <div className="mt-4 space-y-3">
                      {[
                        'Continue where your last stock update stopped.',
                        'Check low stock items without opening multiple sheets.',
                        'Keep your product list cleaner for your team and your counter.',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <p className="text-sm leading-6 text-slate-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="order-1 rounded-[2rem] border-white/80 bg-white/94 shadow-[0_28px_70px_rgba(15,23,42,0.08)] lg:order-2">
              <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
                <div className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
                  NearCart Inventory
                </div>
                <CardTitle className="mt-3 text-[1.9rem]">{t('auth:title')}</CardTitle>
                <CardDescription className="max-w-md">{t('auth:subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2 sm:p-8 sm:pt-2">
                <form className="space-y-5" onSubmit={onSubmit}>
                  <FormField label={t('auth:email')} error={form.formState.errors.email?.message} required>
                    <Input type="email" placeholder={t('auth:emailPlaceholder')} {...form.register('email')} />
                  </FormField>
                  <FormField label={t('auth:password')} error={form.formState.errors.password?.message} required>
                    <Input type="password" placeholder={t('auth:passwordPlaceholder')} {...form.register('password')} />
                  </FormField>
                  <Button className="h-11 w-full rounded-full" loading={loginMutation.isPending} loadingText={t('auth:loggingIn')} type="submit">
                    {t('auth:submit')}
                    {!loginMutation.isPending ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>
                      New business? <Link className="font-semibold text-primary" to="/register">Create a workspace</Link>
                    </p>
                    <p>Need a reset link? Ask an organization admin or super admin to generate one for you.</p>
                  </div>
                </form>

                {unverifiedEmail ? (
                  <div className="mt-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Verify your email to sign in</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        We sent a 6-digit code to {unverifiedEmail}. Enter it below to verify your account and
                        continue signing in.
                      </p>
                    </div>
                    <FormField label="Verification code">
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        value={otpCode}
                      />
                    </FormField>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="rounded-full"
                        disabled={otpCode.length !== 6}
                        loading={verifyOtpMutation.isPending}
                        onClick={handleVerifyOtp}
                        type="button"
                      >
                        Verify & sign in
                      </Button>
                      <Button
                        className="rounded-full"
                        loading={sendOtpMutation.isPending}
                        onClick={handleResendOtp}
                        type="button"
                        variant="outline"
                      >
                        Resend code
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
