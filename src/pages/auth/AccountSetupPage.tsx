import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { useCompleteAccountSetupMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/common'
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
    return <EmptyState title="Setup link is missing" description="Open this page from the account setup link shared by your admin." />
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg rounded-[2rem]">
        <CardHeader className="p-7 sm:p-8">
          <CardTitle>Finish Account Setup</CardTitle>
          <CardDescription>Create your password to activate the invited workspace access.</CardDescription>
        </CardHeader>
        <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label="Password" error={form.formState.errors.password?.message}>
              <Input type="password" placeholder="••••••••" {...form.register('password')} />
            </FormField>
            <FormField label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" placeholder="••••••••" {...form.register('confirmPassword')} />
            </FormField>
            <Button className="w-full" type="submit" disabled={setupMutation.isPending}>
              {setupMutation.isPending ? 'Activating account...' : 'Activate account'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Already active? <Link className="font-semibold text-emerald-700" to="/login">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
