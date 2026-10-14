import React from 'react'
import { mockAuditLogs } from '@/data/mockData'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/utils/cn'
import { ScrollText, User } from 'lucide-react'

export function AuditLogsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Complete history of all changes in the system</p>
      </div>
      <Card className="overflow-hidden">
        <table className="data-table w-full">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Changes</th>
              <th className="px-4 py-3 text-left">IP</th>
              <th className="px-4 py-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockAuditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{log.user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{log.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{log.action}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-muted-foreground capitalize">{log.entity_type}</p>
                  <code className="text-xs text-muted-foreground">{log.entity_id}</code>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {log.old_value && log.new_value ? (
                    <div className="text-xs space-y-1">
                      {Object.keys(log.old_value).map((k) => (
                        <div key={k}>
                          <span className="text-muted-foreground">{k}: </span>
                          <span className="line-through text-red-500">{String(log.old_value![k])}</span>
                          {' → '}
                          <span className="text-emerald-600">{String(log.new_value![k])}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-muted-foreground">{log.ip_address ?? '—'}</code>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// Simple placeholder pages

export function ImportsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Imports</h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">CSV/XLSX import wizard coming soon.</p>
      </Card>
    </div>
  )
}

export function ExportsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Product export functionality coming soon.</p>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Application settings coming soon.</p>
      </Card>
    </div>
  )
}
