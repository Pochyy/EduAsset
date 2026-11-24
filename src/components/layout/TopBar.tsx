import { Bell, LogOut, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Portal } from '../../types'
import { cn, initialsOf, portalHome, portalLabel, roleLabel } from '../../lib/utils'
import { Logo } from '../brand/Logo'
import { alertsCount, alertsHref } from './nav'

interface TopBarProps {
  portal: Portal
  onMenu: () => void
}

export function TopBar({ portal, onMenu }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const alerts = alertsCount(portal)
  const role = user ? roleLabel[user.role] : portalLabel(portal)

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-line bg-paper px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink transition-colors hover:bg-butter-soft lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link
          to={portalHome(portal)}
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-control"
        >
          <Logo
            size={40}
            subtitle={portalLabel(portal)}
            subtitleClassName="hidden sm:inline"
          />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <span className="hidden items-center gap-1.5 text-[11px] font-medium text-warm-muted xl:inline-flex">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-rust/60" />
          Prototype · sample data
        </span>

        <Link
          to={alertsHref(portal)}
          aria-label={`${alerts} alerts`}
          className="relative flex h-11 w-11 items-center justify-center rounded-control bg-butter text-rust transition-colors hover:bg-butter-soft"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-butter-line bg-surface px-1 text-[10px] font-semibold leading-none text-rust">
            {alerts}
          </span>
        </Link>

        <div className="hidden items-center gap-2.5 rounded-control bg-butter py-1.5 pl-1.5 pr-3.5 md:flex">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-[13px] font-semibold text-ink"
          >
            {initialsOf(user?.name ?? 'EduAsset')}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="max-w-[180px] truncate text-[13px] font-medium text-ink">
              {user?.name}
            </span>
            <span className="text-xs text-[#6B4A00]">{role}</span>
          </span>
        </div>

        <button
          type="button"
          aria-label="Sign out"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className={cn(
            'flex min-h-11 items-center gap-1.5 rounded-control px-2 text-[13px] font-medium text-ink',
            'transition-colors hover:bg-butter-soft sm:px-2.5',
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
