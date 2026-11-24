import { cn } from '../../lib/utils'

export interface TabItem {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
  className?: string
}

export function Tabs({ tabs, value, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-x-6 border-b border-line', className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 border-b-2 px-0.5 text-[13px] font-medium transition-colors',
              active
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:border-line hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  'text-[11px] font-medium leading-none tabular-nums',
                  active ? 'text-rust' : 'text-muted',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
