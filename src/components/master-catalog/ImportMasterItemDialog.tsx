import { useEffect } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { useCategoriesQuery } from '@/features/categories/categories.api'
import { useImportMasterItemMutation } from '@/features/master-catalog/master-catalog.api'
import { CheckboxField, ControlledSelect, FormField } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import type { MasterCatalogItem } from '@/types/masterCatalog'

const importSchema = z.object({
  categoryMode: z.enum(['AUTO_CREATE', 'USE_EXISTING']).default('AUTO_CREATE'),
  existingCategoryId: z.string().trim().optional(),
  allowDuplicate: z.boolean().default(false),
  strictIndustryMatch: z.boolean().default(true),
  forceImport: z.boolean().default(false),
  namingOverride: z.string().trim().optional(),
  variantPrices: z.array(z.object({
    masterVariantTemplateId: z.string().trim().optional(),
    sellingPrice: z.string().trim().optional(),
    costPrice: z.string().trim().optional(),
    mrp: z.string().trim().optional(),
  })).default([]),
})

type ImportFormValues = z.infer<typeof importSchema>

export function ImportMasterItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MasterCatalogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const importMutation = useImportMasterItemMutation()
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 })
  const form = useForm({
    resolver: zodResolver(importSchema),
    defaultValues: {
      categoryMode: 'AUTO_CREATE',
      existingCategoryId: '',
      allowDuplicate: false,
      strictIndustryMatch: true,
      forceImport: false,
      namingOverride: '',
      variantPrices: [],
    },
  })
  const variantFieldArray = useFieldArray({
    control: form.control,
    name: 'variantPrices',
  })
  const categoryMode = useWatch({
    control: form.control,
    name: 'categoryMode',
  })
  const allowDuplicate = Boolean(useWatch({
    control: form.control,
    name: 'allowDuplicate',
  }))
  const strictIndustryMatch = Boolean(useWatch({
    control: form.control,
    name: 'strictIndustryMatch',
  }))
  const forceImport = Boolean(useWatch({
    control: form.control,
    name: 'forceImport',
  }))

  useEffect(() => {
    if (!item) {
      return
    }

    form.reset({
      categoryMode: 'AUTO_CREATE',
      existingCategoryId: '',
      allowDuplicate: false,
      strictIndustryMatch: true,
      forceImport: false,
      namingOverride: item.canonicalName,
      variantPrices: item.variantTemplates.map((variant) => ({
        masterVariantTemplateId: variant.id,
        sellingPrice: variant.defaultSellingPrice ?? '',
        costPrice: variant.defaultCostPrice ?? '',
        mrp: variant.defaultMrp ?? '',
      })),
    })
  }, [form, item])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!item) {
      return
    }

    try {
      const result = await importMutation.mutateAsync({
        id: item.id,
        payload: {
          categoryMode: values.categoryMode,
          existingCategoryId: values.categoryMode === 'USE_EXISTING' ? values.existingCategoryId || undefined : undefined,
          allowDuplicate: values.allowDuplicate,
          strictIndustryMatch: values.strictIndustryMatch,
          forceImport: values.forceImport,
          namingOverrides: values.namingOverride ? { canonicalName: values.namingOverride } : undefined,
          pricingOverrides: {
            variantPrices: values.variantPrices.map((variant: ImportFormValues['variantPrices'][number]) => ({
              masterVariantTemplateId: variant.masterVariantTemplateId || undefined,
              sellingPrice: variant.sellingPrice || undefined,
              costPrice: variant.costPrice || undefined,
              mrp: variant.mrp || undefined,
            })),
          },
        },
      })

      toast.success(result.alreadyExisted ? 'Using existing imported product' : 'Master item imported')
      onOpenChange(false)
      navigate(`/products/${result.product.id}`)
    } catch {
      toast.error('Could not import master item')
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import master item</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Category mode">
              <ControlledSelect
                control={form.control}
                name="categoryMode"
                options={[
                  { value: 'AUTO_CREATE', label: 'AUTO_CREATE' },
                  { value: 'USE_EXISTING', label: 'USE_EXISTING' },
                ]}
              />
            </FormField>
            {categoryMode === 'USE_EXISTING' ? (
              <FormField label="Existing category">
                <ControlledSelect
                  control={form.control}
                  name="existingCategoryId"
                  placeholder="Select a category"
                  emptyOptionLabel="Select a category"
                  options={(categoriesQuery.data?.items ?? []).map((category) => ({
                    value: category.id,
                    label: getDisplayName(category),
                  }))}
                />
              </FormField>
            ) : null}
          </div>
          <FormField label="Naming override">
            <Input {...form.register('namingOverride')} />
          </FormField>
          <div className="grid gap-3 md:grid-cols-3">
            <CheckboxField
              checked={allowDuplicate}
              label="Allow duplicate"
              description="Import even if a similar product has already been brought into this organization."
              onCheckedChange={(checked) => form.setValue('allowDuplicate', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={strictIndustryMatch}
              label="Strict industry match"
              description="Reject the import when the organization and master item industry context do not line up."
              onCheckedChange={(checked) => form.setValue('strictIndustryMatch', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={forceImport}
              label="Force import"
              description="Use only when you intentionally want to bypass the safer import path."
              onCheckedChange={(checked) => form.setValue('forceImport', checked, { shouldDirty: true })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Pricing overrides</h3>
              {!variantFieldArray.fields.length ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => variantFieldArray.append({ masterVariantTemplateId: '', sellingPrice: '', costPrice: '', mrp: '' })}
                >
                  Add override
                </Button>
              ) : null}
            </div>
            {variantFieldArray.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-4">
                <Controller control={form.control} name={`variantPrices.${index}.masterVariantTemplateId`} render={() => (
                  <FormField label="Template">
                    <ControlledSelect
                      control={form.control}
                      name={`variantPrices.${index}.masterVariantTemplateId` as const}
                      placeholder="Default / no template"
                      emptyOptionLabel="Default / no template"
                      options={(item?.variantTemplates ?? []).map((variant) => ({
                        value: variant.id,
                        label: variant.displayName ?? variant.name ?? 'Unnamed template',
                      }))}
                    />
                  </FormField>
                )} />
                <Controller control={form.control} name={`variantPrices.${index}.sellingPrice`} render={({ field }) => (
                  <FormField label="Selling price">
                    <Input {...field} />
                  </FormField>
                )} />
                <Controller control={form.control} name={`variantPrices.${index}.costPrice`} render={({ field }) => (
                  <FormField label="Cost price">
                    <Input {...field} />
                  </FormField>
                )} />
                <Controller control={form.control} name={`variantPrices.${index}.mrp`} render={({ field }) => (
                  <FormField label="MRP">
                    <Input {...field} />
                  </FormField>
                )} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={importMutation.isPending} type="submit">
              Import item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
