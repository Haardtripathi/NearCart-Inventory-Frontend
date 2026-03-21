import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  BookOpen,
  Boxes,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  Package2,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { LoadingState } from '@/components/common'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, OptionSelect, Sheet, SheetContent, SheetTrigger } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'

interface NavigationItem {
  to: string
  label: string
  translationKey?: string
  icon: LucideIcon
  requiresRole?: string
  requiresAnyRole?: string[]
}

interface NavigationSection {
  id: string
  label: string
  translationKey?: string
  items: NavigationItem[]
}

interface RouteMeta {
  match: RegExp
  titleDefault: string
  titleNs?: string
  titleKey?: string
  descriptionDefault: string
  descriptionNs?: string
  descriptionKey?: string
}

const navigationSections: NavigationSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    translationKey: 'overviewSection',
    items: [
      { to: '/dashboard', label: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard },
      { to: '/organizations', label: 'Organizations', translationKey: 'organizations', icon: Building2 },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    translationKey: 'catalogSection',
    items: [
      { to: '/master-catalog', label: 'Master Catalog', translationKey: 'masterCatalog', icon: BookOpen, requiresRole: 'SUPER_ADMIN' },
      { to: '/products', label: 'Products', translationKey: 'products', icon: Boxes },
      { to: '/categories', label: 'Categories', translationKey: 'categories', icon: Tags },
      { to: '/brands', label: 'Brands', translationKey: 'brands', icon: Tags },
      { to: '/units', label: 'Units', translationKey: 'units', icon: Ruler },
      { to: '/suppliers', label: 'Suppliers', translationKey: 'suppliers', icon: Truck },
      { to: '/customers', label: 'Customers', translationKey: 'customers', icon: Users },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    translationKey: 'operationsSection',
    items: [
      { to: '/inventory/balances', label: 'Inventory Balances', translationKey: 'inventoryBalances', icon: Warehouse },
      { to: '/inventory/ledger', label: 'Inventory Ledger', translationKey: 'inventoryLedger', icon: FileText },
      { to: '/purchases', label: 'Purchases', translationKey: 'purchases', icon: ShoppingBag },
      { to: '/sales-orders', label: 'Sales Orders', translationKey: 'salesOrders', icon: ShoppingCart },
      { to: '/stock-transfers', label: 'Stock Transfers', translationKey: 'stockTransfers', icon: ArrowRightLeft },
      { to: '/branches', label: 'Branches', translationKey: 'branches', icon: Store },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    translationKey: 'administrationSection',
    items: [
      { to: '/audit-logs', label: 'Audit Logs', translationKey: 'auditLogs', icon: ShieldCheck, requiresRole: 'SUPER_ADMIN' },
      { to: '/users', label: 'Users', icon: Users, requiresAnyRole: ['SUPER_ADMIN', 'ORG_ADMIN'] },
      { to: '/settings', label: 'Settings', translationKey: 'settings', icon: Settings },
    ],
  },
]

const organizationOptionalRoutes = ['/master-catalog', '/organizations', '/settings']

const routeMeta: RouteMeta[] = [
  {
    match: /^\/dashboard/,
    titleDefault: 'Dashboard',
    titleNs: 'dashboard',
    titleKey: 'title',
    descriptionDefault: 'A quick pulse on catalog health, stock pressure, and recent operational activity.',
    descriptionNs: 'dashboard',
    descriptionKey: 'description',
  },
  {
    match: /^\/organizations/,
    titleDefault: 'Organizations',
    titleNs: 'organizations',
    titleKey: 'title',
    descriptionDefault: 'Select an existing organization or create your first one to unlock inventory, branches, products, and orders.',
    descriptionNs: 'organizations',
    descriptionKey: 'description',
  },
  {
    match: /^\/master-catalog(\/.*)?$/,
    titleDefault: 'Master Catalog',
    titleNs: 'masterCatalog',
    titleKey: 'title',
    descriptionDefault: 'Browse reusable catalog templates, maintain platform categories, and import clean product records into an organization.',
    descriptionNs: 'masterCatalog',
    descriptionKey: 'description',
  },
  {
    match: /^\/products\/new/,
    titleDefault: 'Create Product',
    titleNs: 'products',
    titleKey: 'createTitle',
    descriptionDefault: 'Create a new product for the active organization.',
    descriptionNs: 'products',
    descriptionKey: 'formDescription',
  },
  {
    match: /^\/products\/[^/]+\/edit/,
    titleDefault: 'Edit Product',
    titleNs: 'products',
    titleKey: 'editTitle',
    descriptionDefault: 'Update product details, translations, and inventory settings.',
    descriptionNs: 'products',
    descriptionKey: 'formDescription',
  },
  {
    match: /^\/products\/[^/]+$/,
    titleDefault: 'Product Details',
    descriptionDefault: 'Review product details, inventory state, and recent activity.',
  },
  {
    match: /^\/products/,
    titleDefault: 'Products',
    titleNs: 'products',
    titleKey: 'title',
    descriptionDefault: 'Browse and manage product records for the active organization.',
    descriptionNs: 'products',
    descriptionKey: 'listDescription',
  },
  {
    match: /^\/categories/,
    titleDefault: 'Categories',
    descriptionDefault: 'Manage product categorization and translation-ready category trees.',
  },
  {
    match: /^\/brands/,
    titleDefault: 'Brands',
    descriptionDefault: 'Manage organization-level brand records used across products and imports.',
  },
  {
    match: /^\/suppliers/,
    titleDefault: 'Suppliers',
    descriptionDefault: 'Manage supplier records, contacts, and procurement-ready details.',
  },
  {
    match: /^\/customers/,
    titleDefault: 'Customers',
    descriptionDefault: 'Manage customer records for walk-in and account-based orders.',
  },
  {
    match: /^\/inventory\/balances/,
    titleDefault: 'Inventory Balances',
    descriptionDefault: 'Review stock availability, low stock risk, and branch-level balances.',
  },
  {
    match: /^\/inventory\/ledger/,
    titleDefault: 'Inventory Ledger',
    descriptionDefault: 'Track stock movement history across the active organization.',
  },
  {
    match: /^\/inventory\/adjustments\/new/,
    titleDefault: 'Stock Adjustment',
    descriptionDefault: 'Post manual stock increases or decreases with full audit context.',
  },
  {
    match: /^\/purchases\/new/,
    titleDefault: 'Create Purchase',
    descriptionDefault: 'Create a purchase receipt and prepare it for posting into stock.',
  },
  {
    match: /^\/purchases\/[^/]+$/,
    titleDefault: 'Purchase Details',
    descriptionDefault: 'Review purchase receipt details and posting state.',
  },
  {
    match: /^\/purchases/,
    titleDefault: 'Purchases',
    descriptionDefault: 'Manage procurement receipts and stock intake workflows.',
  },
  {
    match: /^\/sales-orders\/new/,
    titleDefault: 'Create Sales Order',
    descriptionDefault: 'Create a sales order for walk-in or account-based fulfillment.',
  },
  {
    match: /^\/sales-orders\/[^/]+$/,
    titleDefault: 'Sales Order Details',
    descriptionDefault: 'Review order status, payment state, and fulfillment progress.',
  },
  {
    match: /^\/sales-orders/,
    titleDefault: 'Sales Orders',
    descriptionDefault: 'Manage outgoing orders and their operational state.',
  },
  {
    match: /^\/stock-transfers\/new/,
    titleDefault: 'Create Stock Transfer',
    descriptionDefault: 'Move stock between branches with approval-ready transfer records.',
  },
  {
    match: /^\/stock-transfers\/[^/]+$/,
    titleDefault: 'Stock Transfer Details',
    descriptionDefault: 'Review branch-to-branch stock transfer status and line items.',
  },
  {
    match: /^\/stock-transfers/,
    titleDefault: 'Stock Transfers',
    descriptionDefault: 'Manage inter-branch stock movement requests and approvals.',
  },
  {
    match: /^\/branches/,
    titleDefault: 'Branches',
    descriptionDefault: 'Manage branch locations and their operational settings.',
  },
  {
    match: /^\/audit-logs/,
    titleDefault: 'Audit Logs',
    descriptionDefault: 'Review organization-level audit trails and workflow events.',
  },
  {
    match: /^\/settings/,
    titleDefault: 'Settings',
    titleNs: 'settings',
    titleKey: 'title',
    descriptionDefault: 'Profile details, language preferences, and backend connection visibility.',
    descriptionNs: 'settings',
    descriptionKey: 'description',
  },
  {
    match: /^\/users/,
    titleDefault: 'Users',
    descriptionDefault: 'Manage invited users, workspace roles, and branch-scoped access.',
  },
]

function routeRequiresOrganization(pathname: string) {
  return !organizationOptionalRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isRouteActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function getNavigationLabel(item: NavigationItem, translate: (key: string, options?: Record<string, unknown>) => string) {
  return item.translationKey
    ? translate(item.translationKey, { ns: 'navigation', defaultValue: item.label })
    : item.label
}

function resolveRouteMeta(pathname: string) {
  return routeMeta.find((meta) => meta.match.test(pathname)) ?? null
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation().pathname
  const { t } = useTranslation()
  const { role: currentUserRole } = useAuth()
  const activeSectionId = useMemo(
    () =>
      navigationSections.find((section) =>
        section.items.some((item) => isRouteActive(pathname, item.to)),
      )?.id ?? navigationSections[0]?.id,
    [pathname],
  )
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  return (
    <nav className="space-y-2">
      {navigationSections.map((section) => {
        const isOpen = openSections[section.id] ?? section.id === activeSectionId

        return (
          <div key={section.id} className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              onClick={() =>
                setOpenSections((current) => ({
                  ...current,
                  [section.id]: !isOpen,
                }))
              }
            >
              <span>{section.translationKey ? t(section.translationKey, { ns: 'navigation', defaultValue: section.label }) : section.label}</span>
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {isOpen ? (
              <div className="space-y-1">
                {section.items
                  .filter((item) => (!item.requiresRole || item.requiresRole === currentUserRole) && (!item.requiresAnyRole || item.requiresAnyRole.includes(currentUserRole ?? '')))
                  .map((item) => {
                  const active = isRouteActive(pathname, item.to)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={
                        active
                          ? 'flex items-center gap-2.5 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[0.88rem] font-semibold text-blue-700'
                          : 'flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.88rem] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900'
                      }
                    >
                      <Icon className={active ? 'h-4 w-4 text-blue-600' : 'h-4 w-4 text-slate-400'} />
                      <span className="truncate">{getNavigationLabel(item, t)}</span>
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Package2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">NearCart</p>
          <p className="text-xs text-slate-500">Inventory Console</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNav onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { t } = useTranslation('common')
  const { isAuthenticated, activeOrganizationId, memberships } = useAuth()
  const pathname = useLocation().pathname
  const setActiveOrganizationId = useAuthStore((state) => state.setActiveOrganizationId)
  const fallbackOrganizationId = useMemo(
    () => memberships.find((membership) => membership.isDefault)?.organizationId ?? memberships[0]?.organizationId ?? null,
    [memberships],
  )

  useEffect(() => {
    if (!activeOrganizationId && fallbackOrganizationId) {
      setActiveOrganizationId(fallbackOrganizationId)
    }
  }, [activeOrganizationId, fallbackOrganizationId, setActiveOrganizationId])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!activeOrganizationId && fallbackOrganizationId) {
    return <LoadingState label={t('loadingOrganizationContext')} />
  }

  if (!activeOrganizationId && routeRequiresOrganization(pathname)) {
    return <Navigate to="/organizations" replace />
  }

  return <Outlet />
}

export function AppShell() {
  const { t } = useTranslation()
  const pathname = useLocation().pathname
  const { user, memberships, activeOrganizationId } = useAuth()
  const setActiveOrganizationId = useAuthStore((state) => state.setActiveOrganizationId)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.organizationId === activeOrganizationId),
    [activeOrganizationId, memberships],
  )
  const activeRouteMeta = useMemo(() => resolveRouteMeta(pathname), [pathname])

  useEffect(() => {
    const title = activeRouteMeta
      ? activeRouteMeta.titleKey
        ? t(activeRouteMeta.titleKey, { ns: activeRouteMeta.titleNs, defaultValue: activeRouteMeta.titleDefault })
        : activeRouteMeta.titleDefault
      : 'NearCart Inventory'
    const description = activeRouteMeta
      ? activeRouteMeta.descriptionKey
        ? t(activeRouteMeta.descriptionKey, {
            ns: activeRouteMeta.descriptionNs,
            defaultValue: activeRouteMeta.descriptionDefault,
          })
        : activeRouteMeta.descriptionDefault
      : 'NearCart Inventory Console'

    document.title = `${title} | NearCart`

    let descriptionMeta = document.querySelector('meta[name="description"]')
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }

    descriptionMeta.setAttribute('content', description)
  }, [activeRouteMeta, t])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-[228px] shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block">
          <SidebarContent />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 sm:px-5 lg:h-14 lg:py-0">
            <div className="flex min-w-0 items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button className="lg:hidden" size="icon" variant="outline">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[260px] border-r border-slate-200 p-0">
                    <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
                  </SheetContent>
                </Sheet>

                {memberships.length ? (
                  <OptionSelect
                    value={activeOrganizationId ?? ''}
                    onValueChange={(value) => setActiveOrganizationId(value || null)}
                    options={memberships.map((membership) => ({
                      value: membership.organizationId,
                      label: membership.organization.name,
                    }))}
                    placeholder={t('selectOrganization', { ns: 'common' })}
                    className="min-w-[190px] sm:min-w-[220px]"
                  />
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/organizations">
                      <Building2 className="h-4 w-4" />
                      {t('setUpOrganization', { ns: 'common' })}
                    </Link>
                  </Button>
                )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
                <LanguageSwitcher />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[154px] justify-between">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-sm font-semibold text-slate-900">{user?.fullName ?? t('account', { ns: 'common' })}</span>
                          <span className="block truncate text-xs font-medium text-slate-500">
                            {user?.platformRole ?? activeMembership?.role ?? t('platformUser', { ns: 'common' })}
                          </span>
                        </span>
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/settings">{t('settings', { ns: 'navigation' })}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => clearSession()}>{t('logout', { ns: 'navigation' })}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </header>

          <main className="overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
