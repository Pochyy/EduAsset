import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, eyebrow, children, footer, className }: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[14px] bg-surface p-6 shadow-[0_24px_48px_rgba(23,23,23,0.18)] focus:outline-none',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow ? (
              <p className="text-xs font-semibold tracking-[0.08em] text-rust">{eyebrow}</p>
            ) : null}
            <h2 id={titleId} className="text-xl font-bold tracking-[-0.02em] text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-neutral-text transition-colors hover:bg-paper"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5">{children}</div>

        {footer ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
