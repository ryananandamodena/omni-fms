import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  FolderTree,
  Folder,
  FolderOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2,
  Layers,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Check,
  X,
  Tag,
  BarChart3,
  Grid3X3,
  List,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryMappings,
  useSaveCategoryMapping,
  useAutoMapCategory,
  CategoryItem,
  CategoryMappingItem,
} from '@/api/categories'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

// ── Konfigurasi Marketplace dengan Warna Kontras Jelas ─────────────────────────
export const MARKETPLACES = [
  {
    id: 'shopee',
    name: 'Shopee',
    emoji: '🛒',
    color: '#D03B1E',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/70',
    badgeBorder: 'border-2 border-orange-400 dark:border-orange-600',
    badgeText: 'text-orange-950 dark:text-orange-100',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    emoji: '🟢',
    color: '#008A4B',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeBorder: 'border-2 border-emerald-400 dark:border-emerald-600',
    badgeText: 'text-emerald-950 dark:text-emerald-100',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    emoji: '🔵',
    color: '#1A56DB',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeBorder: 'border-2 border-blue-400 dark:border-blue-600',
    badgeText: 'text-blue-950 dark:text-blue-100',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    emoji: '⚫',
    color: '#18181B',
    badgeBg: 'bg-zinc-200 dark:bg-zinc-800',
    badgeBorder: 'border-2 border-zinc-400 dark:border-zinc-500',
    badgeText: 'text-zinc-950 dark:text-zinc-100',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    emoji: '💙',
    color: '#007CB7',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/70',
    badgeBorder: 'border-2 border-sky-400 dark:border-sky-600',
    badgeText: 'text-sky-950 dark:text-sky-100',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    emoji: '🟩',
    color: '#15803D',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/70',
    badgeBorder: 'border-2 border-teal-400 dark:border-teal-600',
    badgeText: 'text-teal-950 dark:text-teal-100',
  },
]

// ── Breadcrumb Taksonomi dengan Teks Sangat Jelas ─────────────────────────────
function FormattedCategoryPath({ path, className }: { path: string; className?: string }) {
  const parts = path.split('>').map((p) => p.trim())
  if (parts.length <= 1) {
    return <span className={cn('font-bold text-slate-900 dark:text-white', className)}>{path}</span>
  }
  const rootAndParents = parts.slice(0, -1).join(' › ')
  const leaf = parts[parts.length - 1]

  return (
    <div className={cn('text-xs leading-snug', className)}>
      <span className="text-slate-600 dark:text-slate-400 font-medium">{rootAndParents} › </span>
      <span className="font-extrabold text-slate-900 dark:text-white">{leaf}</span>
    </div>
  )
}

// ── Kartu Kategori Hirarki (Tree Card) ─────────────────────────────────────────
function CategoryCardItem({
  cat,
  categories,
  mappings,
  onEdit,
  onDelete,
  onAddSub,
  onOpenMapping,
  depth = 0,
  forceExpanded,
}: {
  cat: CategoryItem
  categories: CategoryItem[]
  mappings: CategoryMappingItem[]
  onEdit: (cat: CategoryItem) => void
  onDelete: (cat: CategoryItem) => void
  onAddSub: (parentId: string) => void
  onOpenMapping: (cat: CategoryItem, mpId: string) => void
  depth?: number
  forceExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const isExpanded = forceExpanded !== undefined ? forceExpanded : expanded

  const children = categories.filter((c) => c.parent_id === cat.id)
  const catMappings = mappings.filter((m) => m.master_category_id === cat.id)
  const mappedCount = catMappings.length
  const totalChannels = MARKETPLACES.length

  const isFullyMapped = mappedCount === totalChannels
  const isPartiallyMapped = mappedCount > 0 && mappedCount < totalChannels

  return (
    <div className={cn('group relative transition-all duration-150', depth > 0 && 'ml-6 sm:ml-10')}>
      {/* Garis konektor hirarki */}
      {depth > 0 && (
        <div className="absolute -left-6 sm:-left-8 top-7 w-5 sm:w-7 h-7 border-l-2 border-b-2 border-primary/50 rounded-bl-xl pointer-events-none" />
      )}

      <div
        className={cn(
          'relative rounded-xl border-2 transition-all duration-200 bg-card overflow-hidden shadow-xs hover:shadow-md',
          depth === 0
            ? 'border-slate-300 dark:border-slate-700 hover:border-primary'
            : 'border-slate-200 dark:border-slate-750 bg-card/95 hover:border-primary/70',
        )}
      >
        {/* Garis indikator status warna atas */}
        <div
          className={cn(
            'h-1.5 w-full',
            isFullyMapped
              ? 'bg-emerald-600'
              : isPartiallyMapped
              ? 'bg-amber-500'
              : 'bg-rose-500',
          )}
        />

        <div className="p-4 sm:p-5">
          {/* Baris Utama: Ikon, Nama, Badges, dan Tombol Aksi */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Expand Toggle + Folder Icon */}
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                {children.length > 0 ? (
                  <button
                    onClick={() => setExpanded(!isExpanded)}
                    title={isExpanded ? 'Tutup sub-kategori' : 'Buka sub-kategori'}
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary/20 text-slate-900 dark:text-white hover:text-primary transition-colors border border-slate-300 dark:border-slate-600 font-bold"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}

                <div
                  className={cn(
                    'h-11 w-11 rounded-xl flex items-center justify-center border-2 shadow-xs',
                    depth === 0
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white',
                  )}
                >
                  {children.length > 0 && isExpanded ? (
                    <FolderOpen className="h-6 w-6" />
                  ) : (
                    <Folder className="h-6 w-6" />
                  )}
                </div>
              </div>

              {/* Title, Badges & Keterangan */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={cn(
                      'font-black tracking-tight text-slate-900 dark:text-white leading-tight',
                      depth === 0 ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
                    )}
                  >
                    {cat.name}
                  </h3>

                  {depth === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-400">
                      Kategori Induk
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-400">
                      Subkategori
                    </span>
                  )}

                  {children.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-100 border border-indigo-300">
                      {children.length} Sub-kategori
                    </span>
                  )}

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                    slug: {cat.slug}
                  </span>
                </div>

                {cat.description && (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side: SKU & Tombol Tindakan */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-xs font-black">
                <Tag className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
                <span>{cat.product_count}</span>
                <span className="text-slate-600 dark:text-slate-300 font-bold">SKU</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 dark:border-emerald-600 hover:bg-emerald-100"
                  title="Tambah Subkategori ke kategori ini"
                  onClick={() => onAddSub(cat.id)}
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                  <span className="hidden md:inline">Sub-kategori</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-100"
                  title="Edit data kategori"
                  onClick={() => onEdit(cat)}
                >
                  <Edit2 className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300 stroke-[2.5]" />
                  <span className="hidden md:inline">Edit</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs font-bold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-600 hover:bg-rose-100"
                  title="Hapus kategori ini"
                  onClick={() => onDelete(cat)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-700 dark:text-rose-300 stroke-[2.5]" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Status Pemetaan Marketplace Grid ── */}
          <div className="mt-4 pt-3.5 border-t-2 border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Kanal E-Commerce:
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  (Klik kanal untuk hubungkan atau ubah pemetaan)
                </span>
              </div>

              {/* Progress status pill */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border-2 shadow-2xs',
                    isFullyMapped
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border-emerald-500'
                      : isPartiallyMapped
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 border-amber-500'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-100 border-rose-500',
                  )}
                >
                  {isFullyMapped ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                      Lengkap ({mappedCount}/{totalChannels} Kanal)
                    </>
                  ) : isPartiallyMapped ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                      Sebagian ({mappedCount}/{totalChannels} Kanal)
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-rose-700 dark:text-rose-300" />
                      Belum Dipetakan (0/{totalChannels})
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Grid 6 Marketplace Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {MARKETPLACES.map((mp) => {
                const mapping = catMappings.find((m) => m.marketplace_id === mp.id)
                return (
                  <button
                    key={mp.id}
                    onClick={() => onOpenMapping(cat, mp.id)}
                    className={cn(
                      'flex flex-col text-left p-2.5 rounded-xl transition-all duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-primary',
                      mapping
                        ? `${mp.badgeBg} ${mp.badgeBorder} shadow-xs hover:brightness-95`
                        : 'bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-white dark:hover:bg-slate-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{mp.emoji}</span>
                        <span
                          className={cn(
                            'text-xs font-black truncate',
                            mapping ? mp.badgeText : 'text-slate-900 dark:text-white',
                          )}
                        >
                          {mp.name}
                        </span>
                      </div>
                      {mapping ? (
                        <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-800 dark:text-slate-200">
                          <Plus className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Mapping Path or Connect Prompt */}
                    {mapping ? (
                      <div className="mt-0.5 min-w-0">
                        <p className="text-[11px] font-mono font-black text-slate-900 dark:text-white truncate">
                          #{mapping.marketplace_category_id}
                        </p>
                        <p
                          className={cn(
                            'text-xs font-bold leading-tight truncate mt-0.5',
                            mp.badgeText,
                          )}
                          title={mapping.marketplace_category_path}
                        >
                          {mapping.marketplace_category_path.split('>').pop()?.trim()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <Link2 className="h-3.5 w-3.5 text-primary" />
                        + Petakan
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Render Subkategori Anak */}
      {isExpanded && children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <CategoryCardItem
              key={child.id}
              cat={child}
              categories={categories}
              mappings={mappings}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSub={onAddSub}
              onOpenMapping={onOpenMapping}
              depth={depth + 1}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sel Matriks Pemetaan Kategori ─────────────────────────────────────────────
function MappingCell({
  mp,
  mapping,
  onOpen,
}: {
  mp: (typeof MARKETPLACES)[0]
  mapping?: CategoryMappingItem
  onOpen: () => void
}) {
  if (mapping) {
    return (
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        className={cn(
          'group relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md',
          mp.badgeBg,
          mp.badgeBorder,
        )}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 shadow-2xs">
            #{mapping.marketplace_category_id}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-950 dark:text-emerald-100 bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded-full border border-emerald-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-300 stroke-[2.5]" />
            Terhubung
          </span>
        </div>

        <FormattedCategoryPath
          path={mapping.marketplace_category_path}
          className="line-clamp-2"
        />

        <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
          <span>Klik untuk ubah pemetaan</span>
          <Edit2 className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onOpen}
      className={cn(
        'w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed transition-all duration-150 group min-h-[84px]',
        'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5 text-slate-900 dark:text-white',
      )}
    >
      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
        <Plus className="h-4 w-4 text-slate-800 dark:text-slate-200 group-hover:text-primary group-hover:scale-110 transition-transform stroke-[2.5]" />
      </div>
      <span className="text-xs font-black text-slate-900 dark:text-white">
        + Petakan ke {mp.name}
      </span>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// HALAMAN UTAMA: Kategori & Pemetaan Multi-Kanal
// ══════════════════════════════════════════════════════════════════════════════
export function CategoriesPage() {
  const { data: categories = [], isLoading, refetch } = useCategories()
  const { data: mappings = [], refetch: refetchMappings } = useCategoryMappings()

  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const saveMappingMutation = useSaveCategoryMapping()
  const autoMapMutation = useAutoMapCategory()

  // State Kontrol Tampilan
  const [activeTab, setActiveTab] = useState<'master' | 'mapping'>('master')
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'partial' | 'unmapped'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'root' | 'sub'>('all')
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined)

  // State Modal Kategori
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catParentId, setCatParentId] = useState<string>('')
  const [catDesc, setCatDesc] = useState('')

  // State Modal Pemetaan Marketplace & AI
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [selectedCatForMapping, setSelectedCatForMapping] = useState<CategoryItem | null>(null)
  const [selectedMpForMapping, setSelectedMpForMapping] = useState(MARKETPLACES[0])
  const [mappedCatId, setMappedCatId] = useState('')
  const [mappedCatPath, setMappedCatPath] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string; path: string; reason: string } | null>(null)

  // Metrik Perhitungan
  const topLevelCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const totalCategories = categories.length
  const totalSubcategories = categories.filter((c) => Boolean(c.parent_id)).length
  const totalMapped = mappings.length
  const totalPossibleMappings = totalCategories * MARKETPLACES.length
  const overallMappingRate = Math.min(100, Math.round((totalMapped / Math.max(1, totalPossibleMappings)) * 100))

  const categoryStats = useMemo(() => {
    let fullyMappedCount = 0
    let partiallyMappedCount = 0
    let unmappedCount = 0

    categories.forEach((cat) => {
      const count = mappings.filter((m) => m.master_category_id === cat.id).length
      if (count === MARKETPLACES.length) fullyMappedCount++
      else if (count > 0) partiallyMappedCount++
      else unmappedCount++
    })

    return { fullyMappedCount, partiallyMappedCount, unmappedCount }
  }, [categories, mappings])

  // Filter Kategori
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = search.trim().toLowerCase()
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      if (!matchQuery) return false

      if (levelFilter === 'root' && c.parent_id) return false
      if (levelFilter === 'sub' && !c.parent_id) return false

      const count = mappings.filter((m) => m.master_category_id === c.id).length
      if (statusFilter === 'complete' && count !== MARKETPLACES.length) return false
      if (statusFilter === 'partial' && (count === 0 || count === MARKETPLACES.length)) return false
      if (statusFilter === 'unmapped' && count > 0) return false

      return true
    })
  }, [categories, mappings, search, statusFilter, levelFilter])

  const filteredTopLevel = useMemo(() => {
    return filteredCategories.filter((c) => !c.parent_id)
  }, [filteredCategories])

  // Handlers CRUD
  const handleOpenAddCategory = (parentId?: string) => {
    setEditingCategory(null)
    setCatName('')
    setCatSlug('')
    setCatParentId(parentId || '')
    setCatDesc('')
    setCategoryModalOpen(true)
  }

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatParentId(cat.parent_id || '')
    setCatDesc(cat.description || '')
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      toast.error('Nama kategori tidak boleh kosong')
      return
    }
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: { name: catName, slug: catSlug, parent_id: catParentId || undefined, description: catDesc },
        })
        toast.success(`Kategori "${catName}" berhasil diperbarui`)
      } else {
        await createCategoryMutation.mutateAsync({
          name: catName,
          slug: catSlug,
          parent_id: catParentId || undefined,
          description: catDesc,
        })
        toast.success(`Kategori "${catName}" berhasil ditambahkan`)
      }
      setCategoryModalOpen(false)
      refetch()
    } catch {
      toast.error('Gagal menyimpan kategori')
    }
  }

  const handleDeleteCategory = async (cat: CategoryItem) => {
    const childCount = categories.filter((c) => c.parent_id === cat.id).length
    const warningMsg = childCount > 0
      ? `Kategori "${cat.name}" memiliki ${childCount} sub-kategori. Menghapus kategori ini juga akan memengaruhi sub-kategori. Lanjutkan?`
      : `Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`

    if (!confirm(warningMsg)) return
    try {
      await deleteCategoryMutation.mutateAsync(cat.id)
      toast.success(`Kategori "${cat.name}" berhasil dihapus`)
      refetch()
    } catch {
      toast.error('Gagal menghapus kategori')
    }
  }

  // Handlers Mapping
  const handleOpenMappingModal = (cat: CategoryItem, mpId = 'shopee') => {
    const targetMp = MARKETPLACES.find((m) => m.id === mpId) || MARKETPLACES[0]
    setSelectedCatForMapping(cat)
    setSelectedMpForMapping(targetMp)
    setAiSuggestion(null)
    const existing = mappings.find((m) => m.master_category_id === cat.id && m.marketplace_id === targetMp.id)
    setMappedCatId(existing?.marketplace_category_id || '')
    setMappedCatPath(existing?.marketplace_category_path || '')
    setMappingModalOpen(true)
  }

  const handleAutoSuggest = async () => {
    if (!selectedCatForMapping) return
    try {
      toast.loading('AI sedang menganalisis katalog kategori marketplace...', { id: 'ai-map' })
      const res = await autoMapMutation.mutateAsync({
        categoryName: selectedCatForMapping.name,
        marketplaceId: selectedMpForMapping.id,
      })
      toast.dismiss('ai-map')
      setMappedCatId(res.category_id)
      setMappedCatPath(res.category_path)
      setAiSuggestion({ id: res.category_id, path: res.category_path, reason: res.ai_reasoning })
      toast.success('Rekomendasi taksonomi AI berhasil ditemukan!')
    } catch {
      toast.dismiss('ai-map')
      toast.error('Gagal memuat rekomendasi AI')
    }
  }

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCatForMapping || !mappedCatId || !mappedCatPath) {
      toast.error('Lengkapi ID Kategori dan Jalur Taksonomi')
      return
    }
    try {
      await saveMappingMutation.mutateAsync({
        master_category_id: selectedCatForMapping.id,
        marketplace_id: selectedMpForMapping.id,
        marketplace_category_id: mappedCatId,
        marketplace_category_path: mappedCatPath,
      })
      toast.success(`Pemetaan ke ${selectedMpForMapping.name} berhasil disimpan!`)
      setMappingModalOpen(false)
      refetchMappings()
    } catch {
      toast.error('Gagal menyimpan pemetaan kategori')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-primary/20 text-primary border-2 border-primary/40 flex items-center justify-center shadow-xs">
              <FolderTree className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Kategori & Pemetaan Multi-Kanal
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/20 text-primary border border-primary/40">
                  Omnichannel FMS
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
            Atur taksonomi master produk dan petakan ke struktur kategori resmi 6 marketplace e-commerce secara akurat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            variant="outline"
            size="default"
            className="border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            leftIcon={<RefreshCw className={cn('h-4 w-4 stroke-[2.5]', isLoading && 'animate-spin')} />}
            onClick={() => {
              refetch()
              refetchMappings()
            }}
          >
            Segarkan
          </Button>

          <Button
            size="default"
            className="font-extrabold shadow-sm bg-primary hover:bg-primary/90 text-white"
            leftIcon={<Plus className="h-4 w-4 stroke-[3]" />}
            onClick={() => handleOpenAddCategory()}
          >
            Tambah Kategori Baru
          </Button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Master Kategori */}
        <Card
          hover
          onClick={() => {
            setActiveTab('master')
            setLevelFilter('all')
            setStatusFilter('all')
          }}
          className="p-5 relative overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-card shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Master Kategori
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <FolderTree className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{topLevelCategories.length}</p>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Kategori Induk</span>
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white">+{totalSubcategories}</span> subkategori terdaftar
          </p>
        </Card>

        {/* Card 2: Kanal Terhubung */}
        <Card className="p-5 relative overflow-hidden border-2 border-emerald-300 dark:border-emerald-800 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
              Kanal Marketplace
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Layers className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">6 Kanal</p>
            <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">Siap Sinkron</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {MARKETPLACES.map((mp) => (
              <span
                key={mp.id}
                title={mp.name}
                className={cn('text-xs px-2 py-0.5 rounded font-bold border-2', mp.badgeBg, mp.badgeBorder, mp.badgeText)}
              >
                {mp.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Card 3: Status Pemetaan */}
        <Card
          hover
          onClick={() => {
            setActiveTab('master')
            setStatusFilter(categoryStats.unmappedCount > 0 ? 'unmapped' : 'all')
          }}
          className="p-5 relative overflow-hidden border-2 border-blue-300 dark:border-blue-800 bg-card shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider">
              Relasi Pemetaan
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Link2 className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{totalMapped}</p>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">/ {totalPossibleMappings} kemungkinan</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-emerald-800 dark:text-emerald-200 font-black">
              ✓ {categoryStats.fullyMappedCount} Lengkap
            </span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="text-amber-800 dark:text-amber-200 font-black">
              ⚠️ {categoryStats.partiallyMappedCount + categoryStats.unmappedCount} Butuh Pemetaan
            </span>
          </div>
        </Card>

        {/* Card 4: Coverage Rate */}
        <Card className="p-5 relative overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Kelengkapan (Coverage)
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'text-3xl font-black',
                overallMappingRate >= 75
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : overallMappingRate >= 40
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-rose-700 dark:text-rose-300',
              )}
            >
              {overallMappingRate}%
            </p>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {overallMappingRate >= 75 ? 'Sangat Baik' : overallMappingRate >= 40 ? 'Perlu Ditingkatkan' : 'Perlu Perhatian'}
            </span>
          </div>
          <div className="mt-2.5 w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                overallMappingRate >= 75
                  ? 'bg-emerald-600'
                  : overallMappingRate >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-600',
              )}
              style={{ width: `${overallMappingRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* ── Navigation Tabs + Action Controls ── */}
      <div className="bg-card border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Main Tab Switcher */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1.5 border-2 border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('master')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-extrabold transition-all',
                activeTab === 'master'
                  ? 'bg-card text-slate-900 dark:text-white shadow-xs border-2 border-primary/50'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
              )}
            >
              <FolderTree className="h-4 w-4 text-primary stroke-[2.5]" />
              <span>Daftar Hirarki Kategori</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-primary/20 text-primary">
                {totalCategories}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mapping')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-extrabold transition-all',
                activeTab === 'mapping'
                  ? 'bg-card text-slate-900 dark:text-white shadow-xs border-2 border-blue-500/50'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
              )}
            >
              <Grid3X3 className="h-4 w-4 text-blue-600 stroke-[2.5]" />
              <span>Matriks Pemetaan Multi-Kanal</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100 border border-blue-300">
                {totalMapped} Relasi
              </span>
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 dark:text-slate-300 stroke-[2.5]" />
              <input
                type="text"
                placeholder="Cari nama kategori atau slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-background pl-9 pr-8 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 p-0.5 rounded-md"
                >
                  <X className="h-4 w-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Filter & Display Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t-2 border-slate-200 dark:border-slate-700">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-900 dark:text-white mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-4 w-4 text-primary stroke-[2.5]" />
              Filter:
            </span>

            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-extrabold transition-all border-2',
                statusFilter === 'all'
                  ? 'bg-primary text-white border-primary shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-200',
              )}
            >
              Semua ({totalCategories})
            </button>

            <button
              onClick={() => setStatusFilter('unmapped')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-black transition-all border-2',
                statusFilter === 'unmapped'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700 hover:bg-rose-200',
              )}
            >
              Belum Terpetakan ({categoryStats.unmappedCount})
            </button>

            <button
              onClick={() => setStatusFilter('partial')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-black transition-all border-2',
                statusFilter === 'partial'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-700 hover:bg-amber-200',
              )}
            >
              Sebagian ({categoryStats.partiallyMappedCount})
            </button>

            <button
              onClick={() => setStatusFilter('complete')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-black transition-all border-2',
                statusFilter === 'complete'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700 hover:bg-emerald-200',
              )}
            >
              Lengkap ({categoryStats.fullyMappedCount})
            </button>
          </div>

          {/* Level Filter + Expand/Collapse + View Mode */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {activeTab === 'master' && (
              <>
                {/* Expand / Collapse All */}
                <div className="flex items-center gap-1.5 border-r-2 border-slate-300 dark:border-slate-700 pr-3">
                  <button
                    onClick={() => setForceExpandAll(true)}
                    className="px-2.5 py-1 rounded-md text-xs font-black text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Buka semua sub-kategori"
                  >
                    Buka Semua
                  </button>
                  <span className="text-slate-400 font-bold">•</span>
                  <button
                    onClick={() => setForceExpandAll(false)}
                    className="px-2.5 py-1 rounded-md text-xs font-black text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Tutup semua sub-kategori"
                  >
                    Tutup Semua
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border-2 border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black transition-all',
                      viewMode === 'tree'
                        ? 'bg-card text-slate-900 dark:text-white shadow-2xs border border-slate-300'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
                    )}
                    title="Tampilan Pohon Hirarki"
                  >
                    <FolderTree className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Hirarki</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black transition-all',
                      viewMode === 'list'
                        ? 'bg-card text-slate-900 dark:text-white shadow-2xs border border-slate-300'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
                    )}
                    title="Tampilan Tabel Baris"
                  >
                    <List className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Tabel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: DAFTAR HIRARKI KATEGORI MASTER
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'master' && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl skeleton" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-700 dark:text-slate-300">
                <FolderTree className="h-8 w-8 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">
                {search || statusFilter !== 'all' ? 'Tidak Ada Kategori yang Sesuai Filter' : 'Belum Ada Kategori'}
              </h3>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-md mb-5 leading-relaxed">
                {search || statusFilter !== 'all'
                  ? 'Coba ganti kata kunci pencarian atau sesuaikan opsi filter status untuk melihat kategori lainnya.'
                  : 'Mulai bangun katalog omnichannel Anda dengan menambahkan kategori master pertama.'}
              </p>
              {search || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold border-2"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setLevelFilter('all')
                  }}
                >
                  Reset Semua Filter
                </Button>
              ) : (
                <Button size="default" className="font-bold" leftIcon={<Plus className="h-4 w-4 stroke-[3]" />} onClick={() => handleOpenAddCategory()}>
                  Tambah Kategori Pertama
                </Button>
              )}
            </Card>
          ) : viewMode === 'tree' ? (
            /* ── Tree View ── */
            <div className="space-y-4">
              {filteredTopLevel.map((cat) => (
                <CategoryCardItem
                  key={cat.id}
                  cat={cat}
                  categories={categories}
                  mappings={mappings}
                  onEdit={handleOpenEditCategory}
                  onDelete={handleDeleteCategory}
                  onAddSub={handleOpenAddCategory}
                  onOpenMapping={handleOpenMappingModal}
                  forceExpanded={forceExpandAll}
                />
              ))}

              {/* Subkategori yang cocok dengan search/filter jika induknya tidak masuk filter */}
              {search &&
                filteredCategories
                  .filter((c) => c.parent_id && !filteredTopLevel.find((t) => t.id === c.parent_id))
                  .map((cat) => (
                    <CategoryCardItem
                      key={cat.id}
                      cat={cat}
                      categories={categories}
                      mappings={mappings}
                      onEdit={handleOpenEditCategory}
                      onDelete={handleDeleteCategory}
                      onAddSub={handleOpenAddCategory}
                      onOpenMapping={handleOpenMappingModal}
                      forceExpanded={forceExpandAll}
                    />
                  ))}
            </div>
          ) : (
            /* ── List / Table View ── */
            <Card className="overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="px-5 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Nama Kategori & Jalur
                      </th>
                      <th className="px-4 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Slug URL
                      </th>
                      <th className="px-4 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Tingkatan
                      </th>
                      <th className="px-4 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider text-center">
                        Total SKU
                      </th>
                      <th className="px-4 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Kelengkapan Marketplace
                      </th>
                      <th className="px-5 py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                    {filteredCategories.map((cat) => {
                      const isSub = Boolean(cat.parent_id)
                      const catMappings = mappings.filter((m) => m.master_category_id === cat.id)
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-5 py-4">
                            <div className={cn('flex items-center gap-2.5', isSub && 'pl-6')}>
                              {isSub ? (
                                <ArrowRight className="h-4 w-4 text-primary stroke-[3] shrink-0" />
                              ) : (
                                <Folder className="h-5 w-5 text-primary stroke-[2.5] shrink-0" />
                              )}
                              <div>
                                <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{cat.name}</p>
                                {cat.description && (
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">{cat.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{cat.slug}</td>
                          <td className="px-4 py-4">
                            {cat.parent_name ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200 dark:bg-slate-750 text-slate-900 dark:text-white border border-slate-400">
                                Sub dari: {cat.parent_name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-950 dark:text-blue-100 border-2 border-blue-400">
                                Utama (Induk)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-750 text-slate-900 dark:text-white font-black text-xs border border-slate-300">
                              {cat.product_count} SKU
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {MARKETPLACES.map((mp) => {
                                const m = catMappings.find((x) => x.marketplace_id === mp.id)
                                return (
                                  <button
                                    key={mp.id}
                                    onClick={() => handleOpenMappingModal(cat, mp.id)}
                                    title={m ? `${mp.name}: ${m.marketplace_category_path}` : `Petakan ke ${mp.name}`}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black border-2 transition-all',
                                      m
                                        ? `${mp.badgeBg} ${mp.badgeBorder} ${mp.badgeText}`
                                        : 'bg-slate-100 dark:bg-slate-800 border-dashed border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:border-primary',
                                    )}
                                  >
                                    <span>{mp.name}</span>
                                    {m ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Plus className="h-3.5 w-3.5 stroke-[3]" />}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-bold text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-950 border-2 border-blue-400 hover:bg-blue-100"
                                onClick={() => handleOpenEditCategory(cat)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs font-bold text-rose-900 dark:text-rose-100 bg-rose-50 dark:bg-rose-950 border-2 border-rose-400 hover:bg-rose-100"
                                onClick={() => handleDeleteCategory(cat)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: MATRIKS PEMETAAN MULTI-KANAL (GRID TABLE)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          {/* Header Penjelasan Singkat */}
          <div className="p-4 rounded-xl bg-blue-100/80 dark:bg-blue-950/70 border-2 border-blue-300 dark:border-blue-700 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-800 dark:text-blue-300 shrink-0 mt-0.5 stroke-[2.5]" />
            <div className="text-xs sm:text-sm font-semibold text-blue-950 dark:text-blue-100 leading-relaxed">
              <strong className="font-black">Panduan Matriks Pemetaan:</strong> Setiap produk yang Anda unggah ke
              marketplace memerlukan ID taksonomi kategori resmi. Klik pada sel yang berstatus <em>"+ Petakan"</em> untuk
              menghubungkan kategori master dengan taksonomi marketplace target menggunakan bantuan AI atau manual.
            </div>
          </div>

          <Card className="overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider w-64 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r-2 border-slate-300 dark:border-slate-700">
                      Kategori Master
                    </th>
                    {MARKETPLACES.map((mp) => {
                      const count = mappings.filter((m) => m.marketplace_id === mp.id).length
                      return (
                        <th key={mp.id} className="px-3.5 py-4 text-left min-w-[220px]">
                          <div className={cn('flex items-center justify-between p-2.5 rounded-xl border-2', mp.badgeBg, mp.badgeBorder)}>
                            <div className="flex items-center gap-1.5 font-black text-xs" style={{ color: mp.color }}>
                              <span className="text-base">{mp.emoji}</span>
                              <span className="text-slate-900 dark:text-white">{mp.name}</span>
                            </div>
                            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 shadow-2xs">
                              {count} Terhubung
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={MARKETPLACES.length + 1} className="px-5 py-12 text-center text-slate-700 dark:text-slate-300 font-bold">
                        Tidak ada kategori yang cocok dengan kriteria pencarian
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isSub = Boolean(cat.parent_id)
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Sticky Left Column: Master Category */}
                          <td className="px-5 py-4 sticky left-0 bg-card border-r-2 border-slate-300 dark:border-slate-700 z-10 align-top">
                            <div className={cn('flex items-start gap-2.5', isSub && 'pl-5')}>
                              {isSub ? (
                                <ArrowRight className="h-4 w-4 text-primary stroke-[3] shrink-0 mt-0.5" />
                              ) : (
                                <Folder className="h-5 w-5 text-primary stroke-[2.5] shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{cat.name}</p>
                                <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">{cat.slug}</p>
                                <span className="inline-block text-xs font-extrabold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-750 px-2 py-0.5 rounded mt-1 border border-slate-300">
                                  {cat.product_count} SKU
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 6 Marketplace Mapping Cells */}
                          {MARKETPLACES.map((mp) => {
                            const mapping = mappings.find(
                              (m) => m.master_category_id === cat.id && m.marketplace_id === mp.id,
                            )
                            return (
                              <td key={mp.id} className="px-3 py-3 align-top">
                                <MappingCell
                                  mp={mp}
                                  mapping={mapping}
                                  onOpen={() => handleOpenMappingModal(cat, mp.id)}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: Tambah / Edit Kategori Master (Lega, Spacious max-w-4xl / 5xl & Portaled)
      ════════════════════════════════════════════════════════════════════════ */}
      {categoryModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setCategoryModalOpen(false)}
            />
            <div className="relative w-full max-w-4xl xl:max-w-5xl rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-card shadow-2xl overflow-hidden animate-slide-in max-h-[92vh] flex flex-col z-10">
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary border-2 border-primary/40 flex items-center justify-center">
                    <Folder className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {editingCategory ? 'Edit Kategori Master' : 'Tambah Kategori Master Baru'}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      {editingCategory
                        ? `Memperbarui taksonomi katalog untuk "${editingCategory.name}"`
                        : 'Kategori ini akan menjadi acuan induk seluruh produk omnichannel Anda'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Form & Live Preview Body (Spacious 2-Column Grid) */}
              <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                  {/* Kolom Kiri: Form Input Data (7 Kolom) */}
                  <div className="lg:col-span-7 space-y-4">
                    <Input
                      label="Nama Kategori Master"
                      value={catName}
                      onChange={(e) => {
                        setCatName(e.target.value)
                        if (!editingCategory) {
                          setCatSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, ''),
                          )
                        }
                      }}
                      placeholder="Contoh: Kompor Gas Tanam (Gas Hobs)"
                      required
                    />

                    <Input
                      label="Slug URL Kategori"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="kompor-gas-tanam"
                      hint="Format URL unik sistem untuk katalog produk (dihasilkan otomatis)"
                      required
                    />

                    <div>
                      <label className="mb-1.5 block text-sm font-black text-slate-900 dark:text-white">
                        Kategori Induk (Parent Category)
                      </label>
                      <select
                        value={catParentId}
                        onChange={(e) => setCatParentId(e.target.value)}
                        className="flex h-11 w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-background px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      >
                        <option value="">— Tidak ada (Jadikan Kategori Utama / Root)</option>
                        {topLevelCategories
                          .filter((c) => (editingCategory ? c.id !== editingCategory.id : true))
                          .map((top) => (
                            <option key={top.id} value={top.id}>
                              📁 {top.name}
                            </option>
                          ))}
                      </select>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Pilih kategori induk jika kategori ini merupakan sub-kelompok dari kategori utama yang ada.
                      </p>
                    </div>

                    <Textarea
                      label="Deskripsi Kategori (Opsional)"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Deskripsi singkat jenis produk atau spesifikasi yang termasuk dalam kategori ini..."
                      rows={4}
                    />
                  </div>

                  {/* Kolom Kanan: Live Preview & Panduan (5 Kolom) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Live Preview Card */}
                    <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <FolderTree className="h-4 w-4 text-primary" />
                          Pratinjau Kartu Kategori
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                          Live Preview
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-card shadow-xs space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                            <Folder className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900 dark:text-white text-sm truncate">
                              {catName.trim() || 'Nama Kategori Baru'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-300">
                                {catParentId ? 'Subkategori' : 'Kategori Induk'}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300">
                                slug: {catSlug.trim() || 'slug-kategori'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {catDesc.trim() || 'Belum ada deskripsi yang ditambahkan untuk kategori ini.'}
                        </p>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                          <span>📦 0 SKU Produk</span>
                          <span className="text-amber-800 dark:text-amber-200">⚠️ Butuh Pemetaan Kanal</span>
                        </div>
                      </div>
                    </div>

                    {/* Panduan Singkat */}
                    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 p-4 space-y-2">
                      <p className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-blue-600 shrink-0" />
                        Tips Penamaan Taksonomi:
                      </p>
                      <ul className="text-xs font-semibold text-blue-900 dark:text-blue-200 space-y-1.5 list-disc pl-4 leading-relaxed">
                        <li>Gunakan nama umum produk agar algoritma AI lebih mudah mencocokkan taksonomi di Shopee, Tokopedia, Lazada, dll.</li>
                        <li>Kategori induk sebaiknya mewakili lini produk utama (misal: <em>Cooking Appliances</em>).</li>
                        <li>Subkategori digunakan untuk jenis spesifik (misal: <em>Gas Hobs</em> atau <em>Induction Hobs</em>).</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-700 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="font-bold border-2 h-11 px-5"
                    onClick={() => setCategoryModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="font-black h-11 px-7 text-sm shadow-sm"
                    loading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    leftIcon={<Check className="h-4 w-4 stroke-[3]" />}
                  >
                    {editingCategory ? 'Simpan Perubahan Kategori' : 'Buat Kategori Master'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: Pemetaan Kategori Marketplace & AI Taxonomy Matcher (Portaled)
      ════════════════════════════════════════════════════════════════════════ */}
      {mappingModalOpen &&
        selectedCatForMapping &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setMappingModalOpen(false)}
            />
            <div className="relative w-full max-w-3xl xl:max-w-4xl rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-card shadow-2xl overflow-hidden animate-slide-in max-h-[92vh] flex flex-col z-10">
              {/* Header dengan Identitas Marketplace Terpilih */}
              <div
                className="px-6 py-5 border-b-2 border-slate-300 dark:border-slate-700 flex items-center justify-between shrink-0"
                style={{ background: `linear-gradient(135deg, ${selectedMpForMapping.color}25, transparent)` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2"
                    style={{ borderColor: selectedMpForMapping.color, background: `${selectedMpForMapping.color}20` }}
                  >
                    {selectedMpForMapping.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Petakan ke {selectedMpForMapping.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                      Kategori Master:{' '}
                      <strong className="font-black text-slate-900 dark:text-white">{selectedCatForMapping.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMappingModalOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Selector Pilihan Marketplace */}
                <div>
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                    Pilih Kanal Marketplace:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {MARKETPLACES.map((mp) => {
                      const isSelected = selectedMpForMapping.id === mp.id
                      const isMapped = mappings.some(
                        (m) => m.master_category_id === selectedCatForMapping.id && m.marketplace_id === mp.id,
                      )
                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => {
                            setSelectedMpForMapping(mp)
                            setAiSuggestion(null)
                            const existing = mappings.find(
                              (m) => m.master_category_id === selectedCatForMapping.id && m.marketplace_id === mp.id,
                            )
                            setMappedCatId(existing?.marketplace_category_id || '')
                            setMappedCatPath(existing?.marketplace_category_path || '')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center p-2 rounded-xl text-xs font-black border-2 transition-all text-center',
                            isSelected
                              ? `${mp.badgeBg} ${mp.badgeBorder} ${mp.badgeText} ring-2 ring-primary shadow-xs`
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-200',
                          )}
                        >
                          <span className="text-base mb-0.5">{mp.emoji}</span>
                          <span className="truncate w-full text-xs font-black">{mp.name}</span>
                          {isMapped && (
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-200 font-black mt-0.5">
                              ✓ Terhubung
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Banner AI Taxonomy Matcher */}
                <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-black text-sm">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                      <span>AI Taxonomy Matcher</span>
                    </div>
                    <p className="text-xs font-bold text-amber-950 dark:text-amber-200 mt-1 leading-relaxed">
                      AI otomatis mencocokkan taksonomi resmi kategori <strong>"{selectedCatForMapping.name}"</strong> ke
                      standar <strong>{selectedMpForMapping.name}</strong>.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black shadow-xs shrink-0"
                    loading={autoMapMutation.isPending}
                    onClick={handleAutoSuggest}
                    leftIcon={<Zap className="h-3.5 w-3.5 stroke-[2.5]" />}
                  >
                    Rekomendasi AI
                  </Button>
                </div>

                {/* Rekomendasi AI Box (Jika Sudah Ada Hasil) */}
                {aiSuggestion && (
                  <div className="p-4 rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-emerald-100/90 dark:bg-emerald-950/70 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-950 dark:text-emerald-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300 stroke-[2.5]" />
                        Rekomendasi Kategori Ditemukan
                      </span>
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-emerald-300 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-500">
                        ID: #{aiSuggestion.id}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 leading-relaxed">
                      {aiSuggestion.reason}
                    </p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 text-xs font-black text-slate-900 dark:text-white">
                      {aiSuggestion.path}
                    </div>
                  </div>
                )}

                {/* Form Input Detail Pemetaan */}
                <form onSubmit={handleSaveMapping} className="space-y-4">
                  <Input
                    label={`ID Kategori Resmi (${selectedMpForMapping.name})`}
                    value={mappedCatId}
                    onChange={(e) => setMappedCatId(e.target.value)}
                    placeholder="Contoh: 100234 atau 4912"
                    hint={`ID unik kategori internal dari API ${selectedMpForMapping.name}`}
                    required
                  />

                  <Input
                    label="Jalur Taksonomi Kategori (Category Path)"
                    value={mappedCatPath}
                    onChange={(e) => setMappedCatPath(e.target.value)}
                    placeholder="Peralatan Rumah Tangga > Peralatan Dapur > Kompor Tanam"
                    hint="Gunakan tanda panah sudut '>' sebagai pemisah tingkatan hirarki"
                    required
                  />

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="outline" className="font-bold border-2" onClick={() => setMappingModalOpen(false)}>
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="font-black"
                      loading={saveMappingMutation.isPending}
                      leftIcon={<Link2 className="h-4 w-4 stroke-[2.5]" />}
                    >
                      Simpan Pemetaan
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
