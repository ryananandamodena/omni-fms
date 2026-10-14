-- OmniChannel FMS Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users & Auth ──────────────────────────────────────────────────────────────

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin','admin','content_manager','catalog_manager','viewer')),
    avatar_url  VARCHAR(500),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Categories & Brands ──────────────────────────────────────────────────────

CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    parent_id   UUID REFERENCES categories(id),
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE brands (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    logo_url    VARCHAR(500),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ─── Attribute Definitions ────────────────────────────────────────────────────

CREATE TABLE attribute_definitions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    type        VARCHAR(50) NOT NULL CHECK (type IN ('text','number','select','multiselect','boolean')),
    options     JSONB DEFAULT '[]',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku                 VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    brand_id            UUID REFERENCES brands(id),
    category_id         UUID REFERENCES categories(id),
    product_type        VARCHAR(100) NOT NULL DEFAULT 'physical',
    product_code        VARCHAR(100),
    barcode             VARCHAR(100),
    manufacturer        VARCHAR(255),
    short_description   TEXT,
    long_description    TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','archived')),
    content_score       INTEGER NOT NULL DEFAULT 0 CHECK (content_score BETWEEN 0 AND 100),
    seo_title           VARCHAR(255),
    seo_description     VARCHAR(500),
    seo_keywords        TEXT[],
    weight              DECIMAL(10,3),
    length              DECIMAL(10,3),
    width               DECIMAL(10,3),
    height              DECIMAL(10,3),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filename    VARCHAR(255) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    size        BIGINT NOT NULL DEFAULT 0,
    width       INTEGER,
    height      INTEGER,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    alt_text    VARCHAR(255),
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku         VARCHAR(100) NOT NULL UNIQUE,
    barcode     VARCHAR(100),
    price       DECIMAL(15,2) NOT NULL DEFAULT 0,
    compare_price DECIMAL(15,2),
    cost_price  DECIMAL(15,2),
    stock       INTEGER NOT NULL DEFAULT 0,
    weight      DECIMAL(10,3),
    length      DECIMAL(10,3),
    width       DECIMAL(10,3),
    height      DECIMAL(10,3),
    attributes  JSONB NOT NULL DEFAULT '{}',
    image_id    UUID REFERENCES product_images(id),
    status      VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_attributes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id    UUID NOT NULL REFERENCES attribute_definitions(id),
    value           TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, attribute_id)
);

-- ─── Media Assets ─────────────────────────────────────────────────────────────

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    mime_type       VARCHAR(100) NOT NULL,
    size            BIGINT NOT NULL DEFAULT 0,
    width           INTEGER,
    height          INTEGER,
    alt_text        VARCHAR(255),
    tags            TEXT[] DEFAULT '{}',
    folder          VARCHAR(255),
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ─── Marketplaces ─────────────────────────────────────────────────────────────

CREATE TABLE marketplace_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marketplace_id      VARCHAR(50) NOT NULL CHECK (marketplace_id IN ('shopee','tokopedia','lazada','tiktok','blibli','shopify')),
    name                VARCHAR(255) NOT NULL,
    store_name          VARCHAR(255),
    store_id            VARCHAR(255),
    status              VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','expired','error')),
    environment         VARCHAR(50) NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
    credentials_encrypted BYTEA,
    settings            JSONB DEFAULT '{}',
    last_sync_at        TIMESTAMPTZ,
    product_count       INTEGER NOT NULL DEFAULT 0,
    api_status          VARCHAR(50) NOT NULL DEFAULT 'down' CHECK (api_status IN ('ok','degraded','down')),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- ─── Marketplace Categories ───────────────────────────────────────────────────

CREATE TABLE marketplace_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marketplace_id  VARCHAR(50) NOT NULL,
    external_id     VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    path            VARCHAR(500),
    parent_id       VARCHAR(255),
    level           INTEGER NOT NULL DEFAULT 1,
    attributes      JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(marketplace_id, external_id)
);

CREATE TABLE marketplace_category_mappings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_category_id          UUID NOT NULL REFERENCES categories(id),
    marketplace_id              VARCHAR(50) NOT NULL,
    marketplace_category_id     VARCHAR(255) NOT NULL,
    marketplace_category_path   VARCHAR(500),
    created_by                  UUID REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(master_category_id, marketplace_id)
);

-- ─── Marketplace Attributes ───────────────────────────────────────────────────

CREATE TABLE marketplace_attribute_mappings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_attribute_id     UUID NOT NULL REFERENCES attribute_definitions(id),
    marketplace_id          VARCHAR(50) NOT NULL,
    marketplace_attr_id     VARCHAR(255),
    marketplace_attr_name   VARCHAR(255) NOT NULL,
    value_transform         JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(master_attribute_id, marketplace_id)
);

-- ─── Channel Products ─────────────────────────────────────────────────────────

