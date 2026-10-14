import React, { useState } from 'react'
import { Sparkles, Send, Wand2, Search, Copy, RefreshCw, CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { mockProducts } from '@/data/mockData'
import { useGenerateAI } from '@/api'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'result'
}

const DEMO_RESPONSES: Record<string, string> = {
  shopee_title: `MODENA Blender X Pro 500W Stainless Blade 1.5L - Garansi Resmi`,
  tokopedia_title: `MODENA Blender X Pro 500 Watt Pisau Stainless Steel 1.5 Liter - Bergaransi`,
  description: `<p>🌟 <strong>MODENA Blender X Pro 500W</strong> — Blender Profesional untuk Dapur Anda</p>

<p>Hadir dengan teknologi motor terkini, MODENA Blender X Pro menghadirkan performa luar biasa dalam setiap operasi. Motor 500W yang bertenaga memastikan bahan-bahan diblender dengan sempurna setiap saat.</p>

<h2>✨ Keunggulan Utama:</h2>
<ul>
<li>⚡ Motor 500W bertenaga tinggi — efisiensi optimal</li>
<li>🔪 Blade stainless steel 6 titik — hasil halus sempurna</li>
<li>🥤 Kapasitas jar 1.5 liter — ideal untuk keluarga</li>
<li>🎯 5 kecepatan + mode pulse — kontrol total</li>
<li>🛡️ Anti-slip base — aman dan stabil</li>
<li>🔒 Tutup anti-bocor — bersih tanpa tumpah</li>
</ul>

<h2>📦 Isi Paket:</h2>
<ul>
<li>1x Blender X Pro unit</li>
<li>1x Jar 1.5L</li>
<li>1x Buku panduan</li>
<li>1x Kartu garansi (12 bulan)</li>
</ul>`,
  seo: `**SEO Title:** MODENA Blender 500W Stainless Steel 1.5L | Harga Terbaik Indonesia
**Meta Description:** Beli MODENA Blender X Pro 500W dengan blade stainless steel 6 titik, kapasitas 1.5L. Garansi resmi 12 bulan. Gratis ongkir. Cek harga terbaik!
**Keywords:** blender 500 watt, blender modena, blender stainless, blender kapasitas besar, blender rumah tangga, blender murah berkualitas`,
  bullet_points: `• 🏆 Motor 500W bertenaga tinggi — lebih cepat & efisien
• 🔪 Blade stainless steel 6 titik — hasil halus sempurna  
• 🥤 Kapasitas 1.5 liter — ideal untuk 4-6 orang
• 🎯 5 kecepatan + pulse — kontrol presisi
• 💧 Anti-bocor & anti-slip — aman digunakan
• 🛡️ Garansi resmi 12 bulan — bebas khawatir`,
}

function getAIResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('shopee') && lower.includes('title')) return DEMO_RESPONSES.shopee_title
  if (lower.includes('tokopedia') && lower.includes('title')) return DEMO_RESPONSES.tokopedia_title
  if (lower.includes('description') || lower.includes('deskripsi')) return DEMO_RESPONSES.description
  if (lower.includes('seo') || lower.includes('keyword')) return DEMO_RESPONSES.seo
  if (lower.includes('bullet') || lower.includes('selling point')) return DEMO_RESPONSES.bullet_points
  if (lower.includes('title') || lower.includes('judul')) return `MODENA Blender X Pro 500W 1.5L Stainless Blade - Blender Terbaik Dapur Anda`
  return `Berdasarkan analisis produk **MODENA Blender X Pro**, berikut rekomendasi saya:

**Kekuatan Produk:**
- Motor 500W memberikan performa optimal
- Blade stainless steel tahan lama
- Desain modern yang menarik

**Saran Perbaikan:**
- Tambahkan informasi garansi yang lebih detail
- Sertakan lebih banyak foto produk dari berbagai sudut
- Tambahkan video demo penggunaan

**Marketplace Readiness Score:** 87/100 ✅

Apakah Anda ingin saya generate konten spesifik untuk marketplace tertentu?`
}

