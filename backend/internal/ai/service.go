package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AIRequest struct {
	Type          string   `json:"type"`          // "description", "title", "keywords"
	ProductName   string   `json:"product_name"`
	Brand         string   `json:"brand"`
	Category      string   `json:"category"`
	KeyFeatures   []string `json:"key_features"`
	TargetChannel string   `json:"target_channel"` // "shopee", "tokopedia", "lazada", "general"
	Tone          string   `json:"tone"`           // "persuasive", "formal", "casual", "luxury"
	Language      string   `json:"language"`       // "id", "en"
}

type AIResponse struct {
	GeneratedContent string   `json:"generated_content"`
	SuggestedTitles  []string `json:"suggested_titles,omitempty"`
	SuggestedKeywords []string `json:"suggested_keywords,omitempty"`
	Provider         string   `json:"provider"`
	TokensUsed       int      `json:"tokens_used"`
}

type AIService struct {
	httpClient *http.Client
}

func NewAIService() *AIService {
	return &AIService{
		httpClient: &http.Client{Timeout: 45 * time.Second},
	}
}

// GenerateContent generates optimized e-commerce copy using Google Gemini or OpenAI
func (s *AIService) GenerateContent(ctx context.Context, req AIRequest) (*AIResponse, error) {
	geminiKey := os.Getenv("GEMINI_API_KEY")
	openaiKey := os.Getenv("OPENAI_API_KEY")

	if geminiKey != "" {
		return s.generateWithGemini(ctx, geminiKey, req)
	}

	if openaiKey != "" {
		return s.generateWithOpenAI(ctx, openaiKey, req)
	}

	// Smart fallback template if no API key is set yet
	return s.generateMockTemplate(req), nil
}

func (s *AIService) buildPrompt(req AIRequest) string {
	featuresStr := strings.Join(req.KeyFeatures, ", ")
	channelGuide := ""
	switch req.TargetChannel {
	case "shopee":
		channelGuide = "Format khusus untuk Shopee: gunakan bullet points jelas, sertakan emoji e-commerce yang menarik, dan sertakan garansi/jaminan original."
	case "tokopedia":
		channelGuide = "Format khusus untuk Tokopedia: penjelasan spesifikasi teknis rapi, bahasa profesional & ramah, jelaskan benefit produk secara lugas."
	case "tiktok":
		channelGuide = "Format khusus untuk TikTok Shop: bahasa persuasif, FOMO, punchy, highlight estetika dan kemudahan pemakaian."
	}

	return fmt.Sprintf(`Anda adalah E-Commerce Copywriter Specialist Omnichannel profesional (khusus pasar Indonesia).
Tugas Anda adalah membuat %s yang memikat dan berkonversi tinggi untuk produk berikut:
- Nama Produk: %s
- Brand: %s
- Kategori: %s
- Fitur Utama: %s
- Tone: %s
- Bahasa: %s

Panduan Platform: %s

Pastikan hasil tulisan:
1. Menarik perhatian calon pembeli di 3 detik pertama.
2. Penjelasan fitur dan manfaat (benefits) yang jelas.
3. Call to Action (CTA) yang meyakinkan.
Hanya kembalikan konten hasil copy tanpa pembuka/penutup meta.`,
		req.Type, req.ProductName, req.Brand, req.Category, featuresStr, req.Tone, req.Language, channelGuide)
}

func (s *AIService) generateWithGemini(ctx context.Context, apiKey string, req AIRequest) (*AIResponse, error) {
	prompt := s.buildPrompt(req)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}
	body, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	res, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	respBytes, _ := io.ReadAll(res.Body)
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(respBytes, &geminiResp); err != nil || len(geminiResp.Candidates) == 0 {
		return s.generateMockTemplate(req), nil
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text
	return &AIResponse{
		GeneratedContent: text,
		Provider:         "Google Gemini 1.5 Flash",
		TokensUsed:       len(prompt) / 4,
	}, nil
}

func (s *AIService) generateWithOpenAI(ctx context.Context, apiKey string, req AIRequest) (*AIResponse, error) {
	prompt := s.buildPrompt(req)
	url := "https://api.openai.com/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}
	body, _ := json.Marshal(payload)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	res, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	respBytes, _ := io.ReadAll(res.Body)
	var openaiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			TotalTokens int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(respBytes, &openaiResp); err != nil || len(openaiResp.Choices) == 0 {
		return s.generateMockTemplate(req), nil
	}

	return &AIResponse{
		GeneratedContent: openaiResp.Choices[0].Message.Content,
		Provider:         "OpenAI GPT-4o-mini",
		TokensUsed:       openaiResp.Usage.TotalTokens,
	}, nil
}

func (s *AIService) generateMockTemplate(req AIRequest) *AIResponse {
	return &AIResponse{
		GeneratedContent: fmt.Sprintf(`🌟 %s - Solusi Terbaik untuk Kebutuhan Anda! 🌟

Kenalkan %s dari brand terpercaya %s. Didesain secara ergonomis, elegan, dan tahan lama untuk menunjang aktivitas harian Anda.

✨ Keunggulan Utama:
- Desain modern dan material berkualitas premium
- Sangat efisien, hemat daya, dan mudah dibersihkan
- Garansi resmi %s Indonesia

📦 Isi Paket:
- 1x %s Unit
- 1x Buku Panduan Resmi & Kartu Garansi
- Aksesori lengkap bawaan pabrik

🔥 Promo Terbatas! Segera checkout sekarang sebelum kehabisan stok!`,
			req.ProductName, req.ProductName, req.Brand, req.Brand, req.ProductName),
		SuggestedTitles: []string{
			fmt.Sprintf("%s %s Original Garansi Resmi - Terbaik", req.Brand, req.ProductName),
			fmt.Sprintf("[%s] %s Promo Hemat - Ready Stock", req.Brand, req.ProductName),
			fmt.Sprintf("Official Store: %s %s Berkualitas Premium", req.Brand, req.ProductName),
		},
		SuggestedKeywords: []string{
			strings.ToLower(req.ProductName),
			strings.ToLower(req.Brand),
			"garansi resmi",
			"original promo",
			"terlaris",
		},
		Provider:   "Built-in Smart Template (Configure GEMINI_API_KEY for Live AI)",
		TokensUsed: 120,
	}
}
