import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Search, Grid, List, Image as ImageIcon, Trash2, Copy, Eye, Tag, Folder, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockMediaAssets } from '@/data/mockData'
import { formatBytes, formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { MediaAsset } from '@/types'

export function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>(mockMediaAssets)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<MediaAsset | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newAssets: MediaAsset[] = acceptedFiles.map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      filename: file.name,
      original_name: file.name,
      url: URL.createObjectURL(file),
      thumbnail_url: URL.createObjectURL(file),
      mime_type: file.type,
      size: file.size,
      width: 800,
      height: 800,
      tags: [],
      created_at: new Date().toISOString(),
    }))
    setAssets((prev) => [...newAssets, ...prev])
    toast.success(`${acceptedFiles.length} file(s) uploaded`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
  })

  const filtered = assets.filter((a) =>
    !search || a.filename.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const deleteSelected = () => {
    setAssets((prev) => prev.filter((a) => !selected.includes(a.id)))
    setSelected([])
    toast.success(`${selected.length} file(s) deleted`)
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">{assets.length} files · {assets.reduce((s, a) => s + a.size, 0) > 0 ? formatBytes(assets.reduce((s, a) => s + a.size, 0)) : '0 B'} total</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>New Folder</Button>
      </div>

      {/* Upload Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('mx-auto h-8 w-8 mb-2', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Supports JPG, JPEG, PNG, WEBP</p>
        <Button size="sm" variant="outline" className="mt-3" type="button">
          Browse Files
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          leftIcon={<Search className="h-3.5 w-3.5" />}
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-64"
        />
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm font-medium text-primary">{selected.length} selected</span>
            <Button size="sm" variant="destructive" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={deleteSelected}>
              Delete
            </Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView('grid')}
            className={cn('rounded-md p-1.5 transition-colors', view === 'grid' ? 'bg-muted' : 'hover:bg-muted/50')}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('rounded-md p-1.5 transition-colors', view === 'list' ? 'bg-muted' : 'hover:bg-muted/50')}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                'group relative rounded-xl border border-border overflow-hidden cursor-pointer transition-all',
                selected.includes(asset.id) && 'ring-2 ring-primary',
                'hover:shadow-md'
              )}
              onClick={() => toggleSelect(asset.id)}
            >
              <div className="aspect-square bg-muted relative">
                <img
                  src={asset.thumbnail_url || asset.url}
                  alt={asset.alt_text || asset.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {selected.includes(asset.id) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(asset) }}
                    className="rounded-md bg-white/90 p-1 shadow hover:bg-white"
                  >
                    <Eye className="h-3 w-3 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(asset.url) }}
                    className="rounded-md bg-white/90 p-1 shadow hover:bg-white"
                  >
                    <Copy className="h-3 w-3 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssets(prev => prev.filter(a => a.id !== asset.id)); toast.success('Deleted') }}
                    className="rounded-md bg-white/90 p-1 shadow hover:bg-white"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{asset.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(asset.size)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No media files found</p>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <Card className="overflow-hidden">
          <table className="data-table w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left">File</th>
                <th className="px-4 py-3 text-left">Size</th>
                <th className="px-4 py-3 text-left">Dimensions</th>
                <th className="px-4 py-3 text-left">Tags</th>
                <th className="px-4 py-3 text-left">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected.includes(asset.id)} onChange={() => toggleSelect(asset.id)} className="rounded" />
                      <img src={asset.thumbnail_url || asset.url} alt={asset.filename} className="h-10 w-10 rounded-lg object-cover border border-border" />
                      <div>
                        <p className="text-sm font-medium">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">{asset.mime_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatBytes(asset.size)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.width}×{asset.height}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.map((tag) => <Badge key={tag} variant="gray">{tag}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(asset.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => setPreview(asset)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => copyUrl(asset.url)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast.success('Deleted') }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <div className="relative max-w-2xl w-full mx-4 rounded-2xl overflow-hidden bg-card" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.filename} className="w-full object-contain max-h-96" />
            <div className="p-4">
              <p className="font-semibold">{preview.filename}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div><p className="font-medium text-foreground">Size</p>{formatBytes(preview.size)}</div>
                <div><p className="font-medium text-foreground">Dimensions</p>{preview.width}×{preview.height}</div>
                <div><p className="font-medium text-foreground">Type</p>{preview.mime_type}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyUrl(preview.url)}>Copy URL</Button>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
