import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Globe2, ShieldCheck, Warehouse } from 'lucide-react'

import { useLoginMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/hooks/useAuth'
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
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.08)] sm:p-10 lg:p-12">
          <div className="absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_58%)] blur-2xl" />
          <div className="relative">
            <span className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              NearCart Inventory
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Multilingual inventory operations that stay usable on the shop floor and in the office.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Keep products, master catalog imports, purchases, sales orders, transfers, and audit visibility in one responsive workspace.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Localized catalog', value: 'EN / HI', icon: Globe2 },
                { label: 'Tenant aware', value: 'Organizations + branches', icon: ShieldCheck },
                { label: 'Operations ready', value: 'Purchases, orders, transfers', icon: Warehouse },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-900">{item.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-emerald-100/70 bg-white/70 p-5">
              <p className="text-sm font-medium text-slate-900">NearCart keeps the busy work out of inventory flow.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in to continue with organization setup, branch-ready catalog management, and operational workflows that stay aligned across desktop and mobile.
              </p>
            </div>
          </div>
        </div>

        <Card className="self-center rounded-[2rem]">
          <CardHeader className="p-7 pb-4 sm:p-8 sm:pb-4">
            <CardTitle>{t('auth:title')}</CardTitle>
            <CardDescription>{t('auth:subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-7 pt-2 sm:p-8 sm:pt-2">
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label={t('auth:email')} error={form.formState.errors.email?.message} required>
                <Input type="email" placeholder="merchant@example.com" {...form.register('email')} />
              </FormField>
              <FormField label={t('auth:password')} error={form.formState.errors.password?.message} required>
                <Input type="password" placeholder="••••••••" {...form.register('password')} />
              </FormField>
              <Button className="w-full" disabled={loginMutation.isPending} type="submit">
                {loginMutation.isPending ? t('auth:loggingIn') : t('auth:submit')}
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
  )
}