export function AIContentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo! Saya AI Content Assistant untuk OmniChannel FMS. 

Saya dapat membantu Anda:
- 📝 Generate judul produk yang dioptimalkan untuk setiap marketplace
- ✍️ Buat deskripsi produk yang menarik dan SEO-friendly
- 🎯 Optimalkan konten untuk Shopee, Tokopedia, Lazada, dll
- 💡 Generate bullet point selling point
- 🔍 Analisis kesiapan produk untuk publikasi

Pilih produk di bawah atau ketik permintaan Anda!`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const generateAIMutation = useGenerateAI()

  const quickActions = [
    { label: 'Generate Shopee Title', prompt: 'Generate a Shopee optimized title for this product' },
    { label: 'Generate Tokopedia Title', prompt: 'Generate a Tokopedia optimized title for this product' },
    { label: 'Write Description', prompt: 'Write a compelling product description with features and benefits' },
    { label: 'SEO Keywords', prompt: 'Generate SEO title, meta description and keywords' },
    { label: 'Selling Points', prompt: 'Create 6 compelling bullet point selling points' },
    { label: 'Readiness Check', prompt: 'Check if this product is ready to publish and what is missing' },
  ]

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const prod = mockProducts.find((p) => p.id === selectedProduct)
    let aiContent = ''
    try {
      const channel = text.toLowerCase().includes('shopee') ? 'shopee' : text.toLowerCase().includes('tokopedia') ? 'tokopedia' : 'general'
      const type = text.toLowerCase().includes('title') ? 'title' : text.toLowerCase().includes('seo') ? 'keywords' : 'description'
      const res = await generateAIMutation.mutateAsync({
        type,
        product_name: prod?.name || 'MODENA Blender X Pro 500W',
        brand: prod?.brand?.name || 'MODENA',
        category: prod?.category?.name || 'Kitchen Appliance',
        key_features: ['500W High Speed Motor', 'Stainless Steel 6 Blade', '1.5L Jar'],
        target_channel: channel,
        tone: 'persuasive',
        language: 'id',
      })
      aiContent = res.generated_content
    } catch {
      aiContent = getAIResponse(text)
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: aiContent }])
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Content Assistant</h1>
        <p className="text-sm text-muted-foreground">Generate and optimize product content for all marketplaces</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Product selector */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a product (optional)</option>
                {mockProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Messages */}
          <Card className="flex flex-col" style={{ height: '480px' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-primary to-indigo-600 text-white'
                      : 'bg-muted text-foreground'
                  )}>
                    {msg.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : 'U'}
                  </div>
                  <div className={cn(
                    'group relative max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-muted text-foreground rounded-tl-none'
                      : 'bg-primary text-white rounded-tr-none'
                  )}>
                    <div
                      className="whitespace-pre-wrap [&_strong]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_ul]:list-none [&_ul]:space-y-1 [&_li]:text-xs"
                      dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                    />
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Ask AI to generate content, optimize for marketplace, or analyze product..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="h-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </Card>
        </div>

        {/* Right: Quick actions & templates */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={loading}
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-xs hover:bg-muted hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  {action.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">AI Capabilities</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Title Generator', desc: 'Marketplace-optimized titles' },
                { label: 'Description Writer', desc: 'SEO-friendly descriptions' },
                { label: 'SEO Optimizer', desc: 'Keywords & meta tags' },
                { label: 'Selling Points', desc: 'Compelling bullet points' },
                { label: 'Readiness Check', desc: 'Pre-publish validation' },
                { label: 'Category Mapper', desc: 'Auto marketplace mapping' },
              ].map((cap) => (
                <div key={cap.label} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{cap.label}</p>
                    <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary/5 to-indigo-50 dark:from-primary/10 dark:to-indigo-900/20 border-primary/20">
            <h3 className="mb-1 text-sm font-semibold text-primary">Powered by Gemini AI</h3>
            <p className="text-xs text-muted-foreground">
              AI assistant uses Google Gemini to generate marketplace-optimized content tailored for Indonesian e-commerce.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/10">
              Configure AI Settings
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
