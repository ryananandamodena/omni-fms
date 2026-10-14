import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Globe,
  RefreshCw,
  ChevronRight,
  Package,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Image,
  Layers,
  BarChart2,
  History,
  ScrollText,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { mockProducts, mockSyncJobs, mockAuditLogs, mockMarketplaces } from '@/data/mockData'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'content' | 'variants' | 'media' | 'channels' | 'sync' | 'audit'

const tabItems = [
  { id: 'overview', label: 'Overview', icon: <Package className="h-4 w-4" /> },
  { id: 'content', label: 'Content', icon: <Edit className="h-4 w-4" /> },
  { id: 'variants', label: 'Variants', icon: <Layers className="h-4 w-4" /> },
  { id: 'media', label: 'Media', icon: <Image className="h-4 w-4" /> },
  { id: 'channels', label: 'Channels', icon: <Store className="h-4 w-4" /> },
  { id: 'sync', label: 'Sync History', icon: <History className="h-4 w-4" /> },
  { id: 'audit', label: 'Audit Log', icon: <ScrollText className="h-4 w-4" /> },
] as const

const marketplaceConfig: Record<string, { color: string; bg: string }> = {
  shopee: { color: '#EE4D2D', bg: '#fff1ef' },
  tokopedia: { color: '#00AA5B', bg: '#f0fff8' },
  lazada: { color: '#0F146D', bg: '#f0f1ff' },
  tiktok: { color: '#010101', bg: '#f5f5f5' },
  blibli: { color: '#0094DA', bg: '#f0f8ff' },
  shopify: { color: '#96BF48', bg: '#f5faee' },
}

