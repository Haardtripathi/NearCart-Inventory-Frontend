import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { KeyRound, Plus } from 'lucide-react'

import {
  useCreateOrganizationUserMutation,
  useGenerateUserAccessLinkMutation,
  useOrganizationUsersQuery,
  useUpdateOrganizationUserMutation,
} from '@/features/users/users.api'
import { useBranchesQuery } from '@/features/branches/branches.api'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import {
  DataTable,
  EmptyState,
  FilterBar,
  InlineNotice,
  LoadingState,
  PageHeader,
  SearchInput,
  StatusBadge,
} from '@/components/common'
import { CheckboxField, ControlledSelect, FormField } from '@/components/forms'
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui'
import {
  BRANCH_ACCESS_SCOPES,
  LANGUAGE_CODES,
  MEMBERSHIP_STATUSES,
  USER_ROLES,
  type BranchAccessState,
  type OrganizationUser,
} from '@/types/common'
import { normalizeBackendLanguage } from '@/lib/locale'
import { formatDateTime, getDisplayName, parseApiError } from '@/lib/utils'
import { getLanguageLabel, getMembershipStatusLabel, getUserRoleLabel } from '@/lib/labels'

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum(USER_ROLES),
  preferredLanguage: z.enum(LANGUAGE_CODES).default('EN'),
  branchScope: z.enum(BRANCH_ACCESS_SCOPES).default('ALL'),
  branchIds: z.array(z.string()).default([]),
}).superRefine((value, ctx) => {
  if (value.branchScope === 'SELECTED' && value.branchIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one branch',
      path: ['branchIds'],
    })
  }
})

const updateUserSchema = createUserSchema.extend({
  status: z.enum(MEMBERSHIP_STATUSES),
}).superRefine((value, ctx) => {
  if (value.branchScope === 'SELECTED' && value.branchIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one branch',
      path: ['branchIds'],
    })
  }
})

type CreateUserFormValues = z.output<typeof createUserSchema>
type UpdateUserFormValues = z.output<typeof updateUserSchema>

function toBranchAccess(scope: BranchAccessState['scope'], branchIds: string[]): BranchAccessState {
  return {
    scope,
    branchIds: scope === 'ALL' ? [] : branchIds,
  }
}