CREATE TABLE channel_products (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    marketplace_account_id  UUID NOT NULL REFERENCES marketplace_accounts(id),
    external_id             VARCHAR(255),
    external_url            VARCHAR(500),
    status                  VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','unpublished','error')),
    title                   VARCHAR(500),
    description             TEXT,
    price                   DECIMAL(15,2),
    stock                   INTEGER,
    sku                     VARCHAR(100),
    marketplace_category_id VARCHAR(255),
    marketplace_category_name VARCHAR(255),
    attributes              JSONB DEFAULT '{}',
    images                  TEXT[] DEFAULT '{}',
    last_synced_at          TIMESTAMPTZ,
    sync_error              TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, marketplace_account_id)
);

CREATE TABLE channel_product_variants (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_product_id      UUID NOT NULL REFERENCES channel_products(id) ON DELETE CASCADE,
    product_variant_id      UUID NOT NULL REFERENCES product_variants(id),
    external_id             VARCHAR(255),
    price                   DECIMAL(15,2),
    stock                   INTEGER,
    sku                     VARCHAR(100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Inventory & Pricing ──────────────────────────────────────────────────────

CREATE TABLE inventory (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id        VARCHAR(100) DEFAULT 'default',
    quantity            INTEGER NOT NULL DEFAULT 0,
    reserved_quantity   INTEGER NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_variant_id, warehouse_id)
);

CREATE TABLE prices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    price_type          VARCHAR(50) NOT NULL DEFAULT 'regular',
    amount              DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'IDR',
    valid_from          TIMESTAMPTZ,
    valid_to            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sync Jobs ────────────────────────────────────────────────────────────────

CREATE TABLE sync_jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES products(id),
    channel_product_id      UUID REFERENCES channel_products(id),
    marketplace_account_id  UUID NOT NULL REFERENCES marketplace_accounts(id),
    action                  VARCHAR(50) NOT NULL CHECK (action IN ('create','update','delete','price_update','stock_update','image_update','publish','unpublish')),
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed','cancelled')),
    payload                 JSONB DEFAULT '{}',
    result                  JSONB,
    attempt                 INTEGER NOT NULL DEFAULT 0,
    max_attempts            INTEGER NOT NULL DEFAULT 3,
    error_message           TEXT,
    error_code              VARCHAR(100),
    scheduled_at            TIMESTAMPTZ,
    started_at              TIMESTAMPTZ,
    finished_at             TIMESTAMPTZ,
    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sync_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    level       VARCHAR(20) NOT NULL DEFAULT 'info',
    message     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   VARCHAR(255) NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL CHECK (type IN ('success','error','warning','info')),
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    entity_type VARCHAR(100),
    entity_id   VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Generation Logs ───────────────────────────────────────────────────────

CREATE TABLE ai_generation_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    product_id  UUID REFERENCES products(id),
    action      VARCHAR(100) NOT NULL,
    marketplace VARCHAR(50),
    prompt      TEXT,
    response    TEXT,
    tokens_used INTEGER,
    duration_ms INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Import Jobs ──────────────────────────────────────────────────────────────

CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename        VARCHAR(255) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
    total_rows      INTEGER NOT NULL DEFAULT 0,
    processed_rows  INTEGER NOT NULL DEFAULT 0,
    success_rows    INTEGER NOT NULL DEFAULT 0,
    error_rows      INTEGER NOT NULL DEFAULT 0,
    errors          JSONB DEFAULT '[]',
    file_url        VARCHAR(500),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX idx_channel_products_product_id ON channel_products(product_id);
CREATE INDEX idx_channel_products_marketplace ON channel_products(marketplace_account_id);
CREATE INDEX idx_channel_products_status ON channel_products(status);

CREATE INDEX idx_sync_jobs_product_id ON sync_jobs(product_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_marketplace ON sync_jobs(marketplace_account_id);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ─── Seed Data ────────────────────────────────────────────────────────────────

-- Default users (passwords are bcrypt hashes of actual passwords)
INSERT INTO users (email, full_name, password, role) VALUES
('admin@example.com', 'Ryan Ananda', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmSMnagBPgdKn2i', 'admin'),
('content@example.com', 'Content Manager', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmSMnagBPgdKn2i', 'content_manager'),
('viewer@example.com', 'View Only', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmSMnagBPgdKn2i', 'viewer');

-- Default categories
INSERT INTO categories (name, slug) VALUES
('Kitchen Appliance', 'kitchen-appliance'),
('Home Appliance', 'home-appliance'),
('Personal Care', 'personal-care'),
('Laundry', 'laundry'),
('Cooking', 'cooking');

-- Default brands
INSERT INTO brands (name, slug) VALUES
('MODENA', 'modena'),
('Sharp', 'sharp'),
('Philips', 'philips');

-- Default attribute definitions
INSERT INTO attribute_definitions (name, slug, type, is_required) VALUES
('Brand', 'brand', 'text', TRUE),
('Color', 'color', 'select', FALSE),
('Capacity', 'capacity', 'text', FALSE),
('Power', 'power', 'text', FALSE),
('Material', 'material', 'text', FALSE),
('Warranty', 'warranty', 'text', FALSE),
('Weight', 'weight', 'number', FALSE);
