import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useResetPasswordMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { BreadcrumbTrail, EmptyState } from '@/components/common'
import { FormField } from '@/components/forms'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { parseApiError } from '@/lib/utils'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const token = searchParams.get('token') ?? ''
  const resetMutation = useResetPasswordMutation()
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
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
          <BreadcrumbTrail items={[{ label: 'Sign in', to: '/login' }, { label: 'Reset password' }]} />
          <EmptyState title={t('resetMissingTitle')} description={t('resetMissingDescription')} />
        </div>
      </div>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await resetMutation.mutateAsync({
        token,
        password: values.password,
      })
      toast.success('Password reset complete')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <BreadcrumbTrail items={[{ label: 'Sign in', to: '/login' }, { label: 'Reset password' }]} />

        <Card className="w-full rounded-[2rem]">
        <CardHeader className="p-7 sm:p-8">
          <CardTitle>{t('resetTitle')}</CardTitle>
          <CardDescription>{t('resetDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label={t('newPassword')} error={form.formState.errors.password?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder')} {...form.register('password')} />
            </FormField>
            <FormField label={t('confirmPassword')} error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder')} {...form.register('confirmPassword')} />
            </FormField>
            <Button className="w-full" type="submit" loading={resetMutation.isPending} loadingText={t('resettingPassword')}>
              {t('resetPassword')}
            </Button>
            <p className="text-center text-sm text-slate-500">
              <Link className="font-semibold text-emerald-700" to="/login">{t('backToSignIn')}</Link>
            </p>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
