import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  href: string
  cta: string
  tone?: 'rust' | 'ink'
  className?: string
}

export function StatCard({ label, value, href, cta, tone = 'rust', className }: StatCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        'group flex flex-col gap-1.5 rounded-card border border-line bg-surface p-5 transition duration-150 hover:-translate-y-0.5 hover:border-amber hover:shadow-[0_10px_24px_rgba(23,23,23,0.07)]',
        className,
      )}
    >
      <span aria-hidden="true" className="h-1 w-8 rounded-full bg-amber" />
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span
        className={cn(
          'text-[30px] font-bold leading-[1.1]',
          tone === 'rust' ? 'text-rust' : 'text-ink',
        )}
      >
        {value}
      </span>
      <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-rust group-hover:text-rust-deep">
        {cta}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
