import { useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCustomersQuery } from '@/features/customers/customers.api'
import { useCreateSalesOrderMutation } from '@/features/sales-orders/sales-orders.api'
import { BranchSelector, ProductSelector, VariantSelector } from '@/components/inventory/selectors'
import { ControlledSelect, DirtyStatePrompt, FormField } from '@/components/forms'
import { DisclosurePanel, PageHeader, SectionCard } from '@/components/common'
import { Button, Input, Textarea } from '@/components/ui'
import { usePermissions } from '@/hooks/usePermissions'
import { ORDER_SOURCES, PAYMENT_STATUSES } from '@/types/common'
import type { SalesOrderPayload } from '@/types/inventory'
import { getDisplayName } from '@/lib/utils'
import { getOrderSourceLabel, getPaymentStatusLabel } from '@/lib/labels'

const orderItemSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
})

const salesOrderSchema = z.object({
  branchId: z.string().trim().min(1),
  customerId: z.string().trim().optional(),
  orderNumber: z.string().trim().optional(),
  source: z.enum(ORDER_SOURCES).default('APP'),
  status: z.enum(['DRAFT', 'PENDING']).default('PENDING'),
  paymentStatus: z.enum(PAYMENT_STATUSES).default('UNPAID'),
  notes: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1),
})

type SalesOrderFormValues = z.input<typeof salesOrderSchema>

function normalizeSalesOrderPayload(
  values: SalesOrderFormValues,
  submitStatus: 'DRAFT' | 'PENDING',
): SalesOrderPayload {
  return {
    branchId: values.branchId,
    customerId: values.customerId?.trim() ? values.customerId : undefined,
    orderNumber: values.orderNumber?.trim() ? values.orderNumber : undefined,
    source: values.source,
    status: submitStatus,
    paymentStatus: values.paymentStatus,
    notes: values.notes?.trim() ? values.notes : undefined,
    items: values.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity as string | number,
      unitPrice: item.unitPrice as string | number,
      taxRate: item.taxRate as string | number | undefined,
      discountAmount: item.discountAmount as string | number | undefined,
    })),
  }
}

function SalesOrderItemRow({
  control,
  setValue,
  index,
  onRemove,
  onAddProduct,
}: {
  control: Control<SalesOrderFormValues>
  setValue: UseFormSetValue<SalesOrderFormValues>
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
    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Line {index + 1}</p>
          <p className="text-xs text-slate-500">Capture the item, quantity, and selling price first. Tax and discount can stay optional.</p>
        </div>
        <Button type="button" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Controller control={control} name={`items.${index}.unitPrice`} render={({ field }) => (
          <FormField label="Unit price">
            <Input step="0.01" type="number" value={field.value == null ? '' : String(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </FormField>
        )} />
      </div>
      <DisclosurePanel
        title="More line details"
        description="Open only when you need tax or discount fields for this order line."
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </DisclosurePanel>
    </div>
  )
}

export function SalesOrderCreatePage() {
  const { t } = useTranslation(['common', 'orders', 'branches', 'customers'])
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [submitStatus, setSubmitStatus] = useState<'DRAFT' | 'PENDING'>('PENDING')
  const createSalesOrderMutation = useCreateSalesOrderMutation()
  const customersQuery = useCustomersQuery({ page: 1, limit: 100 })
  const form = useForm({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      branchId: '',
      customerId: '',
      orderNumber: '',
      source: 'APP',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      notes: '',
      items: [{ productId: '', variantId: '', quantity: 1, unitPrice: 0, taxRate: 0, discountAmount: 0 }],
    },
  })
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const order = await createSalesOrderMutation.mutateAsync(normalizeSalesOrderPayload(values, submitStatus))
      toast.success(`Sales order ${submitStatus === 'DRAFT' ? 'saved as draft' : 'created'}`)
      navigate(`/sales-orders/${order.id}`)
    } catch {
      toast.error('Could not create sales order')
    }
  })

  return (
    <div className="space-y-6">
      <DirtyStatePrompt active={form.formState.isDirty} />
      <PageHeader
        title="Create sales order"
        description="Create a draft or pending order and move it through confirmation and delivery."
      />
      <SectionCard title="Order details" description="Branch, source, customer, and line items.">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <FormField label="Customer">
              <ControlledSelect
                control={form.control}
                name="customerId"
                placeholder={t('walkInNone', { ns: 'common' })}
                emptyOptionLabel={t('walkInNone', { ns: 'common' })}
                options={customersQuery.data?.items.map((customer) => ({
                  value: customer.id,
                  label: getDisplayName(customer),
                })) ?? []}
                addActionLabel={t('addCustomer', { ns: 'customers' })}
                onAddAction={() => navigate('/customers')}
              />
            </FormField>
          </div>
          <DisclosurePanel
            title="Order preferences"
            description="Source, payment, notes, and manual order numbers can stay optional for quicker mobile entry."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField label="Source">
                <ControlledSelect
                  control={form.control}
                  name="source"
                  options={ORDER_SOURCES.map((source) => ({ value: source, label: getOrderSourceLabel(t, source) }))}
                />
              </FormField>
              <FormField label="Payment status">
                <ControlledSelect
                  control={form.control}
                  name="paymentStatus"
                  options={PAYMENT_STATUSES.map((item) => ({ value: item, label: getPaymentStatusLabel(t, item) }))}
                />
              </FormField>
              <FormField label="Order number">
                <Input placeholder={t('orderNumberPlaceholder', { ns: 'common' })} {...form.register('orderNumber')} />
              </FormField>
            </div>
            <FormField className="mt-4" label="Notes">
              <Textarea placeholder={t('notesPlaceholder')} {...form.register('notes')} />
            </FormField>
          </DisclosurePanel>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Items</h3>
              <Button type="button" variant="outline" onClick={() => itemsFieldArray.append({ productId: '', variantId: '', quantity: 1, unitPrice: 0, taxRate: 0, discountAmount: 0 })}>
                Add line
              </Button>
            </div>
            {itemsFieldArray.fields.map((field, index) => (
              <SalesOrderItemRow
                key={field.id}
                control={form.control}
                setValue={form.setValue}
                index={index}
                onAddProduct={permissions.canManageCatalog ? () => navigate('/products/new') : undefined}
                onRemove={() => itemsFieldArray.remove(index)}
              />
            ))}
          </div>
          <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_14px_32px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <Button type="button" variant="outline" onClick={() => navigate('/sales-orders')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              onClick={() => setSubmitStatus('DRAFT')}
              loading={submitStatus === 'DRAFT' && createSalesOrderMutation.isPending}
              loadingText="Saving draft..."
            >
              Save draft
            </Button>
            <Button
              type="submit"
              onClick={() => setSubmitStatus('PENDING')}
              loading={submitStatus === 'PENDING' && createSalesOrderMutation.isPending}
              loadingText="Saving pending order..."
            >
              Save pending
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
