import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'

import { useCreateIndustryMutation } from '@/features/meta/meta.api'
import { FormField } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'
import { parseApiError } from '@/lib/utils'

const industrySchema = z.object({
  code: z.string().trim().min(2, 'Industry code is required'),
  name: z.string().trim().min(2, 'Industry name is required'),
  description: z.string().trim().optional(),
})

type IndustryFormValues = z.infer<typeof industrySchema>

export function IndustryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createIndustryMutation = useCreateIndustryMutation()
  const form = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        code: '',
        name: '',
        description: '',
      })
    }
  }, [form, open])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createIndustryMutation.mutateAsync({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isActive: true,
        defaultFeatures: {},
      })
      toast.success('Industry created')
      onOpenChange(false)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add industry</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Code" error={form.formState.errors.code?.message} description="Short unique key. Example: GROCERY">
            <Input placeholder="GROCERY" {...form.register('code')} />
          </FormField>
          <FormField label="Name" error={form.formState.errors.name?.message}>
            <Input placeholder="Grocery" {...form.register('name')} />
          </FormField>
          <FormField label="Description">
            <Textarea placeholder="Default industry profile for grocery inventory." {...form.register('description')} />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createIndustryMutation.isPending}>
              {createIndustryMutation.isPending ? 'Creating...' : 'Create industry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
