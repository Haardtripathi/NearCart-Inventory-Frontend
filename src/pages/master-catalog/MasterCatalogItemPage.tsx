import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useIndustriesQuery } from '@/features/meta/meta.api'
import { useMasterCatalogCategoryTreeQuery, useMasterCatalogItemQuery } from '@/features/master-catalog/master-catalog.api'
import { usePermissions } from '@/hooks/usePermissions'
import { ImportMasterItemDialog } from '@/components/master-catalog/ImportMasterItemDialog'
import { MasterCatalogItemDialog } from '@/components/master-catalog/MasterCatalogItemDialog'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import type { MasterCatalogCategory } from '@/types/masterCatalog'

function flattenCategories(items: MasterCatalogCategory[]): MasterCatalogCategory[] {
  return items.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

export function MasterCatalogItemPage() {
  const { id } = useParams()
  const permissions = usePermissions()
  const [importOpen, setImportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)
  const itemQuery = useMasterCatalogItemQuery(id)
  const industriesQuery = useIndustriesQuery()
  const categoryTreeQuery = useMasterCatalogCategoryTreeQuery(itemQuery.data?.industryId)

  if (itemQuery.isLoading) {
    return <LoadingState label="Loading master item..." />
  }

  if (!itemQuery.data) {
    return <EmptyState title="Master item not found" />
  }

  const item = itemQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDisplayName(item)}
        description={item.displayDescription ?? item.canonicalDescription ?? 'No description available.'}
        actions={
          <div className="flex flex-wrap gap-2">
            {permissions.canManageMasterPlatform ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit master item
              </Button>
            ) : null}
            {permissions.canManageMasterImports ? (
              <Button disabled={!item.importable && !item.alreadyImportedProductId} onClick={() => setImportOpen(true)}>
                {item.alreadyImportedProductId ? 'Import again' : 'Import item'}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Master item summary" description="Canonical and localized metadata from the platform catalog.">
          <DetailGrid className="xl:grid-cols-3">
            <DetailItem label="Industry" value={item.industryId} />
            <DetailItem label="Category" value={item.category ? getDisplayName(item.category) : '—'} />
            <DetailItem label="Default unit" value={item.defaultUnitCode ?? '—'} />
            <DetailItem label="Track method" value={item.defaultTrackMethod} />
            <DetailItem label="Product type" value={item.productType} />
            <DetailItem label="Import status" value={<StatusBadge value={item.alreadyImportedProductId ? 'ALREADY_IMPORTED' : 'NOT_IMPORTED'} />} />
          </DetailGrid>
          {item.alreadyImportedProductId ? (
            <InlineNotice className="mt-4" tone="success">
              Already imported into this organization. <Link className="font-semibold underline" to={`/products/${item.alreadyImportedProductId}`}>Open product</Link>
            </InlineNotice>
          ) : null}
        </SectionCard>

        <SectionCard title="Translations and aliases" description="Localized names and search aliases.">
          <div className="space-y-3">
            {(item.translations ?? []).map((translation) => (
              <div key={translation.language} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{translation.language}</p>
                <p className="mt-2 font-medium text-slate-900">{translation.name}</p>
                {translation.description ? <p className="mt-1 text-sm text-slate-600">{translation.description}</p> : null}
              </div>
            ))}
            {item.aliases?.length ? (
              <InlineNotice>
                Aliases: {item.aliases.map((alias) => `${alias.language}: ${alias.value}`).join(', ')}
              </InlineNotice>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Variant templates" description="Default variant scaffolding copied into imported products.">
        <DataTable
          columns={[
            { key: 'name', header: 'Template', render: (variant) => getDisplayName(variant) },
            { key: 'code', header: 'Code', render: (variant) => variant.code },
            { key: 'prices', header: 'Defaults', render: (variant) => <span>{variant.defaultSellingPrice ?? '—'} / {variant.defaultCostPrice ?? '—'}</span> },
            { key: 'levels', header: 'Levels', render: (variant) => <span>{variant.reorderLevel} / {variant.minStockLevel}</span> },
            { key: 'status', header: 'Status', render: (variant) => <StatusBadge value={variant.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          ]}
          items={item.variantTemplates}
          empty={<EmptyState title="No variant templates" description="This master item imports as a single-variant product by default." />}
          rowKey={(variant) => variant.id}
        />
      </SectionCard>

      <ImportMasterItemDialog item={item} onOpenChange={setImportOpen} open={importOpen} />
      <MasterCatalogItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onAddIndustry={permissions.canManageMasterPlatform ? () => setIndustryDialogOpen(true) : undefined}
        industries={industriesQuery.data ?? []}
        categories={flattenCategories(categoryTreeQuery.data ?? [])}
        initialIndustryId={item.industryId}
        item={item}
      />
      <IndustryDialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen} />
    </div>
  )
}
