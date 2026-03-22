import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Globe2, Package2, Store, Warehouse } from 'lucide-react'

import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { useRegisterOrganizationOwnerMutation } from '@/features/auth/auth.api'
import { useIndustriesQuery } from '@/features/meta/meta.api'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { BreadcrumbTrail, DisclosurePanel } from '@/components/common'
import { ControlledSelect, FormField } from '@/components/forms'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { APP_LANGUAGES, BRANCH_TYPES, LANGUAGE_CODES } from '@/types/common'
import { getBranchTypeLabel, getLanguageLabel } from '@/lib/labels'
import { cn, normalizeNullableString, parseApiError } from '@/lib/utils'

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
        enabledLanguages: [...LANGUAGE_CODES],
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        firstBranch: {
          code: normalizeNullableString(values.firstBranchCode) ?? '', // Empty string lets backend auto-generate
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eefbf2_0%,#f8fafc_48%,#f3f6fb_100%)]">
      <PublicNavbar />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <BreadcrumbTrail items={[{ label: 'Sign in', to: '/login' }, { label: 'Create workspace' }]} />

          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-emerald-100 bg-white/90 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                  Start your workspace
                </div>
                <h1 className="text-[2.1rem] font-semibold tracking-tight text-slate-900 sm:text-[2.8rem]">
                  Set up your shop inventory in one clean flow
                </h1>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                  Create your owner account, add your business details, and set up the first branch so you can start tracking products and stock without a complicated setup.
                </p>
              </div>

              <Card className="rounded-[2rem] border-white/80 bg-white/90 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.07)]">
                <div className="space-y-4">
                  {[
                    { title: 'Owner account', description: 'Create the main login for your business.', icon: Package2 },
                    { title: 'Business setup', description: 'Add your shop name, language, and basic details.', icon: Globe2 },
                    { title: 'First branch', description: 'Set up your first store or warehouse and start using the app.', icon: Warehouse },
                  ].map((item) => {
                    const Icon = item.icon

                    return (
                      <div key={item.title} className="flex items-start gap-4 rounded-[1.3rem] border border-slate-200/80 bg-slate-50/80 p-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="rounded-[2rem] border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,244,0.9))] p-6 shadow-[0_20px_55px_rgba(15,23,42,0.07)]">
                <p className="text-sm font-semibold text-slate-900">Helpful for local businesses like:</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {['Kirana', 'Pharmacy', 'Stationery', 'Hardware', 'Personal care', 'Wholesale'].map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-600">
                    You can keep optional details light for the first pass and fill in more later.
                  </p>
                </div>
              </Card>
            </div>

            <Card className="w-full rounded-[2rem] border-white/80 bg-white/94 shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
              <CardHeader className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      NearCart Inventory
                    </div>
                    <CardTitle className="mt-3 text-[1.9rem]">{t('register:title')}</CardTitle>
                    <CardDescription className="max-w-2xl">{t('register:subtitle')}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {APP_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                          language === lang
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <p className="text-sm leading-6 text-slate-700">
                      Fill the essentials now, then continue to products, stock, and branch work once the workspace is ready.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
                <form className="space-y-6" onSubmit={onSubmit}>
                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <div className="space-y-4 rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">{t('register:ownerAccount')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('register:ownerAccountDesc')}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField label={t('register:fullName')} error={form.formState.errors.fullName?.message} required>
                          <Input placeholder={t('register:fullNamePlaceholder')} {...form.register('fullName')} />
                        </FormField>
                        <FormField label={t('register:email')} error={form.formState.errors.email?.message} required>
                          <Input type="email" placeholder={t('register:emailPlaceholder')} {...form.register('email')} />
                        </FormField>
                        <FormField label={t('register:password')} error={form.formState.errors.password?.message} required>
                          <Input type="password" placeholder={t('register:passwordPlaceholder')} {...form.register('password')} />
                        </FormField>
                        <FormField label={t('register:preferredLanguage')}>
                          <ControlledSelect
                            control={form.control as never}
                            name="preferredLanguage"
                            options={LANGUAGE_CODES.map((language) => ({
                              value: language,
                              label: getLanguageLabel(t, language),
                            }))}
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">{t('register:workspaceBasics')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('register:workspaceBasicsDesc')}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField label={t('register:organizationName')} error={form.formState.errors.organizationName?.message} required>
                          <Input placeholder={t('register:organizationNamePlaceholder')} {...form.register('organizationName')} />
                        </FormField>
                        <FormField label={t('register:primaryIndustry')} error={form.formState.errors.primaryIndustryId?.message} required>
                          <ControlledSelect
                            control={form.control as never}
                            name="primaryIndustryId"
                            placeholder={industriesQuery.isLoading ? t('register:loadingIndustries') : t('register:primaryIndustryPlaceholder')}
                            options={
                              industriesQuery.data?.map((industry) => ({
                                value: industry.id,
                                label: industry.displayName ?? industry.name ?? industry.code ?? industry.id,
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
                              label: getLanguageLabel(t, language),
                            }))}
                          />
                        </FormField>
                      </div>
                      <DisclosurePanel
                        title="Workspace contact details"
                        description="Organization email and phone are optional, so you can finish setup faster on mobile."
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField label={t('register:organizationEmail')} error={form.formState.errors.organizationEmail?.message}>
                            <Input placeholder={t('register:organizationEmailPlaceholder')} {...form.register('organizationEmail')} />
                          </FormField>
                          <FormField label={t('register:phone')}>
                            <Input placeholder={t('register:phonePlaceholder')} {...form.register('phone')} />
                          </FormField>
                        </div>
                      </DisclosurePanel>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{t('register:firstBranch')}</h2>
                      <p className="mt-1 text-sm text-slate-600">{t('register:firstBranchDesc')}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FormField label={t('register:branchName')} error={form.formState.errors.firstBranchName?.message} required>
                        <Input placeholder={t('register:branchNamePlaceholder')} {...form.register('firstBranchName')} />
                      </FormField>
                      <FormField label={t('register:branchType')}>
                        <ControlledSelect
                          control={form.control as never}
                          name="firstBranchType"
                          options={BRANCH_TYPES.map((type) => ({
                            value: type,
                            label: getBranchTypeLabel(t, type),
                          }))}
                        />
                      </FormField>
                    </div>
                    <DisclosurePanel
                      title="Branch location and code"
                      description="Branch code and address info are optional for the first pass and can be added later."
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FormField
                          label={t('register:branchCode')}
                          description={t('register:branchCodeHelper')}
                          error={form.formState.errors.firstBranchCode?.message}
                        >
                          <Input placeholder={t('register:branchCodePlaceholder')} {...form.register('firstBranchCode')} />
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
                    </DisclosurePanel>
                  </div>

                  <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                    <p className="text-sm text-slate-500">
                      {t('register:haveAccount')} <Link className="font-semibold text-emerald-700" to="/login">{t('register:signIn')}</Link>
                    </p>
                    <Button
                      className="rounded-full px-5"
                      type="submit"
                      disabled={industriesQuery.isLoading}
                      loading={registerMutation.isPending}
                      loadingText={t('register:creatingWorkspace')}
                    >
                      {t('register:createWorkspace')}
                    </Button>
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
