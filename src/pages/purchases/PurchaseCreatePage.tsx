import { useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCreatePurchaseMutation, usePostPurchaseMutation } from '@/features/purchases/purchases.api'
import { useSuppliersQuery } from '@/features/suppliers/suppliers.api'
import { BranchSelector, ProductSelector, VariantSelector } from '@/components/inventory/selectors'
import { ControlledSelect, DirtyStatePrompt, FormField } from '@/components/forms'
import { PageHeader, SectionCard } from '@/components/common'
import { Button, DatePicker, Input, Textarea } from '@/components/ui'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDateForInput, parseDateValue } from '@/lib/utils'

const purchaseItemSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  batchNumber: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
})

const purchaseSchema = z.object({
  branchId: z.string().trim().min(1),
  supplierId: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
  invoiceDate: z.string().trim().optional(),
  receivedAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(purchaseItemSchema).min(1),
})

type PurchaseFormValues = z.input<typeof purchaseSchema>

function PurchaseItemRow({
  control,
  setValue,
  index,
  onRemove,
  onAddProduct,
}: {
  control: Control<PurchaseFormValues>
  setValue: UseFormSetValue<PurchaseFormValues>
  index: number
  onRemove: () => void
  onAddProduct?: () => void
}) {
  const { t } = useTranslation(['common', 'products'])
  const productId = useWatch({
    control,
    name: `items.${index}.productId`,
  })

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-7">
      <Controller control={control} name={`items.${index}.productId`} render={({ field }) => (
        <FormField label="Product">
          <ProductSelector value={field.value} onChange={(value) => {
            field.onChange(value)
            setValue(`items.${index}.variantId`, '', { shouldDirty: true })
          }} addActionLabel={onAddProduct ? t('addProduct', { ns: 'products' }) : undefined} onAddAction={onAddProduct} />
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
      <Controller control={control} name={`items.${index}.taxRate`} render={({ field }) => (
        <FormField label="Tax %">
          <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
        </FormField>
      )} />
      <Controller control={control} name={`items.${index}.discountAmount`} render={({ field }) => (
        <FormField label="Discount">
          <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
        </FormField>
      )} />
      <div className="flex items-end">
        <Button type="button" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Controller control={control} name={`items.${index}.batchNumber`} render={({ field }) => (
        <FormField className="md:col-span-1 xl:col-span-3" label="Batch number">
          <Input {...field} />
        </FormField>
      )} />
      <Controller control={control} name={`items.${index}.expiryDate`} render={({ field }) => (
        <FormField className="md:col-span-1 xl:col-span-3" label="Expiry date">
          <DatePicker
            value={parseDateValue(field.value)}
            onChange={(date) => field.onChange(formatDateForInput(date))}
            placeholder={t('pickExpiryDate')}
          />
        </FormField>
      )} />
    </div>
  )
}

export function PurchaseCreatePage() {
  const { t } = useTranslation(['common', 'purchases', 'suppliers', 'products', 'branches'])
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [submitMode, setSubmitMode] = useState<'draft' | 'post'>('draft')
  const createPurchaseMutation = useCreatePurchaseMutation()
  const postPurchaseMutation = usePostPurchaseMutation()
  const suppliersQuery = useSuppliersQuery({ page: 1, limit: 100 })
  const form = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      receiptNumber: '',
      invoiceDate: '',
      receivedAt: '',
      notes: '',
      items: [{ productId: '', variantId: '', quantity: 1, unitCost: 0, taxRate: 0, discountAmount: 0, batchNumber: '', expiryDate: '' }],
    },
  })
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const purchase = await createPurchaseMutation.mutateAsync(values)
      if (submitMode === 'post') {
        await postPurchaseMutation.mutateAsync(purchase.id)
        toast.success('Purchase created and posted')
      } else {
        toast.success('Purchase draft created')
      }
      navigate(`/purchases/${purchase.id}`)
    } catch {
      toast.error('Could not create purchase')
    }
  })

  return (
    <div className="space-y-6">
      <DirtyStatePrompt active={form.formState.isDirty} />
      <PageHeader
        title="Create purchase"
        description="Draft a purchase receipt, then optionally post it immediately to update stock."
      />
      <SectionCard title="Purchase details" description="Receipt and supplier metadata.">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Branch" error={form.formState.errors.branchId?.message}>
              <Controller
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <BranchSelector
                    value={field.value}
                    onChange={field.onChange}
                    addActionLabel={permissions.canManageCatalog ? t('addBranch', { ns: 'branches' }) : undefined}
                    onAddAction={permissions.canManageCatalog ? () => navigate('/branches') : undefined}
                  />
                )}
              />
            </FormField>
            <FormField label="Supplier">
              <ControlledSelect
                control={form.control}
                name="supplierId"
                placeholder={t('noSupplier', { ns: 'common' })}
                emptyOptionLabel={t('noSupplier', { ns: 'common' })}
                options={suppliersQuery.data?.items.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.name,
                })) ?? []}
                addActionLabel={t('addSupplier', { ns: 'suppliers' })}
                onAddAction={() => navigate('/suppliers')}
              />
            </FormField>
            <FormField label="Receipt number">
              <Input placeholder={t('receiptNumberPlaceholder', { ns: 'common' })} {...form.register('receiptNumber')} />
            </FormField>
            <Controller
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormField label="Invoice date">
                  <DatePicker
                    value={parseDateValue(field.value)}
                    onChange={(date) => field.onChange(formatDateForInput(date))}
                    placeholder={t('pickInvoiceDate', { ns: 'common' })}
                  />
                </FormField>
              )}
            />
            <FormField label="Received at">
              <Input type="datetime-local" {...form.register('receivedAt')} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea placeholder={t('notesPlaceholder', { ns: 'purchases' })} {...form.register('notes')} />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Items</h3>
              <Button type="button" variant="outline" onClick={() => itemsFieldArray.append({ productId: '', variantId: '', quantity: 1, unitCost: 0, taxRate: 0, discountAmount: 0, batchNumber: '', expiryDate: '' })}>
                Add line
              </Button>
            </div>
            {itemsFieldArray.fields.map((field, index) => (
              <PurchaseItemRow
                key={field.id}
                control={form.control}
                setValue={form.setValue}
                index={index}
                onAddProduct={permissions.canManageCatalog ? () => navigate('/products/new') : undefined}
                onRemove={() => itemsFieldArray.remove(index)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/purchases')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={createPurchaseMutation.isPending || postPurchaseMutation.isPending}
              onClick={() => setSubmitMode('draft')}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              disabled={createPurchaseMutation.isPending || postPurchaseMutation.isPending}
              onClick={() => setSubmitMode('post')}
            >
              Save and post
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
