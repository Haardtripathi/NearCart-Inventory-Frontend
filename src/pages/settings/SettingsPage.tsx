import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { DetailGrid, DetailItem, InlineNotice, PageHeader, SectionCard } from '@/components/common'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { FormField } from '@/components/forms'
import { Badge, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useHealthQuery, useLocalizationContextQuery } from '@/features/meta/meta.api'
import { useChangePasswordMutation } from '@/features/auth/auth.api'
import { normalizeBackendLanguage } from '@/lib/locale'
import { formatDateTime, parseApiError } from '@/lib/utils'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { user, memberships, activeOrganizationId } = useAuth()
  const localizationQuery = useLocalizationContextQuery()
  const healthQuery = useHealthQuery()
  const changePasswordMutation = useChangePasswordMutation()
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.organizationId === activeOrganizationId),
    [activeOrganizationId, memberships],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success('Password updated')
      form.reset()
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t('profileBasics')} description={t('profileDescription')}>
          <DetailGrid className="xl:grid-cols-2">
            <DetailItem label={t('name', { ns: 'common' })} value={user?.fullName ?? '—'} />
            <DetailItem label={t('email', { ns: 'common' })} value={user?.email ?? '—'} />
            <DetailItem label={t('platformRole')} value={<Badge>{user?.platformRole ?? activeMembership?.role ?? '—'}</Badge>} />
            <DetailItem label={t('lastLogin')} value={formatDateTime(user?.lastLoginAt)} />
          </DetailGrid>
        </SectionCard>

        <SectionCard title={t('preferredLanguage')} description={t('preferredLanguageDescription')}>
          <div className="max-w-xs">
            <LanguageSwitcher />
          </div>
          <InlineNotice className="mt-4" tone="success">
            {t('backendPreferredLanguage')}:{' '}
            <span className="font-semibold text-slate-900">{normalizeBackendLanguage(user?.preferredLanguage)}</span>
          </InlineNotice>
        </SectionCard>

        <SectionCard title={t('passwordTitle')} description={t('passwordDescription')}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField label={t('currentPassword')} error={form.formState.errors.currentPassword?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder', { ns: 'common' })} {...form.register('currentPassword')} />
            </FormField>
            <FormField label={t('newPassword')} error={form.formState.errors.newPassword?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder', { ns: 'common' })} {...form.register('newPassword')} />
            </FormField>
            <FormField label={t('confirmNewPassword')} error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" placeholder={t('passwordPlaceholder', { ns: 'common' })} {...form.register('confirmPassword')} />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" loading={changePasswordMutation.isPending} loadingText={t('updatingPassword')}>
                {t('updatePassword')}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title={t('organizationLanguages')} description={t('organizationLanguagesDescription')}>
          <DetailGrid className="xl:grid-cols-2">
            <DetailItem label={t('activeOrganization')} value={activeMembership?.organization.name ?? '—'} />
            <DetailItem
              label={t('resolvedLanguage')}
              value={localizationQuery.data?.resolvedLanguage ? normalizeBackendLanguage(localizationQuery.data.resolvedLanguage) : '—'}
            />
            <DetailItem
              label={t('organizationDefaultLanguage')}
              value={localizationQuery.data?.orgDefaultLanguage ? normalizeBackendLanguage(localizationQuery.data.orgDefaultLanguage) : '—'}
            />
            <DetailItem
              label={t('requestedLanguage')}
              value={localizationQuery.data?.requestedLanguage ? normalizeBackendLanguage(localizationQuery.data.requestedLanguage) : '—'}
            />
          </DetailGrid>
        </SectionCard>

        <SectionCard title={t('backendInfo')} description={t('backendInfoDescription')}>
          <DetailGrid className="xl:grid-cols-2">
            <DetailItem label={t('apiBaseUrl')} value={import.meta.env.VITE_API_BASE_URL || '—'} className="xl:col-span-2" />
            <DetailItem label={t('healthStatus')} value={healthQuery.data?.status ?? 'Unavailable'} />
            <DetailItem label={t('healthTimestamp')} value={formatDateTime(healthQuery.data?.timestamp)} />
          </DetailGrid>
        </SectionCard>
      </div>
    </div>
  )
}
