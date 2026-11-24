import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  message: string
}

interface ToastContextValue {
  showToast: (tone: ToastTone, title: string, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-success-line bg-success-bg',
  error: 'border-danger-line bg-danger-bg',
  info: 'border-butter-line bg-butter-soft',
  warning: 'border-warning-line bg-warning-bg',
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const toneIconColor: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-rust',
  warning: 'text-warning',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])
  const location = useLocation()

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (tone: ToastTone, title: string, message: string) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, tone, title, message }])
      const timer = window.setTimeout(() => dismiss(id), 5000)
      timers.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    setToasts([])
  }, [location.pathname])

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current = []
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone]
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={cn(
                'flex items-start gap-3 rounded-card border p-4 shadow-[0_12px_28px_rgba(23,23,23,0.14)]',
                toneStyles[toast.tone],
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', toneIconColor[toast.tone])} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold text-ink">{toast.title}</strong>
                <span className="block text-[13px] leading-relaxed text-neutral-text">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss message"
                className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-neutral-text transition-colors hover:bg-white/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
