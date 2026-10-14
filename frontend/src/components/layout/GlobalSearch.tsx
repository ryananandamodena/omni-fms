import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Store, Tag, X, ArrowRight } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { mockProducts, mockMarketplaces, mockCategories } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface SearchResult {
  type: 'product' | 'marketplace' | 'category'
  id: string
  title: string
  subtitle?: string
  url: string
  image?: string
}

export function GlobalSearch() {
  const { setSearchOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setSearchOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const productResults: SearchResult[] = mockProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku}`,
        url: `/products/${p.id}`,
        image: p.primary_image?.thumbnail_url,
      }))

    const marketplaceResults: SearchResult[] = mockMarketplaces
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 2)
      .map((m) => ({
        type: 'marketplace',
        id: m.id,
        title: m.name,
        subtitle: m.store_name,
        url: `/marketplaces`,
      }))

    const categoryResults: SearchResult[] = mockCategories
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 2)
      .map((c) => ({
        type: 'category',
        id: c.id,
        title: c.name,
        url: `/categories`,
      }))

    setResults([...productResults, ...marketplaceResults, ...categoryResults])
  }, [query])

  const typeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="h-3.5 w-3.5 text-blue-500" />
      case 'marketplace': return <Store className="h-3.5 w-3.5 text-emerald-500" />
      case 'category': return <Tag className="h-3.5 w-3.5 text-amber-500" />
      default: return null
    }
  }

  const handleSelect = (result: SearchResult) => {
    navigate(result.url)
    setSearchOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl animate-fade-in">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, SKU, marketplaces..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/70 transition-colors text-left',
                    i === 0 && 'bg-muted/40'
                  )}
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="h-8 w-8 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {typeIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      result.type === 'product' && 'bg-blue-100 text-blue-700',
                      result.type === 'marketplace' && 'bg-emerald-100 text-emerald-700',
                      result.type === 'category' && 'bg-amber-100 text-amber-700',
                    )}>
                      {result.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
            </div>
          )}

          {!query && (
            <div className="px-4 py-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'All Products', url: '/products', icon: <Package className="h-4 w-4" /> },
                  { label: 'Marketplaces', url: '/marketplaces', icon: <Store className="h-4 w-4" /> },
                  { label: 'Sync Center', url: '/sync', icon: <Tag className="h-4 w-4" /> },
                  { label: 'Media Library', url: '/media', icon: <Tag className="h-4 w-4" /> },
                ].map((item) => (
                  <button
                    key={item.url}
                    onClick={() => { navigate(item.url); setSearchOpen(false) }}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
