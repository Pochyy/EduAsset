import { NavLink } from 'react-router-dom'
import type { Portal } from '../../types'
import { cn } from '../../lib/utils'
import { navFor } from './nav'

interface SidebarProps {
  portal: Portal
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ portal, onNavigate, className }: SidebarProps) {
  return (
    <nav
      aria-label="Main menu"
      className={cn('flex flex-col gap-0.5 bg-butter px-4 pb-7 pt-5', className)}
    >
      {navFor(portal).map((group) => (
        <div key={group.label}>
          <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-rust">
            {group.label}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
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
                      {item.count !== undefined ? (
                        <span className="min-w-[22px] rounded-full bg-amber px-2 py-0.5 text-center text-[11px] font-bold leading-tight text-ink">
                          {item.count}
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
