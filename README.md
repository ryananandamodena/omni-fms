# OmniChannel FMS — Product Content Management System

<div align="center">

![OmniChannel FMS](https://img.shields.io/badge/OmniChannel-FMS-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**A centralized platform for managing product content across Shopee, Tokopedia, Lazada, TikTok Shop, Blibli, and Shopify**

[Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Quick Start](#quick-start) · [API Docs](#api-documentation) · [Marketplace Guide](#marketplace-integration-guide)

</div>

---

## Overview

OmniChannel FMS is a production-ready **Omnichannel Product Content Management System** that allows businesses to:

1. Create and manage **master products** with full content (title, description, images, variants, attributes)
2. Map products to **marketplace-specific categories and attributes**
3. **Publish and synchronize** product data across multiple e-commerce channels simultaneously
4. Track **synchronization status** with detailed error reporting and retry mechanisms
5. Use **AI assistance** to generate optimized content for each marketplace

### Key Architecture Principle

```
Master Product
     ↓
Channel Mapping
     ↓
Marketplace Product
```

Each master product can have **different content per marketplace**:
- Shopee: title, category, attributes, price, images optimized for Shopee
- Tokopedia: different title, category, attributes for Tokopedia
- Lazada: different format for Lazada

---

## Features

### ✅ Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| Authentication | ✅ | JWT-based auth with RBAC (5 roles) |
| Dashboard | ✅ | KPI cards, charts, activity feed |
| Product Management | ✅ | Full CRUD, search, filter, sort, paginate |
| Product Detail | ✅ | Image gallery, tabs, content score |
| Media Library | ✅ | Upload, drag-drop, grid/list view |
| Marketplace Management | ✅ | 6 marketplaces, connection status |
| Sync Center | ✅ | Job queue, retry, error details |
| AI Content Assistant | ✅ | Chat interface, quick actions |
| Global Search | ✅ | Ctrl+K shortcut, cross-entity search |
| Dark/Light Mode | ✅ | Full theme switching |
| Audit Logs | ✅ | Complete change history |
| Content Score | ✅ | 100-point scoring system |
| Marketplace Readiness | ✅ | Per-marketplace validation |
| Bulk Actions | ✅ | Multi-select, bulk publish/delete |

### 🚧 Backend (Architecture Ready)

| Feature | Status |
|---------|--------|
| Go API Server | 🚧 Scaffolded |
| PostgreSQL Schema | ✅ Complete |
| Redis Queue | 🚧 Architecture ready |
| Background Workers | 🚧 Architecture ready |
| Mock Marketplace Adapters | 🚧 Architecture ready |
| Docker Compose | ✅ Complete |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│   React + TypeScript + Vite + TailwindCSS v4        │
│   Zustand (state) + React Query (data fetching)     │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────┐
│                   Nginx Proxy                        │
│         Reverse proxy + SSL termination             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│               Go Backend (Gin)                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ API Routes: /api/v1/...                      │   │
│  │ Auth (JWT) + RBAC Middleware                 │   │
│  │ Service Layer (Products, Marketplaces, etc.) │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                               │
│  ┌──────────────────▼───────────────────────────┐   │
│  │ Marketplace Adapters (Interface + Impls)     │   │
│  │  ShopeeAdapter | TokopediaAdapter | ...      │   │
│  │  MockAdapter (development/testing)           │   │
│  └──────────────────────────────────────────────┘   │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
┌──────────▼───────┐    ┌─────────────▼──────────────┐
│   PostgreSQL     │    │     Redis                   │
│   (Primary DB)   │    │  Queue + Cache + Sessions   │
└──────────────────┘    └────────────────────────────┘
                                     │
                        ┌────────────▼───────────────┐
                        │    Background Worker        │
                        │  (Asynq task processor)     │
                        │  - Sync jobs                │
                        │  - Retry logic              │
                        │  - Exponential backoff      │
                        └────────────────────────────┘
```

### Sync Engine Flow

```
User updates product
        ↓
Create SyncJob (DB)
        ↓
Push to Redis Queue (Asynq)
        ↓
Worker picks up task
        ↓
Marketplace Adapter
        ↓
Marketplace API (or Mock)
        ↓
Success ──────────────→ Update SyncJob: SUCCESS
Failed ───→ Retry (max 3) → Update SyncJob: FAILED
        ↓
Save SyncLog
        ↓
Send Notification
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool |
| TailwindCSS | 4.x | Styling |
| React Router | 6.x | Client routing |
| TanStack Query | 5.x | Data fetching & caching |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Zustand | 4.x | State management |
| Recharts | 2.x | Charts |
| React Dropzone | 14.x | File upload |
| React Hot Toast | 2.x | Notifications |
| Lucide React | Latest | Icons |
| CVA | 0.5.x | Component variants |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Go | 1.26 | Backend language |
| Gin | 1.12 | HTTP framework |
| pgx/v5 | 5.x | PostgreSQL driver |
| go-redis/v9 | 9.x | Redis client |
| Asynq | 0.26 | Background jobs |
| golang-jwt | 5.x | JWT authentication |
| golang.org/x/crypto | Latest | Password hashing |
| uuid | 1.6 | UUID generation |
| godotenv | 1.5 | Environment loading |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| Reverse Proxy | Nginx Alpine |
| Containerization | Docker + Docker Compose |

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Go 1.21+
- Docker and Docker Compose (optional, for full stack)

### 1. Frontend Only (Demo Mode)

```bash
# Clone the project
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173

**Demo Accounts:**
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Admin |
| content@example.com | Content123! | Content Manager |
| viewer@example.com | Viewer123! | Viewer |

### 2. Full Stack with Docker

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your values
# (minimum: no changes needed for development)

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

Services:
- Frontend: http://localhost
- Backend API: http://localhost:8080
- MinIO Console: http://localhost:9001

### 3. Local Development (Backend)

```bash
cd backend

# Copy env
cp ../.env.example .env

# Download dependencies
go mod tidy

# Run database migrations
# (requires PostgreSQL running)
psql -U omnichannel -d omnichannel_fms -f migrations/001_init.sql

# Run server
go run cmd/server/main.go

# Run worker (in separate terminal)
go run cmd/worker/main.go
```

---

## Project Structure

```
omnichannel-fms/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, Topbar, AppLayout, GlobalSearch
│   │   │   └── ui/            # Button, Badge, Card, Input components
│   │   ├── pages/             # All page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── MarketplacesPage.tsx
│   │   │   ├── SyncCenterPage.tsx
│   │   │   ├── AIContentPage.tsx
│   │   │   ├── MediaLibraryPage.tsx
│   │   │   └── AuditLogsPage.tsx
│   │   ├── data/
│   │   │   └── mockData.ts    # Mock data for demo
│   │   ├── stores/            # Zustand stores (auth, ui)
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   └── vite.config.ts
│
├── backend/
│   ├── cmd/
│   │   ├── server/main.go     # HTTP server entry point
│   │   └── worker/main.go     # Background worker entry point
│   ├── internal/
│   │   ├── auth/              # Authentication & JWT
│   │   ├── users/             # User management
│   │   ├── products/          # Product CRUD & business logic
│   │   ├── categories/        # Category management
│   │   ├── marketplaces/      # Marketplace account management
│   │   ├── sync/              # Sync job management
│   │   ├── media/             # File upload & media library
│   │   ├── ai/                # AI content generation
│   │   ├── audit/             # Audit logging
│   │   └── notifications/     # Notification system
│   ├── adapters/
│   │   ├── shopee/            # Shopee API adapter
│   │   ├── tokopedia/         # Tokopedia API adapter
│   │   ├── lazada/            # Lazada API adapter
│   │   ├── tiktok/            # TikTok Shop adapter
│   │   ├── blibli/            # Blibli adapter
│   │   ├── shopify/           # Shopify adapter
│   │   └── mock/              # Mock adapters for development
│   ├── migrations/
│   │   └── 001_init.sql       # Database schema
│   └── workers/               # Async job processors
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://:password@host:6379/0

# JWT
JWT_SECRET=min-32-character-secret-key
JWT_REFRESH_SECRET=another-32-character-secret-key
JWT_EXPIRY=24h

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=omnichannel-media
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# AI
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

# Marketplaces (optional - uses mock if not set)
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
TOKOPEDIA_CLIENT_ID=
TOKOPEDIA_CLIENT_SECRET=
LAZADA_CLIENT_ID=
LAZADA_CLIENT_SECRET=

# Development
MOCK_MARKETPLACE=true
```

---

## Database Migration

```bash
# Apply migrations
psql -U omnichannel -d omnichannel_fms -f backend/migrations/001_init.sql

# Or with Docker
docker exec -i omnichannel-postgres psql -U omnichannel -d omnichannel_fms \
  < backend/migrations/001_init.sql
```

---

## API Documentation

### Authentication

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "admin" },
    "token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

### Products API

```http
# List products
GET /api/v1/products?page=1&per_page=20&status=active&search=blender

# Get product
GET /api/v1/products/:id

# Create product
POST /api/v1/products

# Update product  
PUT /api/v1/products/:id

# Delete product
DELETE /api/v1/products/:id

# Product variants
GET /api/v1/products/:id/variants
POST /api/v1/products/:id/variants

# Product images
GET /api/v1/products/:id/images
POST /api/v1/products/:id/images

# Channel products
GET /api/v1/products/:id/channels
POST /api/v1/products/:id/channels
```

### Sync API

```http
# Create sync job
POST /api/v1/sync/jobs
{
  "product_id": "...",
  "marketplace_account_id": "...",
  "action": "publish"
}

# List sync jobs
GET /api/v1/sync/jobs?status=failed&product_id=...

# Retry sync job
POST /api/v1/sync/jobs/:id/retry

# Cancel sync job
POST /api/v1/sync/jobs/:id/cancel
```

### Response Format

Success:
```json
{
  "success": true,
  "data": {},
  "message": "Product created successfully"
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_VALIDATION_ERROR",
    "message": "SKU already exists",
    "details": {
      "sku": ["SKU 'MOD-001' is already taken"]
    }
  }
}
```

---

## Marketplace Integration Guide

### Mock Mode (Default)

All marketplace adapters default to **Mock Mode** during development. Mock adapters simulate:
- ✅ Product creation
- ✅ Product update
- ✅ Stock update
- ✅ Price update  
- ✅ Image upload
- ✅ Category retrieval
- ✅ API errors (random 10% failure rate)
- ✅ Token expiration simulation
- ✅ Rate limiting simulation

Enable mock mode:
```env
MOCK_MARKETPLACE=true
```

### Adding Real Marketplace API

1. **Create adapter implementation:**
```go
// adapters/shopee/adapter.go
type ShopeeAdapter struct {
    partnerID  string
    partnerKey string
    shopID     string
    accessToken string
}

func (a *ShopeeAdapter) CreateProduct(ctx context.Context, product *model.Product) (*model.ExternalProduct, error) {
    // Implement Shopee-specific API call
}
```

2. **Update adapter factory:**
```go
// internal/marketplaces/factory.go
func NewAdapter(marketplace string, credentials Credentials) MarketplaceAdapter {
    if os.Getenv("MOCK_MARKETPLACE") == "true" {
        return mock.NewMockAdapter(marketplace)
    }
    switch marketplace {
    case "shopee":
        return shopee.NewAdapter(credentials)
    // ...
    }
}
```

3. **Set credentials in `.env`:**
```env
MOCK_MARKETPLACE=false
SHOPEE_PARTNER_ID=your-partner-id
SHOPEE_PARTNER_KEY=your-partner-key
```

### Marketplace Status

| Marketplace | Mock | Real API | OAuth |
|------------|------|----------|-------|
| Shopee | ✅ | 🚧 | ✅ |
| Tokopedia | ✅ | 🚧 | ✅ |
| Lazada | ✅ | 🚧 | ✅ |
| TikTok Shop | ✅ | 🚧 | ✅ |
| Blibli | ✅ | 🚧 | ✅ |
| Shopify | ✅ | 🚧 | ✅ |

---

## User Roles & Permissions

| Feature | Super Admin | Admin | Content Manager | Catalog Manager | Viewer |
|---------|:-----------:|:-----:|:---------------:|:---------------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Products | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Description | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit SKU/Variants | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete Products | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Marketplaces | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish Products | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d postgres redis

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f worker

# Stop services
docker compose down

# Stop and remove volumes (DANGER: data loss)
docker compose down -v

# Rebuild images
docker compose build
docker compose up -d --build

# Execute commands in container
docker exec -it omnichannel-postgres psql -U omnichannel -d omnichannel_fms
docker exec -it omnichannel-redis redis-cli

# View container status
docker compose ps
```

---

## Test Scenarios

### Complete E2E Flow

1. **Login** → admin@example.com / Admin123!
2. **View Dashboard** → Check KPI cards, charts
3. **Create Product** → /products/new
4. **Upload Images** → Media Library
5. **Add Variants** → Product Detail > Variants tab
6. **View Content Score** → Should be >80/100
7. **Connect Shopee (Mock)** → Marketplaces > Connect Shopee
8. **Publish Product** → Product Detail > Publish to Shopee
9. **View Sync Job** → Sync Center
10. **Update Price** → Edit product price
11. **Re-sync** → Sync Center > Retry
12. **View Audit Log** → Audit Logs

### Test Accounts

| Account | Email | Password | Use Case |
|---------|-------|----------|----------|
| Admin | admin@example.com | Admin123! | Full access testing |
| Content | content@example.com | Content123! | Content management testing |
| Viewer | viewer@example.com | Viewer123! | Read-only access testing |

---

## Development Commands

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Type checking
npm run tsc

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend

```bash
cd backend

# Install dependencies
go mod tidy

# Run server
go run cmd/server/main.go

# Run worker
go run cmd/worker/main.go

# Build binaries
go build -o bin/server cmd/server/main.go
go build -o bin/worker cmd/worker/main.go

# Run tests
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

---

## Roadmap

### Phase 1 (Completed - Frontend)
- [x] Authentication UI
- [x] Dashboard
- [x] Product List & Detail
- [x] Media Library
- [x] Marketplace Management UI
- [x] Sync Center
- [x] AI Content Assistant
- [x] Global Search
- [x] Dark/Light Mode

### Phase 2 (Next)
- [ ] Complete Go backend implementation
- [ ] Real database integration
- [ ] Redis queue setup
- [ ] Background workers
- [ ] JWT auth in backend

### Phase 3 (Future)
- [ ] Shopee real API integration
- [ ] Tokopedia real API integration
- [ ] CSV/XLSX import
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline

---

## License

MIT License — Copyright (c) 2024 OmniChannel FMS

---

<div align="center">
Built with ❤️ for Indonesian e-commerce sellers
</div>
