import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useRegisterOrganizationOwnerMutation } from '@/features/auth/auth.api'
import { useIndustriesQuery } from '@/features/meta/meta.api'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { ControlledSelect, FormField } from '@/components/forms'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { BRANCH_TYPES, LANGUAGE_CODES } from '@/types/common'
import { normalizeNullableString, parseApiError } from '@/lib/utils'

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  preferredLanguage: z.enum(LANGUAGE_CODES).default('EN'),
  organizationName: z.string().trim().min(2),
  organizationEmail: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  primaryIndustryId: z.string().min(1),
  defaultLanguage: z.enum(LANGUAGE_CODES).default('EN'),
  firstBranchName: z.string().trim().min(2),
  firstBranchCode: z.string().trim().optional(), // Auto-generated if not provided
  firstBranchType: z.enum(BRANCH_TYPES).default('STORE'),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
})

type RegisterFormValues = z.output<typeof registerSchema>

export function RegisterOrganizationOwnerPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const { language, setLanguage } = useLocale()
  const industriesQuery = useIndustriesQuery()
  const registerMutation = useRegisterOrganizationOwnerMutation()
  const form = useForm<any>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      preferredLanguage: 'EN',
      organizationName: '',
      organizationEmail: '',
      phone: '',
      primaryIndustryId: '',
      defaultLanguage: 'EN',
      firstBranchName: '',
      firstBranchCode: '',
      firstBranchType: 'STORE',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!form.getValues('primaryIndustryId') && industriesQuery.data?.[0]?.id) {
      form.setValue('primaryIndustryId', industriesQuery.data[0].id)
    }
  }, [form, industriesQuery.data])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        preferredLanguage: values.preferredLanguage,
        name: values.organizationName.trim(),
        organizationEmail: normalizeNullableString(values.organizationEmail) ?? undefined,
        phone: normalizeNullableString(values.phone) ?? undefined,
        primaryIndustryId: values.primaryIndustryId,
        defaultLanguage: values.defaultLanguage,
        enabledLanguages: ['EN', 'HI', 'GU'],
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        firstBranch: {
          code: normalizeNullableString(values.firstBranchCode) ?? undefined, // Auto-generated if not provided
          name: values.firstBranchName.trim(),
          type: values.firstBranchType,
          city: normalizeNullableString(values.city) ?? undefined,
          state: normalizeNullableString(values.state) ?? undefined,
          country: normalizeNullableString(values.country) ?? undefined,
          postalCode: normalizeNullableString(values.postalCode) ?? undefined,
        },
      })

      toast.success(t('register:successMessage'))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-5xl rounded-[2rem]">
        <CardHeader className="flex flex-row items-start justify-between p-7 sm:p-8">
          <div className="flex-1">
            <CardTitle>{t('register:title')}</CardTitle>
            <CardDescription>
              {t('register:subtitle')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {LANGUAGE_CODES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as any)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === lang
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('register:ownerAccount')}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t('register:ownerAccountDesc')}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t('register:fullName')} error={form.formState.errors.fullName?.message}>
                    <Input placeholder={t('register:fullNamePlaceholder')} {...form.register('fullName')} />
                  </FormField>
                  <FormField label={t('register:email')} error={form.formState.errors.email?.message}>
                    <Input type="email" placeholder={t('register:emailPlaceholder')} {...form.register('email')} />
                  </FormField>
                  <FormField label={t('register:password')} error={form.formState.errors.password?.message}>
                    <Input type="password" placeholder={t('register:passwordPlaceholder')} {...form.register('password')} />
                  </FormField>
                  <FormField label={t('register:preferredLanguage')}>
                    <ControlledSelect
                      control={form.control as never}
                      name="preferredLanguage"
                      options={LANGUAGE_CODES.map((language) => ({
                        value: language,
                        label: language,
                      }))}
                    />
                  </FormField>
                </div>
              </div>

              <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('register:workspaceBasics')}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t('register:workspaceBasicsDesc')}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t('register:organizationName')} error={form.formState.errors.organizationName?.message}>
                    <Input placeholder={t('register:organizationNamePlaceholder')} {...form.register('organizationName')} />
                  </FormField>
                  <FormField label={t('register:organizationEmail')} error={form.formState.errors.organizationEmail?.message}>
                    <Input placeholder={t('register:organizationEmailPlaceholder')} {...form.register('organizationEmail')} />
                  </FormField>
                  <FormField label={t('register:phone')}>
                    <Input placeholder={t('register:phonePlaceholder')} {...form.register('phone')} />
                  </FormField>
                  <FormField label={t('register:primaryIndustry')} error={form.formState.errors.primaryIndustryId?.message}>
                    <ControlledSelect
                      control={form.control as never}
                      name="primaryIndustryId"
                      placeholder={industriesQuery.isLoading ? t('register:loadingIndustries') : t('register:primaryIndustryPlaceholder')}
                      options={
                        industriesQuery.data?.map((industry) => ({
                          value: industry.id,
                          label: industry.displayName ?? industry.name ?? industry.code,
                        })) ?? []
                      }
                    />
                  </FormField>
                  <FormField label={t('register:defaultLanguage')}>
                    <ControlledSelect
                      control={form.control as never}
                      name="defaultLanguage"
                      options={LANGUAGE_CODES.map((language) => ({
                        value: language,
                        label: language,
                      }))}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{t('register:firstBranch')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('register:firstBranchDesc')}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label={t('register:branchName')} error={form.formState.errors.firstBranchName?.message}>
                  <Input placeholder={t('register:branchNamePlaceholder')} {...form.register('firstBranchName')} />
                </FormField>
                <FormField label={t('register:branchCode')} helperText={t('register:branchCodeHelper')} error={form.formState.errors.firstBranchCode?.message}>
                  <Input placeholder={t('register:branchCodePlaceholder')} {...form.register('firstBranchCode')} />
                </FormField>
                <FormField label={t('register:branchType')}>
                  <ControlledSelect
                    control={form.control as never}
                    name="firstBranchType"
                    options={BRANCH_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                </FormField>
                <FormField label={t('register:city')}>
                  <Input placeholder={t('register:cityPlaceholder')} {...form.register('city')} />
                </FormField>
                <FormField label={t('register:state')}>
                  <Input placeholder={t('register:statePlaceholder')} {...form.register('state')} />
                </FormField>
                <FormField label={t('register:country')}>
                  <Input placeholder={t('register:countryPlaceholder')} {...form.register('country')} />
                </FormField>
                <FormField label={t('register:postalCode')}>
                  <Input placeholder={t('register:postalCodePlaceholder')} {...form.register('postalCode')} />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {t('register:haveAccount')} <Link className="font-semibold text-emerald-700" to="/login">{t('register:signIn')}</Link>
              </p>
              <Button type="submit" disabled={registerMutation.isPending || industriesQuery.isLoading}>
                {registerMutation.isPending ? t('register:creatingWorkspace') : t('register:createWorkspace')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
