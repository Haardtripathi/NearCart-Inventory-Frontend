import type {
  Brand,
  Category,
  Industry,
  LocalizedRecord,
  Nullable,
  ProductStatus,
  ProductType,
  TaxRate,
  TrackMethod,
  TranslationInput,
  Unit,
  VariantTranslationInput,
} from './common'

export interface ProductVariant extends LocalizedRecord {
  id: string
  organizationId?: string
  productId: string
  sku: string
  barcode?: Nullable<string>
  attributes?: Record<string, string> | null
  costPrice: string
  sellingPrice: string
  mrp?: Nullable<string>
  reorderLevel: string
  minStockLevel: string
  maxStockLevel?: Nullable<string>
  weight?: Nullable<string>
  unitId?: Nullable<string>
  unit?: Nullable<Unit>
  isDefault: boolean
  isActive: boolean
  imageUrl?: Nullable<string>
  translations?: VariantTranslationInput[]
  createdAt?: string
  updatedAt?: string
}

export interface Product extends LocalizedRecord {
  id: string
  organizationId?: string
  categoryId?: Nullable<string>
  brandId?: Nullable<string>
  taxRateId?: Nullable<string>
  industryId?: Nullable<string>
  masterCatalogItemId?: Nullable<string>
  slug: string
  productType: ProductType
  sourceType: 'MANUAL' | 'MASTER_TEMPLATE'
  status: ProductStatus
  hasVariants: boolean
  trackInventory: boolean
  allowBackorder: boolean
  allowNegativeStock: boolean
  trackMethod: TrackMethod
  primaryUnitId?: Nullable<string>
  primaryUnit?: Nullable<Unit>
  imageUrl?: Nullable<string>
  tags?: string[] | Record<string, unknown> | null
  customFields?: unknown
  metadata?: unknown
  translations?: TranslationInput[]
  category?: Nullable<Category>
  brand?: Nullable<Brand>
  taxRate?: Nullable<TaxRate>
  industry?: Nullable<Industry>
  masterCatalogItem?: Nullable<{
    id: string
    code: string
    slug: string
    canonicalName: string
  }>
  variants: ProductVariant[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProductStatus
  categoryId?: string
  brandId?: string
  hasVariants?: boolean
}

export interface ProductVariantPayload {
  id?: string
  name?: string
  sku: string
  barcode?: string | null
  attributes?: Record<string, string>
  costPrice: string | number
  sellingPrice: string | number
  mrp?: string | number | null
  reorderLevel?: string | number
  minStockLevel?: string | number
  maxStockLevel?: string | number | null
  weight?: string | number | null
  unitId?: string | null
  isDefault?: boolean
  isActive?: boolean
  imageUrl?: string | null
  customFields?: unknown
  metadata?: unknown
  translations?: VariantTranslationInput[]
}

export interface ProductPayload {
  categoryId?: string | null
  brandId?: string | null
  taxRateId?: string | null
  industryId?: string | null
  name: string
  slug?: string
  description?: string | null
  productType: ProductType
  status?: ProductStatus
  hasVariants?: boolean
  trackInventory?: boolean
  allowBackorder?: boolean
  allowNegativeStock?: boolean
  trackMethod?: TrackMethod
  primaryUnitId?: string | null
  imageUrl?: string | null
  tags?: string[] | null
  customFields?: unknown
  metadata?: unknown
  translations?: TranslationInput[]
  defaultVariant?: ProductVariantPayload
  variants?: ProductVariantPayload[]
}
