import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useCreateAdjustmentMutation, useInventoryBalancesQuery } from '@/features/inventory/inventory.api'
import { ControlledSelect, DirtyStatePrompt, FormField } from '@/components/forms'
import { BranchSelector, ProductSelector, QuantityText, VariantSelector } from '@/components/inventory/selectors'
import { DetailGrid, DetailItem, PageHeader, SectionCard } from '@/components/common'
import { Button, DatePicker, Input, Textarea } from '@/components/ui'
import { formatDateForInput, parseDateValue } from '@/lib/utils'

const adjustmentSchema = z.object({
  branchId: z.string().trim().min(1),
  productId: z.string().trim().optional(),
  variantId: z.string().trim().min(1),
  direction: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive(),
  note: z.string().trim().min(1),
  unitCost: z.string().trim().optional(),
  batchNumber: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
  manufactureDate: z.string().trim().optional(),
})

export function StockAdjustmentPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createAdjustmentMutation = useCreateAdjustmentMutation()
  const form = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      branchId: searchParams.get('branchId') ?? '',
      productId: searchParams.get('productId') ?? '',
      variantId: searchParams.get('variantId') ?? '',
      direction: 'IN',
      quantity: 1,
      note: '',
      unitCost: '',
      batchNumber: '',
      expiryDate: '',
      manufactureDate: '',
    },
  })

  const branchId = useWatch({ control: form.control, name: 'branchId' })
  const productId = useWatch({ control: form.control, name: 'productId' })
  const variantId = useWatch({ control: form.control, name: 'variantId' })
  const expiryDate = useWatch({ control: form.control, name: 'expiryDate' })
  const manufactureDate = useWatch({ control: form.control, name: 'manufactureDate' })
  const currentBalanceQuery = useInventoryBalancesQuery({
    page: 1,
    limit: 1,
    branchId: branchId || undefined,
    variantId: variantId || undefined,
  })

  const currentBalance = useMemo(
    () => currentBalanceQuery.data?.items?.[0],
    [currentBalanceQuery.data?.items],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createAdjustmentMutation.mutateAsync({
        branchId: values.branchId,
        variantId: values.variantId,
        direction: values.direction,
        quantity: values.quantity,
        note: values.note,
        unitCost: values.unitCost || undefined,
        batchNumber: values.batchNumber || undefined,
        expiryDate: values.expiryDate || undefined,
        manufactureDate: values.manufactureDate || undefined,
      })
      toast.success('Stock adjustment created')
      navigate('/inventory/balances')
    } catch {
      toast.error('Could not create stock adjustment')
    }
  })

  return (
    <div className="space-y-6">
      <DirtyStatePrompt active={form.formState.isDirty} />
      <PageHeader
        title="Create stock adjustment"
        description="Post manual stock increases or decreases against a branch and variant."
      />
      <SectionCard title="Adjustment form" description="Backend adjustments require branch, variant, direction, quantity, and note.">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Branch" error={form.formState.errors.branchId?.message}>
              <Controller control={form.control} name="branchId" render={({ field }) => <BranchSelector value={field.value} onChange={field.onChange} />} />
            </FormField>
            <FormField label="Product">
              <Controller control={form.control} name="productId" render={({ field }) => <ProductSelector value={field.value} onChange={(value) => {
                field.onChange(value)
                form.setValue('variantId', '')
              }} />} />
            </FormField>
            <FormField label="Variant" error={form.formState.errors.variantId?.message}>
              <Controller control={form.control} name="variantId" render={({ field }) => <VariantSelector productId={productId || undefined} value={field.value} onChange={field.onChange} />} />
            </FormField>
            <FormField label="Direction">
              <ControlledSelect
                control={form.control}
                name="direction"
                options={[
                  { value: 'IN', label: 'IN' },
                  { value: 'OUT', label: 'OUT' },
                ]}
              />
            </FormField>
            <FormField label="Quantity" error={form.formState.errors.quantity?.message}>
              <Input step="0.001" type="number" {...form.register('quantity')} />
            </FormField>
            <FormField label="Unit cost">
              <Input step="0.01" type="number" {...form.register('unitCost')} />
            </FormField>
            <FormField label="Batch number">
              <Input {...form.register('batchNumber')} />
            </FormField>
            <FormField label="Expiry date">
              <DatePicker
                value={parseDateValue(expiryDate)}
                onChange={(date) => form.setValue('expiryDate', formatDateForInput(date), { shouldDirty: true })}
                placeholder={t('pickExpiryDate')}
              />
            </FormField>
            <FormField label="Manufacture date">
              <DatePicker
                value={parseDateValue(manufactureDate)}
                onChange={(date) => form.setValue('manufactureDate', formatDateForInput(date), { shouldDirty: true })}
                placeholder={t('pickManufactureDate')}
              />
            </FormField>
          </div>
          <FormField label="Note" error={form.formState.errors.note?.message}>
            <Textarea {...form.register('note')} />
          </FormField>
          <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-900">Current stock snapshot</p>
            {currentBalance ? (
              <DetailGrid className="mt-4 xl:grid-cols-3">
                <DetailItem label="On hand" value={<QuantityText value={currentBalance.onHand} />} />
                <DetailItem label="Reserved" value={<QuantityText value={currentBalance.reserved} />} />
                <DetailItem label="Available" value={<QuantityText value={currentBalance.available} />} />
              </DetailGrid>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No balance found yet for this branch and variant.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/balances')}>
              Cancel
            </Button>
            <Button disabled={createAdjustmentMutation.isPending} type="submit">
              Create adjustment
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
