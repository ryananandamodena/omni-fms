import React from 'react'
import {
  Package,
  CheckCircle,
  FileText,
  Globe,
  AlertCircle,
  XCircle,
  Store,
  Layers,
  RefreshCw,
  TrendingUp,
  Clock,
  Upload,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { StatCard } from '@/components/ui/Card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  mockDashboardStats,
  mockMarketplaceDistribution,
  mockRecentActivity,
  mockSyncJobs,
} from '@/data/mockData'
import { formatRelativeTime, formatCurrency } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'

const syncTrendData = [
  { date: 'Sep 25', success: 45, failed: 3, pending: 8 },
  { date: 'Sep 26', success: 52, failed: 2, pending: 5 },
  { date: 'Sep 27', success: 48, failed: 5, pending: 12 },
  { date: 'Sep 28', success: 61, failed: 1, pending: 7 },
  { date: 'Sep 29', success: 55, failed: 4, pending: 9 },
  { date: 'Sep 30', success: 70, failed: 2, pending: 6 },
  { date: 'Oct 1', success: 64, failed: 3, pending: 8 },
]

const activityIcon = (type: string) => {
  switch (type) {
    case 'publish': return <Globe className="h-3.5 w-3.5 text-emerald-500" />
    case 'update': return <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
    case 'error': return <XCircle className="h-3.5 w-3.5 text-red-500" />
    case 'import': return <Upload className="h-3.5 w-3.5 text-amber-500" />
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const stats = mockDashboardStats
  const distribution = mockMarketplaceDistribution
  const recentActivity = mockRecentActivity
  const syncJobs = mockSyncJobs.slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/products/new')}>
            + New Product
          </Button>
        </div>
      </div>

      {/* Alert: Lazada expired */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-400">
          <strong>Lazada API token has expired.</strong> Reconnect your Lazada account to resume syncing.
        </p>
        <Button variant="warning" size="sm" className="ml-auto" onClick={() => navigate('/marketplaces')}>
          Reconnect
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          title="Total Products"
          value={stats.total_products}
          subtitle={`${stats.total_skus} SKUs`}
          icon={<Package className="h-5 w-5" />}
          color="blue"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          title="Active Products"
          value={stats.active_products}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Draft Products"
          value={stats.draft_products}
          icon={<FileText className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="Published"
          value={stats.published_products}
          subtitle="across all channels"
          icon={<Globe className="h-5 w-5" />}
          color="indigo"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatCard
          title="Connected Stores"
          value={stats.connected_marketplaces}
          icon={<Store className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Pending Sync"
          value={stats.pending_sync}
          icon={<RefreshCw className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="Failed Sync"
          value={stats.failed_sync}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="Total SKUs"
          value={stats.total_skus}
          icon={<Layers className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Updated Today"
          value={stats.updated_today}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sync Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Product Sync Status (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={syncTrendData}>
                <defs>
                  <linearGradient id="success" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="success" stroke="#10b981" fill="url(#success)" strokeWidth={2} />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failed)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Marketplace Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Marketplace Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="count"
                  nameKey="marketplace"
                >
                  {distribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {distribution.map((d) => (
                <div key={d.marketplace} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.marketplace}</span>
                  </div>
                  <span className="font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    {activityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-none">{activity.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                      {activity.user && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <p className="text-xs text-muted-foreground">{activity.user}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sync Jobs */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle>Recent Sync Jobs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sync')} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{job.product.name}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{job.marketplace.name}</span>
                      <span>·</span>
                      <span className="capitalize">{job.action.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
