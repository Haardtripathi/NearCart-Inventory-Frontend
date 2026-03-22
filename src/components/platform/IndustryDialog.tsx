import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'

import { useCreateIndustryMutation, useUpdateIndustryMutation } from '@/features/meta/meta.api'
import { FormField, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'
import { parseApiError } from '@/lib/utils'
import type { Industry, TranslationInput } from '@/types/common'

const industrySchema = z.object({
  code: z.string().trim().min(2, 'Industry code is required'),
  name: z.string().trim().min(2, 'Industry name is required'),
  description: z.string().trim().optional(),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

type IndustryFormValues = z.input<typeof industrySchema>

export function IndustryDialog({
  open,
  onOpenChange,
  industry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  industry?: Industry | null
}) {
  const { t } = useTranslation(['masterCatalog', 'common'])
  const createIndustryMutation = useCreateIndustryMutation()
  const updateIndustryMutation = useUpdateIndustryMutation()
  const form = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      translations: [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        code: industry?.code ?? '',
        name: industry?.name ?? '',
        description: industry?.description ?? '',
        translations: industry?.translations ?? [],
      })
    }
  }, [form, industry, open])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        translations: (values.translations ?? []).filter((translation: TranslationInput) => translation.name?.trim()),
      }

      if (industry?.id) {
        await updateIndustryMutation.mutateAsync({
          id: industry.id,
          payload,
        })
        toast.success(t('industryUpdated', { ns: 'masterCatalog' }))
      } else {
        await createIndustryMutation.mutateAsync({
          ...payload,
          isActive: true,
          defaultFeatures: {},
        })
        toast.success(t('industryCreated', { ns: 'masterCatalog' }))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {industry?.id ? t('editIndustryDialogTitle', { ns: 'masterCatalog' }) : t('addIndustryDialogTitle', { ns: 'masterCatalog' })}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            label={t('industryCode', { ns: 'masterCatalog' })}
            error={form.formState.errors.code?.message}
            description={t('industryCodeDescription', { ns: 'masterCatalog' })}
            required
          >
            <Input placeholder={t('industryCodePlaceholder', { ns: 'masterCatalog' })} {...form.register('code')} />
          </FormField>
          <FormField label={t('name', { ns: 'common' })} error={form.formState.errors.name?.message} required>
            <Input placeholder={t('industryNamePlaceholder', { ns: 'masterCatalog' })} {...form.register('name')} />
          </FormField>
          <FormField label={t('descriptionLabel', { ns: 'common' })}>
            <Textarea placeholder={t('industryDescriptionPlaceholder', { ns: 'masterCatalog' })} {...form.register('description')} />
          </FormField>
          {industry?.id ? (
            <FormField label={t('languageOverrides', { ns: 'products' })}>
              <TranslationFields
                value={form.watch('translations')}
                onChange={(value) => form.setValue('translations', value as TranslationInput[], { shouldDirty: true })}
              />
            </FormField>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={createIndustryMutation.isPending || updateIndustryMutation.isPending}>
              {createIndustryMutation.isPending || updateIndustryMutation.isPending
                ? t('savingIndustry', { ns: 'masterCatalog' })
                : industry?.id
                  ? t('updateIndustry', { ns: 'masterCatalog' })
                  : t('createIndustry', { ns: 'masterCatalog' })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
