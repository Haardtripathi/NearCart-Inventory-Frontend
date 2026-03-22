/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Slot } from '@radix-ui/react-slot'
import { Loader2, Plus, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// Re-export new shadcn components
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator } from './select'
export { Label } from './label'
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover'
export { Calendar } from './calendar'
export { DatePicker } from './date-picker'
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from './command'
export { Checkbox } from './checkbox'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700',
        secondary: 'border border-slate-200 bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200/80',
        outline: 'border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        destructive: 'bg-rose-600 text-white shadow-sm shadow-rose-200 hover:bg-rose-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3.5 text-[0.82rem]',
        lg: 'h-11 px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant, size, asChild = false, loading = false, loadingText, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText ?? children}
          </>
        ) : children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition [color-scheme:light]',
        'placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition [color-scheme:light]',
        'placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white [color-scheme:light]',
        'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")] bg-[length:1.2em_1.2em] bg-[right_0.9rem_center] bg-no-repeat px-3.5 py-2 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition',
        'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
NativeSelect.displayName = 'NativeSelect'

const EMPTY_SELECT_VALUE = '__OPTION_SELECT_EMPTY__'
const ADD_ACTION_SELECT_VALUE = '__OPTION_SELECT_ADD_ACTION__'

export interface OptionSelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export function OptionSelect({
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel,
  addActionLabel,
  onAddAction,
  className,
  contentClassName,
  disabled,
}: {
  value?: string
  onValueChange: (value: string) => void
  options: OptionSelectOption[]
  placeholder?: string
  emptyLabel?: string
  addActionLabel?: React.ReactNode
  onAddAction?: () => void
  className?: string
  contentClassName?: string
  disabled?: boolean
}) {
  const { t } = useTranslation('common')
  const hasValue = Boolean(value && options.some((option) => option.value === value))
  const resolvedValue = hasValue ? value : emptyLabel ? EMPTY_SELECT_VALUE : ''
  const resolvedPlaceholder = placeholder ?? t('selectOption')

  return (
    <Select
      value={resolvedValue}
      onValueChange={(nextValue) => {
        if (nextValue === ADD_ACTION_SELECT_VALUE) {
          onAddAction?.()
          return
        }

        onValueChange(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {emptyLabel ? <SelectItem value={EMPTY_SELECT_VALUE}>{emptyLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
        {addActionLabel ? (
          <SelectItem value={ADD_ACTION_SELECT_VALUE}>
            <span className="inline-flex items-center gap-2 font-medium text-primary">
              <Plus className="h-4 w-4" />
              {addActionLabel}
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md border border-slate-200 bg-white text-slate-900 shadow-[0_3px_12px_rgba(15,23,42,0.04)]', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-4 sm:p-5', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold tracking-tight text-slate-900', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-6 text-slate-500', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
}

export function Badge({
  className,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    muted: 'bg-slate-100 text-slate-500',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] ring-1 ring-inset ring-black/5',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} {...props} />
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-slate-200/80', className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-slate-200/80 transition-colors hover:bg-slate-50/80', className)} {...props} />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('h-12 px-4 text-left align-middle text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-4 align-middle text-slate-600', className)} {...props} />
}

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.14)] sm:w-[calc(100vw-2rem)] sm:p-6',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1 text-left', className)} {...props} />
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

export function SheetContent({
  className,
  side = 'right',
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed bottom-0 top-0 z-50 flex w-[92vw] max-w-md flex-col overflow-y-auto border-slate-200 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.16)] transition-all duration-300 ease-in-out sm:p-6',
          side === 'right'
            ? 'right-0 border-l data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full'
            : 'left-0 border-r data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1 text-slate-500 sm:w-fit', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none',
      'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 outline-none', className)} {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[11rem] rounded-md border border-slate-200 bg-white p-1.5 shadow-[0_12px_24px_rgba(15,23,42,0.1)]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:bg-slate-100 focus:text-slate-900',
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogCancel = AlertDialogPrimitive.Cancel
export const AlertDialogAction = AlertDialogPrimitive.Action

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.14)] sm:w-[calc(100vw-2rem)] sm:p-6',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  )
}

export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2', className)} {...props} />
)

export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} {...props} />
)

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

export function Separator({ className, ...props }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root className={cn('h-px w-full bg-border', className)} {...props} />
}

// ScrollArea
export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      orientation="vertical"
      className="flex touch-none select-none transition-colors data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-slate-300/80" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

// Tooltip
export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-slate-950 px-3 py-1.5 text-xs text-white shadow-xl',
        'data-[state=delayed-open]:data-[side=top]:animate-in data-[state=delayed-open]:data-[side=top]:fade-in-0 data-[state=delayed-open]:data-[side=top]:zoom-in-95 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName
