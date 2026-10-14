import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  RefreshCw,
  Package,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { mockProducts } from '@/data/mockData'
import { useProducts, useDeleteProduct } from '@/api'
import { formatCurrency, formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

type SortField = 'name' | 'sku' | 'status' | 'updated_at'
type SortDir = 'asc' | 'desc'

const marketplaceIcons: Record<string, string> = {
  shopee: '🛒',
  tokopedia: '🟢',
  lazada: '🔵',
  tiktok: '⚫',
  blibli: '💙',
  shopify: '🟩',
}

export function ProductsPage() {
  const navigate = useNavigate()
  const { data: apiProducts, isLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const perPage = 10

  // Synchronize state when API products are loaded
  React.useEffect(() => {
    if (apiProducts && apiProducts.length > 0) {
      setProducts(apiProducts)
    }
  }, [apiProducts])

  // Filter
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let aVal: string = String(a[sortField as keyof Product] ?? '')
      let bVal: string = String(b[sortField as keyof Product] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelected(selected.length === paginated.length ? [] : paginated.map((p) => p.id))
  }

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    toast.success('Product deleted')
  }

  const handleDuplicate = (product: Product) => {
    const dup = { ...product, id: `dup-${Date.now()}`, sku: `${product.sku}-COPY`, name: `${product.name} (Copy)` }
    setProducts((prev) => [dup, ...prev])
    toast.success('Product duplicated')
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />} onClick={() => navigate('/imports')}>
            Import
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
            Export
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/products/new')}>
            New Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            leftIcon={<Search className="h-3.5 w-3.5" />}
            placeholder="Search by name, SKU, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-72"
          />
          <div className="flex items-center gap-2">
            {(['all', 'active', 'draft', 'archived'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors border',
                  statusFilter === s
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {s === 'all' ? `All (${products.length})` : s}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} className="ml-auto">
            Filters
          </Button>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm">
            <span className="font-medium text-primary">{selected.length} selected</span>
            <div className="ml-4 flex items-center gap-1">
              {[
                { label: 'Publish', icon: <RefreshCw className="h-3.5 w-3.5" /> },
                { label: 'Archive', icon: <Archive className="h-3.5 w-3.5" /> },
                { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant={action.danger ? 'destructive' : 'outline'}
                  size="sm"
                  leftIcon={action.icon}
                  onClick={() => {
                    toast.success(`${action.label} applied to ${selected.length} products`)
                    setSelected([])
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>×</button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => toggleSort('sku')}>
                  <div className="flex items-center gap-1">SKU <SortIcon field="sku" /></div>
                </th>
                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Product Name <SortIcon field="name" /></div>
                </th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                </th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => toggleSort('updated_at')}>
                  <div className="flex items-center gap-1">Updated <SortIcon field="updated_at" /></div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">No products found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    <Button size="sm" className="mt-4" onClick={() => navigate('/products/new')}>
                      Create First Product
                    </Button>
                  </td>
                </tr>
              ) : (
                paginated.map((product) => {
                  const price = product.variants[0]?.price ?? 0
                  const stock = product.variants.reduce((s, v) => s + v.stock, 0)
                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors cursor-pointer',
                        selected.includes(product.id) && 'bg-primary/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-4 py-3" onClick={() => navigate(`/products/${product.id}`)}>
                        {product.primary_image ? (
                          <img
                            src={product.primary_image.thumbnail_url || product.primary_image.url}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={() => navigate(`/products/${product.id}`)}>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{product.sku}</code>
                      </td>
                      <td className="px-4 py-3 max-w-48" onClick={() => navigate(`/products/${product.id}`)}>
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand?.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{product.category?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{formatCurrency(price)}</span>
                        {product.variants.length > 1 && (
                          <p className="text-xs text-muted-foreground">{product.variants.length} variants</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-medium', stock === 0 && 'text-red-500')}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full progress-bar"
                              style={{ width: `${product.content_score}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-medium', scoreColor(product.content_score))}>
                            {product.content_score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(product.updated_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                            className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-md p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-7 w-7 rounded-md text-xs transition-colors',
                    page === p ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
