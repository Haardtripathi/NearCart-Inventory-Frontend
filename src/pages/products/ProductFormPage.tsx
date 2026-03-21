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
import { PageHeader, SectionCard } from '@/components/common'
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { usePermissions } from '@/hooks/usePermissions'
import { PRODUCT_STATUSES, PRODUCT_TYPES, TRACK_METHODS, type TranslationInput, type VariantTranslationInput } from '@/types/common'

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().optional(),
  sku: z.string().trim().min(1),
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
}: {
  control: Control<ProductFormValues>
  index: number
  onRemove: () => void
  units: Array<{ id: string; name: string }>
}) {
  const { t } = useTranslation(['products', 'common'])
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{t('variantLabel', { index: index + 1 })}</p>
        <Button type="button" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Controller control={control} name={`variants.${index}.name`} render={({ field }) => (
          <FormField label={t('nameOptional')}>
            <Input {...field} />
          </FormField>
        )} />
        <Controller control={control} name={`variants.${index}.sku`} render={({ field }) => (
          <FormField label={t('sku')}>
            <Input {...field} />
          </FormField>
        )} />
        <Controller control={control} name={`variants.${index}.barcode`} render={({ field }) => (
          <FormField label={t('barcode')}>
            <Input {...field} />
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
          />
        </FormField>
        <Controller control={control} name={`variants.${index}.costPrice`} render={({ field }) => (
          <FormField label={t('costPrice')}>
            <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </FormField>
        )} />
        <Controller control={control} name={`variants.${index}.sellingPrice`} render={({ field }) => (
          <FormField label={t('sellingPrice')}>
            <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
          <FormField label={t('imageUrl')}>
            <Input {...field} />
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
      <Controller
        control={control}
        name={`variants.${index}.attributes`}
        render={({ field }) => (
          <FormField label={t('attributes')}>
            <KeyValueEditor value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />
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

export function ProductFormPage() {
  const { t } = useTranslation(['products', 'common'])
  const permissions = usePermissions()
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

  const units = useMemo(() => unitsQuery.data?.items.map((item) => ({ id: item.id, name: item.name })) ?? [], [unitsQuery.data?.items])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const normalizedVariants = values.productType === 'VARIABLE' ? values.variants : [values.variants[0]]
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
        const variantPayload = {
          ...variant,
          unitId: variant.unitId || undefined,
          barcode: variant.barcode || undefined,
          imageUrl: variant.imageUrl || undefined,
          translations: normalizeVariantTranslations(variant.translations),
        }

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
  })

  if (isEdit && productQuery.isLoading) {
    return <SectionCard description={t('loadingProductDescription')} title={t('loading', { ns: 'common' })}><div className="h-20" /></SectionCard>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label={t('name')} error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </FormField>
            <FormField label={t('slug')}>
              <Input {...form.register('slug')} />
            </FormField>
            <FormField label={t('productType')}>
              <ControlledSelect
                control={form.control}
                name="productType"
                options={PRODUCT_TYPES.map((type) => ({ value: type, label: t(`typeValues.${type}`, { defaultValue: type }) }))}
              />
            </FormField>
            <FormField label={t('status', { ns: 'common' })}>
              <ControlledSelect
                control={form.control}
                name="status"
                options={PRODUCT_STATUSES.map((status) => ({ value: status, label: t(`statusValues.${status}`, { defaultValue: status }) }))}
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
                  label: category.displayName ?? category.name ?? 'Uncategorized',
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
                  label: brand.name,
                })) ?? []}
                addActionLabel={t('addBrand')}
                onAddAction={() => navigate('/brands')}
              />
            </FormField>
            <FormField label={t('taxRate')}>
              <ControlledSelect
                control={form.control}
                name="taxRateId"
                placeholder={t('noTaxRate')}
                emptyOptionLabel={t('noTaxRate')}
                options={taxRatesQuery.data?.items.map((taxRate) => ({
                  value: taxRate.id,
                  label: taxRate.name,
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
                  label: industry.displayName ?? industry.name ?? 'Unnamed industry',
                })) ?? []}
                addActionLabel={permissions.canManageMasterPlatform ? t('addIndustry') : undefined}
                onAddAction={() => setIndustryDialogOpen(true)}
              />
            </FormField>
            <FormField label={t('trackMethod')}>
              <ControlledSelect
                control={form.control}
                name="trackMethod"
                options={TRACK_METHODS.map((method) => ({ value: method, label: t(`trackMethodValues.${method}`, { defaultValue: method }) }))}
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
                  label: unit.name,
                })) ?? []}
              />
            </FormField>
            <FormField label={t('imageUrl')}>
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => <ImageUploadField label={t('productImage')} value={field.value} onChange={field.onChange} />}
              />
            </FormField>
            <FormField label={t('tags')}>
              <Input placeholder={t('tagsPlaceholder')} {...form.register('tags')} />
            </FormField>
          </div>
          <FormField className="mt-4" label={t('descriptionLabel', { ns: 'common' })}>
            <Textarea {...form.register('description')} />
          </FormField>
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
          <div className="mt-5 rounded-md border border-dashed border-slate-200 bg-slate-50/70 p-4">
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
            {isEdit ? t('saveChanges') : t('createProduct')}
          </Button>
        </div>
      </form>

      <IndustryDialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen} />
    </div>
  )
}