const contentScoreItems = [
  { label: 'Product title', passed: true },
  { label: 'Short description', passed: true },
  { label: 'Long description', passed: true },
  { label: 'Primary image', passed: true },
  { label: 'At least 3 images', passed: true },
  { label: 'SKU', passed: true },
  { label: 'Price set', passed: true },
  { label: 'Stock configured', passed: true },
  { label: 'Warranty information', passed: false },
  { label: 'SEO keywords', passed: false },
  { label: 'Brand specified', passed: true },
  { label: 'Category mapped', passed: true },
]

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedImage, setSelectedImage] = useState(0)

  const product = mockProducts.find((p) => p.id === id)
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Product not found</p>
        <Button size="sm" className="mt-4" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    )
  }

  const allImages = [
    product.primary_image,
    ...product.images,
    // Fill with placeholder images for demo
    { id: 'demo-1', url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&q=80', is_primary: false, sort_order: 1, product_id: product.id, filename: 'img2.jpg', size: 0, width: 800, height: 800, created_at: product.created_at },
    { id: 'demo-2', url: 'https://images.unsplash.com/photo-1585515656618-c8d69f0e39d0?w=400&q=80', is_primary: false, sort_order: 2, product_id: product.id, filename: 'img3.jpg', size: 0, width: 800, height: 800, created_at: product.created_at },
  ].filter(Boolean)

  const productSyncJobs = mockSyncJobs.filter((j) => j.product_id === product.id)
  const productAuditLogs = mockAuditLogs.filter((l) => l.entity_id === product.id)

  const passedItems = contentScoreItems.filter((i) => i.passed).length
  const scorePercent = Math.round((passedItems / contentScoreItems.length) * 100)

  const handlePublish = (marketplaceName: string) => {
    toast.success(`Publishing to ${marketplaceName}...`)
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate('/products')} className="hover:text-foreground transition-colors">
          Products
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{product.sku}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">{product.sku}</code>
              {product.brand?.name} · {product.category?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
            AI Assist
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />} onClick={() => navigate(`/products/${id}/edit`)}>
            Edit
          </Button>
          <Button size="sm" leftIcon={<Globe className="h-3.5 w-3.5" />} onClick={() => handlePublish('all channels')}>
            Publish All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Image gallery */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
            <div className="aspect-square relative">
              {allImages[selectedImage] ? (
                <img
                  src={(allImages[selectedImage] as any).url}
                  alt={product.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all',
                    selectedImage === i ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <img
                    src={(img as any).url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Content Score */}
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Content Score</p>
              <span className={cn(
                'text-lg font-bold',
                scorePercent >= 80 ? 'text-emerald-600' : scorePercent >= 60 ? 'text-amber-600' : 'text-red-500'
              )}>
                {scorePercent}/100
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full progress-bar" style={{ width: `${scorePercent}%` }} />
            </div>
            <div className="space-y-1.5">
              {contentScoreItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.passed ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                  )}
                  <span className={item.passed ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Main content */}
        <div className="lg:col-span-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-0.5 rounded-xl border border-border bg-muted/30 p-1 mb-4">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'SKU', value: product.sku },
                    { label: 'Brand', value: product.brand?.name ?? '—' },
                    { label: 'Category', value: product.category?.name ?? '—' },
                    { label: 'Product Type', value: product.product_type },
                    { label: 'Barcode', value: product.barcode ?? '—' },
                    { label: 'Product Code', value: product.product_code ?? '—' },
                    { label: 'Manufacturer', value: product.manufacturer ?? '—' },
                    { label: 'Created', value: formatDate(product.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-0.5 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold">Short Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.short_description ?? 'No description set.'}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold">Inventory Summary</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xl font-bold">{product.variants.reduce((s, v) => s + v.stock, 0)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Stock</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xl font-bold">{product.variants.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Variants</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xl font-bold">{formatCurrency(Math.min(...product.variants.map(v => v.price)))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Starting Price</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Product Description</h3>
                  <Button size="sm" variant="outline" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                    Improve with AI
                  </Button>
                </div>
                <div
                  className="prose prose-sm max-w-none text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-sm"
                  dangerouslySetInnerHTML={{ __html: product.long_description ?? '<p>No description</p>' }}
                />
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">SEO Information</h3>
                  <Button size="sm" variant="outline" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                    Generate SEO
                  </Button>
                </div>
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">No SEO information set. Click Generate to create optimized SEO content.</p>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="animate-fade-in">
              <Card>
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Product Variants ({product.variants.length})</h3>
                  <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Variant</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Attributes</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Stock</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{variant.sku}</code>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(variant.attributes).map(([k, v]) => (
                                <Badge key={k} variant="gray" className="text-xs">
                                  {k}: {v}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{formatCurrency(variant.price)}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-sm font-medium', variant.stock === 0 && 'text-red-500')}>
                              {variant.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={variant.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon-sm" variant="ghost">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-3 animate-fade-in">
              {productSyncJobs.length === 0 ? (
                <Card className="p-8 text-center">
                  <RefreshCw className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No sync history for this product</p>
                </Card>
              ) : (
                productSyncJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={job.status} />
                        <div>
                          <p className="text-sm font-medium capitalize">{job.action.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.marketplace.name} · Attempt {job.attempt}/{job.max_attempts}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(job.created_at)}</p>
                    </div>
                    {job.error_message && (
                      <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                        <p className="text-xs text-red-700 dark:text-red-400">{job.error_message}</p>
                        <Button size="sm" variant="outline" className="mt-2 text-red-600 border-red-200" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                          Retry Sync
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3 animate-fade-in">
              {productAuditLogs.length === 0 ? (
                <Card className="p-8 text-center">
                  <ScrollText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No audit history for this product</p>
                </Card>
              ) : (
                productAuditLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{log.action}</span>
                          <p className="text-sm font-medium">{log.user.full_name}</p>
                        </div>
                        {log.old_value && log.new_value && (
                          <div className="mt-2 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-xs">
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Before</p>
                              {Object.entries(log.old_value).map(([k, v]) => (
                                <p key={k}><span className="text-muted-foreground">{k}:</span> {String(v)}</p>
                              ))}
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">After</p>
                              {Object.entries(log.new_value).map(([k, v]) => (
                                <p key={k} className="text-emerald-600"><span className="text-muted-foreground">{k}:</span> {String(v)}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(log.created_at)}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {(activeTab === 'media' || activeTab === 'channels') && (
            <Card className="p-8 text-center animate-fade-in">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeTab === 'media' ? 'Manage product images in the Media tab.' : 'Configure marketplace channels below.'}
              </p>
            </Card>
          )}
        </div>

        {/* Right: Marketplace status */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Marketplace Status</h3>
            <div className="space-y-2">
              {mockMarketplaces.map((mp) => {
                const statuses = ['connected', 'connected', 'expired', 'connected', 'disconnected', 'connected']
                const status = statuses[mockMarketplaces.indexOf(mp)] ?? 'disconnected'
                const isConnected = status === 'connected'
                const config = marketplaceConfig[mp.marketplace_id] ?? { color: '#888', bg: '#f5f5f5' }

                return (
                  <div
                    key={mp.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-2.5 border transition-colors',
                      isConnected ? 'border-border hover:bg-muted/50' : 'border-dashed border-border/50 opacity-60'
                    )}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold shrink-0"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {mp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{mp.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isConnected ? 'Published' : 'Not connected'}
                      </p>
                    </div>
                    {isConnected ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
            <Button size="sm" className="w-full mt-3" leftIcon={<Globe className="h-3.5 w-3.5" />}>
              Publish to All
            </Button>
          </Card>

          {/* Marketplace Readiness */}
          <Card className="p-4 mt-4">
            <h3 className="mb-3 text-sm font-semibold">Shopee Readiness</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { label: 'SKU', ok: true },
                { label: 'Title (≤120 chars)', ok: product.name.length <= 120 },
                { label: 'Description', ok: !!product.long_description },
                { label: 'Price', ok: product.variants[0]?.price > 0 },
                { label: 'Stock', ok: product.variants[0]?.stock > 0 },
                { label: 'Images (min 1)', ok: !!product.primary_image },
                { label: 'Brand', ok: !!product.brand },
                { label: 'Weight', ok: !!product.variants[0]?.weight },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.ok ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  <span className={item.ok ? 'text-foreground' : 'text-amber-600'}>{item.label}</span>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3">
              Fix Issues
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Stub Plus icon
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
