import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { mockMarketplaces } from '@/data/mockData'
import type { Marketplace } from '@/types'

export interface BackendMarketplace {
  id: string
  code: string
  name: string
  logo?: string
  status: string
  shop_name?: string
  shop_id?: string
  item_count?: number
  last_sync?: string
}

export interface ConnectParams {
  code: string
  shop_name?: string
  shop_id?: string
  partner_id?: string
  partner_key?: string
  access_token?: string
  environment?: 'sandbox' | 'production'
  auto_sync?: boolean
}

export interface TestConnectionResponse {
  status: string
  code: string
  latency_ms: number
  store_name: string
  store_id: string
  scope: string[]
  message: string
}

export const marketplacesApi = {
  list: async (): Promise<Marketplace[]> => {
    try {
      const res = await apiClient.get<{ data: BackendMarketplace[] }>('/marketplaces')
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data.map((bm) => ({
          id: bm.id,
          marketplace_id: bm.code as Marketplace['marketplace_id'],
          name: bm.name,
          store_name: bm.shop_name,
          store_id: bm.shop_id,
          status: bm.status as Marketplace['status'],
          environment: 'sandbox',
          product_count: bm.item_count || 0,
          api_status: 'ok',
          last_sync_at: bm.last_sync,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      }
      return mockMarketplaces
    } catch {
      return mockMarketplaces
    }
  },

  getShopeeAuthUrl: async (redirectUrl?: string): Promise<string> => {
    const res = await apiClient.get<{ auth_url: string }>('/marketplaces/shopee/auth-url', {
      params: { redirect: redirectUrl },
    })
    return res.data.auth_url
  },

  connect: async (params: ConnectParams): Promise<void> => {
    await apiClient.post('/marketplaces/connect', params)
  },

  disconnect: async (code: string): Promise<void> => {
    await apiClient.post(`/marketplaces/${code}/disconnect`)
  },

  testConnection: async (code: string): Promise<TestConnectionResponse> => {
    const res = await apiClient.post<TestConnectionResponse>(`/marketplaces/${code}/test`)
    return res.data
  },
}

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesApi.list,
    staleTime: 60 * 1000,
  })
}

export function useConnectMarketplace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marketplacesApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] })
    },
  })
}

export function useDisconnectMarketplace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marketplacesApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] })
    },
  })
}

export function useTestMarketplaceConnection() {
  return useMutation({
    mutationFn: marketplacesApi.testConnection,
  })
}
