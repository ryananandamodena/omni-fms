package adapters

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

// ShopeeAdapter handles communication with Shopee Open Platform API v2
type ShopeeAdapter struct {
	PartnerID  int64
	PartnerKey string
	IsSandbox  bool
	HTTPClient *http.Client
}

// NewShopeeAdapter initializes a Shopee Adapter instance
func NewShopeeAdapter(partnerID int64, partnerKey string, isSandbox bool) *ShopeeAdapter {
	return &ShopeeAdapter{
		PartnerID:  partnerID,
		PartnerKey: partnerKey,
		IsSandbox:  isSandbox,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *ShopeeAdapter) getBaseURL() string {
	if s.IsSandbox {
		return "https://partner.test-stable.shopeemobile.com"
	}
	return "https://partner.shopeemobile.com"
}

// GenerateSignature generates HMAC-SHA256 signature required by Shopee v2
func (s *ShopeeAdapter) GenerateSignature(path string, timestamp int64, accessToken string, shopID int64) string {
	var baseStr string
	if accessToken == "" && shopID == 0 {
		// Public api / auth api
		baseStr = fmt.Sprintf("%d%s%d", s.PartnerID, path, timestamp)
	} else {
		// Shop-level api
		baseStr = fmt.Sprintf("%d%s%d%s%d", s.PartnerID, path, timestamp, accessToken, shopID)
	}

	h := hmac.New(sha256.New, []byte(s.PartnerKey))
	h.Write([]byte(baseStr))
	return hex.EncodeToString(h.Sum(nil))
}

// GetAuthURL generates OAuth authorization URL for the seller to authorize
func (s *ShopeeAdapter) GetAuthURL(redirectURL string) (string, error) {
	path := "/api/v2/shop/auth_partner"
	ts := time.Now().Unix()
	sign := s.GenerateSignature(path, ts, "", 0)

	authURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&sign=%s&redirect=%s",
		s.getBaseURL(), path, s.PartnerID, ts, sign, redirectURL)
	return authURL, nil
}

