import { ArrowLeft, Check, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'
import { buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader, type Crumb } from '../components/ui/PageHeader'

interface ComingSoonProps {
  breadcrumbs: Crumb[]
  title: string
  summary: string
  srs: string
  items: string[]
  reference: string
  backTo: string
  backLabel: string
}

export function ComingSoon({
  breadcrumbs,
  title,
  summary,
  srs,
  items,
  reference,
  backTo,
  backLabel,
}: ComingSoonProps) {
  usePageTitle(title)

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        description={summary}
        actions={
          <Link to={backTo} className={buttonStyles('secondary')}>
            <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            {backLabel}
          </Link>
        }
      />

      <Card className="max-w-3xl p-6">
        <div className="flex items-start gap-3">
          <Layers className="mt-0.5 h-5 w-5 shrink-0 text-rust" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
              This screen arrives in the next batch
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              The approved screen is finalised in the static design reference. This route is a
              placeholder while the flow is rebuilt as React components on the shared system.
            </p>
          </div>
        </div>

        <ul className="m-0 mt-5 grid list-none gap-2 p-0 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-rust" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
          <span>SRS {srs}</span>
          <code className="font-mono text-[11px]">{reference}</code>
        </div>
      </Card>
    </>
  )
}
