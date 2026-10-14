import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface AIGenerateRequest {
  type: 'description' | 'title' | 'keywords'
  product_name: string
  brand?: string
  category?: string
  key_features?: string[]
  target_channel?: 'shopee' | 'tokopedia' | 'lazada' | 'general'
  tone?: 'persuasive' | 'formal' | 'casual' | 'luxury'
  language?: 'id' | 'en'
}

export interface AIGenerateResponse {
  generated_content: string
  suggested_titles?: string[]
  suggested_keywords?: string[]
  provider: string
  tokens_used: number
}

export const aiApi = {
  generate: async (req: AIGenerateRequest): Promise<AIGenerateResponse> => {
    const res = await apiClient.post<AIGenerateResponse>('/ai/generate', req)
    return res.data
  },
}

export function useGenerateAI() {
  return useMutation({
    mutationFn: aiApi.generate,
  })
}
