import * as React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'

const EMPTY_ITEM_VALUE = '__ASYNC_COMBOBOX_EMPTY__'
const ADD_ACTION_ITEM_VALUE = '__ASYNC_COMBOBOX_ADD_ACTION__'
const LOAD_MORE_ITEM_VALUE = '__ASYNC_COMBOBOX_LOAD_MORE__'

/**
 * Searchable, server-paged replacement for OptionSelect on org-scoped lists that can grow past a
 * single page (products, customers, suppliers, brands). OptionSelect was fed `{ page: 1, limit:
 * 100 }` everywhere, so the 101st product/customer/etc. simply never appeared and there was no way
 * to find it — this queries the list endpoint's `search` param as the user types (debounced) and
 * pages in more results on demand.
 *
 * The selected value's label is resolved from, in order: the loaded pages, the option the user
 * just picked, and finally `fetchById` — so a value prefilled from a link or an existing record
 * still shows its name even when it isn't on the first page of results.
 */
export function AsyncCombobox<T>({
  value,
  onChange,
  queryKey,
  fetchPage,
  fetchById,
  getOptionValue,
  getOptionLabel,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  addActionLabel,
  onAddAction,
  disabled,
  className,
  pageSize = 20,
}: {
  value?: string
  onChange: (value: string) => void
  /** Base key for this entity, e.g. ['products'] — org id, language and search are appended. */
  queryKey: readonly unknown[]
  fetchPage: (params: { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>
  fetchById?: (id: string) => Promise<T>
  getOptionValue: (item: T) => string
  getOptionLabel: (item: T) => string
  placeholder?: string
  searchPlaceholder?: string
  /** When set, renders a leading "none / all" option that clears the value. */
  emptyLabel?: string
  addActionLabel?: React.ReactNode
  onAddAction?: () => void
  disabled?: boolean
  className?: string
  pageSize?: number
}) {
  const { t } = useTranslation('common')
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search.trim())
  // Label of the option the user picked most recently, so the trigger doesn't flash back to the
  // placeholder when the search that surfaced it is cleared on close.
  const [picked, setPicked] = React.useState<{ value: string; label: string } | null>(null)

  const listQuery = useInfiniteQuery({
    queryKey: [...queryKey, 'combobox', activeOrganizationId, language, debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchPage({ page: pageParam, limit: pageSize, search: debouncedSearch || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    // Only hit the server once the list is actually opened — a form with several line items
    // would otherwise fire one list request per row on mount just to render closed triggers.
    enabled: open && Boolean(activeOrganizationId),
  })

  const items = React.useMemo(() => listQuery.data?.pages.flatMap((page) => page.items) ?? [], [listQuery.data])
  const loadedMatch = value ? items.find((item) => getOptionValue(item) === value) : undefined
  const pickedLabel = value && picked?.value === value ? picked.label : undefined

  const selectedQuery = useQuery({
    queryKey: [...queryKey, 'combobox-selected', activeOrganizationId, language, value],
    queryFn: () => fetchById!(value!),
    enabled: Boolean(value && fetchById && !loadedMatch && !pickedLabel),
    staleTime: 60_000,
    // A deleted record 404s — no point retrying, and it must not leave the trigger on "Loading".
    retry: false,
  })

  const selectedLabel = value
    ? loadedMatch
      ? getOptionLabel(loadedMatch)
      : pickedLabel ?? (selectedQuery.data ? getOptionLabel(selectedQuery.data) : undefined)
    : undefined
  const resolvedPlaceholder = placeholder ?? t('selectOption')
  const triggerLabel = value
    ? selectedLabel ?? (selectedQuery.isError ? emptyLabel ?? resolvedPlaceholder : t('loading'))
    : emptyLabel

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch('')
    }
  }

  const select = (nextValue: string, label?: string) => {
    if (label) {
      setPicked({ value: nextValue, label })
    }
    onChange(nextValue)
    handleOpenChange(false)
  }

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight < 48 &&
      listQuery.hasNextPage &&
      !listQuery.isFetchingNextPage
    ) {
      void listQuery.fetchNextPage()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full min-w-0 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-left text-[0.925rem] font-medium text-slate-700 shadow-sm outline-none transition',
            'focus:border-primary focus:ring-4 focus:ring-primary/10 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/10',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
        >
          <span className={cn('line-clamp-1', !triggerLabel && 'text-slate-400')}>{triggerLabel ?? resolvedPlaceholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[16rem]">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder ?? t('searchToFilter')}
          />
          <CommandList onScroll={onListScroll}>
            {listQuery.isFetching && !listQuery.isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : (
              <CommandEmpty>{t('noMatchesFound')}</CommandEmpty>
            )}
            <CommandGroup>
              {emptyLabel && !debouncedSearch ? (
                <CommandItem value={EMPTY_ITEM_VALUE} onSelect={() => select('')}>
                  <Check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
                  {emptyLabel}
                </CommandItem>
              ) : null}
              {items.map((item) => {
                const optionValue = getOptionValue(item)
                const label = getOptionLabel(item)
                return (
                  <CommandItem key={optionValue} value={optionValue} onSelect={() => select(optionValue, label)}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', value === optionValue ? 'opacity-100' : 'opacity-0')} />
                    <span className="line-clamp-1">{label}</span>
                  </CommandItem>
                )
              })}
              {listQuery.hasNextPage ? (
                <CommandItem
                  value={LOAD_MORE_ITEM_VALUE}
                  disabled={listQuery.isFetchingNextPage}
                  onSelect={() => void listQuery.fetchNextPage()}
                  className="justify-center font-medium text-primary"
                >
                  {listQuery.isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('loadMore')}
                </CommandItem>
              ) : null}
              {addActionLabel ? (
                <CommandItem
                  value={ADD_ACTION_ITEM_VALUE}
                  onSelect={() => {
                    handleOpenChange(false)
                    onAddAction?.()
                  }}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <Plus className="h-4 w-4" />
                    {addActionLabel}
                  </span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
