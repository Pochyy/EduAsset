import { ArrowRight, ScanLine, Plus, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { actions, activity, health, healthTotal, kpis, outlook } from '../data/dashboard'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Table, TBody, TD, TH, THead, TR, TableWrap } from '../components/ui/Table'

const healthBar = {
  success: 'bg-success',
  warning: 'bg-amber',
  danger: 'bg-danger',
  neutral: 'bg-neutral-text',
} as const

export function CentralDashboard() {
  usePageTitle('Central · Dashboard')

  const healthAria = health.map((entry) => `${entry.value} ${entry.label}`).join(', ')

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Dashboard' },
        ]}
        title="Custodianship dashboard"
        description="What needs a decision today across all four modules."
        actions={
          <>
            <Link to="/central/reconciliation" className={buttonStyles('secondary')}>
              <ScanLine className="h-[18px] w-[18px]" aria-hidden="true" />
              Start reconciliation
            </Link>
            <Link to="/central/receive" className={buttonStyles('primary')}>
              <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
              Receive new items
            </Link>
          </>
        }
      />

      <section
        aria-label="Key figures"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            href={kpi.href}
            cta={kpi.cta}
          />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-[-0.01em] text-ink">Needs your action</h2>
            <Badge tone="warning">{actions.length} open</Badge>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {actions.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
              >
                <Badge tone="info" className="shrink-0">
                  {task.module}
                </Badge>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link
                    to={task.href}
                    className="text-sm font-semibold leading-snug text-ink hover:text-rust"
                  >
                    {task.title}
                  </Link>
                  <span className="text-xs leading-snug text-muted">{task.detail}</span>
                </div>
                <Link
                  to={task.href}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2.5 text-[13px] font-semibold text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                >
                  {task.cta}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
            Durable equipment health
          </h2>
          <p className="text-[13px] leading-relaxed text-muted">
            4-state machine across all registered WIL equipment — {healthTotal} units.
          </p>

          <div
            role="img"
            aria-label={healthAria}
            className="flex h-3.5 overflow-hidden rounded-full bg-neutral-bg"
          >
            {health.map((entry) => (
              <span
                key={entry.label}
                className={cn('block h-full', healthBar[entry.tone])}
                style={{ width: `${(entry.value / healthTotal) * 100}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {health.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center gap-2.5 rounded-control border border-line-soft p-3"
              >
                <span
                  aria-hidden="true"
                  className={cn('h-3 w-3 shrink-0 rounded-full', healthBar[entry.tone])}
                />
                <span className="flex flex-col leading-tight">
                  <span className="text-xl font-bold text-ink">{entry.value}</span>
                  <span className="text-xs text-muted">{entry.label}</span>
                </span>
              </div>
            ))}
          </div>

          <Link
            to="/central/repairs"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
          >
            Open Repair &amp; BER
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-[-0.01em] text-ink">Depletion outlook</h2>
            <Link
              to="/central/alerts"
              className="inline-flex min-h-11 items-center text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
            >
              All items
            </Link>
          </div>

          <TableWrap className="rounded-control">
            <Table className="min-w-[420px]">
              <THead>
                <tr>
                  <TH>Item</TH>
                  <TH numeric>Days left</TH>
                  <TH numeric>Trigger (L+S)</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {outlook.map((row) => (
                  <TR key={row.item}>
                    <TD className="font-semibold">{row.item}</TD>
                    <TD numeric>{row.days}</TD>
                    <TD numeric>{row.trigger}</TD>
                    <TD>
                      <span className="flex flex-col items-start gap-1">
                        <Badge tone={row.tone}>{row.tone === 'success' ? 'OK' : 'ALERT'}</Badge>
                        {row.tone !== 'success' ? (
                          <span className="whitespace-nowrap text-[11px] font-medium text-muted">
                            PR drafted
                          </span>
                        ) : null}
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
            Recent activity (audit log)
          </h2>
          <ol className="m-0 flex list-none flex-col p-0">
            {activity.map((entry) => (
              <li
                key={entry.text}
                className="flex gap-3 border-t border-line-soft py-2.5 first:border-t-0 first:pt-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] leading-snug text-ink">{entry.text}</span>
                  <span className="text-xs text-muted">{entry.meta}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
