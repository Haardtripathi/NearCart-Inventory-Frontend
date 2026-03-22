import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { Badge, Button, Card, CardContent, Input, OptionSelect } from '@/components/ui'
import {
  DetailGrid,
  DetailItem,
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/common'
import { ControlledSelect, FormField } from '@/components/forms'
import { useIndustriesQuery } from '@/features/meta/meta.api'
import {
  useAddOrganizationIndustryMutation,
  useCreateOrganizationMutation,
  useMyOrganizationsQuery,
} from '@/features/organizations/organizations.api'
import { useUserDirectoryQuery } from '@/features/users/users.api'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { normalizeNullableString, parseApiError } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { BRANCH_TYPES, LANGUAGE_CODES } from '@/types/common'
import { getBranchTypeLabel, getLanguageLabel } from '@/lib/labels'

const organizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required'),
  slug: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid organization email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  primaryIndustryId: z.string().min(1, 'Select an industry'),
  defaultLanguage: z.enum(LANGUAGE_CODES),
  firstBranchName: z.string().trim().min(2, 'Branch name is required'),
  firstBranchCode: z.string().trim().optional(),
  firstBranchType: z.enum(BRANCH_TYPES),
  addressLine1: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  ownerUserId: z.string().trim().optional(),
  ownerFullName: z.string().trim().optional(),
  ownerEmail: z.string().trim().optional(),
  ownerPreferredLanguage: z.enum(LANGUAGE_CODES).default('EN'),
})

type OrganizationFormValues = z.output<typeof organizationSchema>