type shopeeTokenResponse struct {
	Error        string `json:"error"`
	Message      string `json:"message"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpireIn     int64  `json:"expire_in"`
	ShopIDList   []int64 `json:"shop_id_list"`
}

// ExchangeToken exchanges authorization code from Shopee OAuth redirect for access token
func (s *ShopeeAdapter) ExchangeToken(ctx context.Context, authCode string, shopID string) (*MarketplaceCredentials, error) {
	path := "/api/v2/auth/token/get"
	ts := time.Now().Unix()
	sign := s.GenerateSignature(path, ts, "", 0)

	reqURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&sign=%s", s.getBaseURL(), path, s.PartnerID, ts, sign)

	parsedShopID, _ := strconv.ParseInt(shopID, 10, 64)
	bodyData := map[string]interface{}{
		"code":       authCode,
		"shop_id":    parsedShopID,
		"partner_id": s.PartnerID,
	}
	bodyBytes, _ := json.Marshal(bodyData)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("shopee exchange token http error: %w", err)
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	var result shopeeTokenResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %s", string(respBody))
	}

	if result.Error != "" {
		return nil, fmt.Errorf("shopee api error: %s - %s", result.Error, result.Message)
	}

	return &MarketplaceCredentials{
		PartnerID:    fmt.Sprintf("%d", s.PartnerID),
		PartnerKey:   s.PartnerKey,
		ShopID:       shopID,
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(result.ExpireIn) * time.Second),
		IsSandbox:    s.IsSandbox,
	}, nil
}

// RefreshToken refreshes an expired access token using the refresh_token
func (s *ShopeeAdapter) RefreshToken(ctx context.Context, creds *MarketplaceCredentials) (*MarketplaceCredentials, error) {
	path := "/api/v2/auth/access_token/get"
	ts := time.Now().Unix()
	sign := s.GenerateSignature(path, ts, "", 0)

	reqURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&sign=%s", s.getBaseURL(), path, s.PartnerID, ts, sign)

	parsedShopID, _ := strconv.ParseInt(creds.ShopID, 10, 64)
	bodyData := map[string]interface{}{
		"refresh_token": creds.RefreshToken,
		"shop_id":       parsedShopID,
		"partner_id":    s.PartnerID,
	}
	bodyBytes, _ := json.Marshal(bodyData)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	var result shopeeTokenResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	if result.Error != "" {
		return nil, fmt.Errorf("shopee refresh token error: %s - %s", result.Error, result.Message)
	}

	creds.AccessToken = result.AccessToken
	creds.RefreshToken = result.RefreshToken
	creds.ExpiresAt = time.Now().Add(time.Duration(result.ExpireIn) * time.Second)
	return creds, nil
}

// CreateProduct creates/publishes a product item to Shopee (/api/v2/product/add_item)
func (s *ShopeeAdapter) CreateProduct(ctx context.Context, creds *MarketplaceCredentials, payload ProductPayload) (*SyncResult, error) {
	path := "/api/v2/product/add_item"
	ts := time.Now().Unix()
	shopID, _ := strconv.ParseInt(creds.ShopID, 10, 64)
	sign := s.GenerateSignature(path, ts, creds.AccessToken, shopID)

	reqURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&access_token=%s&shop_id=%d&sign=%s",
		s.getBaseURL(), path, s.PartnerID, ts, creds.AccessToken, shopID, sign)

	// Format payload according to Shopee v2 specification
	shopeeItem := map[string]interface{}{
		"original_price": payload.Price,
		"description":    payload.Description,
		"item_name":      payload.Title,
		"normal_stock":   payload.Stock,
		"weight":         float64(payload.WeightGrams) / 1000.0, // Shopee expects KG
		"item_status":    "NORMAL",
		"item_sku":       payload.SKU,
	}

	bodyBytes, _ := json.Marshal(shopeeItem)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return &SyncResult{
			Success:      false,
			ChannelType:  ChannelShopee,
			ErrorMessage: err.Error(),
			SyncedAt:     time.Now(),
		}, err
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	var shopeeResp struct {
		Error    string `json:"error"`
		Message  string `json:"message"`
		Response struct {
			ItemID int64 `json:"item_id"`
		} `json:"response"`
	}

	if err := json.Unmarshal(respBody, &shopeeResp); err != nil {
		return nil, err
	}

	if shopeeResp.Error != "" {
		return &SyncResult{
			Success:      false,
			ChannelType:  ChannelShopee,
			ErrorMessage: fmt.Sprintf("%s: %s", shopeeResp.Error, shopeeResp.Message),
			SyncedAt:     time.Now(),
		}, nil
	}

	return &SyncResult{
		Success:        true,
		ChannelItemDoc: strconv.FormatInt(shopeeResp.Response.ItemID, 10),
		ChannelType:    ChannelShopee,
		SyncedAt:       time.Now(),
	}, nil
}

// UpdateStock updates product inventory stock (/api/v2/product/update_stock)
func (s *ShopeeAdapter) UpdateStock(ctx context.Context, creds *MarketplaceCredentials, itemID string, stock int) (*SyncResult, error) {
	path := "/api/v2/product/update_stock"
	ts := time.Now().Unix()
	shopID, _ := strconv.ParseInt(creds.ShopID, 10, 64)
	parsedItemID, _ := strconv.ParseInt(itemID, 10, 64)
	sign := s.GenerateSignature(path, ts, creds.AccessToken, shopID)

	reqURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&access_token=%s&shop_id=%d&sign=%s",
		s.getBaseURL(), path, s.PartnerID, ts, creds.AccessToken, shopID, sign)

	bodyData := map[string]interface{}{
		"item_id": parsedItemID,
		"stock_list": []map[string]interface{}{
			{"normal_stock": stock},
		},
	}
	bodyBytes, _ := json.Marshal(bodyData)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	return &SyncResult{
		Success:        true,
		ChannelItemDoc: itemID,
		ChannelType:    ChannelShopee,
		SyncedAt:       time.Now(),
	}, nil
}

// UpdatePrice updates product price (/api/v2/product/update_price)
func (s *ShopeeAdapter) UpdatePrice(ctx context.Context, creds *MarketplaceCredentials, itemID string, price float64) (*SyncResult, error) {
	path := "/api/v2/product/update_price"
	ts := time.Now().Unix()
	shopID, _ := strconv.ParseInt(creds.ShopID, 10, 64)
	parsedItemID, _ := strconv.ParseInt(itemID, 10, 64)
	sign := s.GenerateSignature(path, ts, creds.AccessToken, shopID)

	reqURL := fmt.Sprintf("%s%s?partner_id=%d&timestamp=%d&access_token=%s&shop_id=%d&sign=%s",
		s.getBaseURL(), path, s.PartnerID, ts, creds.AccessToken, shopID, sign)

	bodyData := map[string]interface{}{
		"item_id": parsedItemID,
		"price_list": []map[string]interface{}{
			{"original_price": price},
		},
	}
	bodyBytes, _ := json.Marshal(bodyData)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	return &SyncResult{
		Success:        true,
		ChannelItemDoc: itemID,
		ChannelType:    ChannelShopee,
		SyncedAt:       time.Now(),
	}, nil
}
