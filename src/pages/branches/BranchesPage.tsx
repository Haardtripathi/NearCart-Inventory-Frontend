import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useBranchesQuery, useCreateBranchMutation, useDeleteBranchMutation, useUpdateBranchMutation } from '@/features/branches/branches.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { BRANCH_TYPES, type Branch, type BranchType } from '@/types/common'
import { ConfirmDialog, DataTable, DisclosurePanel, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, ControlledSelect, FormField } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { getBranchTypeLabel } from '@/lib/labels'
import { getDisplayName, parseApiError } from '@/lib/utils'

// Raw number inputs post a string (or '' when cleared); coerce to a finite number within range,
// or `undefined` when left blank so an unset coordinate doesn't get submitted as 0/NaN.
const optionalCoordinate = (min: number, max: number) =>
  z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) {
      return undefined
    }
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(num) ? undefined : num
  }, z.number().min(min).max(max).optional())

const branchSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1),
  type: z.enum(BRANCH_TYPES),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  // Pickup-point coordinates for nearest-free-driver auto-assignment (see
  // findNearestFreeDriver in the backend sales-orders service). Optional — a branch with no
  // coordinates simply can't be auto-matched to a driver yet; the manual assign-driver dropdown
  // still works either way.
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  isActive: z.boolean().default(true),
})

// Explicit input/output split needed because `optionalCoordinate` is a `z.preprocess` schema:
// its inferred *input* type is `unknown` (required), while its *output* type is `number |
// undefined` (optional) — without splitting these, the zodResolver's inferred field type collapses
// to the (wrong) output shape for form state and trips a resolver/Control type mismatch.
type BranchFormValues = z.input<typeof branchSchema>
type BranchFormOutput = z.output<typeof branchSchema>

