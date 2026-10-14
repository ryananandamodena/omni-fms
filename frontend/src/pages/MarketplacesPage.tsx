import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, WifiOff, AlertCircle, RefreshCw, Plus, Settings, ExternalLink, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { mockMarketplaces } from '@/data/mockData'
import { useMarketplaces } from '@/api'
import { useTriggerSync } from '@/api/sync'
import { MarketplaceIntegrationModal } from '@/components/marketplaces/MarketplaceIntegrationModal'
import { formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Marketplace, MarketplaceId } from '@/types'

const marketplaceInfo: Record<MarketplaceId, {
  description: string
  color: string
  bg: string
  textColor: string
  emoji: string
  features: string[]
}> = {
  shopee: {
    description: "Indonesia's leading e-commerce platform",
    color: '#EE4D2D',
    bg: 'linear-gradient(135deg, #EE4D2D, #FF7043)',
    textColor: 'white',
    emoji: '🛒',
    features: ['Auto-sync', 'Bulk publish', 'Price management'],
  },
  tokopedia: {
    description: 'Indonesia\'s largest marketplace',
    color: '#00AA5B',
    bg: 'linear-gradient(135deg, #00AA5B, #00C073)',
    textColor: 'white',
    emoji: '🟢',
    features: ['Auto-sync', 'Bulk publish', 'Inventory sync'],
  },
  lazada: {
    description: 'Southeast Asia e-commerce giant',
    color: '#0F146D',
    bg: 'linear-gradient(135deg, #0F146D, #1E2BAA)',
    textColor: 'white',
    emoji: '🔵',
    features: ['Auto-sync', 'Multi-country', 'Promotions'],
  },
  tiktok: {
    description: 'Social commerce platform',
    color: '#010101',
    bg: 'linear-gradient(135deg, #010101, #333)',
    textColor: 'white',
    emoji: '🎵',
    features: ['Live sync', 'Video product', 'Short video'],
  },
  blibli: {
    description: 'Indonesian online shopping mall',
    color: '#0094DA',
    bg: 'linear-gradient(135deg, #0094DA, #0AC2FF)',
    textColor: 'white',
    emoji: '💙',
    features: ['Auto-sync', 'B2B support', 'Bulk pricing'],
  },
  shopify: {
    description: 'Global e-commerce platform',
    color: '#96BF48',
    bg: 'linear-gradient(135deg, #96BF48, #b0d55f)',
    textColor: 'white',
    emoji: '🟩',
    features: ['Full API', 'Custom storefront', 'Analytics'],
  },
}

interface MarketplaceCardProps {
  marketplace: Marketplace
  onOpenSettings: (m: Marketplace) => void
}

function MarketplaceCard({ marketplace, onOpenSettings }: MarketplaceCardProps) {
  const info = marketplaceInfo[marketplace.marketplace_id] || marketplaceInfo.shopee
  const isConnected = marketplace.status === 'connected'
  const isExpired = marketplace.status === 'expired'
  const triggerSyncMutation = useTriggerSync()

  const handleConnect = () => {
    onOpenSettings(marketplace)
  }

  const handleSync = () => {
    triggerSyncMutation.mutate({
      productId: '1',
      channel: marketplace.name,
      action: 'update',
    }, {
      onSuccess: () => {
        toast.success(`Sinkronisasi produk ke ${marketplace.name} telah dijadwalkan!`)
      },
      onError: () => {
        toast.error(`Gagal memicu sinkronisasi ${marketplace.name}`)
      }
    })
  }

  const handleRefreshToken = () => {
    toast.success(`Refreshing ${marketplace.name} token...`)
  }

  return (
    <Card className={cn('overflow-hidden transition-all duration-200', isConnected && 'marketplace-card-active')}>
      {/* Card header with gradient */}
      <div
        className="relative h-24 p-4 flex items-start justify-between"
        style={{ background: info.bg }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.emoji}</span>
            <div>
              <h3 className="text-base font-bold text-white">{marketplace.name}</h3>
              <p className="text-xs text-white/70">{info.description}</p>
            </div>
          </div>
        </div>
        <div>
          <StatusBadge status={marketplace.status} />
        </div>
        {/* Pattern overlay */}
        <div className="absolute right-0 bottom-0 opacity-10">
          <div className="h-16 w-16 rounded-full border-4 border-white translate-x-4 translate-y-4" />
          <div className="h-8 w-8 rounded-full border-4 border-white absolute top-0 right-8" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {isConnected || isExpired ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Store</p>
                <p className="font-medium truncate">{marketplace.store_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Store ID</p>
                <p className="font-medium font-mono text-xs">{marketplace.store_id ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="font-bold text-lg">{marketplace.product_count}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="font-medium text-xs">
                  {marketplace.last_sync_at ? formatRelativeTime(marketplace.last_sync_at) : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-muted-foreground">API Status:</p>
              <StatusBadge status={marketplace.api_status} />
            </div>

            {isExpired && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">Token expired. Please reconnect.</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isExpired ? (
                <Button size="sm" className="flex-1" variant="warning" onClick={() => onOpenSettings(marketplace)}>
                  Reconnect
                </Button>
              ) : (
                <Button size="sm" className="flex-1" variant="outline" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={handleSync}>
                  Sync Now
                </Button>
              )}
              <Button size="icon-sm" variant="ghost" title="Settings" onClick={() => onOpenSettings(marketplace)}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon-sm" variant="ghost" title="Open store" onClick={() => window.open(info.description, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Features included:</p>
              <div className="flex flex-wrap gap-1.5">
                {info.features.map((f) => (
                  <Badge key={f} variant="gray" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            <Button size="sm" className="w-full" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={handleConnect}>
              Connect {marketplace.name}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

export function MarketplacesPage() {
  const { data: marketplaces = mockMarketplaces, refetch } = useMarketplaces()
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>('all')
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpenModal = (mp: Marketplace) => {
    setSelectedMarketplace(mp)
    setModalOpen(true)
  }

  const handleAddMarketplace = () => {
    const disconnected = marketplaces.find((m) => m.status === 'disconnected')
    setSelectedMarketplace(disconnected || marketplaces[0])
    setModalOpen(true)
  }

  const filtered = marketplaces.filter((mp) => {
    if (filter === 'all') return true
    if (filter === 'connected') return mp.status === 'connected' || mp.status === 'expired'
    return mp.status === 'disconnected'
  })

  const connectedCount = marketplaces.filter((m) => m.status === 'connected').length
  const totalProducts = marketplaces.reduce((s, m) => s + m.product_count, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplaces</h1>
          <p className="text-sm text-muted-foreground">
            {connectedCount} connected · {totalProducts} products across all channels
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddMarketplace}>
          Add Marketplace
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Connected', value: connectedCount, color: 'text-emerald-600' },
          { label: 'Disconnected', value: marketplaces.filter(m => m.status === 'disconnected').length, color: 'text-muted-foreground' },
          { label: 'Expired', value: marketplaces.filter(m => m.status === 'expired').length, color: 'text-amber-600' },
          { label: 'Total Products', value: totalProducts, color: 'text-blue-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'connected', 'disconnected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors border',
              filter === f ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Marketplace Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((mp) => (
          <MarketplaceCard key={mp.id} marketplace={mp} onOpenSettings={handleOpenModal} />
        ))}
      </div>

      {/* Integration Modal */}
      {selectedMarketplace && (
        <MarketplaceIntegrationModal
          marketplace={selectedMarketplace}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
