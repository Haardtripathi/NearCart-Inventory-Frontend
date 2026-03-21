import { useEffect } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import {
  useCreateMasterCatalogItemMutation,
  useUpdateMasterCatalogItemMutation,
} from '@/features/master-catalog/master-catalog.api'
import { parseApiError } from '@/lib/utils'
import type {
  MasterCatalogAliasInput,
  MasterCatalogCategory,
  MasterCatalogItem,
} from '@/types/masterCatalog'
import type {
  Industry,
  TranslationInput,
  VariantTranslationInput,
} from '@/types/common'
import {
  LANGUAGE_CODES,
  PRODUCT_TYPES,
  TRACK_METHODS,
} from '@/types/common'
import { CheckboxField, ControlledSelect, FormField, KeyValueEditor, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'

const aliasSchema = z.object({
  language: z.enum(LANGUAGE_CODES),
  value: z.string().trim().min(1, 'Alias value is required'),
})

const variantTemplateSchema = z.object({
  code: z.string().trim().min(1, 'Template code is required'),
  name: z.string().trim().min(1, 'Template name is required'),
  skuSuffix: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  unitCode: z.string().trim().optional(),
  defaultCostPrice: z.string().trim().optional(),
  defaultSellingPrice: z.string().trim().optional(),
  defaultMrp: z.string().trim().optional(),
  reorderLevel: z.string().trim().default('0'),
  minStockLevel: z.string().trim().default('0'),
  maxStockLevel: z.string().trim().optional(),
  weight: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).default({}),
  translations: z.array(z.custom<VariantTranslationInput>()).default([]),
})

const itemSchema = z.object({
  industryId: z.string().trim().min(1, 'Select an industry'),
  masterCategoryId: z.string().trim().optional(),
  code: z.string().trim().min(1, 'Code is required'),
  slug: z.string().trim().optional(),
  canonicalName: z.string().trim().min(1, 'Canonical name is required'),
  canonicalDescription: z.string().trim().optional(),
  productType: z.enum(PRODUCT_TYPES),
  defaultTrackMethod: z.enum(TRACK_METHODS),
  defaultUnitCode: z.string().trim().optional(),
  defaultBrandName: z.string().trim().optional(),
  defaultTaxCode: z.string().trim().optional(),
  defaultImageUrl: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  hasVariants: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
  aliases: z.array(aliasSchema).default([]),
  variantTemplates: z.array(variantTemplateSchema).default([]),
})

type ItemDialogValues = z.input<typeof itemSchema>

