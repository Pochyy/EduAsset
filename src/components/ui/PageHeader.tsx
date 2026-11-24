import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumbs: Crumb[]
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ breadcrumbs, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden="true" className="text-[#b8afa0]">
                /
              </span>
            ) : null}
            {crumb.href ? (
              <Link to={crumb.href} className="text-muted transition-colors hover:text-rust">
                {crumb.label}
              </Link>
            ) : (
              <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-ink' : 'text-muted'}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[clamp(26px,2.6vw,32px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
