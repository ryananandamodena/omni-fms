import React, { useState } from 'react'
import { RefreshCw, Search, Filter, RotateCcw, Eye, AlertCircle, CheckCircle, Clock, XCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { mockSyncJobs } from '@/data/mockData'
import { useSyncJobs, useTriggerSync } from '@/api'
import { formatDate, formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { SyncJob, SyncJobStatus } from '@/types'

const statusIcon = (status: SyncJobStatus) => {
  switch (status) {
    case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
    case 'pending': return <Clock className="h-4 w-4 text-amber-500" />
    case 'processing': return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
    case 'cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />
  }
}

export function SyncCenterPage() {
  const { data: apiJobs, refetch: refetchJobs } = useSyncJobs()
  const triggerSyncMutation = useTriggerSync()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobs, setJobs] = useState<SyncJob[]>(mockSyncJobs)

  React.useEffect(() => {
    if (apiJobs && apiJobs.length > 0) {
      setJobs(apiJobs)
    }
  }, [apiJobs])

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.product.name.toLowerCase().includes(q) || j.product.sku.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: jobs.length,
    success: jobs.filter((j) => j.status === 'success').length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  }

  const handleRetry = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId)
    if (targetJob) {
      triggerSyncMutation.mutate({
        productId: targetJob.product_id,
        channel: targetJob.marketplace_account_id,
        action: targetJob.action,
      })
    }
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'pending', attempt: j.attempt + 1 } : j))
    toast.success('Job queued for retry')
  }

  const handleCancelAll = () => {
    setJobs((prev) => prev.map((j) => j.status === 'pending' ? { ...j, status: 'cancelled' } : j))
    toast.success('Pending jobs cancelled')
  }

  const handleSyncAll = () => {
    triggerSyncMutation.mutate(
      { productId: '1', channel: 'all', action: 'update' },
      {
        onSuccess: () => {
          toast.success('All channels sync triggered!')
          refetchJobs()
        },
        onError: () => {
          toast.error('Failed to trigger sync')
        },
      }
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sync Center</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage product synchronization jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancelAll}>
            Cancel Pending
          </Button>
          <Button size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={handleSyncAll}>
            Sync All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'text-foreground' },
          { label: 'Success', value: stats.success, color: 'text-emerald-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Processing', value: stats.processing, color: 'text-blue-600' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter(s.label === 'Total Jobs' ? 'all' : s.label.toLowerCase())}>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            leftIcon={<Search className="h-3.5 w-3.5" />}
            placeholder="Search by product name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-72"
          />
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'pending', 'processing', 'success', 'failed', 'cancelled'] as const).map((s) => (
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
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left">Job ID</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Marketplace</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Attempts</th>
                <th className="px-4 py-3 text-left">Started</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No sync jobs found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const duration = job.started_at && job.finished_at
                    ? Math.round((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)
                    : null

                  return (
                    <React.Fragment key={job.id}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{job.id}</code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{job.product.name}</p>
                          <p className="text-xs text-muted-foreground">{job.product.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{job.marketplace.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                            {job.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {statusIcon(job.status)}
                            <StatusBadge status={job.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{job.attempt}/{job.max_attempts}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {job.started_at ? formatRelativeTime(job.started_at) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {duration !== null ? `${duration}s` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {job.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<RotateCcw className="h-3 w-3" />}
                                onClick={() => handleRetry(job.id)}
                              >
                                Retry
                              </Button>
                            )}
                            <Button size="icon-sm" variant="ghost" title="View details">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {job.error_message && (
                        <tr className="bg-red-50/50 dark:bg-red-900/10">
                          <td colSpan={9} className="px-4 py-2">
                            <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-500" />
                              <div>
                                <span className="font-medium">Error: </span>
                                {job.error_message}
                                {job.error_code && (
                                  <code className="ml-2 text-[10px] bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded">
                                    {job.error_code}
                                  </code>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