function toOptionalNumber(value?: string | null) {
  if (!value?.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function createEmptyAlias(): MasterCatalogAliasInput {
  return {
    language: 'EN',
    value: '',
  }
}

function createEmptyVariantTemplate() {
  return {
    code: '',
    name: '',
    skuSuffix: '',
    barcode: '',
    unitCode: '',
    defaultCostPrice: '',
    defaultSellingPrice: '',
    defaultMrp: '',
    reorderLevel: '0',
    minStockLevel: '0',
    maxStockLevel: '',
    weight: '',
    sortOrder: 0,
    isDefault: false,
    isActive: true,
    attributes: {},
    translations: [],
  }
}

function VariantTemplateEditor({
  control,
  index,
  onRemove,
}: {
  control: Control<ItemDialogValues>
  index: number
  onRemove: () => void
}) {
  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Variant template {index + 1}</p>
        <Button type="button" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Controller
          control={control}
          name={`variantTemplates.${index}.code`}
          render={({ field, fieldState }) => (
            <FormField label="Code" error={fieldState.error?.message}>
              <Input placeholder="500ml" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.name`}
          render={({ field, fieldState }) => (
            <FormField label="Name" error={fieldState.error?.message}>
              <Input placeholder="500 ml pack" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.skuSuffix`}
          render={({ field }) => (
            <FormField label="SKU suffix">
              <Input placeholder="500" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.unitCode`}
          render={({ field }) => (
            <FormField label="Unit code">
              <Input placeholder="PCS" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.defaultCostPrice`}
          render={({ field }) => (
            <FormField label="Cost price">
              <Input type="number" step="0.01" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.defaultSellingPrice`}
          render={({ field }) => (
            <FormField label="Selling price">
              <Input type="number" step="0.01" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.defaultMrp`}
          render={({ field }) => (
            <FormField label="MRP">
              <Input type="number" step="0.01" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.barcode`}
          render={({ field }) => (
            <FormField label="Barcode">
              <Input {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.reorderLevel`}
          render={({ field }) => (
            <FormField label="Reorder level">
              <Input type="number" step="0.001" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.minStockLevel`}
          render={({ field }) => (
            <FormField label="Min stock">
              <Input type="number" step="0.001" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.maxStockLevel`}
          render={({ field }) => (
            <FormField label="Max stock">
              <Input type="number" step="0.001" {...field} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.weight`}
          render={({ field }) => (
            <FormField label="Weight">
              <Input type="number" step="0.001" {...field} />
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Controller
          control={control}
          name={`variantTemplates.${index}.isDefault`}
          render={({ field }) => (
            <CheckboxField
              checked={Boolean(field.value)}
              label="Default template"
              description="Use this template as the default starting point when the imported product is created."
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name={`variantTemplates.${index}.isActive`}
          render={({ field }) => (
            <CheckboxField
              checked={Boolean(field.value)}
              label="Active"
              description="Inactive templates stay saved on the master item but should not be used in imports."
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name={`variantTemplates.${index}.attributes`}
        render={({ field }) => (
          <FormField label="Attributes">
            <KeyValueEditor value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name={`variantTemplates.${index}.translations`}
        render={({ field }) => (
          <FormField label="Variant translations">
            <TranslationFields value={field.value} onChange={field.onChange} withDescription={false} />
          </FormField>
        )}
      />
    </div>
  )
}

export function MasterCatalogItemDialog({
  open,
  onOpenChange,
  industries,
  categories,
  initialIndustryId,
  item,
  onAddIndustry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  industries: Industry[]
  categories: MasterCatalogCategory[]
  initialIndustryId?: string
  item?: MasterCatalogItem | null
  onAddIndustry?: () => void
}) {
  const createMutation = useCreateMasterCatalogItemMutation()
  const updateMutation = useUpdateMasterCatalogItemMutation()
  const form = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      industryId: initialIndustryId ?? '',
      masterCategoryId: '',
      code: '',
      slug: '',
      canonicalName: '',
      canonicalDescription: '',
      productType: 'SIMPLE',
      defaultTrackMethod: 'PIECE',
      defaultUnitCode: '',
      defaultBrandName: '',
      defaultTaxCode: '',
      defaultImageUrl: '',
      tags: '',
      hasVariants: false,
      trackInventory: true,
      allowBackorder: false,
      allowNegativeStock: false,
      isActive: true,
      translations: [],
      aliases: [],
      variantTemplates: [],
    },
  })

  const aliasesFieldArray = useFieldArray({
    control: form.control,
    name: 'aliases',
  })

  const templatesFieldArray = useFieldArray({
    control: form.control,
    name: 'variantTemplates',
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      industryId: item?.industryId ?? initialIndustryId ?? '',
      masterCategoryId: item?.category?.id ?? '',
      code: item?.code ?? '',
      slug: item?.slug ?? '',
      canonicalName: item?.canonicalName ?? '',
      canonicalDescription: item?.canonicalDescription ?? '',
      productType: item?.productType ?? 'SIMPLE',
      defaultTrackMethod: item?.defaultTrackMethod ?? 'PIECE',
      defaultUnitCode: item?.defaultUnitCode ?? '',
      defaultBrandName: item?.defaultBrandName ?? '',
      defaultTaxCode: item?.defaultTaxCode ?? '',
      defaultImageUrl: item?.defaultImageUrl ?? '',
      tags: Array.isArray(item?.tags) ? item.tags.join(', ') : '',
      hasVariants: item?.hasVariants ?? false,
      trackInventory: item?.trackInventory ?? true,
      allowBackorder: item?.allowBackorder ?? false,
      allowNegativeStock: item?.allowNegativeStock ?? false,
      isActive: item?.isActive ?? true,
      translations: item?.translations ?? [],
      aliases: item?.aliases?.map((alias) => ({
        language: alias.language as 'EN' | 'HI' | 'GU',
        value: alias.value,
      })) ?? [],
      variantTemplates: item?.variantTemplates?.map((template) => ({
        code: template.code,
        name: template.name ?? '',
        skuSuffix: template.skuSuffix ?? '',
        barcode: template.barcode ?? '',
        unitCode: template.unitCode ?? '',
        defaultCostPrice: template.defaultCostPrice ?? '',
        defaultSellingPrice: template.defaultSellingPrice ?? '',
        defaultMrp: template.defaultMrp ?? '',
        reorderLevel: template.reorderLevel ?? '0',
        minStockLevel: template.minStockLevel ?? '0',
        maxStockLevel: template.maxStockLevel ?? '',
        weight: template.weight ?? '',
        sortOrder: template.sortOrder ?? 0,
        isDefault: template.isDefault,
        isActive: template.isActive,
        attributes: Object.fromEntries(
          Object.entries(template.attributes ?? {}).map(([key, value]) => [key, String(value)]),
        ),
        translations: template.translations ?? [],
      })) ?? [],
    })
  }, [form, initialIndustryId, item, open])

  const selectedIndustryId = useWatch({
    control: form.control,
    name: 'industryId',
  })
  const hasVariants = Boolean(useWatch({
    control: form.control,
    name: 'hasVariants',
  }))
  const trackInventory = Boolean(useWatch({
    control: form.control,
    name: 'trackInventory',
  }))
  const allowBackorder = Boolean(useWatch({
    control: form.control,
    name: 'allowBackorder',
  }))
  const allowNegativeStock = Boolean(useWatch({
    control: form.control,
    name: 'allowNegativeStock',
  }))
  const isActive = Boolean(useWatch({
    control: form.control,
    name: 'isActive',
  }))
  const categoryOptions = categories.filter((category) => category.industryId === selectedIndustryId)

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      industryId: values.industryId,
      masterCategoryId: values.masterCategoryId?.trim() || undefined,
      code: values.code.trim(),
      slug: values.slug?.trim() || undefined,
      canonicalName: values.canonicalName.trim(),
      canonicalDescription: values.canonicalDescription?.trim() || undefined,
      productType: values.productType,
      defaultTrackMethod: values.defaultTrackMethod,
      defaultUnitCode: values.defaultUnitCode?.trim() || undefined,
      defaultBrandName: values.defaultBrandName?.trim() || undefined,
      defaultTaxCode: values.defaultTaxCode?.trim() || undefined,
      hasVariants: values.hasVariants,
      trackInventory: values.trackInventory,
      allowBackorder: values.allowBackorder,
      allowNegativeStock: values.allowNegativeStock,
      defaultImageUrl: values.defaultImageUrl?.trim() || undefined,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : undefined,
      isActive: values.isActive,
      translations: (values.translations ?? [])
        .map((translation: TranslationInput) => ({
          ...translation,
          name: translation.name?.trim() ?? '',
          description: translation.description?.trim() || undefined,
        }))
        .filter((translation: TranslationInput) => translation.name),
      aliases: (values.aliases ?? [])
        .map((alias: MasterCatalogAliasInput) => ({
          language: alias.language,
          value: alias.value.trim(),
        }))
        .filter((alias: MasterCatalogAliasInput) => alias.value),
      variantTemplates: (values.variantTemplates ?? [])
        .map((template) => ({
          code: template.code.trim(),
          name: template.name.trim(),
          skuSuffix: template.skuSuffix?.trim() || undefined,
          barcode: template.barcode?.trim() || undefined,
          unitCode: template.unitCode?.trim() || undefined,
          defaultCostPrice: toOptionalNumber(template.defaultCostPrice),
          defaultSellingPrice: toOptionalNumber(template.defaultSellingPrice),
          defaultMrp: toOptionalNumber(template.defaultMrp),
          reorderLevel: toOptionalNumber(template.reorderLevel),
          minStockLevel: toOptionalNumber(template.minStockLevel),
          maxStockLevel: toOptionalNumber(template.maxStockLevel),
          weight: toOptionalNumber(template.weight),
          sortOrder: template.sortOrder,
          isDefault: template.isDefault,
          isActive: template.isActive,
          attributes: template.attributes,
          translations: (template.translations ?? [])
            .map((translation: VariantTranslationInput) => ({
              ...translation,
              name: translation.name?.trim() ?? '',
            }))
            .filter((translation: VariantTranslationInput) => translation.name),
        }))
        .filter((template) => template.code && template.name),
    }

    try {
      if (item) {
        await updateMutation.mutateAsync({ id: item.id, payload })
        toast.success('Master item updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Master item created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit master item' : 'Add master item'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Industry" error={form.formState.errors.industryId?.message}>
              <ControlledSelect
                control={form.control}
                name="industryId"
                placeholder="Select industry"
                options={industries.map((industry) => ({
                  value: industry.id,
                  label: industry.displayName ?? industry.name ?? 'Unnamed industry',
                }))}
                addActionLabel={onAddIndustry ? 'Add industry' : undefined}
                onAddAction={onAddIndustry}
              />
            </FormField>
            <FormField label="Master category">
              <ControlledSelect
                control={form.control}
                name="masterCategoryId"
                placeholder="No category"
                emptyOptionLabel="No category"
                options={categoryOptions.map((category) => ({
                  value: category.id,
                  label: category.displayName ?? category.name ?? category.code ?? 'Uncategorized',
                }))}
              />
            </FormField>
            <FormField label="Code" error={form.formState.errors.code?.message}>
              <Input placeholder="amul_milk" {...form.register('code')} />
            </FormField>
            <FormField label="Slug">
              <Input placeholder="amul-milk" {...form.register('slug')} />
            </FormField>
            <FormField label="Canonical name" error={form.formState.errors.canonicalName?.message}>
              <Input placeholder="Milk" {...form.register('canonicalName')} />
            </FormField>
            <FormField label="Product type">
              <ControlledSelect
                control={form.control}
                name="productType"
                options={PRODUCT_TYPES.map((type) => ({ value: type, label: type }))}
              />
            </FormField>
            <FormField label="Track method">
              <ControlledSelect
                control={form.control}
                name="defaultTrackMethod"
                options={TRACK_METHODS.map((method) => ({ value: method, label: method }))}
              />
            </FormField>
            <FormField label="Default unit code">
              <Input placeholder="L" {...form.register('defaultUnitCode')} />
            </FormField>
            <FormField label="Default brand">
              <Input placeholder="NearCart" {...form.register('defaultBrandName')} />
            </FormField>
            <FormField label="Default tax code">
              <Input placeholder="GST_5" {...form.register('defaultTaxCode')} />
            </FormField>
            <FormField label="Image URL" className="md:col-span-2">
              <Input placeholder="https://..." {...form.register('defaultImageUrl')} />
            </FormField>
            <FormField label="Tags" className="md:col-span-2">
              <Input placeholder="milk, dairy, chilled" {...form.register('tags')} />
            </FormField>
          </div>

          <FormField label="Canonical description">
            <Textarea rows={4} {...form.register('canonicalDescription')} />
          </FormField>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CheckboxField
              checked={hasVariants}
              label="Has variants"
              description="Treat the master item as a multi-template import instead of a single-variant scaffold."
              onCheckedChange={(checked) => form.setValue('hasVariants', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={trackInventory}
              label="Track inventory"
              description="Imported products should contribute to stock balances and ledger entries."
              onCheckedChange={(checked) => form.setValue('trackInventory', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={allowBackorder}
              label="Allow backorder"
              description="Imported products may be sold even when current stock is exhausted."
              onCheckedChange={(checked) => form.setValue('allowBackorder', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={allowNegativeStock}
              label="Allow negative stock"
              description="Use only for special operational cases where overselling is intentionally supported."
              onCheckedChange={(checked) => form.setValue('allowNegativeStock', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={isActive}
              label="Active"
              description="Inactive master items remain visible historically but should not be used in new platform workflows."
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
          </div>

          <Controller
            control={form.control}
            name="translations"
            render={({ field }) => (
              <FormField label="Localized names and descriptions">
                <TranslationFields value={field.value} onChange={field.onChange} />
              </FormField>
            )}
          />

          <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Aliases</h3>
                <p className="text-sm text-slate-500">Search synonyms users may type in different languages.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => aliasesFieldArray.append(createEmptyAlias())}>
                Add alias
              </Button>
            </div>

            {!aliasesFieldArray.fields.length ? (
              <p className="text-sm text-slate-500">No aliases added yet.</p>
            ) : (
              <div className="space-y-3">
                {aliasesFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                    <ControlledSelect
                      control={form.control}
                      name={`aliases.${index}.language` as const}
                      options={LANGUAGE_CODES.map((language) => ({
                        value: language,
                        label: language,
                      }))}
                    />
                    <Controller
                      control={form.control}
                      name={`aliases.${index}.value`}
                      render={({ field, fieldState }) => (
                        <FormField label={index === 0 ? 'Alias value' : ''} error={fieldState.error?.message}>
                          <Input placeholder="दूध" {...field} />
                        </FormField>
                      )}
                    />
                    <Button type="button" variant="ghost" onClick={() => aliasesFieldArray.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Variant templates</h3>
                <p className="text-sm text-slate-500">Define default SKU/pricing/threshold templates for imports.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => templatesFieldArray.append(createEmptyVariantTemplate())}>
                Add template
              </Button>
            </div>

            {!templatesFieldArray.fields.length ? (
              <p className="text-sm text-slate-500">No variant templates added yet.</p>
            ) : (
              <div className="space-y-4">
                {templatesFieldArray.fields.map((field, index) => (
                  <VariantTemplateEditor
                    key={field.id}
                    control={form.control}
                    index={index}
                    onRemove={() => templatesFieldArray.remove(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {item ? 'Save master item' : 'Create master item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
