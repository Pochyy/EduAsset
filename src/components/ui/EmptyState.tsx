import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <strong className="text-base font-semibold text-ink">{title}</strong>
      {description ? (
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
