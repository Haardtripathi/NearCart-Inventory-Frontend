import type {
  Industry,
  LanguageCode,
  LocalizedRecord,
  Nullable,
  ProductType,
  TrackMethod,
  TranslationInput,
  VariantTranslationInput,
} from './common'

export interface MasterCatalogCategory extends LocalizedRecord {
  id: string
  industryId: string
  parentId?: Nullable<string>
  code: string
  slug: string
  sortOrder: number
  iconKey?: Nullable<string>
  imageUrl?: Nullable<string>
  isActive: boolean
  translations?: TranslationInput[]
  children?: MasterCatalogCategory[]
  parent?: Nullable<MasterCatalogCategory>
}

export interface MasterCatalogVariantTemplate extends LocalizedRecord {
  id: string
  masterItemId: string
  code: string
  skuSuffix?: Nullable<string>
  barcode?: Nullable<string>
  attributes?: Record<string, string> | null
  defaultCostPrice?: Nullable<string>
  defaultSellingPrice?: Nullable<string>
  defaultMrp?: Nullable<string>
  reorderLevel: string
  minStockLevel: string
  maxStockLevel?: Nullable<string>
  weight?: Nullable<string>
  unitCode?: Nullable<string>
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  translations?: VariantTranslationInput[]
}

export interface MasterCatalogItem extends LocalizedRecord {
  id: string
  industryId: string
  code: string
  slug: string
  canonicalName: string
  canonicalDescription?: Nullable<string>
  productType: ProductType
  defaultTrackMethod: TrackMethod
  defaultUnitCode?: Nullable<string>
  defaultBrandName?: Nullable<string>
  defaultTaxCode?: Nullable<string>
  hasVariants: boolean
  trackInventory: boolean
  allowBackorder: boolean
  allowNegativeStock: boolean
  defaultImageUrl?: Nullable<string>
  tags?: unknown
  customFieldsTemplate?: unknown
  metadata?: unknown
  isActive: boolean
  category?: Nullable<MasterCatalogCategory>
  translations?: TranslationInput[]
  aliases?: Array<{ id?: string; language: string; value: string }>
  variantTemplates: MasterCatalogVariantTemplate[]
  alreadyImportedProductId?: Nullable<string>
  importable?: boolean
}

export interface MasterCatalogCategoryPayload {
  industryId: string
  parentId?: string
  code: string
  slug?: string
  sortOrder?: number
  iconKey?: string
  imageUrl?: string
  isActive?: boolean
  metadata?: unknown
  translations: TranslationInput[]
}

export interface MasterCatalogAliasInput {
  language: LanguageCode
  value: string
}

export interface MasterCatalogVariantTemplatePayload {
  code: string
  name: string
  skuSuffix?: string
  barcode?: string
  attributes?: Record<string, string>
  defaultCostPrice?: string | number | null
  defaultSellingPrice?: string | number | null
  defaultMrp?: string | number | null
  reorderLevel?: string | number | null
  minStockLevel?: string | number | null
  maxStockLevel?: string | number | null
  weight?: string | number | null
  unitCode?: string
  isDefault?: boolean
  isActive?: boolean
  sortOrder?: number
  metadata?: unknown
  translations?: VariantTranslationInput[]
}

export interface MasterCatalogItemPayload {
  industryId: string
  masterCategoryId?: string
  code: string
  slug?: string
  canonicalName: string
  canonicalDescription?: string
  productType: ProductType
  defaultTrackMethod: TrackMethod
  defaultUnitCode?: string
  defaultBrandName?: string
  defaultTaxCode?: string
  hasVariants?: boolean
  trackInventory?: boolean
  allowBackorder?: boolean
  allowNegativeStock?: boolean
  defaultImageUrl?: string
  tags?: string[]
  customFieldsTemplate?: unknown
  metadata?: unknown
  isActive?: boolean
  translations?: TranslationInput[]
  aliases?: MasterCatalogAliasInput[]
  variantTemplates?: MasterCatalogVariantTemplatePayload[]
}

export interface ImportMasterCatalogPayload {
  categoryMode: 'AUTO_CREATE' | 'USE_EXISTING'
  existingCategoryId?: string
  allowDuplicate?: boolean
  strictIndustryMatch?: boolean
  forceImport?: boolean
  pricingOverrides?: {
    variantPrices?: Array<{
      masterVariantTemplateId?: string
      sellingPrice?: string | number
      costPrice?: string | number
      mrp?: string | number
    }>
  }
  namingOverrides?: {
    canonicalName?: string
  }
}

export interface ImportMasterCatalogResult {
  alreadyExisted: boolean
  warning?: string | null
  product: {
    id: string
    slug: string
    displayName?: string | null
    name: string
  }
}

export interface PlatformIndustryState {
  items: Industry[]
}
