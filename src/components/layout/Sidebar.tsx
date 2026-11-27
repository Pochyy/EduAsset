import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { Portal } from '../../types'
import { cn } from '../../lib/utils'
import { useQueueCounts } from '../../data/counts'
import { navFor } from './nav'

interface SidebarProps {
  portal: Portal
  onNavigate?: () => void
  className?: string
}

export function PhoneNav({ portal }: { portal: Portal }) {
  const counts = useQueueCounts()
  const items = navFor(portal).flatMap((group) => group.items)
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]')
    if (!nav || !active) return
    const navRect = nav.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    nav.scrollLeft +=
      activeRect.left - navRect.left - (nav.clientWidth - activeRect.width) / 2
  }, [location.pathname])

  return (
    <div className="sticky top-[72px] z-20 border-b border-line bg-butter lg:hidden">
      <nav
        ref={navRef}
        aria-label="Main menu"
        className="flex gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:thin]"
      >
        {items.map((item) => {
          const Icon = item.icon
          const count = item.countKey ? counts[item.countKey] : item.count
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-control px-3 text-[13px] transition-colors',
                  isActive
                    ? 'bg-white font-semibold text-ink shadow-[inset_0_-3px_0_#F5A623]'
                    : 'font-medium text-ink hover:bg-butter-soft',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-rust' : 'text-rust/80')}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                  {count ? (
                    <span className="text-[10px] font-semibold tabular-nums text-warm-muted">
                      {count}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar({ portal, onNavigate, className }: SidebarProps) {
  const counts = useQueueCounts()

  return (
    <nav
      aria-label="Main menu"
      className={cn('flex flex-col gap-0.5 bg-butter px-4 pb-7 pt-5', className)}
    >
      {navFor(portal).map((group) => (
        <div key={group.label}>
          <div className="px-3 pb-1.5 pt-4 text-[11px] font-medium tracking-[0.02em] text-warm-muted">
            {group.label}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const count = item.countKey ? counts[item.countKey] : item.count
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-control px-3 text-[13px] transition-colors',
                      isActive
                        ? 'bg-white font-semibold text-ink shadow-[inset_3px_0_0_#F5A623]'
                        : 'font-medium text-ink hover:bg-butter-soft',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn('h-5 w-5 shrink-0', isActive ? 'text-rust' : 'text-rust/80')}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                      {count ? (
                        <span className="min-w-[2ch] text-right text-[11px] font-medium leading-tight tabular-nums text-warm-muted">
                          {count}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
