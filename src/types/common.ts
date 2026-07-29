import type { PaginationMeta } from './api'

export const APP_LANGUAGES = ['en', 'hi', 'gu'] as const
export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const LANGUAGE_CODES = ['EN', 'HI', 'GU'] as const
export type LanguageCode = (typeof LANGUAGE_CODES)[number]

// Languages the self-hosted LibreTranslate instance has models loaded for (matches backend
// MACHINE_TRANSLATABLE_LANGUAGE_CODES in localization.ts). GU is a supported display/manual-entry
// language but auto-translate can't generate it yet — surfaced in TranslationFields so it doesn't
// look broken when it's just untranslated.
export const MACHINE_TRANSLATABLE_LANGUAGE_CODES: readonly LanguageCode[] = ['EN', 'HI']

export const USER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'INVITED', 'SUSPENDED'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

export const USER_ACTION_TOKEN_PURPOSES = ['ACCOUNT_SETUP', 'PASSWORD_RESET'] as const
export type UserActionTokenPurpose = (typeof USER_ACTION_TOKEN_PURPOSES)[number]

export const BRANCH_ACCESS_SCOPES = ['ALL', 'SELECTED'] as const
export type BranchAccessScope = (typeof BRANCH_ACCESS_SCOPES)[number]

export const PRODUCT_TYPES = ['SIMPLE', 'VARIABLE', 'BUNDLE', 'SERVICE', 'RAW_MATERIAL', 'FINISHED_GOOD'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const TRACK_METHODS = ['PIECE', 'WEIGHT', 'VOLUME', 'LENGTH'] as const
export type TrackMethod = (typeof TRACK_METHODS)[number]

export const BRANCH_TYPES = ['STORE', 'WAREHOUSE', 'DARK_STORE'] as const
export type BranchType = (typeof BRANCH_TYPES)[number]

export const SALES_ORDER_STATUSES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
] as const
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PURCHASE_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

export const STOCK_TRANSFER_STATUSES = ['DRAFT', 'APPROVED', 'CANCELLED'] as const
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number]

export const ORDER_SOURCES = ['APP', 'WALK_IN', 'PHONE', 'WHATSAPP', 'OTHER'] as const
export type OrderSource = (typeof ORDER_SOURCES)[number]

// Platform-wide gig-driver pool (Swiggy/Zomato-style) — a Driver is not a User/OrganizationMembership.
// Drivers self-register via the separate NearCart-Driver app and are verified here by a SUPER_ADMIN.
// See PHASE1_REQUIREMENTS.md "Driver API contract" (locked 2026-07-24).
export const DRIVER_STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED'] as const
export type DriverStatus = (typeof DRIVER_STATUSES)[number]

export const STOCK_MOVEMENT_TYPES = [
  'OPENING',
  'PURCHASE',
  'SALE',
  'SALE_CANCEL',
  'RETURN_IN',
  'RETURN_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RESERVE',
  'RELEASE_RESERVE',
  'DAMAGE',
  'EXPIRED',
] as const
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export const REFERENCE_TYPES = [
  'PURCHASE_RECEIPT',
  'SALES_ORDER',
  'STOCK_ADJUSTMENT',
  'STOCK_TRANSFER',
  'MANUAL',
  'SYSTEM',
] as const
export type ReferenceType = (typeof REFERENCE_TYPES)[number]

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'STOCK_POST',
  'ORDER_CONFIRM',
  'ORDER_REJECT',
  'ORDER_DELIVER',
  'TRANSFER_APPROVE',
  'ORDER_READY',
  'ORDER_ASSIGN_DRIVER',
  'ORDER_PICKUP',
  'DRIVER_REGISTER',
  'DRIVER_VERIFY',
  'DRIVER_SUSPEND',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type Nullable<T> = T | null

export interface TranslationInput {
  language: LanguageCode
  name: string
  description?: Nullable<string>
  shortName?: Nullable<string>
}

export interface BranchAccessState {
  scope: BranchAccessScope
  branchIds: string[]
}

export interface VariantTranslationInput {
  language: LanguageCode
  name: string
}

export interface LocalizedRecord {
  name?: Nullable<string>
  description?: Nullable<string>
  displayName?: Nullable<string>
  displayDescription?: Nullable<string>
  resolvedLanguage?: Nullable<LanguageCode>
}

