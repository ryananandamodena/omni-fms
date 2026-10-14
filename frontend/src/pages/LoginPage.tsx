import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const TEST_ACCOUNTS = [
  { email: 'admin@example.com', password: 'Admin123!', role: 'admin' as const, name: 'Ryan Ananda' },
  { email: 'content@example.com', password: 'Content123!', role: 'content_manager' as const, name: 'Content Manager' },
  { email: 'viewer@example.com', password: 'Viewer123!', role: 'viewer' as const, name: 'View Only' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800)) // simulate API

    const account = TEST_ACCOUNTS.find(
      (a) => a.email === data.email && a.password === data.password
    )

    if (!account) {
      toast.error('Invalid email or password')
      setLoading(false)
      return
    }

    const user: User = {
      id: `u-${account.role}`,
      email: account.email,
      full_name: account.name,
      role: account.role,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }

    login(user, `mock-jwt-token-${Date.now()}`, `mock-refresh-token-${Date.now()}`)
    toast.success(`Welcome back, ${user.full_name}!`)
    navigate('/dashboard')
    setLoading(false)
  }

  const fillDemo = (account: typeof TEST_ACCOUNTS[number]) => {
    setValue('email', account.email)
    setValue('password', account.password)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left: Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">OmniChannel FMS</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="mb-3 text-center text-xs text-muted-foreground font-medium">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-muted-foreground">{account.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                    {account.role.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Hero */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center bg-gradient-to-br from-primary via-blue-600 to-indigo-800 px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">
            Manage All Your E-Commerce Channels in One Place
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Publish products to Shopee, Tokopedia, Lazada, TikTok Shop, and more with a single click.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Marketplaces', value: '6+' },
              { label: 'Products Synced', value: '1,052' },
              { label: 'Time Saved', value: '78%' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop', 'Blibli', 'Shopify'].map((mp) => (
              <span
                key={mp}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20"
              >
                {mp}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
