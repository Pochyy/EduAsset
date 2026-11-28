import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { Portal } from '../../types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ portal }: { portal: Portal }) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:border focus:border-amber-press focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>

      <TopBar portal={portal} />

      <div className="flex items-start">
        <div className="sticky top-[72px] block h-[calc(100vh-72px)] w-[264px] shrink-0 overflow-y-auto">
          <Sidebar portal={portal} className="min-h-full" />
        </div>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 py-8 sm:px-7 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
