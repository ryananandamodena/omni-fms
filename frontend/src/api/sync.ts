import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { mockSyncJobs } from '@/data/mockData'
import type { SyncJob } from '@/types'

export interface BackendSyncJob {
  id: string
  product_id: string
  product_name: string
  channel: string
  action: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'
  message?: string
  created_at: string
  finished_at?: string
}

export const syncApi = {
  listJobs: async (): Promise<SyncJob[]> => {
    try {
      const res = await apiClient.get<{ data: BackendSyncJob[] }>('/sync/jobs')
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data.map((bj) => {
          const chLower = (bj.channel || 'shopee').toLowerCase()
          return {
            id: bj.id,
            product_id: bj.product_id,
            product: {
              id: bj.product_id,
              sku: `MDN-${bj.product_id}`,
              name: bj.product_name || `Product ${bj.product_id}`,
            },
            channel_product_id: `cp-${bj.id}`,
            marketplace_account_id: bj.channel,
            marketplace: {
              id: bj.channel,
              marketplace_id: (chLower === 'tokopedia' || chLower === 'lazada' || chLower === 'tiktok' || chLower === 'blibli' || chLower === 'shopify') ? chLower : 'shopee',
              name: bj.channel,
            },
            action: (bj.action as SyncJob['action']) || 'update',
            status: bj.status === 'processing' ? 'processing' : bj.status === 'failed' ? 'failed' : 'success',
            attempt: 1,
            max_attempts: 3,
            created_at: bj.created_at,
            started_at: bj.created_at,
            finished_at: bj.finished_at,
            error_message: bj.message,
          }
        })
      }
      return mockSyncJobs
    } catch {
      return mockSyncJobs
    }
  },

  triggerSync: async (params: { productId: string; channel?: string; action?: string }): Promise<BackendSyncJob> => {
    const res = await apiClient.post<{ message: string; job: BackendSyncJob }>('/sync/trigger', {
      product_id: params.productId,
      channel: params.channel || 'all',
      action: params.action || 'update',
    })
    return res.data.job
  },
}

export function useSyncJobs() {
  return useQuery({
    queryKey: ['sync-jobs'],
    queryFn: syncApi.listJobs,
    refetchInterval: 10000,
  })
}

export function useTriggerSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: syncApi.triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
