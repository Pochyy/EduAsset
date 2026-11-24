import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Portal } from '../../types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ portal }: { portal: Portal }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:border focus:border-amber-press focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>

      <TopBar portal={portal} onMenu={() => setOpen(true)} />

      <div className="flex items-start">
        <div className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[264px] shrink-0 overflow-y-auto lg:block">
          <Sidebar portal={portal} className="min-h-full" />
        </div>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 py-8 sm:px-7 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-butter shadow-[0_24px_48px_rgba(23,23,23,0.24)]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-butter-line pl-4 pr-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-rust">
                Navigate
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-butter-soft"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <Sidebar
              portal={portal}
              onNavigate={() => setOpen(false)}
              className="min-h-0 flex-1 overflow-y-auto"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
