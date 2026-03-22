import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

import { useBrandsQuery } from '@/features/brands/brands.api'
import { useCategoriesQuery } from '@/features/categories/categories.api'
import { useIndustriesQuery, useTaxRatesQuery, useUnitsQuery } from '@/features/meta/meta.api'
import {
  useCreateProductMutation,
  useCreateVariantMutation,
  useDeleteVariantMutation,
  useProductQuery,
  useUpdateProductMutation,
  useUpdateVariantMutation,
} from '@/features/products/products.api'
import { CheckboxField, ControlledSelect, DirtyStatePrompt, FormField, KeyValueEditor, TranslationFields } from '@/components/forms'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { DisclosurePanel, LoadingState, PageHeader, SectionCard } from '@/components/common'
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { useActiveOrganizationContext } from '@/hooks/useActiveOrganizationContext'
import { usePermissions } from '@/hooks/usePermissions'
import { getDisplayName } from '@/lib/utils'
import { PRODUCT_STATUSES, PRODUCT_TYPES, TRACK_METHODS, type TranslationInput, type VariantTranslationInput } from '@/types/common'
import type { ProductVariantPayload } from '@/types/product'

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().optional(),
  sku: z.string().trim().optional().default(''),
  barcode: z.string().trim().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().nullable().optional(),
  reorderLevel: z.coerce.number().min(0).default(0),
  minStockLevel: z.coerce.number().min(0).default(0),
  maxStockLevel: z.coerce.number().nullable().optional(),
  weight: z.coerce.number().nullable().optional(),
  unitId: z.string().trim().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  imageUrl: z.string().trim().optional(),
  translations: z.array(z.custom<VariantTranslationInput>()).default([]),
  attributes: z.record(z.string(), z.string()).default({}),
})

const productSchema = z.object({
  categoryId: z.string().trim().optional(),
  brandId: z.string().trim().optional(),
  taxRateId: z.string().trim().optional(),
  industryId: z.string().trim().optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  productType: z.enum(PRODUCT_TYPES),
  status: z.enum(PRODUCT_STATUSES).default('ACTIVE'),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
  trackMethod: z.enum(TRACK_METHODS).default('PIECE'),
  primaryUnitId: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  translations: z.array(z.custom<TranslationInput>()).default([]),
  variants: z.array(variantSchema).min(1),
})

type ProductFormValues = z.input<typeof productSchema>

