import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Product } from '@/types'
import { mockProducts } from '@/data/mockData'

export interface BackendProduct {
  id: string
  title?: string
  name?: string
  description?: string
  sku: string
  brand?: string
  category?: string
  base_price?: number
  total_stock?: number
  status: 'active' | 'draft' | 'archived'
  images?: string[]
  variants?: Array<{
    id: string
    sku: string
    name: string
    price: number
    stock: number
  }>
  created_at: string
  updated_at: string
}

function normalizeProduct(bp: BackendProduct): Product {
  const name = bp.title || bp.name || 'Untitled Product'
  return {
    id: bp.id,
    sku: bp.sku,
    name,
    product_type: 'physical',
    short_description: bp.description,
    long_description: bp.description,
    status: bp.status || 'draft',
    content_score: 85,
    primary_image: bp.images && bp.images.length > 0 ? {
      id: `img-${bp.id}`,
      product_id: bp.id,
      filename: `${bp.sku}.jpg`,
      url: bp.images[0],
      is_primary: true,
      size: 102400,
      width: 800,
      height: 800,
      sort_order: 0,
      created_at: bp.created_at,
    } : undefined,
    images: (bp.images || []).map((url, idx) => ({
      id: `img-${bp.id}-${idx}`,
      product_id: bp.id,
      filename: `${bp.sku}-${idx}.jpg`,
      url,
      is_primary: idx === 0,
      size: 102400,
      width: 800,
      height: 800,
      sort_order: idx,
      created_at: bp.created_at,
    })),
    variants: (bp.variants || []).map((v) => ({
      id: v.id,
      product_id: bp.id,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      attributes: { Name: v.name },
      status: 'active',
      created_at: bp.created_at,
      updated_at: bp.updated_at,
    })),
    attributes: [],
    channel_products: [],
    created_at: bp.created_at,
    updated_at: bp.updated_at,
  }
}

export const productsApi = {
  list: async (): Promise<Product[]> => {
    try {
      const res = await apiClient.get<{ data: BackendProduct[]; total: number }>('/products')
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data.map(normalizeProduct)
      }
      return mockProducts
    } catch {
      // Graceful fallback to mock data if API is offline
      return mockProducts
    }
  },

  getById: async (id: string): Promise<Product | undefined> => {
    try {
      const res = await apiClient.get<{ data: BackendProduct }>(`/products/${id}`)
      if (res.data?.data) {
        return normalizeProduct(res.data.data)
      }
      return mockProducts.find((p) => p.id === id)
    } catch {
      return mockProducts.find((p) => p.id === id)
    }
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const payload = {
      sku: data.sku,
      title: data.name,
      description: data.long_description || data.short_description,
      status: data.status || 'draft',
      base_price: data.variants?.[0]?.price || 0,
      total_stock: data.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0,
    }
    const res = await apiClient.post<{ data: BackendProduct }>('/products', payload)
    return normalizeProduct(res.data.data)
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const payload = {
      sku: data.sku,
      title: data.name,
      description: data.long_description || data.short_description,
      status: data.status,
    }
    const res = await apiClient.put<{ data: BackendProduct }>(`/products/${id}`, payload)
    return normalizeProduct(res.data.data)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`)
  },
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
    staleTime: 60 * 1000,
  })
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => (id ? productsApi.getById(id) : Promise.resolve(undefined)),
    enabled: Boolean(id),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
