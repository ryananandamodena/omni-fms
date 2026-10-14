import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
        gray: 'badge-gray',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-primary': variant === 'default',
            'bg-emerald-500': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-red-500': variant === 'danger',
            'bg-blue-500': variant === 'info',
            'bg-gray-500': variant === 'gray',
          })}
        />
      )}
      {children}
    </span>
  )
}

// Convenience status badge
interface StatusBadgeProps {
  status: string
  className?: string
}

const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  draft: { variant: 'gray', label: 'Draft' },
  archived: { variant: 'gray', label: 'Archived' },
  published: { variant: 'success', label: 'Published' },
  unpublished: { variant: 'gray', label: 'Unpublished' },
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  success: { variant: 'success', label: 'Success' },
  failed: { variant: 'danger', label: 'Failed' },
  cancelled: { variant: 'gray', label: 'Cancelled' },
  connected: { variant: 'success', label: 'Connected' },
  disconnected: { variant: 'gray', label: 'Disconnected' },
  expired: { variant: 'warning', label: 'Expired' },
  error: { variant: 'danger', label: 'Error' },
  ok: { variant: 'success', label: 'OK' },
  degraded: { variant: 'warning', label: 'Degraded' },
  down: { variant: 'danger', label: 'Down' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status.toLowerCase()] ?? { variant: 'gray' as const, label: status }
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  )
}
