import { createBrowserRouter } from 'react-router-dom'

import { AppShell, ProtectedRoute } from '@/components/layout/AppShell'
import { AccessDeniedPage } from '@/pages/errors/AccessDeniedPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { RouteErrorPage } from '@/pages/errors/RouteErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => ({
      Component: (await import('@/pages/public/HomePage')).HomePage,
    }),
  },
  {
    path: '/login',
    lazy: async () => ({
      Component: (await import('@/pages/auth/LoginPage')).LoginPage,
    }),
  },
  {
    path: '/register',
    lazy: async () => ({
      Component: (await import('@/pages/auth/RegisterOrganizationOwnerPage')).RegisterOrganizationOwnerPage,
    }),
  },
  {
    path: '/account-setup',
    lazy: async () => ({
      Component: (await import('@/pages/auth/AccountSetupPage')).AccountSetupPage,
    }),
  },
  {
    path: '/reset-password',
    lazy: async () => ({
      Component: (await import('@/pages/auth/ResetPasswordPage')).ResetPasswordPage,
    }),
  },
  {
    path: '/privacy',
    lazy: async () => ({
      Component: (await import('@/pages/public/LegalPages')).PrivacyPage,
    }),
  },
  {
    path: '/terms',
    lazy: async () => ({
      Component: (await import('@/pages/public/LegalPages')).TermsPage,
    }),
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: 'organizations',
            lazy: async () => ({
              Component: (await import('@/pages/organizations/OrganizationsPage')).OrganizationsPage,
            }),
          },
          {
            path: 'dashboard',
            lazy: async () => ({
              Component: (await import('@/pages/dashboard/DashboardPage')).DashboardPage,
            }),
          },
          {
            path: 'products',
            lazy: async () => ({
              Component: (await import('@/pages/products/ProductsPage')).ProductsPage,
            }),
          },
          {
            path: 'products/new',
            lazy: async () => ({
              Component: (await import('@/pages/products/ProductFormPage')).ProductFormPage,
            }),
          },
          {
            path: 'products/:id',
            lazy: async () => ({
              Component: (await import('@/pages/products/ProductDetailPage')).ProductDetailPage,
            }),
          },
          {
            path: 'products/:id/edit',
            lazy: async () => ({
              Component: (await import('@/pages/products/ProductFormPage')).ProductFormPage,
            }),
          },
          {
            path: 'products/:id/variants/:variantId/edit',
            lazy: async () => ({
              Component: (await import('@/pages/products/ProductFormPage')).ProductFormPage,
            }),
          },
          {
            path: 'categories',
            lazy: async () => ({
              Component: (await import('@/pages/categories/CategoriesPage')).CategoriesPage,
            }),
          },
          {
            path: 'brands',
            lazy: async () => ({
              Component: (await import('@/pages/brands/BrandsPage')).BrandsPage,
            }),
          },
          {
            path: 'units',
            lazy: async () => ({
              Component: (await import('@/pages/units/UnitsPage')).UnitsPage,
            }),
          },
          {
            path: 'suppliers',
            lazy: async () => ({
              Component: (await import('@/pages/suppliers/SuppliersPage')).SuppliersPage,
            }),
          },
          {
            path: 'customers',
            lazy: async () => ({
              Component: (await import('@/pages/customers/CustomersPage')).CustomersPage,
            }),
          },
          {
            path: 'inventory/balances',
            lazy: async () => ({
              Component: (await import('@/pages/inventory/InventoryBalancesPage')).InventoryBalancesPage,
            }),
          },
          {
            path: 'inventory/ledger',
            lazy: async () => ({
              Component: (await import('@/pages/inventory/InventoryLedgerPage')).InventoryLedgerPage,
            }),
          },
          {
            path: 'inventory/adjustments/new',
            lazy: async () => ({
              Component: (await import('@/pages/inventory/StockAdjustmentPage')).StockAdjustmentPage,
            }),
          },
          {
            path: 'purchases',
            lazy: async () => ({
              Component: (await import('@/pages/purchases/PurchasesPage')).PurchasesPage,
            }),
          },
          {
            path: 'purchases/new',
            lazy: async () => ({
              Component: (await import('@/pages/purchases/PurchaseCreatePage')).PurchaseCreatePage,
            }),
          },
          {
            path: 'purchases/:id',
            lazy: async () => ({
              Component: (await import('@/pages/purchases/PurchaseDetailPage')).PurchaseDetailPage,
            }),
          },
          {
            path: 'sales-orders',
            lazy: async () => ({
              Component: (await import('@/pages/sales-orders/SalesOrdersPage')).SalesOrdersPage,
            }),
          },
          {
            path: 'sales-orders/new',
            lazy: async () => ({
              Component: (await import('@/pages/sales-orders/SalesOrderCreatePage')).SalesOrderCreatePage,
            }),
          },
          {
            path: 'sales-orders/:id',
            lazy: async () => ({
              Component: (await import('@/pages/sales-orders/SalesOrderDetailPage')).SalesOrderDetailPage,
            }),
          },
          {
            path: 'stock-transfers',
            lazy: async () => ({
              Component: (await import('@/pages/stock-transfers/StockTransfersPage')).StockTransfersPage,
            }),
          },
          {
            path: 'stock-transfers/new',
            lazy: async () => ({
              Component: (await import('@/pages/stock-transfers/StockTransferCreatePage')).StockTransferCreatePage,
            }),
          },
          {
            path: 'stock-transfers/:id',
            lazy: async () => ({
              Component: (await import('@/pages/stock-transfers/StockTransferDetailPage')).StockTransferDetailPage,
            }),
          },
          {
            path: 'master-catalog',
            lazy: async () => ({
              Component: (await import('@/pages/master-catalog/MasterCatalogPage')).MasterCatalogPage,
            }),
          },
          {
            path: 'master-catalog/items/:id',
            lazy: async () => ({
              Component: (await import('@/pages/master-catalog/MasterCatalogItemPage')).MasterCatalogItemPage,
            }),
          },
          {
            path: 'branches',
            lazy: async () => ({
              Component: (await import('@/pages/branches/BranchesPage')).BranchesPage,
            }),
          },
          {
            path: 'audit-logs',
            lazy: async () => ({
              Component: (await import('@/pages/audit/AuditLogsPage')).AuditLogsPage,
            }),
          },
          {
            path: 'settings',
            lazy: async () => ({
              Component: (await import('@/pages/settings/SettingsPage')).SettingsPage,
            }),
          },
          {
            path: 'users',
            lazy: async () => ({
              Component: (await import('@/pages/users/UsersPage')).UsersPage,
            }),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
