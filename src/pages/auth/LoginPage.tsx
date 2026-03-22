import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BellRing, Boxes, CheckCircle2, Package2, Store } from 'lucide-react'

import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { useLoginMutation } from '@/features/auth/auth.api'
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

export function LoginPage() {
  const { t } = useTranslation(['auth'])
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const loginMutation = useLoginMutation()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
      toast.success('Logged in successfully')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const { message } = parseApiError(error)
      toast.error(message || t('auth:invalidCredentials'))
    }
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eefbf2_0%,#f8fafc_48%,#f3f6fb_100%)]">
      <PublicNavbar />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <BreadcrumbTrail items={[{ label: 'Sign in' }]} />

          <div className="grid w-full gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="order-2 space-y-5 lg:order-1">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex rounded-full border border-emerald-100 bg-white/90 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
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
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.value}</p>
                    </Card>
                  )
                })}
              </div>

              <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,253,244,0.9))] p-6 shadow-[0_24px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
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
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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
                <div className="inline-flex w-fit rounded-full bg-emerald-600/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
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
                      New business? <Link className="font-semibold text-emerald-700" to="/register">Create a workspace</Link>
                    </p>
                    <p>Need a reset link? Ask an organization admin or super admin to generate one for you.</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
