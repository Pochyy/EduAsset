import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface MetricItem {
  label: string
  value: number | string
  href?: string
  cta?: string
  /** Use a smaller type size for short prose values. */
  text?: boolean
}

interface MetricStripProps {
  ariaLabel: string
  items: MetricItem[]
  className?: string
}

export function MetricStrip({ ariaLabel, items, className }: MetricStripProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn('overflow-hidden rounded-card border border-line bg-line', className)}
    >
      <div
        className={cn(
          'grid gap-px',
          items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4',
        )}
      >
        {items.map((item) => {
          const body = (
            <>
              <span className="text-xs font-semibold text-muted">{item.label}</span>
              <span
                className={cn(
                  'mt-2 font-bold text-ink',
                  item.text
                    ? 'text-[15px] leading-snug'
                    : 'text-[28px] leading-none tracking-[-0.02em]',
                )}
              >
                {item.value}
              </span>
              {item.cta && item.href ? (
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-rust group-hover:text-rust-deep">
                  {item.cta}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              ) : null}
            </>
          )

          const cellClass = 'group flex min-h-[112px] flex-col bg-surface p-5 transition-colors'

          return item.href ? (
            <Link key={item.label} to={item.href} className={cn(cellClass, 'hover:bg-butter-soft')}>
              {body}
            </Link>
          ) : (
            <div key={item.label} className={cellClass}>
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
