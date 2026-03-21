import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

import { useCreateStockTransferMutation } from '@/features/stock-transfers/stock-transfers.api'
import { BranchSelector, ProductSelector, VariantSelector } from '@/components/inventory/selectors'
import { DirtyStatePrompt, FormField } from '@/components/forms'
import { PageHeader, SectionCard } from '@/components/common'
import { Button, Input, Textarea } from '@/components/ui'

const transferItemSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0).optional(),
})

const stockTransferSchema = z.object({
  fromBranchId: z.string().trim().min(1),
  toBranchId: z.string().trim().min(1),
  transferNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(transferItemSchema).min(1),
}).refine((value) => value.fromBranchId !== value.toBranchId, {
  message: 'Source and destination branch cannot be the same',
  path: ['toBranchId'],
})

type StockTransferFormValues = z.input<typeof stockTransferSchema>

function TransferItemRow({
  control,
  setValue,
  index,
  onRemove,
}: {
  control: Control<StockTransferFormValues>
  setValue: UseFormSetValue<StockTransferFormValues>
  index: number
  onRemove: () => void
}) {
  const productId = useWatch({
    control,
    name: `items.${index}.productId`,
  })

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-5">
      <Controller control={control} name={`items.${index}.productId`} render={({ field }) => (
        <FormField label="Product">
          <ProductSelector value={field.value} onChange={(value) => {
            field.onChange(value)
            setValue(`items.${index}.variantId`, '', { shouldDirty: true })
          }} />
        </FormField>
      )} />
      <Controller control={control} name={`items.${index}.variantId`} render={({ field }) => (
        <FormField label="Variant">
          <VariantSelector productId={productId} value={field.value} onChange={field.onChange} />
        </FormField>
      )} />
      <Controller control={control} name={`items.${index}.quantity`} render={({ field }) => (
        <FormField label="Quantity">
          <Input step="0.001" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
        </FormField>
      )} />
      <Controller control={control} name={`items.${index}.unitCost`} render={({ field }) => (
        <FormField label="Unit cost">
          <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
        </FormField>
      )} />
      <div className="flex items-end">
        <Button type="button" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function StockTransferCreatePage() {
  const navigate = useNavigate()
  const createTransferMutation = useCreateStockTransferMutation()
  const form = useForm({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      fromBranchId: '',
      toBranchId: '',
      transferNumber: '',
      notes: '',
      items: [{ productId: '', variantId: '', quantity: 1, unitCost: 0 }],
    },
  })
  const itemsFieldArray = useFieldArray({ control: form.control, name: 'items' })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const transfer = await createTransferMutation.mutateAsync(values)
      toast.success('Transfer draft created')
      navigate(`/stock-transfers/${transfer.id}`)
    } catch {
      toast.error('Could not create stock transfer')
    }
  })

  return (
    <div className="space-y-6">
      <DirtyStatePrompt active={form.formState.isDirty} />
      <PageHeader
        title="Create stock transfer"
        description="Create a draft transfer and approve it when stock should move between branches."
      />
      <SectionCard title="Transfer details" description="Choose source and destination branches, then add line items.">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="From branch" error={form.formState.errors.fromBranchId?.message}>
              <Controller control={form.control} name="fromBranchId" render={({ field }) => <BranchSelector value={field.value} onChange={field.onChange} />} />
            </FormField>
            <FormField label="To branch" error={form.formState.errors.toBranchId?.message}>
              <Controller control={form.control} name="toBranchId" render={({ field }) => <BranchSelector value={field.value} onChange={field.onChange} />} />
            </FormField>
            <FormField label="Transfer number">
              <Input placeholder="TR-2026-001" {...form.register('transferNumber')} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea placeholder="Reason for transfer, courier details, or handling instructions." {...form.register('notes')} />
          </FormField>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Items</h3>
              <Button type="button" variant="outline" onClick={() => itemsFieldArray.append({ productId: '', variantId: '', quantity: 1, unitCost: 0 })}>
                Add line
              </Button>
            </div>
            {itemsFieldArray.fields.map((field, index) => (
              <TransferItemRow key={field.id} control={form.control} setValue={form.setValue} index={index} onRemove={() => itemsFieldArray.remove(index)} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/stock-transfers')}>
              Cancel
            </Button>
            <Button type="submit">Create draft transfer</Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
