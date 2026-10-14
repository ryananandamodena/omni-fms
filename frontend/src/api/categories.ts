import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface CategoryItem {
  id: string
  name: string
  slug: string
  parent_id?: string
  parent_name?: string
  description?: string
  product_count: number
  children?: CategoryItem[]
  created_at: string
  updated_at: string
}

export interface CategoryMappingItem {
  id: string
  master_category_id: string
  master_category_name: string
  marketplace_id: string
  marketplace_category_id: string
  marketplace_category_path: string
  status: 'mapped' | 'unmapped' | 'review'
  updated_at: string
}

export interface AutoMapResponse {
  category_id: string
  category_path: string
  confidence: number
  ai_reasoning: string
}

export const categoriesApi = {
  list: async (): Promise<CategoryItem[]> => {
    try {
      const res = await apiClient.get<{ data: CategoryItem[] }>('/categories')
      return res.data?.data || []
    } catch {
      return []
    }
  },

  create: async (data: { name: string; slug?: string; parent_id?: string; description?: string }): Promise<CategoryItem> => {
    const res = await apiClient.post<{ data: CategoryItem }>('/categories', data)
    return res.data.data
  },

  update: async (id: string, data: { name: string; slug?: string; parent_id?: string; description?: string }): Promise<void> => {
    await apiClient.put(`/categories/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },

  listMappings: async (): Promise<CategoryMappingItem[]> => {
    try {
      const res = await apiClient.get<{ data: CategoryMappingItem[] }>('/categories/mappings')
      return res.data?.data || []
    } catch {
      return []
    }
  },

  saveMapping: async (data: {
    master_category_id: string
    marketplace_id: string
    marketplace_category_id: string
    marketplace_category_path: string
  }): Promise<void> => {
    await apiClient.post('/categories/mappings', data)
  },

  autoMap: async (categoryName: string, marketplaceId: string): Promise<AutoMapResponse> => {
    const res = await apiClient.post<AutoMapResponse>('/categories/auto-map', {
      category_name: categoryName,
      marketplace_id: marketplaceId,
    })
    return res.data
  },
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
    staleTime: 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; slug?: string; parent_id?: string; description?: string } }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useCategoryMappings() {
  return useQuery({
    queryKey: ['category-mappings'],
    queryFn: categoriesApi.listMappings,
    staleTime: 60 * 1000,
  })
}

export function useSaveCategoryMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.saveMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] })
    },
  })
}

export function useAutoMapCategory() {
  return useMutation({
    mutationFn: ({ categoryName, marketplaceId }: { categoryName: string; marketplaceId: string }) =>
      categoriesApi.autoMap(categoryName, marketplaceId),
  })
}
