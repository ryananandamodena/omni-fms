// ─── Auth ───────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'super_admin' | 'admin' | 'content_manager' | 'catalog_manager' | 'viewer'

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refresh_token: string
}

// ─── Products ────────────────────────────────────────────────────────────────
export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Product {
  id: string
  sku: string
  name: string
  brand_id?: string
  brand?: Brand
  category_id?: string
  category?: Category
  product_type: string
  product_code?: string
  barcode?: string
  manufacturer?: string
  short_description?: string
  long_description?: string
  status: ProductStatus
  content_score: number
  primary_image?: ProductImage
  images: ProductImage[]
  variants: ProductVariant[]
  attributes: ProductAttribute[]
  channel_products: ChannelProduct[]
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  filename: string
  url: string
  thumbnail_url?: string
  size: number
  width: number
  height: number
  sort_order: number
  alt_text?: string
  is_primary: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  barcode?: string
  price: number
  compare_price?: number
  stock: number
  weight?: number
  length?: number
  width?: number
  height?: number
  attributes: Record<string, string>
  image_id?: string
  image?: ProductImage
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ProductAttribute {
  id: string
  product_id: string
  attribute_id: string
  attribute: AttributeDefinition
  value: string
}

// ─── Categories & Brands ──────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  parent?: Category
  children?: Category[]
  description?: string
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
  description?: string
  created_at: string
}

// ─── Attributes ───────────────────────────────────────────────────────────────
export interface AttributeDefinition {
  id: string
  name: string
  slug: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  options?: string[]
  is_required: boolean
  description?: string
}

// ─── Marketplaces ─────────────────────────────────────────────────────────────
export type MarketplaceId = 'shopee' | 'tokopedia' | 'lazada' | 'tiktok' | 'blibli' | 'shopify'
export type MarketplaceStatus = 'connected' | 'disconnected' | 'expired' | 'error'
export type ConnectionEnvironment = 'sandbox' | 'production'

export interface Marketplace {
  id: string
  marketplace_id: MarketplaceId
  name: string
  store_name?: string
  store_id?: string
  status: MarketplaceStatus
  environment: ConnectionEnvironment
  last_sync_at?: string
  product_count: number
  api_status: 'ok' | 'degraded' | 'down'
  created_at: string
  updated_at: string
}

// ─── Channel Products ─────────────────────────────────────────────────────────
export type ChannelProductStatus = 'draft' | 'pending' | 'published' | 'unpublished' | 'error'

export interface ChannelProduct {
  id: string
  product_id: string
  marketplace_account_id: string
  marketplace: Marketplace
  external_id?: string
  status: ChannelProductStatus
  title: string
  description?: string
  price: number
  stock: number
  sku: string
  marketplace_category_id?: string
  marketplace_category_name?: string
  attributes: Record<string, string>
  images: string[]
  last_synced_at?: string
  sync_error?: string
  created_at: string
  updated_at: string
}

// ─── Sync Jobs ────────────────────────────────────────────────────────────────
export type SyncJobStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'
export type SyncJobAction = 'create' | 'update' | 'delete' | 'price_update' | 'stock_update' | 'image_update' | 'publish' | 'unpublish'

export interface SyncJob {
  id: string
  product_id: string
  product: Pick<Product, 'id' | 'sku' | 'name'>
  channel_product_id: string
  marketplace_account_id: string
  marketplace: Pick<Marketplace, 'id' | 'marketplace_id' | 'name'>
  action: SyncJobAction
  status: SyncJobStatus
  attempt: number
  max_attempts: number
  error_message?: string
  error_code?: string
  started_at?: string
  finished_at?: string
  created_at: string
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  user_id: string
  user: Pick<User, 'id' | 'full_name' | 'email'>
  action: string
  entity_type: string
  entity_id: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  entity_type?: string
  entity_id?: string
  created_at: string
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_products: number
  active_products: number
  draft_products: number
  published_products: number
  pending_sync: number
  failed_sync: number
  connected_marketplaces: number
  total_skus: number
  updated_today: number
}

export interface SyncStatusData {
  success: number
  pending: number
  failed: number
  draft: number
}

export interface MarketplaceDistribution {
  marketplace: string
  count: number
  color: string
}

export interface RecentActivity {
  id: string
  description: string
  type: 'update' | 'publish' | 'error' | 'import' | 'sync'
  timestamp: string
  user?: string
}

// ─── Import/Export ────────────────────────────────────────────────────────────
export interface ImportJob {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  errors?: ImportError[]
  created_at: string
  completed_at?: string
}

export interface ImportError {
  row: number
  field: string
  message: string
  value?: string
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export type AiAction = 'generate_title' | 'generate_description' | 'improve_description' | 'seo_optimize' | 'marketplace_optimize'

export interface AiRequest {
  action: AiAction
  product_id?: string
  marketplace?: MarketplaceId
  context: {
    product_name?: string
    features?: string[]
    existing_content?: string
    target_keywords?: string[]
  }
}

export interface AiResponse {
  title?: string
  short_description?: string
  long_description?: string
  bullet_points?: string[]
  seo_keywords?: string[]
  meta_description?: string
  marketplace_title?: string
  marketplace_description?: string
}

// ─── Media ────────────────────────────────────────────────────────────────────
export interface MediaAsset {
  id: string
  filename: string
  original_name: string
  url: string
  thumbnail_url?: string
  mime_type: string
  size: number
  width?: number
  height?: number
  alt_text?: string
  tags: string[]
  folder?: string
  created_at: string
}

// ─── Content Score ────────────────────────────────────────────────────────────
export interface ContentScore {
  total: number
  categories: {
    basic_info: ContentScoreCategory
    media: ContentScoreCategory
    description: ContentScoreCategory
    seo: ContentScoreCategory
    attributes: ContentScoreCategory
    marketplace_readiness: ContentScoreCategory
  }
}

export interface ContentScoreCategory {
  score: number
  max: number
  items: ContentScoreItem[]
}

export interface ContentScoreItem {
  label: string
  passed: boolean
  message?: string
}

// ─── Marketplace Category Mapping ─────────────────────────────────────────────
export interface MarketplaceCategoryMapping {
  id: string
  master_category_id: string
  master_category: Category
  marketplace_id: MarketplaceId
  marketplace_category_id: string
  marketplace_category_path: string
  created_at: string
}
