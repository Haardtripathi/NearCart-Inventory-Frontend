import type { UserRole } from '@/types/common'

export function canManageCatalog(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'MANAGER'
}

export function canManageProducts(role?: UserRole | null) {
  return canManageCatalog(role)
}

export function canManageMasterImports(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'MANAGER'
}

export function canManageMasterPlatform(role?: UserRole | null) {
  return role === 'SUPER_ADMIN'
}

export function canManageUsers(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN'
}

export function canManageInventory(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'MANAGER'
}

export function canManagePurchases(role?: UserRole | null) {
  return canManageInventory(role)
}

export function canManageTransfers(role?: UserRole | null) {
  return canManageInventory(role)
}

export function canManageSalesOrders(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'MANAGER' || role === 'STAFF'
}

export function canViewAuditLogs(role?: UserRole | null) {
  return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN'
}

export function canViewPlatformOverview(role?: UserRole | null) {
  return role === 'SUPER_ADMIN'
}

// Platform-wide driver pool verification (Drivers page) — SUPER_ADMIN only, same rule as
// canViewPlatformOverview but kept as its own named check for clarity at call sites.
export function canManageDrivers(role?: UserRole | null) {
  return role === 'SUPER_ADMIN'
}