export function BranchesPage() {
  const { t } = useTranslation(['branches', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const debouncedSearch = useDebounce(search)

  const branchesQuery = useBranchesQuery({ page, limit: 12, search: debouncedSearch || undefined })
  const createBranchMutation = useCreateBranchMutation()
  const updateBranchMutation = useUpdateBranchMutation()
  const deleteBranchMutation = useDeleteBranchMutation()
  const form = useForm<BranchFormValues, undefined, BranchFormOutput>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'STORE',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      isActive: true,
    },
  })
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))

  const branches = useMemo(() => branchesQuery.data?.items ?? [], [branchesQuery.data?.items])

  const openCreate = () => {
    setEditingBranch(null)
    form.reset({
      code: '',
      name: '',
      type: 'STORE',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch)
    form.reset({
      code: branch.code,
      name: branch.name,
      type: branch.type as BranchType,
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      addressLine1: branch.addressLine1 ?? '',
      addressLine2: branch.addressLine2 ?? '',
      city: branch.city ?? '',
      state: branch.state ?? '',
      country: branch.country ?? '',
      postalCode: branch.postalCode ?? '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      isActive: branch.isActive,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingBranch) {
        await updateBranchMutation.mutateAsync({ id: editingBranch.id, payload: values })
        toast.success(t('branches:updated'))
      } else {
        await createBranchMutation.mutateAsync(values)
        toast.success(t('branches:created'))
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(parseApiError(error).message || t('branches:saveFailed'))
    }
  })

  if (branchesQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('branches:title')}
        description={t('branches:description')}
        actions={
          permissions.canManageCatalog ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('branches:addBranch')}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('branches:searchPlaceholder')} />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'name', header: t('branches:name'), render: (branch) => <div><p className="font-medium text-slate-900">{getDisplayName(branch)}</p><p className="text-xs text-slate-500">{branch.code}</p></div> },
          { key: 'type', header: t('branches:type'), render: (branch) => getBranchTypeLabel(t, branch.type) },
          { key: 'location', header: t('branches:location'), render: (branch) => [branch.city, branch.state, branch.country].filter(Boolean).join(', ') || '—' },
          { key: 'status', header: t('common:status'), render: (branch) => <StatusBadge value={branch.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          {
            key: 'actions',
            header: t('common:actions'),
            render: (branch) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(branch)} disabled={!permissions.canManageCatalog}>
                  {t('common:edit')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeletingBranch(branch)} disabled={!permissions.canManageCatalog}>
                  {t('common:archive')}
                </Button>
              </div>
            ),
          },
        ]}
        empty={<EmptyState title={t('branches:noBranchesTitle')} description={t('branches:noBranchesDescription')} />}
        items={branches}
        rowKey={(branch) => branch.id}
      />

      <PaginationControls pagination={branchesQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingBranch ? t('branches:editBranch') : t('branches:addBranch')}</DialogTitle>
            <DialogDescription>
              {editingBranch ? t('branches:editDialogDescription') : t('branches:createDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label={t('branches:code')} error={form.formState.errors.code?.message}>
              <Input placeholder={t('branches:codePlaceholder')} {...form.register('code')} />
            </FormField>
            <FormField label={t('branches:name')} error={form.formState.errors.name?.message} required>
              <Input placeholder={t('branches:namePlaceholder')} {...form.register('name')} />
            </FormField>
            <FormField label={t('branches:type')}>
              <ControlledSelect
                control={form.control as never}
                name="type"
                options={BRANCH_TYPES.map((type) => ({
                  value: type,
                  label: getBranchTypeLabel(t, type),
                }))}
              />
            </FormField>
            <div className="md:col-span-2">
              <CheckboxField
                checked={isActive}
                label={t('branches:active')}
                description={t('branches:activeDescription')}
                onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
              />
            </div>
            <div className="md:col-span-2">
              <DisclosurePanel
                title="Contact and address details"
                description="Keep these optional fields hidden unless you need them while creating the branch."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t('common:phone')}>
                    <Input placeholder={t('common:phonePlaceholder')} {...form.register('phone')} />
                  </FormField>
                  <FormField label={t('common:email')}>
                    <Input placeholder={t('common:emailPlaceholder')} {...form.register('email')} />
                  </FormField>
                  <FormField label={t('branches:addressLine1')}>
                    <Input placeholder={t('common:addressLine1Placeholder')} {...form.register('addressLine1')} />
                  </FormField>
                  <FormField label={t('branches:addressLine2')}>
                    <Input {...form.register('addressLine2')} />
                  </FormField>
                  <FormField label={t('common:city')}>
                    <Input placeholder={t('common:cityPlaceholder')} {...form.register('city')} />
                  </FormField>
                  <FormField label={t('common:state')}>
                    <Input placeholder={t('common:statePlaceholder')} {...form.register('state')} />
                  </FormField>
                  <FormField label={t('common:country')}>
                    <Input placeholder={t('common:countryPlaceholder')} {...form.register('country')} />
                  </FormField>
                  <FormField label={t('common:postalCode')}>
                    <Input placeholder={t('common:postalCodePlaceholder')} {...form.register('postalCode')} />
                  </FormField>
                </div>
              </DisclosurePanel>
            </div>
            <div className="md:col-span-2">
              <DisclosurePanel
                title={t('branches:pickupLocationTitle')}
                description={t('branches:pickupLocationDescription')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label={t('branches:latitude')}
                    description={t('branches:latitudeHelper')}
                    error={form.formState.errors.latitude?.message}
                  >
                    <Input type="number" step="any" min={-90} max={90} placeholder="19.0760" {...form.register('latitude')} />
                  </FormField>
                  <FormField
                    label={t('branches:longitude')}
                    description={t('branches:longitudeHelper')}
                    error={form.formState.errors.longitude?.message}
                  >
                    <Input type="number" step="any" min={-180} max={180} placeholder="72.8777" {...form.register('longitude')} />
                  </FormField>
                </div>
              </DisclosurePanel>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                loading={createBranchMutation.isPending || updateBranchMutation.isPending}
                loadingText={editingBranch ? t('branches:updateBranch') : t('branches:createBranch')}
                type="submit"
              >
                {editingBranch ? t('branches:updateBranch') : t('branches:createBranch')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingBranch)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBranch(null)
          }
        }}
        title={t('branches:archiveTitle')}
        description={deletingBranch ? t('branches:archiveDescription', { name: deletingBranch.name }) : undefined}
        confirmLabel={t('branches:archiveLabel')}
        onConfirm={async () => {
          if (!deletingBranch) {
            return
          }
          try {
            await deleteBranchMutation.mutateAsync(deletingBranch.id)
            toast.success(t('branches:archived'))
            setDeletingBranch(null)
          } catch {
            toast.error(t('branches:archiveFailed'))
          }
        }}
      />
    </div>
  )
}