export interface Industry extends LocalizedRecord {
  id: string
  code: string
  isActive?: boolean
  defaultFeatures?: Record<string, unknown>
  defaultSettings?: unknown
  translations?: TranslationInput[]
}

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  email?: Nullable<string>
  status: string
  role?: UserRole
  isDefault?: boolean
  industries?: Array<{
    id: string
    industryId: string
    isPrimary: boolean
    industry: Industry
  }>
}

export interface Branch extends LocalizedRecord {
  id: string
  organizationId?: string
  code: string
  name: string
  type: BranchType
  phone?: Nullable<string>
  email?: Nullable<string>
  addressLine1?: Nullable<string>
  addressLine2?: Nullable<string>
  city?: Nullable<string>
  state?: Nullable<string>
  country?: Nullable<string>
  postalCode?: Nullable<string>
  latitude?: Nullable<number>
  longitude?: Nullable<number>
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BranchSummary {
  id: string
  code: string
  name: string
}

export interface Category extends LocalizedRecord {
  id: string
  organizationId?: string
  parentId?: Nullable<string>
  slug: string
  isActive: boolean
  sortOrder: number
  translations?: TranslationInput[]
  parent?: Nullable<Category>
  children?: Category[]
}

export interface Brand extends LocalizedRecord {
  id: string
  name: string
  slug: string
  isActive: boolean
  translations?: TranslationInput[]
}

export interface OrganizationUser {
  id: string
  fullName: string
  email: string
  preferredLanguage: LanguageCode
  isActive: boolean
  platformRole?: Nullable<UserRole>
  lastLoginAt?: Nullable<string>
  role: UserRole
  status: MembershipStatus
  isDefault: boolean
  branchAccess: BranchAccessState
  accessibleBranches: BranchSummary[]
  invitedAt?: Nullable<string>
  acceptedAt?: Nullable<string>
  passwordSetupRequired: boolean
}

// The backend intentionally never returns the raw token or a clickable URL for an access link —
// it's emailed directly to the user instead (see backend users.service.ts serializeAccessLink:
// returning the raw token in an API response used to let anyone who could see the response set
// that user's password). Only these three fields are ever present.
export interface UserAccessLink {
  purpose: UserActionTokenPurpose
  sentTo: string
  expiresAt: string
}

export interface DirectoryUser {
  id: string
  fullName: string
  email: string
  platformRole?: Nullable<UserRole>
  preferredLanguage: LanguageCode
  isActive: boolean
  passwordSetupRequired: boolean
  lastLoginAt?: Nullable<string>
  membershipCount: number
}

export interface Unit extends LocalizedRecord {
  id: string
  organizationId?: Nullable<string>
  code: string
  name: string
  symbol?: Nullable<string>
  isSystem?: boolean
  allowsDecimal?: boolean
  translations?: TranslationInput[]
}

export interface TaxRate extends LocalizedRecord {
  id: string
  name: string
  code?: Nullable<string>
  rate: string
  isInclusive: boolean
  isActive: boolean
  translations?: TranslationInput[]
}

export interface Supplier extends LocalizedRecord {
  id: string
  name: string
  code?: Nullable<string>
  phone?: Nullable<string>
  email?: Nullable<string>
  taxNumber?: Nullable<string>
  address?: unknown
  notes?: Nullable<string>
  isActive: boolean
  translations?: TranslationInput[]
}

export interface Customer extends LocalizedRecord {
  id: string
  name: string
  phone?: Nullable<string>
  email?: Nullable<string>
  address?: unknown
  notes?: Nullable<string>
  isActive: boolean
}

export interface Driver {
  id: string
  fullName: string
  phone: string
  email?: Nullable<string>
  vehicleType: string
  vehicleNumber: string
  status: DriverStatus
  createdAt?: string
  updatedAt?: string
}

/**
 * Minimal driver shape returned by `GET /api/drivers?status=VERIFIED` (the org-staff assignment
 * dropdown) — per PHASE1_REQUIREMENTS.md the contract deliberately limits this to
 * `id, fullName, phone, vehicleType` since any shop can see the whole shared driver pool.
 */
export interface DriverSummary {
  id: string
  fullName: string
  phone: string
  vehicleType: string
}

export interface ListState<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface SelectOption {
  label: string
  value: string
  description?: string
}

export interface LocalizationContext {
  requestedLanguage: Nullable<LanguageCode>
  resolvedLanguage: LanguageCode
  orgDefaultLanguage: Nullable<LanguageCode>
  userPreferredLanguage: Nullable<LanguageCode>
}