function VariantEditor({
  control,
  index,
  onRemove,
  units,
  canRemove,
  isEdit,
  onAddUnit,
}: {
  control: Control<ProductFormValues>
  index: number
  onRemove: () => void
  units: Array<{ id: string; name: string }>
  canRemove: boolean
  isEdit: boolean
  onAddUnit?: () => void
}) {
  const { t } = useTranslation(['products', 'common', 'units'])
  const variantTranslations = useWatch({
    control,
    name: `variants.${index}.translations`,
  })
  const hasVariantTranslations = Boolean(variantTranslations?.some((translation) => translation.name?.trim()))
  const [showTranslations, setShowTranslations] = useState(false)
  const [translationsDismissed, setTranslationsDismissed] = useState(false)
  const variantTranslationsOpen = showTranslations || (hasVariantTranslations && !translationsDismissed)

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t('variantLabel', { index: index + 1 })}</p>
          <p className="text-xs text-slate-500">Keep the pricing essentials visible and tuck barcode or stock rules away until needed.</p>
        </div>
        <Button type="button" variant="ghost" onClick={onRemove} disabled={!canRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Controller control={control} name={`variants.${index}.name`} render={({ field }) => (
          <FormField label={t('nameOptional')}>
            <Input {...field} />
          </FormField>
        )} />
        <Controller control={control} name={`variants.${index}.sku`} render={({ field, fieldState }) => (
          <FormField label={t('sku')} error={fieldState.error?.message}>
            <Input placeholder={t('autoGeneratedSku', { defaultValue: 'Auto-generated if left blank' })} {...field} />
          </FormField>
        )} />
        <FormField label={t('unit')}>
          <ControlledSelect
            control={control}
            name={`variants.${index}.unitId` as const}
            placeholder={t('inheritProductUnit')}
            emptyOptionLabel={t('inheritProductUnit')}
            options={units.map((unit) => ({
              value: unit.id,
              label: unit.name,
            }))}
            addActionLabel={onAddUnit ? t('addUnit', { ns: 'units' }) : undefined}
            onAddAction={onAddUnit}
          />
        </FormField>
        <Controller control={control} name={`variants.${index}.costPrice`} render={({ field, fieldState }) => (
          <FormField label={t('costPrice')} error={fieldState.error?.message} required>
            <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </FormField>
        )} />
        <Controller control={control} name={`variants.${index}.sellingPrice`} render={({ field, fieldState }) => (
          <FormField label={t('sellingPrice')} error={fieldState.error?.message} required>
            <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </FormField>
        )} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Controller
          control={control}
          name={`variants.${index}.isDefault`}
          render={({ field }) => (
            <CheckboxField
              checked={Boolean(field.value)}
              label={t('defaultVariant')}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name={`variants.${index}.isActive`}
          render={({ field }) => (
            <CheckboxField
              checked={Boolean(field.value)}
              label={t('active', { ns: 'common' })}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      <DisclosurePanel
        title="More variant details"
        description="Add barcode, stock thresholds, media, and attributes only when the item needs them."
        defaultOpen={isEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Controller control={control} name={`variants.${index}.barcode`} render={({ field }) => (
            <FormField label={t('barcode')}>
              <Input {...field} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.mrp`} render={({ field }) => (
            <FormField label={t('mrp')}>
              <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.weight`} render={({ field }) => (
            <FormField label={t('weight')}>
              <Input step="0.001" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.reorderLevel`} render={({ field }) => (
            <FormField label={t('reorderLevel')}>
              <Input step="0.001" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.minStockLevel`} render={({ field }) => (
            <FormField label={t('minStock')}>
              <Input step="0.001" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.maxStockLevel`} render={({ field }) => (
            <FormField label={t('maxStock')}>
              <Input step="0.001" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormField>
          )} />
          <Controller control={control} name={`variants.${index}.imageUrl`} render={({ field }) => (
            <FormField label={t('imageUrl')} className="sm:col-span-2 xl:col-span-4">
              <ImageUploadField label={t('productImage')} value={field.value} onChange={field.onChange} scope="product" />
            </FormField>
          )} />
        </div>
        <Controller
          control={control}
          name={`variants.${index}.attributes`}
          render={({ field }) => (
            <FormField className="mt-4" label={t('attributes')}>
              <KeyValueEditor value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
      </DisclosurePanel>
      {isEdit ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{t('variantLanguageOverrides')}</p>
              <p className="text-xs leading-5 text-slate-500">{t('autoLanguageFallback')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (variantTranslationsOpen) {
                  setShowTranslations(false)
                  setTranslationsDismissed(true)
                  return
                }

                setShowTranslations(true)
                setTranslationsDismissed(false)
              }}
            >
              {variantTranslationsOpen ? t('hideLanguageOverrides') : t('showLanguageOverrides')}
            </Button>
          </div>
          {variantTranslationsOpen ? (
            <Controller
              control={control}
              name={`variants.${index}.translations`}
              render={({ field }) => (
                <FormField className="mt-4" label={t('languageOverrides')}>
                  <TranslationFields value={field.value} onChange={field.onChange} withDescription={false} />
                </FormField>
              )}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function normalizeProductTranslations(entries: TranslationInput[] = []) {
  return entries
    .map((translation) => ({
      ...translation,
      name: translation.name?.trim() ?? '',
      description: translation.description?.trim() || undefined,
    }))
    .filter((translation) => translation.name)
}

function normalizeVariantTranslations(entries: VariantTranslationInput[] = []) {
  return entries
    .map((translation) => ({
      ...translation,
      name: translation.name?.trim() ?? '',
    }))
    .filter((translation) => translation.name)
}

function createDefaultVariant() {
  return {
    name: '',
    sku: '',
    barcode: '',
    costPrice: 0,
    sellingPrice: 0,
    mrp: null,
    reorderLevel: 0,
    minStockLevel: 0,
    maxStockLevel: null,
    weight: null,
    unitId: '',
    isDefault: true,
    isActive: true,
    imageUrl: '',
    translations: [],
    attributes: {},
  }
}

function buildSkuSegment(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateVariantSku(productName: string, variantName: string | undefined, index: number) {
  const base = buildSkuSegment(productName) || 'PRODUCT'
  const variant = buildSkuSegment(variantName ?? '')
  return variant ? `${base}-${variant}` : `${base}-${index + 1}`
}

function normalizeVariantApiPayload(
  variant: ProductFormValues['variants'][number],
  productName: string,
  index: number,
): ProductVariantPayload {
  return {
    id: variant.id,
    sku: variant.sku?.trim() || generateVariantSku(productName, variant.name, index),
    costPrice: Number(variant.costPrice ?? 0),
    sellingPrice: Number(variant.sellingPrice ?? 0),
    reorderLevel: Number(variant.reorderLevel ?? 0),
    minStockLevel: Number(variant.minStockLevel ?? 0),
    name: variant.name?.trim() || undefined,
    barcode: variant.barcode?.trim() || undefined,
    attributes: Object.keys(variant.attributes ?? {}).length ? variant.attributes : undefined,
    imageUrl: variant.imageUrl?.trim() || undefined,
    unitId: variant.unitId?.trim() || undefined,
    mrp: variant.mrp == null ? undefined : Number(variant.mrp),
    maxStockLevel: variant.maxStockLevel == null ? undefined : Number(variant.maxStockLevel),
    weight: variant.weight == null ? undefined : Number(variant.weight),
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    translations: normalizeVariantTranslations(variant.translations),
  }
}

export function ProductFormPage() {
  const { t } = useTranslation(['products', 'common', 'units'])
  const permissions = usePermissions()
  const { defaultIndustryId } = useActiveOrganizationContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([])
  const [openedTranslationKeys, setOpenedTranslationKeys] = useState<Record<string, boolean>>({})
  const [dismissedTranslationKeys, setDismissedTranslationKeys] = useState<Record<string, boolean>>({})
  const productQuery = useProductQuery(id)
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 })
  const brandsQuery = useBrandsQuery({ page: 1, limit: 100 })
  const unitsQuery = useUnitsQuery()
  const taxRatesQuery = useTaxRatesQuery()
  const industriesQuery = useIndustriesQuery()
  const createProductMutation = useCreateProductMutation()
  const updateProductMutation = useUpdateProductMutation()
  const createVariantMutation = useCreateVariantMutation()
  const updateVariantMutation = useUpdateVariantMutation()
  const deleteVariantMutation = useDeleteVariantMutation()
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: '',
      brandId: '',
      taxRateId: '',
      industryId: '',
      name: '',
      slug: '',
      description: '',
      productType: 'SIMPLE',
      status: 'ACTIVE',
      trackInventory: true,
      allowBackorder: false,
      allowNegativeStock: false,
      trackMethod: 'PIECE',
      primaryUnitId: '',
      imageUrl: '',
      tags: '',
      translations: [],
      variants: [createDefaultVariant()],
    },
  })

  const variantsFieldArray = useFieldArray({
    control: form.control,
    name: 'variants',
  })
  const watchedProductTranslations = useWatch({
    control: form.control,
    name: 'translations',
  })

  const productType = useWatch({
    control: form.control,
    name: 'productType',
  })
  const translationVisibilityKey = id ?? 'new'
  const hasProductTranslations = Boolean(watchedProductTranslations?.some((translation) => translation.name?.trim()))
  const productTranslationsOpen =
    (openedTranslationKeys[translationVisibilityKey] ?? false)
    || (hasProductTranslations && !(dismissedTranslationKeys[translationVisibilityKey] ?? false))

  useEffect(() => {
    if (!productQuery.data) {
      return
    }

    form.reset({
      categoryId: productQuery.data.categoryId ?? '',
      brandId: productQuery.data.brandId ?? '',
      taxRateId: productQuery.data.taxRateId ?? '',
      industryId: productQuery.data.industryId ?? '',
      name: productQuery.data.name ?? '',
      slug: productQuery.data.slug,
      description: productQuery.data.description ?? '',
      productType: productQuery.data.productType,
      status: productQuery.data.status,
      trackInventory: productQuery.data.trackInventory,
      allowBackorder: productQuery.data.allowBackorder,
      allowNegativeStock: productQuery.data.allowNegativeStock,
      trackMethod: productQuery.data.trackMethod,
      primaryUnitId: productQuery.data.primaryUnitId ?? '',
      imageUrl: productQuery.data.imageUrl ?? '',
      tags: Array.isArray(productQuery.data.tags) ? productQuery.data.tags.join(', ') : '',
      translations: productQuery.data.translations ?? [],
      variants: productQuery.data.variants.map((variant) => ({
        id: variant.id,
        name: variant.name ?? '',
        sku: variant.sku,
        barcode: variant.barcode ?? '',
        costPrice: Number(variant.costPrice),
        sellingPrice: Number(variant.sellingPrice),
        mrp: variant.mrp ? Number(variant.mrp) : null,
        reorderLevel: Number(variant.reorderLevel),
        minStockLevel: Number(variant.minStockLevel),
        maxStockLevel: variant.maxStockLevel ? Number(variant.maxStockLevel) : null,
        weight: variant.weight ? Number(variant.weight) : null,
        unitId: variant.unitId ?? '',
        isDefault: variant.isDefault,
        isActive: variant.isActive,
        imageUrl: variant.imageUrl ?? '',
        translations: variant.translations ?? [],
        attributes: Object.fromEntries(
          Object.entries(variant.attributes ?? {}).map(([key, value]) => [key, String(value)]),
        ),
      })),
    })
  }, [form, productQuery.data])

  useEffect(() => {
    if (isEdit || form.formState.isDirty || form.getValues('industryId')) {
      return
    }

    const resolvedDefaultIndustryId = defaultIndustryId && industriesQuery.data?.some((industry) => industry.id === defaultIndustryId)
      ? defaultIndustryId
      : industriesQuery.data?.[0]?.id

    if (resolvedDefaultIndustryId) {
      form.setValue('industryId', resolvedDefaultIndustryId, { shouldDirty: false })
    }
  }, [defaultIndustryId, form, form.formState.isDirty, industriesQuery.data, isEdit])

  useEffect(() => {
    if (productType === 'SIMPLE' && variantsFieldArray.fields.length > 1) {
      form.setValue('variants', [form.getValues('variants.0')], { shouldDirty: true })
    }
  }, [form, productType, variantsFieldArray.fields.length])

  const units = useMemo(
    () => unitsQuery.data?.items.map((item) => ({ id: item.id, name: getDisplayName(item, item.name) })) ?? [],
    [unitsQuery.data?.items],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const selectedVariants = values.productType === 'VARIABLE' ? values.variants : [values.variants[0]]
      const normalizedVariants = selectedVariants.map((variant, index) => normalizeVariantApiPayload(variant, values.name, index))
      const payload = {
        categoryId: values.categoryId || undefined,
        brandId: values.brandId || undefined,
        taxRateId: values.taxRateId || undefined,
        industryId: values.industryId || undefined,
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        productType: values.productType,
        status: values.status,
        hasVariants: values.productType === 'VARIABLE',
        trackInventory: values.trackInventory,
        allowBackorder: values.allowBackorder,
        allowNegativeStock: values.allowNegativeStock,
        trackMethod: values.trackMethod,
        primaryUnitId: values.primaryUnitId || undefined,
        imageUrl: values.imageUrl || undefined,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : undefined,
        translations: normalizeProductTranslations(values.translations),
      }

      if (!isEdit) {
        const created = await createProductMutation.mutateAsync({
          ...payload,
          defaultVariant: values.productType === 'VARIABLE' ? undefined : normalizedVariants[0],
          variants: values.productType === 'VARIABLE' ? normalizedVariants : undefined,
        })
        toast.success(t('createdSuccess'))
        navigate(`/products/${created.id}`)
        return
      }

      await updateProductMutation.mutateAsync({ id: id!, payload })

      for (const variantId of removedVariantIds) {
        await deleteVariantMutation.mutateAsync({ productId: id!, variantId })
      }

      for (const variant of normalizedVariants) {
        const variantPayload = variant

        if (variant.id) {
          await updateVariantMutation.mutateAsync({
            productId: id!,
            variantId: variant.id,
            payload: variantPayload,
          })
        } else {
          await createVariantMutation.mutateAsync({
            productId: id!,
            payload: variantPayload,
          })
        }
      }

      toast.success(t('updatedSuccess'))
      navigate(`/products/${id}`)
    } catch {
      toast.error(t('saveFailed'))
    }
  }, () => {
    toast.error(t('fillRequiredFields', { ns: 'common', defaultValue: 'Please fill the required fields.' }))
  })

  if (isEdit && productQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="form" />
  }

  return (
    <div className="space-y-6">
      <DirtyStatePrompt active={form.formState.isDirty} />
      <PageHeader
        title={isEdit ? t('editTitle') : t('createTitle')}
        description={t('formDescription')}
      />

      <form className="space-y-6" onSubmit={onSubmit}>
        <SectionCard title={t('basicInfoTitle')} description={t('basicInfoDescription')}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <FormField label={t('name')} error={form.formState.errors.name?.message} required>
              <Input {...form.register('name')} />
            </FormField>
            <FormField label={t('productType')} required>
              <ControlledSelect
                control={form.control}
                name="productType"
                options={PRODUCT_TYPES.map((type) => ({ value: type, label: t(`typeValues.${type}`, { defaultValue: type }) }))}
              />
            </FormField>
            <FormField label={t('category', { ns: 'common' })}>
              <ControlledSelect
                control={form.control}
                name="categoryId"
                placeholder={t('noCategory')}
                emptyOptionLabel={t('noCategory')}
                options={categoriesQuery.data?.items.map((category) => ({
                  value: category.id,
                  label: getDisplayName(category, t('uncategorized', { ns: 'common' })),
                })) ?? []}
                addActionLabel={t('addCategory')}
                onAddAction={() => navigate('/categories')}
              />
            </FormField>
            <FormField label={t('brand')}>
              <ControlledSelect
                control={form.control}
                name="brandId"
                placeholder={t('noBrand')}
                emptyOptionLabel={t('noBrand')}
                options={brandsQuery.data?.items.map((brand) => ({
                  value: brand.id,
                  label: getDisplayName(brand, brand.name),
                })) ?? []}
                addActionLabel={t('addBrand')}
                onAddAction={() => navigate('/brands')}
              />
            </FormField>
            <FormField label={t('primaryUnit')}>
              <ControlledSelect
                control={form.control}
                name="primaryUnitId"
                placeholder={t('noPrimaryUnit')}
                emptyOptionLabel={t('noPrimaryUnit')}
                options={unitsQuery.data?.items.map((unit) => ({
                  value: unit.id,
                  label: getDisplayName(unit, unit.name),
                })) ?? []}
                addActionLabel={t('addUnit', { ns: 'units' })}
                onAddAction={() => navigate('/units')}
              />
            </FormField>
            <FormField label={t('imageUrl')} className="sm:col-span-2 xl:col-span-3">
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => <ImageUploadField label={t('productImage')} value={field.value} onChange={field.onChange} scope="product" />}
              />
            </FormField>
          </div>
          <FormField className="mt-4" label={t('descriptionLabel', { ns: 'common' })}>
            <Textarea {...form.register('description')} />
          </FormField>
          <DisclosurePanel
            className="mt-5"
            title="Inventory and publishing settings"
            description="Optional rules, tags, and language overrides stay out of the way until you need them."
            defaultOpen={isEdit}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FormField label={t('status', { ns: 'common' })} required>
                <ControlledSelect
                  control={form.control}
                  name="status"
                  options={PRODUCT_STATUSES.map((status) => ({ value: status, label: t(`statusValues.${status}`, { defaultValue: status }) }))}
                />
              </FormField>
              <FormField label={t('slug')}>
                <Input {...form.register('slug')} />
              </FormField>
              <FormField label={t('taxRate')}>
                <ControlledSelect
                  control={form.control}
                  name="taxRateId"
                  placeholder={t('noTaxRate')}
                  emptyOptionLabel={t('noTaxRate')}
                  options={taxRatesQuery.data?.items.map((taxRate) => ({
                    value: taxRate.id,
                    label: getDisplayName(taxRate, taxRate.name),
                  })) ?? []}
                />
              </FormField>
              <FormField label={t('industry', { ns: 'common' })}>
                <ControlledSelect
                  control={form.control}
                  name="industryId"
                  placeholder={t('noIndustry')}
                  emptyOptionLabel={t('noIndustry')}
                  options={industriesQuery.data?.map((industry) => ({
                    value: industry.id,
                    label: getDisplayName(industry, t('industry', { ns: 'common' })),
                  })) ?? []}
                  addActionLabel={permissions.canManageMasterPlatform ? t('addIndustry') : undefined}
                  onAddAction={() => setIndustryDialogOpen(true)}
                />
              </FormField>
              <FormField label={t('trackMethod')} required>
                <ControlledSelect
                  control={form.control}
                  name="trackMethod"
                  options={TRACK_METHODS.map((method) => ({ value: method, label: t(`trackMethodValues.${method}`, { defaultValue: method }) }))}
                />
              </FormField>
              <FormField label={t('tags')}>
                <Input placeholder={t('tagsPlaceholder')} {...form.register('tags')} />
              </FormField>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Controller
                control={form.control}
                name="trackInventory"
                render={({ field }) => (
                  <CheckboxField
                    checked={Boolean(field.value)}
                    label={t('trackInventory')}
                    description={t('trackInventoryDescription')}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="allowBackorder"
                render={({ field }) => (
                  <CheckboxField
                    checked={Boolean(field.value)}
                    label={t('allowBackorder')}
                    description={t('allowBackorderDescription')}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="allowNegativeStock"
                render={({ field }) => (
                  <CheckboxField
                    checked={Boolean(field.value)}
                    label={t('allowNegativeStock')}
                    description={t('allowNegativeStockDescription')}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            {isEdit ? (
              <div className="mt-5 rounded-md border border-dashed border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{t('languageOverrides')}</p>
                    <p className="text-xs leading-5 text-slate-500">{t('autoLanguageFallback')}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (productTranslationsOpen) {
                        setOpenedTranslationKeys((current) => ({
                          ...current,
                          [translationVisibilityKey]: false,
                        }))
                        setDismissedTranslationKeys((current) => ({
                          ...current,
                          [translationVisibilityKey]: true,
                        }))
                        return
                      }

                      setOpenedTranslationKeys((current) => ({
                        ...current,
                        [translationVisibilityKey]: true,
                      }))
                      setDismissedTranslationKeys((current) => ({
                        ...current,
                        [translationVisibilityKey]: false,
                      }))
                    }}
                  >
                    {productTranslationsOpen ? t('hideLanguageOverrides') : t('showLanguageOverrides')}
                  </Button>
                </div>
                {productTranslationsOpen ? (
                  <Controller
                    control={form.control}
                    name="translations"
                    render={({ field }) => (
                      <FormField className="mt-4" label={t('languageOverrides')}>
                        <TranslationFields value={field.value} onChange={field.onChange} />
                      </FormField>
                    )}
                  />
                ) : null}
              </div>
            ) : null}
          </DisclosurePanel>
        </SectionCard>

        <SectionCard
          title={t('variantsTitle')}
          description={productType === 'VARIABLE' ? t('variantsDescriptionVariable') : t('variantsDescriptionSimple')}
          action={productType === 'VARIABLE' ? (
            <Button type="button" variant="outline" onClick={() => variantsFieldArray.append(createDefaultVariant())}>
              {t('addVariant')}
            </Button>
          ) : undefined}
        >
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">{t('variantList')}</TabsTrigger>
              <TabsTrigger value="guide">{t('guidance')}</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="space-y-4">
              {(productType === 'VARIABLE' ? variantsFieldArray.fields : variantsFieldArray.fields.slice(0, 1)).map((field, index) => (
                <VariantEditor
                  key={field.id}
                  control={form.control}
                  index={index}
                  units={units}
                  canRemove={variantsFieldArray.fields.length > 1}
                  isEdit={isEdit}
                  onAddUnit={() => navigate('/units')}
                  onRemove={() => {
                    const variantId = form.getValues(`variants.${index}.id`)
                    if (variantId) {
                      setRemovedVariantIds((current) => [...current, variantId])
                    }
                    variantsFieldArray.remove(index)
                  }}
                />
              ))}
            </TabsContent>
            <TabsContent value="guide">
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                {t('variantGuidanceDescription')}
              </div>
            </TabsContent>
          </Tabs>
        </SectionCard>

        <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_14px_32px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            loading={createProductMutation.isPending || updateProductMutation.isPending}
            loadingText={isEdit ? 'Saving changes...' : 'Creating product...'}
          >
            {isEdit ? t('saveChanges') : t('createProduct')}
          </Button>
        </div>
      </form>

      <IndustryDialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen} />
    </div>
  )
}
