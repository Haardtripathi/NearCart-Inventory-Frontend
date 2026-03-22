import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useCompleteAccountSetupMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { BreadcrumbTrail, EmptyState } from '@/components/common'
import { FormField } from '@/components/forms'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { parseApiError } from '@/lib/utils'

const accountSetupSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type AccountSetupFormValues = z.infer<typeof accountSetupSchema>

export function AccountSetupPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const token = searchParams.get('token') ?? ''
  const setupMutation = useCompleteAccountSetupMutation()
  const form = useForm<AccountSetupFormValues>({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <BreadcrumbTrail items={[{ label: 'Sign in', to: '/login' }, { label: 'Account setup' }]} />
          <EmptyState title={t('setupMissingTitle')} description={t('setupMissingDescription')} />
        </div>
      </div>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await setupMutation.mutateAsync({
        token,
        password: values.password,
      })
      toast.success('Account setup complete')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <BreadcrumbTrail items={[{ label: 'Sign in', to: '/login' }, { label: 'Account setup' }]} />

        <Card className="w-full rounded-[2rem]">
        <CardHeader className="p-7 sm:p-8">
          <CardTitle>{t('setupTitle')}</CardTitle>
          <CardDescription>{t('setupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label={t('password')} error={form.formState.errors.password?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder')} {...form.register('password')} />
            </FormField>
            <FormField label={t('confirmPassword')} error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder')} {...form.register('confirmPassword')} />
            </FormField>
            <Button className="w-full" type="submit" disabled={setupMutation.isPending}>
              {setupMutation.isPending ? t('activatingAccount') : t('activateAccount')}
            </Button>
            <p className="text-center text-sm text-slate-500">
              {t('alreadyActive')} <Link className="font-semibold text-emerald-700" to="/login">{t('submit')}</Link>
            </p>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
