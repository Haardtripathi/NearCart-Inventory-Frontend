import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'

import { useIndustriesQuery, useUnitsQuery } from '@/features/meta/meta.api'
import {
  useMasterCatalogCategoriesQuery,
  useMasterCatalogCategoryTreeQuery,
  useMasterCatalogItemsQuery,
} from '@/features/master-catalog/master-catalog.api'
import { useActiveOrganizationContext } from '@/hooks/useActiveOrganizationContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ImportMasterItemDialog } from '@/components/master-catalog/ImportMasterItemDialog'
import { MasterCatalogCategoryDialog } from '@/components/master-catalog/MasterCatalogCategoryDialog'
import { MasterCatalogItemDialog } from '@/components/master-catalog/MasterCatalogItemDialog'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { DataTable, EmptyState, FilterBar, InlineNotice, LoadingState, PageHeader, PaginationControls, SearchInput, SectionCard, StatusBadge } from '@/components/common'
import { Badge, Button, OptionSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { getDisplayDescription, getDisplayName } from '@/lib/utils'
import type { MasterCatalogCategory, MasterCatalogItem } from '@/types/masterCatalog'

function flattenCategories(items: MasterCatalogCategory[]): MasterCatalogCategory[] {
  return items.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

function filterCategoryTree(items: MasterCatalogCategory[], search: string): MasterCatalogCategory[] {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) {
    return items
  }

  return items
    .map((category) => {
      const filteredChildren = filterCategoryTree(category.children ?? [], normalizedSearch)
      const haystack = [
        category.displayName,
        category.name,
        category.code,
        category.slug,
        ...(category.translations ?? []).flatMap((translation) => [translation.name, translation.description ?? '']),
      ]
        .join(' ')
        .toLowerCase()

      if (haystack.includes(normalizedSearch) || filteredChildren.length) {
        return {
          ...category,
          children: filteredChildren,
        }
      }

      return null
    })
    .filter(Boolean) as MasterCatalogCategory[]
}

function CategoryTree({
  items,
  selectedCategoryId,
  onSelect,
}: {
  items: MasterCatalogCategory[]
  selectedCategoryId: string
  onSelect: (categoryId: string) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((category) => (
        <div key={category.id}>
          <button
            className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition ${
              selectedCategoryId === category.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            onClick={() => onSelect(category.id)}
            type="button"
          >
            {getDisplayName(category)}
          </button>
          {category.children?.length ? (
            <div className="mt-2 space-y-2 border-l border-dashed border-slate-200 pl-4">
              <CategoryTree items={category.children} onSelect={onSelect} selectedCategoryId={selectedCategoryId} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function getImportState(item: MasterCatalogItem) {
  if (item.alreadyImportedProductId) {
    return {
      label: 'alreadyImported',
      tone: 'success' as const,
    }
  }

  if (item.importable) {
    return {
      label: 'readyToImport',
      tone: 'success' as const,
    }
  }

  return {
    label: 'requiresMatchingIndustry',
    tone: 'warning' as const,
  }
}

export function MasterCatalogPage() {
  const { t } = useTranslation(['masterCatalog', 'common'])
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { defaultIndustryId } = useActiveOrganizationContext()
  const industriesQuery = useIndustriesQuery()
  const unitsQuery = useUnitsQuery()
  const [industryId, setIndustryId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [adminCategorySearch, setAdminCategorySearch] = useState('')
  const [hasVariants, setHasVariants] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [importingItem, setImportingItem] = useState<MasterCatalogItem | null>(null)
  const [editingItem, setEditingItem] = useState<MasterCatalogItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<MasterCatalogCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState(false)
  const debouncedSearch = useDebounce(search)
  const debouncedAdminCategorySearch = useDebounce(adminCategorySearch)
  const fallbackIndustryId = useMemo(
    () => defaultIndustryId && industriesQuery.data?.some((industry) => industry.id === defaultIndustryId)
      ? defaultIndustryId
      : industriesQuery.data?.[0]?.id ?? '',
    [defaultIndustryId, industriesQuery.data],
  )
  const selectedIndustryId = industriesQuery.data?.some((industry) => industry.id === industryId) ? industryId : ''
  const resolvedIndustryId = selectedIndustryId || fallbackIndustryId

  const categoryTreeQuery = useMasterCatalogCategoryTreeQuery(resolvedIndustryId)
  const categoriesQuery = useMasterCatalogCategoriesQuery({
    industryId: resolvedIndustryId,
    page: 1,
    limit: 100,
    search: debouncedAdminCategorySearch || undefined,
  })
  const allCategories = useMemo(() => flattenCategories(categoryTreeQuery.data ?? []), [categoryTreeQuery.data])
  const topLevelCategories = useMemo(() => categoryTreeQuery.data ?? [], [categoryTreeQuery.data])
  const resolvedCategoryId = useMemo(
    () => allCategories.some((category) => category.id === categoryId) ? categoryId : '',
    [allCategories, categoryId],
  )
  const itemsQuery = useMasterCatalogItemsQuery({
    industryId: resolvedIndustryId,
    page,
    limit: 12,
    categoryId: resolvedCategoryId || undefined,
    q: debouncedSearch || undefined,
    hasVariants: hasVariants ? hasVariants === 'true' : undefined,
    isActive: isActive ? isActive === 'true' : undefined,
  })
  const items = useMemo(() => itemsQuery.data?.items ?? [], [itemsQuery.data?.items])
  const activeCategory = useMemo(
    () => allCategories.find((category) => category.id === resolvedCategoryId) ?? null,
    [allCategories, resolvedCategoryId],
  )
  const visibleCategoryTree = useMemo(
    () => filterCategoryTree(categoryTreeQuery.data ?? [], categorySearch),
    [categorySearch, categoryTreeQuery.data],
  )
  const selectedIndustryName = useMemo(
    () => industriesQuery.data?.find((industry) => industry.id === resolvedIndustryId)?.displayName
      ?? industriesQuery.data?.find((industry) => industry.id === resolvedIndustryId)?.name
      ?? '—',
    [industriesQuery.data, resolvedIndustryId],
  )
  const selectedIndustry = useMemo(
    () => industriesQuery.data?.find((industry) => industry.id === resolvedIndustryId) ?? null,
    [industriesQuery.data, resolvedIndustryId],
  )
  const unitLabelByCode = useMemo(
    () =>
      new Map(
        (unitsQuery.data?.items ?? []).map((unit) => [
          unit.code.trim().toUpperCase(),
          getDisplayName(unit, unit.name),
        ]),
      ),
    [unitsQuery.data?.items],
  )
  const blockedImportCount = useMemo(
    () => items.filter((item) => !item.importable && !item.alreadyImportedProductId).length,
    [items],
  )

  if (industriesQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="list" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={(
          <>
            <Select
              value={resolvedIndustryId}
              onValueChange={(value) => {
                if (value === '__add_industry__') {
                  setEditingIndustry(false)
                  setIndustryDialogOpen(true)
                  return
                }

                setIndustryId(value)
                setCategoryId('')
                setPage(1)
              }}
            >
              <SelectTrigger className="min-w-[220px]">
                <SelectValue placeholder={t('selectIndustry')} />
              </SelectTrigger>
              <SelectContent>
                {industriesQuery.data?.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.displayName ?? industry.name ?? 'Unnamed industry'}
                  </SelectItem>
                ))}
                {permissions.canManageMasterPlatform ? <SelectItem value="__add_industry__">+ {t('addIndustry')}</SelectItem> : null}
              </SelectContent>
            </Select>

            {permissions.canManageMasterPlatform ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingIndustry(true)
                    setIndustryDialogOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t('editIndustry')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t('addCategory')}
                </Button>
                <Button
                  onClick={() => {
                    setEditingItem(null)
                    setItemDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t('addMasterItem')}
                </Button>
              </>
            ) : null}
          </>
        )}
      />

      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
        <SearchInput
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          placeholder={t('searchItemsPlaceholder')}
        />
        <OptionSelect
          value={hasVariants}
          onValueChange={(value) => {
            setPage(1)
            setHasVariants(value)
          }}
          emptyLabel={t('anyItemType')}
          options={[
            { value: 'true', label: t('hasVariants') },
            { value: 'false', label: t('singleVariant') },
          ]}
        />
        <OptionSelect
          value={isActive}
          onValueChange={(value) => {
            setPage(1)
            setIsActive(value)
          }}
          emptyLabel={t('anyStatus')}
          options={[
            { value: 'true', label: t('activeItems') },
            { value: 'false', label: t('inactiveItems') },
          ]}
        />
        <Button
          variant="outline"
          onClick={() => {
            setPage(1)
            setSearch('')
            setHasVariants('')
            setIsActive('true')
            setCategorySearch('')
            setCategoryId('')
          }}
        >
          {t('clearFilters', { ns: 'common' })}
        </Button>
      </FilterBar>

      <div className="rounded-md border border-slate-200 bg-white shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t('categories', { ns: 'common' })}</h2>
              <p className="text-sm text-slate-500">
                {activeCategory
                  ? t('showingCategory', { category: getDisplayName(activeCategory) })
                  : t('browseDescription')}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPage(1)
                setCategorySearch('')
                setCategoryId('')
              }}
            >
              {t('reset', { ns: 'common' })}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={
                resolvedCategoryId
                  ? 'rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700'
              }
              onClick={() => {
                setPage(1)
                setCategoryId('')
              }}
            >
              {t('allItems')}
            </button>
            {topLevelCategories.slice(0, 8).map((category) => (
              <button
                key={category.id}
                type="button"
                className={
                  resolvedCategoryId === category.id
                    ? 'rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700'
                    : 'rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
                onClick={() => {
                  setPage(1)
                  setCategoryId(category.id)
                }}
              >
                {getDisplayName(category)}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <SearchInput
              placeholder={t('filterCategories')}
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
            />
          </div>
        </div>

        <div className="p-4">
          {visibleCategoryTree.length ? (
            <CategoryTree
              items={visibleCategoryTree}
              selectedCategoryId={resolvedCategoryId}
              onSelect={(nextCategoryId) => {
                setPage(1)
                setCategoryId(nextCategoryId)
              }}
            />
          ) : (
            <EmptyState className="min-h-[160px]" title={t('noCategoriesTitle')} description={t('noCategoriesDescription')} />
          )}
        </div>
      </div>

      {blockedImportCount > 0 ? (
        <InlineNotice className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" tone="warning">
          <span>{t('importBlockedDescription')}</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/organizations">{t('manageOrganizationIndustries')}</Link>
          </Button>
        </InlineNotice>
      ) : null}

      <SectionCard
        title={t('browseTitle')}
        description={activeCategory ? t('showingCategory', { category: getDisplayName(activeCategory) }) : t('browseDescription')}
        action={<Badge tone="muted">{itemsQuery.data?.pagination?.totalItems ?? 0} {t('items', { ns: 'common' })}</Badge>}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="muted">{t('selectedIndustry')}: {selectedIndustryName}</Badge>
          <Badge tone="muted">{t('selectedCategory')}: {activeCategory ? getDisplayName(activeCategory) : t('allItems')}</Badge>
          <Badge tone={blockedImportCount > 0 ? 'warning' : 'success'}>
            {blockedImportCount > 0 ? t('requiresMatchingIndustry') : t('readyToImport')}
          </Badge>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: t('item', { ns: 'common' }),
              render: (item) => (
                <div>
                  <p className="font-semibold text-slate-900">{getDisplayName(item)}</p>
                  <p className="text-xs text-slate-500">{getDisplayDescription(item) || item.code}</p>
                </div>
              ),
            },
            {
              key: 'category',
              header: t('category', { ns: 'common' }),
              render: (item) => item.category ? getDisplayName(item.category) : t('uncategorized', { ns: 'common' }),
            },
            {
              key: 'unit',
              header: t('unit', { ns: 'common' }),
              render: (item) => {
                const unitCode = item.defaultUnitCode?.trim()
                if (!unitCode) {
                  return '—'
                }

                return unitLabelByCode.get(unitCode.toUpperCase()) ?? unitCode
              },
            },
            {
              key: 'variants',
              header: t('variants', { ns: 'products' }),
              render: (item) => item.variantTemplates.length,
            },
            {
              key: 'status',
              header: t('status', { ns: 'common' }),
              render: (item) => <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />,
            },
            {
              key: 'importStatus',
              header: t('import'),
              render: (item) => {
                const state = getImportState(item)
                return <Badge tone={state.tone}>{t(state.label)}</Badge>
              },
            },
            {
              key: 'actions',
              header: t('actions', { ns: 'common' }),
              render: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/master-catalog/items/${item.id}`}>{t('view', { ns: 'common' })}</Link>
                  </Button>
                  {permissions.canManageMasterPlatform ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingItem(item)
                        setItemDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {t('edit', { ns: 'common' })}
                    </Button>
                  ) : null}
                  {item.alreadyImportedProductId ? (
                    <Button asChild size="sm">
                      <Link to={`/products/${item.alreadyImportedProductId}`}>{t('openImportedProduct')}</Link>
                    </Button>
                  ) : permissions.canManageMasterImports ? (
                    <Button size="sm" disabled={!item.importable} onClick={() => setImportingItem(item)}>
                      {t('import')}
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          items={items}
          empty={
            <EmptyState
              title={t('noMasterItemsTitle')}
              description={t('noMasterItemsDescription')}
              action={
                permissions.canManageMasterPlatform ? (
                  <Button
                    onClick={() => {
                      setEditingItem(null)
                      setItemDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t('addMasterItem')}
                  </Button>
                ) : undefined
              }
            />
          }
          rowKey={(item) => item.id}
        />

        <div className="mt-5">
          <PaginationControls pagination={itemsQuery.data?.pagination} onPageChange={setPage} />
        </div>
      </SectionCard>

      {permissions.canManageMasterPlatform ? (
        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">{t('manageCategories')}</TabsTrigger>
            <TabsTrigger value="items">{t('manageItems')}</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <SectionCard
              title={t('manageCategories')}
              description={t('manageCategoriesDescription')}
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t('create', { ns: 'common' })}
                </Button>
              }
            >
              <div className="mb-4">
                <SearchInput
                  placeholder={t('filterCategories')}
                  value={adminCategorySearch}
                  onChange={(event) => setAdminCategorySearch(event.target.value)}
                />
              </div>
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: t('category', { ns: 'common' }),
                    render: (category) => (
                      <div>
                        <p className="font-medium text-slate-900">{getDisplayName(category, category.code)}</p>
                        <p className="text-xs text-slate-500">{category.code} · {category.slug}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'parent',
                    header: t('parentCategory'),
                    render: (category) => category.parent ? getDisplayName(category.parent, category.parent.code) : '—',
                  },
                  {
                    key: 'status',
                    header: t('status', { ns: 'common' }),
                    render: (category) => <StatusBadge value={category.isActive ? 'ACTIVE' : 'INACTIVE'} />,
                  },
                  {
                    key: 'actions',
                    header: t('actions', { ns: 'common' }),
                    render: (category) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryDialogOpen(true)
                        }}
                      >
                        {t('edit', { ns: 'common' })}
                      </Button>
                    ),
                  },
                ]}
                items={categoriesQuery.data?.items ?? []}
                empty={<EmptyState title={t('noCategoriesTitle')} description={t('noCategoriesDescription')} />}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="items">
            <SectionCard
              title={t('manageItems')}
              description={t('manageItemsDescription')}
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingItem(null)
                    setItemDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t('create', { ns: 'common' })}
                </Button>
              }
            >
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: t('item', { ns: 'common' }),
                    render: (item) => (
                      <div>
                        <p className="font-medium text-slate-900">{getDisplayName(item, item.canonicalName)}</p>
                        <p className="text-xs text-slate-500">{item.code} · {item.slug}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'category',
                    header: t('category', { ns: 'common' }),
                    render: (item) => item.category ? getDisplayName(item.category, item.category.code) : '—',
                  },
                  {
                    key: 'variants',
                    header: t('variants', { ns: 'products' }),
                    render: (item) => item.variantTemplates.length,
                  },
                  {
                    key: 'status',
                    header: t('status', { ns: 'common' }),
                    render: (item) => <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />,
                  },
                  {
                    key: 'actions',
                    header: t('actions', { ns: 'common' }),
                    render: (item) => (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/master-catalog/items/${item.id}`}>{t('view', { ns: 'common' })}</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem(item)
                            setItemDialogOpen(true)
                          }}
                        >
                          {t('edit', { ns: 'common' })}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                items={items}
                empty={<EmptyState title={t('noItemsForFiltersTitle')} description={t('noItemsForFiltersDescription')} />}
              />
            </SectionCard>
          </TabsContent>
        </Tabs>
      ) : null}

      <ImportMasterItemDialog item={importingItem} onOpenChange={(open) => !open && setImportingItem(null)} open={Boolean(importingItem)} />
      <MasterCatalogCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onAddIndustry={() => setIndustryDialogOpen(true)}
        industries={industriesQuery.data ?? []}
        categories={allCategories}
        initialIndustryId={resolvedIndustryId}
        category={editingCategory}
      />
      <MasterCatalogItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        onAddIndustry={() => setIndustryDialogOpen(true)}
        onAddCategory={() => {
          setEditingCategory(null)
          setCategoryDialogOpen(true)
        }}
        onAddUnit={() => navigate('/units')}
        industries={industriesQuery.data ?? []}
        categories={allCategories}
        initialIndustryId={resolvedIndustryId}
        item={editingItem}
      />
      <IndustryDialog
        open={industryDialogOpen}
        onOpenChange={(open) => {
          setIndustryDialogOpen(open)
          if (!open) {
            setEditingIndustry(false)
          }
        }}
        industry={editingIndustry ? selectedIndustry : null}
      />
    </div>
  )
}
