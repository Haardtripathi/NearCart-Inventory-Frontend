import type {
  Branch,
  Customer,
  Nullable,
  OrderSource,
  PaymentStatus,
  PurchaseStatus,
  ReferenceType,
  SalesOrderStatus,
  StockMovementType,
  StockTransferStatus,
  Supplier,
} from './common'
import type { Product, ProductVariant } from './product'

export interface InventoryBalance {
  id: string
  branchId: string
  productId: string
  variantId: string
  onHand: string
  reserved: string
  incoming: string
  available: string
  updatedAt: string
  branch: Branch
  product: Product
  variant: ProductVariant
}

export interface InventoryLedgerEntry {
  id: string
  branchId: string
  productId: string
  variantId: string
  movementType: StockMovementType
  referenceType: ReferenceType
  referenceId?: Nullable<string>
  quantityDelta: string
  unitCost?: Nullable<string>
  beforeOnHand: string
  afterOnHand: string
  beforeReserved: string
  afterReserved: string
  note?: Nullable<string>
  createdAt: string
  branch: Branch
  product: Product
  variant: ProductVariant
  createdBy?: Nullable<{
    id: string
    fullName: string
    email: string
  }>
}

export interface StockAdjustmentPayload {
  branchId: string
  variantId: string
  quantity: string | number
  direction: 'IN' | 'OUT'
  note: string
  unitCost?: string | number
  batchNumber?: string
  expiryDate?: string
  manufactureDate?: string
}

export interface PurchaseItem {
  id?: string
  productId: string
  variantId: string
  quantity: string | number
  unitCost: string | number
  taxRate?: string | number
  discountAmount?: string | number
  batchNumber?: string | null
  expiryDate?: string | null
  metadata?: unknown
  product?: Product
  variant?: ProductVariant
  taxAmount?: string
  lineTotal?: string
}

export interface PurchaseReceipt {
  id: string
  branchId: string
  supplierId?: Nullable<string>
  receiptNumber: string
  status: PurchaseStatus
  invoiceDate?: Nullable<string>
  receivedAt?: Nullable<string>
  subtotal: string
  taxTotal: string
  discountTotal: string
  total: string
  notes?: Nullable<string>
  supplier?: Nullable<Supplier>
  branch: Branch
  items: PurchaseItem[]
  createdAt: string
  updatedAt: string
}

export interface PurchasePayload {
  branchId: string
  supplierId?: string | null
  receiptNumber?: string
  invoiceDate?: string | null
  receivedAt?: string | null
  notes?: string | null
  items: PurchaseItem[]
}

export interface SalesOrderItem {
  id?: string
  productId: string
  variantId: string
  quantity: string | number
  unitPrice?: string | number
  taxRate?: string | number
  discountAmount?: string | number
  metadata?: unknown
  product?: Product
  variant?: ProductVariant
  productNameSnapshot?: string
  variantNameSnapshot?: string
  skuSnapshot?: string
  taxAmount?: string
  lineTotal?: string
}

export interface SalesOrder {
  id: string
  branchId: string
  customerId?: Nullable<string>
  orderNumber: string
  source: OrderSource
  status: SalesOrderStatus
  paymentStatus: PaymentStatus
  subtotal: string
  taxTotal: string
  discountTotal: string
  total: string
  notes?: Nullable<string>
  rejectionReason?: Nullable<string>
  branch: Branch
  customer?: Nullable<Customer>
  items: SalesOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface SalesOrderPayload {
  branchId: string
  customerId?: string | null
  orderNumber?: string
  source?: OrderSource
  status?: Extract<SalesOrderStatus, 'DRAFT' | 'PENDING' | 'READY' | 'OUT_FOR_DELIVERY'>
  paymentStatus?: PaymentStatus
  notes?: string | null
  items: SalesOrderItem[]
}

export interface StockTransferItem {
  id?: string
  productId: string
  variantId: string
  quantity: string | number
  unitCost?: string | number
  product?: Product
  variant?: ProductVariant
}

export interface StockTransfer {
  id: string
  fromBranchId: string
  toBranchId: string
  transferNumber: string
  status: StockTransferStatus
  notes?: Nullable<string>
  fromBranch: Branch
  toBranch: Branch
  items: StockTransferItem[]
  createdAt: string
  updatedAt: string
}

export interface StockTransferPayload {
  fromBranchId: string
  toBranchId: string
  transferNumber?: string
  notes?: string | null
  items: StockTransferItem[]
}

export interface DashboardSummaryCard {
  label: string
  value: number
  tone?: 'default' | 'warning' | 'success'
  deltaLabel?: string
}

export interface DashboardState {
  totalProducts: number
  activeProducts: number
  lowStockItems: InventoryBalance[]
  pendingSalesOrders: number
  totalBranches: number
  recentMovements: InventoryLedgerEntry[]
  recentOrders: SalesOrder[]
  importedMasterProducts: Product[]
}
