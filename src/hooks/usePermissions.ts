import { useAuth } from './useAuth'
import {
  canManageCatalog,
  canManageInventory,
  canManageMasterImports,
  canManageMasterPlatform,
  canManageUsers,
  canManageProducts,
  canManagePurchases,
  canManageSalesOrders,
  canManageTransfers,
  canViewAuditLogs,
} from '@/lib/permissions'

export function usePermissions() {
  const { role } = useAuth()

  return {
    canManageCatalog: canManageCatalog(role),
    canManageProducts: canManageProducts(role),
    canManageInventory: canManageInventory(role),
    canManagePurchases: canManagePurchases(role),
    canManageTransfers: canManageTransfers(role),
    canManageSalesOrders: canManageSalesOrders(role),
    canManageMasterImports: canManageMasterImports(role),
    canManageMasterPlatform: canManageMasterPlatform(role),
    canManageUsers: canManageUsers(role),
    canViewAuditLogs: canViewAuditLogs(role),
  }
}
