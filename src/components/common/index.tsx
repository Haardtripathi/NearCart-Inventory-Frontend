import * as React from 'react'
import { AlertTriangle, Loader2, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import type { PaginationMeta } from '@/types/api'
import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
}) {
  const { t } = useTranslation('common')
  const resolvedEyebrow = eyebrow === 'Workspace view' ? t('workspaceView') : eyebrow

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1.5">
        {resolvedEyebrow ? (
          <span className="inline-flex text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {resolvedEyebrow}
          </span>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-900 md:text-[2.2rem]">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-col gap-3 bg-white pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function MetricCard({
  label,
  value,
  caption = 'Live snapshot',
  icon,
  tone,
  className,
}: {
  label: string
  value: ReactNode
  caption?: string
  icon?: ReactNode
  tone?: string
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{caption}</p>
          </div>
          {icon ? <div className={cn('rounded-md border border-slate-200 p-3 shadow-sm', tone)}>{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function DetailGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}

export function DetailItem({
  label,
  value,
  hint,
  className,
  tone = 'muted',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  className?: string
  tone?: 'muted' | 'success' | 'warning'
}) {
  const toneClasses = {
    muted: 'border-slate-200 bg-slate-50/80',
    success: 'border-emerald-100 bg-emerald-50/80',
    warning: 'border-amber-100 bg-amber-50/80',
  }

  return (
    <div className={cn('rounded-md border p-4', toneClasses[tone], className)}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-3 text-base font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-sm leading-6 text-slate-500">{hint}</div> : null}
    </div>
  )
}

export function InlineNotice({
  children,
  className,
  tone = 'muted',
}: {
  children: ReactNode
  className?: string
  tone?: 'muted' | 'success' | 'warning'
}) {
  const toneClasses = {
    muted: 'border-slate-200 bg-slate-50/80 text-slate-600',
    success: 'border-emerald-100 bg-emerald-50/80 text-emerald-800',
    warning: 'border-amber-100 bg-amber-50/80 text-amber-800',
  }

  return (
    <div className={cn('rounded-md border p-4 text-sm leading-6', toneClasses[tone], className)}>
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200/80 bg-slate-50/70 px-6 py-8 text-center', className)}>
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  const { t } = useTranslation('common')

  return (
    <EmptyState
      title={title === 'Something went wrong' ? t('somethingWentWrong') : title}
      description={description}
      action={onRetry ? <Button onClick={onRetry}>{t('retry')}</Button> : undefined}
    />
  )
}

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  const { t } = useTranslation('common')
  const resolvedLabel = label === 'Loading data...' ? t('loadingData') : label

  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-6 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
      <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-emerald-700 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <p className="text-sm text-slate-500">{resolvedLabel}</p>
    </div>
  )
}

export function SearchInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className="pl-10" {...props} />
    </div>
  )
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
      <div className={cn('grid gap-3 [&>*]:min-w-0 [&>*]:w-full md:[&>*]:w-auto', className)}>
        {children}
      </div>
    </div>
  )
}

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value?.toLowerCase() ?? ''
  let tone: 'default' | 'success' | 'warning' | 'danger' | 'muted' = 'default'

  if (normalized.includes('active') || normalized.includes('approved') || normalized.includes('delivered') || normalized.includes('paid')) {
    tone = 'success'
  } else if (normalized.includes('pending') || normalized.includes('draft') || normalized.includes('partial') || normalized.includes('ready')) {
    tone = 'warning'
  } else if (normalized.includes('inactive') || normalized.includes('archived') || normalized.includes('rejected') || normalized.includes('cancelled')) {
    tone = 'danger'
  }

  return <Badge tone={tone}>{value ?? '—'}</Badge>
}

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination?: PaginationMeta
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation('common')
  const { pages, hasNext, hasPrevious } = usePagination(pagination?.page ?? 1, pagination?.totalPages ?? 1)

  if (!pagination || pagination.totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t('page')} {pagination.page} / {pagination.totalPages} · {pagination.totalItems} {t('items').toLowerCase()}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => onPageChange(pagination.page - 1)}>
          {t('previous')}
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === pagination.page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(pagination.page + 1)}>
          {t('next')}
        </Button>
      </div>
    </div>
  )
}

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  cellClassName?: string
  render: (item: T) => ReactNode
}

export function DataTable<T>({
  columns,
  items,
  empty,
  rowClassName,
  rowKey,
}: {
  columns: DataTableColumn<T>[]
  items: T[]
  empty?: ReactNode
  rowClassName?: (item: T) => string | undefined
  rowKey?: (item: T, index: number) => React.Key
}) {
  const { t } = useTranslation('common')

  if (!items.length) {
    return empty ? <>{empty}</> : <EmptyState title={t('noRecordsYet')} />
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {items.map((item, index) => (
          <Card key={rowKey?.(item, index) ?? index}>
            <CardContent className="space-y-3 p-4">
              {columns.map((column) => (
                <div key={column.key} className={cn('space-y-1', column.cellClassName)}>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {column.header}
                  </p>
                  <div className="text-sm text-slate-600">{column.render(item)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-md border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={rowKey?.(item, index) ?? index} className={rowClassName?.(item)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={cn(column.className, column.cellClassName)}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  destructive = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  destructive?: boolean
}) {
  const { t } = useTranslation('common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
