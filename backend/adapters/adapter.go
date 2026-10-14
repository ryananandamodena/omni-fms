package adapters

import (
	"context"
	"time"
)

// ChannelType defines supported marketplaces
type ChannelType string

const (
	ChannelShopee    ChannelType = "shopee"
	ChannelTokopedia ChannelType = "tokopedia"
	ChannelLazada    ChannelType = "lazada"
	ChannelTikTok    ChannelType = "tiktok"
	ChannelBlibli    ChannelType = "blibli"
	ChannelShopify   ChannelType = "shopify"
)

// MarketplaceCredentials holds auth tokens & keys
type MarketplaceCredentials struct {
	PartnerID    string    `json:"partner_id"`
	PartnerKey   string    `json:"partner_key"`
	ShopID       string    `json:"shop_id"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	IsSandbox    bool      `json:"is_sandbox"`
}

// ProductPayload standard structure to sync to any marketplace
type ProductPayload struct {
	MasterProductID string            `json:"master_product_id"`
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	SKU             string            `json:"sku"`
	Price           float64           `json:"price"`
	Stock           int               `json:"stock"`
	WeightGrams     int               `json:"weight_grams"`
	CategoryChannel string            `json:"category_channel"`
	ImageURLs       []string          `json:"image_urls"`
	Variants        []VariantPayload  `json:"variants"`
	Attributes      map[string]string `json:"attributes"`
}

type VariantPayload struct {
	SKU   string  `json:"sku"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

// SyncResult response after publishing/updating
type SyncResult struct {
	Success        bool      `json:"success"`
	ChannelItemDoc string    `json:"channel_item_id"`
	ChannelType    ChannelType `json:"channel_type"`
	ErrorMessage   string    `json:"error_message,omitempty"`
	SyncedAt       time.Time `json:"synced_at"`
}

// MarketplaceAdapter contract interface
type MarketplaceAdapter interface {
	GetAuthURL(redirectURL string) (string, error)
	ExchangeToken(ctx context.Context, authCode string, shopID string) (*MarketplaceCredentials, error)
	RefreshToken(ctx context.Context, creds *MarketplaceCredentials) (*MarketplaceCredentials, error)
	CreateProduct(ctx context.Context, creds *MarketplaceCredentials, payload ProductPayload) (*SyncResult, error)
	UpdateStock(ctx context.Context, creds *MarketplaceCredentials, itemID string, stock int) (*SyncResult, error)
	UpdatePrice(ctx context.Context, creds *MarketplaceCredentials, itemID string, price float64) (*SyncResult, error)
}