export function OrganizationsPage() {
  const { t } = useTranslation(['organizations', 'common', 'register'])
  const permissions = usePermissions()
  const navigate = useNavigate()
  const { activeOrganizationId, memberships, role } = useAuth()
  const setActiveOrganizationId = useAuthStore((state) => state.setActiveOrganizationId)
  const organizationsQuery = useMyOrganizationsQuery()
  const industriesQuery = useIndustriesQuery()
  const directoryQuery = useUserDirectoryQuery('', role === 'SUPER_ADMIN')
  const createOrganizationMutation = useCreateOrganizationMutation()
  const addIndustryMutation = useAddOrganizationIndustryMutation()
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)
  const [additionalIndustryId, setAdditionalIndustryId] = useState('')
  const [ownerMode, setOwnerMode] = useState<'current' | 'existing' | 'new'>('current')
  const [latestOwnerAccessLink, setLatestOwnerAccessLink] = useState<{ url: string; expiresAt: string; ownerEmail: string } | null>(null)

  const organizations = useMemo(
    () =>
      organizationsQuery.data ??
      memberships.map((membership) => ({
        ...membership.organization,
        role: membership.role,
        isDefault: membership.isDefault,
      })),
    [memberships, organizationsQuery.data],
  )
  const activeOrganization = useMemo(
    () => organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
    [activeOrganizationId, organizations],
  )
  const availableAdditionalIndustries = useMemo(() => {
    const enabledIndustryIds = new Set(activeOrganization?.industries?.map((entry) => entry.industryId) ?? [])
    return (industriesQuery.data ?? []).filter((industry) => !enabledIndustryIds.has(industry.id))
  }, [activeOrganization?.industries, industriesQuery.data])

  const form = useForm<any>({
    resolver: zodResolver(organizationSchema) as never,
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      phone: '',
      primaryIndustryId: '',
      defaultLanguage: 'EN',
      firstBranchName: '',
      firstBranchCode: '',
      firstBranchType: 'STORE',
      addressLine1: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      ownerUserId: '',
      ownerFullName: '',
      ownerEmail: '',
      ownerPreferredLanguage: 'EN',
    },
  })

  useEffect(() => {
    if (!form.getValues('primaryIndustryId') && industriesQuery.data?.[0]?.id) {
      form.setValue('primaryIndustryId', industriesQuery.data[0].id)
    }
  }, [form, industriesQuery.data])

  useEffect(() => {
    if (role === 'SUPER_ADMIN' && !form.getValues('ownerUserId') && directoryQuery.data?.[0]?.id) {
      form.setValue('ownerUserId', directoryQuery.data[0].id)
    }
  }, [directoryQuery.data, form, role])

  const selectedAdditionalIndustryId = useMemo(() => {
    if (additionalIndustryId && availableAdditionalIndustries.some((industry) => industry.id === additionalIndustryId)) {
      return additionalIndustryId
    }

    return availableAdditionalIndustries[0]?.id ?? ''
  }, [additionalIndustryId, availableAdditionalIndustries])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (role === 'SUPER_ADMIN' && ownerMode === 'existing' && !values.ownerUserId) {
        toast.error('Select an existing owner')
        return
      }

      if (role === 'SUPER_ADMIN' && ownerMode === 'new' && (!values.ownerFullName?.trim() || !values.ownerEmail?.trim())) {
        toast.error('Enter the new owner name and email')
        return
      }

      const createdOrganization = await createOrganizationMutation.mutateAsync({
        name: values.name.trim(),
        slug: normalizeNullableString(values.slug) ?? undefined,
        email: normalizeNullableString(values.email) ?? undefined,
        phone: normalizeNullableString(values.phone) ?? undefined,
        primaryIndustryId: values.primaryIndustryId,
        defaultLanguage: values.defaultLanguage,
        enabledLanguages: [...LANGUAGE_CODES],
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        ...(role === 'SUPER_ADMIN' && ownerMode === 'existing' && values.ownerUserId
          ? {
              ownerUserId: values.ownerUserId,
            }
          : {}),
        ...(role === 'SUPER_ADMIN' && ownerMode === 'new'
          ? {
              owner: {
                fullName: values.ownerFullName?.trim() ?? '',
                email: values.ownerEmail?.trim() ?? '',
                preferredLanguage: values.ownerPreferredLanguage,
              },
            }
          : {}),
        firstBranch: {
          code: normalizeNullableString(values.firstBranchCode) ?? '',
          name: values.firstBranchName.trim(),
          type: values.firstBranchType,
          addressLine1: normalizeNullableString(values.addressLine1) ?? undefined,
          city: normalizeNullableString(values.city) ?? undefined,
          state: normalizeNullableString(values.state) ?? undefined,
          country: normalizeNullableString(values.country) ?? undefined,
          postalCode: normalizeNullableString(values.postalCode) ?? undefined,
        },
      })

      setActiveOrganizationId(createdOrganization.id)

      if (createdOrganization.ownerAccessLink?.url && createdOrganization.ownerUser?.email) {
        setLatestOwnerAccessLink({
          url: createdOrganization.ownerAccessLink.url,
          expiresAt: createdOrganization.ownerAccessLink.expiresAt,
          ownerEmail: createdOrganization.ownerUser.email,
        })
        toast.success('Organization created and owner setup link generated')
        form.reset({
          name: '',
          slug: '',
          email: '',
          phone: '',
          primaryIndustryId: industriesQuery.data?.[0]?.id ?? '',
          defaultLanguage: 'EN',
          firstBranchName: '',
          firstBranchCode: '',
          firstBranchType: 'STORE',
          addressLine1: '',
          city: '',
          state: '',
          country: 'India',
          postalCode: '',
          ownerUserId: directoryQuery.data?.[0]?.id ?? '',
          ownerFullName: '',
          ownerEmail: '',
          ownerPreferredLanguage: 'EN',
        })
        setOwnerMode('current')
        return
      }

      toast.success(t('createdSuccess'))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(parseApiError(error).message || t('createFailed'))
    }
  })

  if (organizationsQuery.isLoading && !organizationsQuery.data) {
    return <LoadingState label={t('loadingOrganizations')} />
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Setup" title={t('title')} description={t('description')} />

      <InlineNotice>{t('workspaceGuide')}</InlineNotice>

      {latestOwnerAccessLink ? (
        <InlineNotice tone="success">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Owner setup link ready for {latestOwnerAccessLink.ownerEmail}</p>
              <p className="mt-1 break-all text-sm">{latestOwnerAccessLink.url}</p>
              <p className="mt-1 text-xs text-slate-500">Expires {latestOwnerAccessLink.expiresAt}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(latestOwnerAccessLink.url)
                  toast.success('Setup link copied')
                }}
              >
                Copy link
              </Button>
              <Button variant="ghost" onClick={() => setLatestOwnerAccessLink(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </InlineNotice>
      ) : null}

      <SectionCard title={t('availableTitle')} description={t('availableDescription')}>
        {organizations.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {organizations.map((organization) => {
              const isActive = organization.id === activeOrganizationId

              return (
                <Card key={organization.id} className={isActive ? 'border-primary/30 ring-1 ring-primary/15' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{organization.name}</p>
                        <p className="text-sm text-slate-500">{organization.slug}</p>
                      </div>
                      <StatusBadge value={organization.status} />
                    </div>
                    <DetailGrid className="mt-4 xl:grid-cols-2">
                      <DetailItem label={t('role', { ns: 'common' })} value={organization.role ?? '—'} />
                      <DetailItem label={t('defaultWorkspace')} value={organization.isDefault ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })} />
                    </DetailGrid>
                    <div className="mt-4 space-y-2">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('enabledIndustries')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(organization.industries ?? []).map((entry) => (
                          <Badge key={entry.id} tone={entry.isPrimary ? 'success' : 'muted'}>
                            {entry.industry.displayName ?? entry.industry.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button
                        variant={isActive ? 'secondary' : 'default'}
                        onClick={() => {
                          setActiveOrganizationId(organization.id)
                          navigate('/dashboard', { replace: true })
                        }}
                      >
                        {isActive ? t('currentlyActive', { ns: 'common' }) : t('useOrganization', { ns: 'common' })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState title={t('noOrganizationsTitle')} description={t('noOrganizationsDescription')} />
        )}
      </SectionCard>

      {activeOrganization && (role === 'SUPER_ADMIN' || role === 'ORG_ADMIN') ? (
        <SectionCard title={t('enableIndustryTitle')} description={t('enableIndustryDescription')}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_auto] lg:items-end">
            <FormField label={t('addIndustry')}>
              <OptionSelect
                value={selectedAdditionalIndustryId}
                onValueChange={setAdditionalIndustryId}
                options={availableAdditionalIndustries.map((industry) => ({
                  value: industry.id,
                  label: industry.displayName ?? industry.name ?? industry.code,
                }))}
                placeholder={availableAdditionalIndustries.length ? t('selectIndustryToEnable') : t('allIndustriesEnabled')}
                disabled={!availableAdditionalIndustries.length || addIndustryMutation.isPending}
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              {permissions.canManageMasterPlatform ? (
                <Button type="button" variant="outline" onClick={() => setIndustryDialogOpen(true)}>
                  {t('addIndustry')}
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={!selectedAdditionalIndustryId || !availableAdditionalIndustries.length || addIndustryMutation.isPending}
                onClick={async () => {
                  try {
                    await addIndustryMutation.mutateAsync({
                      organizationId: activeOrganization.id,
                      payload: {
                        industryId: selectedAdditionalIndustryId,
                      },
                    })
                    toast.success(t('industryEnabledSuccess'))
                    setAdditionalIndustryId('')
                  } catch (error) {
                    toast.error(parseApiError(error).message || t('industryEnabledFailed'))
                  }
                }}
              >
                {addIndustryMutation.isPending ? t('enablingIndustry') : t('enableIndustry')}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title={organizations.length ? t('createAnotherTitle') : t('createFirstTitle')} description={t('createDescription')}>
        {industriesQuery.isError ? (
          <ErrorState description="Industries could not be loaded, so organization setup is blocked right now." onRetry={() => void industriesQuery.refetch()} />
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="mb-4 space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">{t('basicsTitle')}</h3>
                  <p className="text-sm text-slate-600">{t('basicsDescription')}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t('organizationName')} error={form.formState.errors.name?.message} required>
                    <Input placeholder={t('organizationNamePlaceholder', { ns: 'register' })} {...form.register('name')} />
                  </FormField>
                  <FormField label="Slug" error={form.formState.errors.slug?.message}>
                    <Input placeholder={t('slugPlaceholder')} {...form.register('slug')} />
                  </FormField>
                  <FormField label={t('email', { ns: 'common' })} error={form.formState.errors.email?.message}>
                    <Input placeholder={t('organizationEmailPlaceholder', { ns: 'register' })} {...form.register('email')} />
                  </FormField>
                  <FormField label={t('phone', { ns: 'common' })} error={form.formState.errors.phone?.message}>
                    <Input placeholder={t('phonePlaceholder', { ns: 'register' })} {...form.register('phone')} />
                  </FormField>
                  <FormField label={t('primaryIndustry')} error={form.formState.errors.primaryIndustryId?.message} required>
                    <ControlledSelect
                      control={form.control as never}
                      name="primaryIndustryId"
                      placeholder={industriesQuery.isLoading ? t('loadingIndustries', { ns: 'common' }) : t('selectIndustry', { ns: 'common' })}
                      disabled={industriesQuery.isLoading}
                      addActionLabel={permissions.canManageMasterPlatform ? 'Add industry' : undefined}
                      onAddAction={() => setIndustryDialogOpen(true)}
                      options={
                        industriesQuery.data?.map((industry) => ({
                          value: industry.id,
                          label: industry.displayName ?? industry.name ?? industry.code,
                        })) ?? []
                      }
                    />
                  </FormField>
                  <FormField label={t('defaultLanguage')} error={form.formState.errors.defaultLanguage?.message}>
                    <ControlledSelect
                      control={form.control as never}
                      name="defaultLanguage"
                      options={LANGUAGE_CODES.map((lang) => ({ value: lang, label: getLanguageLabel(t, lang) }))}
                    />
                  </FormField>
                </div>

                {role === 'SUPER_ADMIN' ? (
                  <div className="mt-6 rounded-md border border-slate-200 bg-white p-4">
                    <div className="mb-4 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900">Owner assignment</h4>
                      <p className="text-sm text-slate-600">Choose who should own this workspace on day one.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Owner flow">
                        <OptionSelect
                          value={ownerMode}
                          onValueChange={(value) => setOwnerMode(value as 'current' | 'existing' | 'new')}
                          options={[
                            { value: 'current', label: 'Use current user' },
                            { value: 'existing', label: 'Assign existing user' },
                            { value: 'new', label: 'Create new owner' },
                          ]}
                        />
                      </FormField>
                      {ownerMode === 'existing' ? (
                        <FormField label="Existing owner">
                          <ControlledSelect
                            control={form.control as never}
                            name="ownerUserId"
                            placeholder={directoryQuery.isLoading ? t('loadingUsers', { ns: 'common' }) : t('selectOwner', { ns: 'common' })}
                            options={(directoryQuery.data ?? []).map((user) => ({
                              value: user.id,
                              label: `${user.fullName} (${user.email})`,
                            }))}
                          />
                        </FormField>
                      ) : null}
                      {ownerMode === 'new' ? (
                        <>
                          <FormField label="Owner full name">
                            <Input placeholder={t('fullNamePlaceholder', { ns: 'register' })} {...form.register('ownerFullName')} />
                          </FormField>
                          <FormField label="Owner email">
                            <Input placeholder={t('emailPlaceholder', { ns: 'register' })} {...form.register('ownerEmail')} />
                          </FormField>
                          <FormField label="Owner language">
                            <ControlledSelect
                              control={form.control as never}
                              name="ownerPreferredLanguage"
                              options={LANGUAGE_CODES.map((language) => ({
                                value: language,
                                label: getLanguageLabel(t, language),
                              }))}
                            />
                          </FormField>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="mb-4 space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">{t('firstBranchTitle')}</h3>
                  <p className="text-sm text-slate-600">{t('firstBranchDescription')}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t('firstBranchName')} error={form.formState.errors.firstBranchName?.message} required>
                    <Input placeholder={t('branchNamePlaceholder', { ns: 'register' })} {...form.register('firstBranchName')} />
                  </FormField>
                  <FormField label={t('firstBranchCode')} error={form.formState.errors.firstBranchCode?.message}>
                    <Input placeholder={t('branchCodePlaceholder', { ns: 'register' })} {...form.register('firstBranchCode')} />
                  </FormField>
                  <FormField label={t('branchType')} error={form.formState.errors.firstBranchType?.message}>
                    <ControlledSelect
                      control={form.control as never}
                      name="firstBranchType"
                      options={BRANCH_TYPES.map((type) => ({ value: type, label: getBranchTypeLabel(t, type) }))}
                    />
                  </FormField>
                  <FormField label={t('addressLine1')} error={form.formState.errors.addressLine1?.message}>
                    <Input placeholder={t('addressLine1Placeholder', { ns: 'common' })} {...form.register('addressLine1')} />
                  </FormField>
                  <FormField label={t('city', { ns: 'common' })} error={form.formState.errors.city?.message}>
                    <Input placeholder={t('cityPlaceholder', { ns: 'register' })} {...form.register('city')} />
                  </FormField>
                  <FormField label={t('state', { ns: 'common' })} error={form.formState.errors.state?.message}>
                    <Input placeholder={t('statePlaceholder', { ns: 'register' })} {...form.register('state')} />
                  </FormField>
                  <FormField label={t('country', { ns: 'common' })} error={form.formState.errors.country?.message}>
                    <Input placeholder={t('countryPlaceholder', { ns: 'register' })} {...form.register('country')} />
                  </FormField>
                  <FormField label={t('postalCode', { ns: 'common' })} error={form.formState.errors.postalCode?.message}>
                    <Input placeholder={t('postalCodePlaceholder', { ns: 'register' })} {...form.register('postalCode')} />
                  </FormField>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={createOrganizationMutation.isPending || industriesQuery.isLoading}>
                {createOrganizationMutation.isPending ? t('creatingOrganization') : t('createOrganization')}
              </Button>
            </div>
          </form>
        )}
      </SectionCard>

      <IndustryDialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen} />
    </div>
  )
}