export function UsersPage() {
  const { t } = useTranslation('common')
  const permissions = usePermissions()
  const { role } = useAuth()
  const usersQuery = useOrganizationUsersQuery()
  const branchesQuery = useBranchesQuery({ page: 1, limit: 100 })
  const createUserMutation = useCreateOrganizationUserMutation()
  const updateUserMutation = useUpdateOrganizationUserMutation()
  const generateAccessLinkMutation = useGenerateUserAccessLinkMutation()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null)
  const [latestAccessLink, setLatestAccessLink] = useState<{ label: string; url: string; expiresAt: string } | null>(null)

  const createForm = useForm<any>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: {
      fullName: '',
      email: '',
      role: 'STAFF',
      preferredLanguage: 'EN',
      branchScope: 'ALL',
      branchIds: [],
    },
  })
  const updateForm = useForm<any>({
    resolver: zodResolver(updateUserSchema) as never,
    defaultValues: {
      fullName: '',
      email: '',
      role: 'STAFF',
      preferredLanguage: 'EN',
      status: 'ACTIVE',
      branchScope: 'ALL',
      branchIds: [],
    },
  })

  const branches = useMemo(() => branchesQuery.data?.items ?? [], [branchesQuery.data?.items])
  const createBranchScope = useWatch({ control: createForm.control, name: 'branchScope' })
  const updateBranchScope = useWatch({ control: updateForm.control, name: 'branchScope' })

  const users = useMemo(() => {
    const items = usersQuery.data ?? []
    const query = search.trim().toLowerCase()

    if (!query) {
      return items
    }

    return items.filter((user) =>
      [user.fullName, user.email, user.role, user.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [search, usersQuery.data])

  const roleOptions = useMemo(() => {
    const options = [
      { value: 'STAFF', label: getUserRoleLabel(t, 'STAFF') },
      { value: 'MANAGER', label: getUserRoleLabel(t, 'MANAGER') },
      { value: 'ORG_ADMIN', label: getUserRoleLabel(t, 'ORG_ADMIN') },
    ]

    return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' ? options : options.filter((option) => option.value === 'STAFF')
  }, [role, t])

  const openEdit = (user: OrganizationUser) => {
    setEditingUser(user)
    updateForm.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      preferredLanguage: normalizeBackendLanguage(user.preferredLanguage),
      status: user.status,
      branchScope: user.branchAccess.scope,
      branchIds: user.branchAccess.branchIds,
    })
  }

  const copyAccessLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.success('Access link copied')
  }

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      const result = await createUserMutation.mutateAsync({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: values.role,
        preferredLanguage: values.preferredLanguage,
        branchAccess: toBranchAccess(values.branchScope, values.branchIds),
      })

      if (result.accessLink) {
        setLatestAccessLink({
          label: result.accessLink.purpose === 'ACCOUNT_SETUP' ? 'Setup link' : 'Reset link',
          url: result.accessLink.url,
          expiresAt: result.accessLink.expiresAt,
        })
      } else {
        setLatestAccessLink(null)
      }

      toast.success('Organization user saved')
      setIsCreateOpen(false)
      createForm.reset({
        fullName: '',
        email: '',
        role: 'STAFF',
        preferredLanguage: 'EN',
        branchScope: 'ALL',
        branchIds: [],
      })
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  const onUpdate = updateForm.handleSubmit(async (values) => {
    if (!editingUser) {
      return
    }

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        payload: {
          fullName: values.fullName.trim(),
          role: values.role,
          preferredLanguage: values.preferredLanguage,
          status: values.status,
          branchAccess: toBranchAccess(values.branchScope, values.branchIds),
        },
      })

      toast.success('Organization user updated')
      setEditingUser(null)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  if (!permissions.canManageUsers) {
    return <EmptyState title="User access is restricted" description="Only super admins and org admins can manage organization users." />
  }

  if (usersQuery.isLoading) {
    return <LoadingState label="Loading organization users..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Create organization users, resend setup links, and control role and branch access without leaving the active workspace."
        actions={(
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        )}
      />

      {latestAccessLink ? (
        <InlineNotice tone="success">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-slate-900">{latestAccessLink.label} ready</p>
              <p className="mt-1 break-all text-sm">{latestAccessLink.url}</p>
              <p className="mt-1 text-xs text-slate-500">Expires {formatDateTime(latestAccessLink.expiresAt)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void copyAccessLink(latestAccessLink.url)}>Copy link</Button>
              <Button variant="ghost" onClick={() => setLatestAccessLink(null)}>Dismiss</Button>
            </div>
          </div>
        </InlineNotice>
      ) : null}

      <FilterBar>
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by name, email, role, or status" />
      </FilterBar>

      <DataTable
        items={users}
        rowKey={(user) => user.id}
        empty={<EmptyState title="No organization users yet" description="Invite your first store owner, manager, or staff member to start the onboarding flow." />}
        columns={[
          {
            key: 'identity',
            header: 'User',
            render: (user) => (
              <div>
                <p className="font-medium text-slate-900">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (user) => (
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{getUserRoleLabel(t, user.role)}</Badge>
                {user.isDefault ? <Badge tone="muted">Default</Badge> : null}
              </div>
            ),
          },
          {
            key: 'access',
            header: 'Branch access',
            render: (user) =>
              user.branchAccess.scope === 'ALL'
                ? t('allBranches')
                : `${user.accessibleBranches.map((branch) => branch.name).join(', ') || user.branchAccess.branchIds.length} ${t('selectedBranches').toLowerCase()}`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (user) => <StatusBadge value={user.status} />,
          },
          {
            key: 'lastLogin',
            header: 'Last login',
            render: (user) => formatDateTime(user.lastLoginAt),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (user) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const link = await generateAccessLinkMutation.mutateAsync(user.id)
                      setLatestAccessLink({
                        label: link.purpose === 'ACCOUNT_SETUP' ? 'Setup link' : 'Reset link',
                        url: link.url,
                        expiresAt: link.expiresAt,
                      })
                      toast.success('Access link generated')
                    } catch (error) {
                      toast.error(parseApiError(error).message)
                    }
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                  Link
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add organization user</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
            <FormField label="Full name" error={createForm.formState.errors.fullName?.message}>
              <Input placeholder="Asha Patel" {...createForm.register('fullName')} />
            </FormField>
            <FormField label="Email" error={createForm.formState.errors.email?.message}>
              <Input type="email" placeholder="asha@example.com" {...createForm.register('email')} />
            </FormField>
            <FormField label="Role">
              <ControlledSelect control={createForm.control as never} name="role" options={roleOptions} />
            </FormField>
            <FormField label="Preferred language">
              <ControlledSelect
                control={createForm.control as never}
                name="preferredLanguage"
                options={LANGUAGE_CODES.map((language) => ({
                  value: language,
                  label: getLanguageLabel(t, language),
                }))}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Branch scope">
                <ControlledSelect
                  control={createForm.control as never}
                  name="branchScope"
                  options={BRANCH_ACCESS_SCOPES.map((scope) => ({
                    value: scope,
                    label: scope === 'ALL' ? t('allBranches') : t('selectedBranches'),
                  }))}
                />
              </FormField>
            </div>
            {createBranchScope === 'SELECTED' ? (
              <div className="md:col-span-2 space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-800">Allowed branches</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {branches.map((branch) => {
                    const selected = createForm.watch('branchIds').includes(branch.id)
                    return (
                      <CheckboxField
                        key={branch.id}
                        checked={selected}
                        label={getDisplayName(branch)}
                        description={branch.code}
                        onCheckedChange={(checked) => {
                          const current = createForm.getValues('branchIds')
                          createForm.setValue(
                            'branchIds',
                            checked ? [...current, branch.id] : current.filter((branchId: string) => branchId !== branch.id),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }}
                      />
                    )
                  })}
                </div>
                {createForm.formState.errors.branchIds?.message ? (
                  <p className="text-xs font-medium text-rose-600">{String(createForm.formState.errors.branchIds.message)}</p>
                ) : null}
              </div>
            ) : null}
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                Save user
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit organization user</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onUpdate}>
            <FormField label="Full name" error={updateForm.formState.errors.fullName?.message}>
              <Input placeholder="Asha Patel" {...updateForm.register('fullName')} />
            </FormField>
            <FormField label="Email">
              <Input disabled {...updateForm.register('email')} />
            </FormField>
            <FormField label="Role">
              <ControlledSelect control={updateForm.control as never} name="role" options={roleOptions} />
            </FormField>
            <FormField label="Status">
              <ControlledSelect
                control={updateForm.control as never}
                name="status"
                options={MEMBERSHIP_STATUSES.map((status) => ({
                  value: status,
                  label: getMembershipStatusLabel(t, status),
                }))}
              />
            </FormField>
            <FormField label="Preferred language">
              <ControlledSelect
                control={updateForm.control as never}
                name="preferredLanguage"
                options={LANGUAGE_CODES.map((language) => ({
                  value: language,
                  label: getLanguageLabel(t, language),
                }))}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Branch scope">
                <ControlledSelect
                  control={updateForm.control as never}
                  name="branchScope"
                  options={BRANCH_ACCESS_SCOPES.map((scope) => ({
                    value: scope,
                    label: scope === 'ALL' ? t('allBranches') : t('selectedBranches'),
                  }))}
                />
              </FormField>
            </div>
            {updateBranchScope === 'SELECTED' ? (
              <div className="md:col-span-2 space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-800">Allowed branches</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {branches.map((branch) => {
                    const selected = updateForm.watch('branchIds').includes(branch.id)
                    return (
                      <CheckboxField
                        key={branch.id}
                        checked={selected}
                        label={getDisplayName(branch)}
                        description={branch.code}
                        onCheckedChange={(checked) => {
                          const current = updateForm.getValues('branchIds')
                          updateForm.setValue(
                            'branchIds',
                            checked ? [...current, branch.id] : current.filter((branchId: string) => branchId !== branch.id),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }}
                      />
                    )
                  })}
                </div>
                {updateForm.formState.errors.branchIds?.message ? (
                  <p className="text-xs font-medium text-rose-600">{String(updateForm.formState.errors.branchIds.message)}</p>
                ) : null}
              </div>
            ) : null}
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                Update user
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
