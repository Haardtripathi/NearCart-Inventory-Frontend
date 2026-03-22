import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'

import {
  useCreateMasterCatalogCategoryMutation,
  useUpdateMasterCatalogCategoryMutation,
} from '@/features/master-catalog/master-catalog.api'
import { parseApiError } from '@/lib/utils'
import type { MasterCatalogCategory } from '@/types/masterCatalog'
import type { Industry, TranslationInput } from '@/types/common'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { CheckboxField, ControlledSelect, FormField, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui'

const categorySchema = z.object({
  industryId: z.string().trim().min(1, 'Select an industry'),
  parentId: z.string().trim().optional(),
  code: z.string().trim().min(1, 'Code is required'),
  slug: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  iconKey: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

export function MasterCatalogCategoryDialog({
  open,
  onOpenChange,
  industries,
  categories,
  initialIndustryId,
  category,
  onAddIndustry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  industries: Industry[]
  categories: MasterCatalogCategory[]
  initialIndustryId?: string
  category?: MasterCatalogCategory | null
  onAddIndustry?: () => void
}) {
  const { t } = useTranslation(['masterCatalog', 'categories'])
  const createMutation = useCreateMasterCatalogCategoryMutation()
  const updateMutation = useUpdateMasterCatalogCategoryMutation()
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      industryId: initialIndustryId ?? '',
      parentId: '',
      code: '',
      slug: '',
      sortOrder: 0,
      iconKey: '',
      imageUrl: '',
      isActive: true,
      translations: [],
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      industryId: category?.industryId ?? initialIndustryId ?? '',
      parentId: category?.parentId ?? '',
      code: category?.code ?? '',
      slug: category?.slug ?? '',
      sortOrder: category?.sortOrder ?? 0,
      iconKey: category?.iconKey ?? '',
      imageUrl: category?.imageUrl ?? '',
      isActive: category?.isActive ?? true,
      translations: category?.translations ?? [],
    })
  }, [category, form, initialIndustryId, open])

  const selectedIndustryId = useWatch({
    control: form.control,
    name: 'industryId',
  })
  const isActive = Boolean(useWatch({
    control: form.control,
    name: 'isActive',
  }))
  const parentOptions = categories.filter(
    (item) => item.industryId === selectedIndustryId && item.id !== category?.id,
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      industryId: values.industryId,
      parentId: values.parentId?.trim() || undefined,
      code: values.code.trim(),
      slug: values.slug?.trim() || undefined,
      sortOrder: values.sortOrder,
      iconKey: values.iconKey?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      isActive: values.isActive,
      translations: (values.translations ?? [])
        .map((translation: TranslationInput) => ({
          ...translation,
          name: translation.name?.trim() ?? '',
          description: translation.description?.trim() || undefined,
        }))
        .filter((translation: TranslationInput) => translation.name),
    }

    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, payload })
        toast.success('Master category updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Master category created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit master category' : 'Add master category'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Industry" error={form.formState.errors.industryId?.message} required>
              <ControlledSelect
                control={form.control}
                name="industryId"
                placeholder={t('selectIndustry', { ns: 'masterCatalog' })}
                options={industries.map((industry) => ({
                  value: industry.id,
                  label: industry.displayName ?? industry.name ?? 'Unnamed industry',
                }))}
                addActionLabel={onAddIndustry ? 'Add industry' : undefined}
                onAddAction={onAddIndustry}
              />
            </FormField>

            <FormField label="Parent category">
              <ControlledSelect
                control={form.control}
                name="parentId"
                placeholder={t('noParent', { ns: 'categories' })}
                emptyOptionLabel={t('noParent', { ns: 'categories' })}
                options={parentOptions.map((item) => ({
                  value: item.id,
                  label: item.displayName ?? item.name ?? item.code,
                }))}
              />
            </FormField>

            <FormField label="Code" error={form.formState.errors.code?.message} required>
              <Input placeholder={t('categoryCodePlaceholder', { ns: 'masterCatalog' })} {...form.register('code')} />
            </FormField>

            <FormField label="Slug">
              <Input placeholder={t('categorySlugPlaceholder', { ns: 'masterCatalog' })} {...form.register('slug')} />
            </FormField>

            <FormField label="Sort order">
              <Input type="number" {...form.register('sortOrder')} />
            </FormField>

            <FormField label="Icon key">
              <Input placeholder={t('categoryIconPlaceholder', { ns: 'masterCatalog' })} {...form.register('iconKey')} />
            </FormField>

            <FormField className="md:col-span-2" label="Image">
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageUploadField
                    label="Category image"
                    value={field.value}
                    onChange={field.onChange}
                    scope="master-catalog-category"
                  />
                )}
              />
            </FormField>
          </div>

          <CheckboxField
            checked={isActive}
            label="Active category"
            description="Inactive master categories remain in platform history but should not be used for fresh imports."
            onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
          />

          <Controller
            control={form.control}
            name="translations"
            render={({ field }) => (
              <FormField label="Localized names and descriptions">
                <TranslationFields value={field.value} onChange={field.onChange} />
              </FormField>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {category ? 'Save category' : 'Create category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
