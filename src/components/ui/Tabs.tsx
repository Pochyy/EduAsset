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
    <div role="tablist" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2', className)}>
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
              'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors',
              active
                ? 'border-amber-press bg-amber text-ink'
                : 'border-line bg-surface text-neutral-text hover:bg-butter-soft',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                  active ? 'bg-white text-ink' : 'bg-neutral-bg text-neutral-text',
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
