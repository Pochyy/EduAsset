import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const toneStyles: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-neutral-bg text-neutral-text',
  info: 'bg-butter-soft text-rust',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}
