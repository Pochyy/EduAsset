import { ArrowRight, ScanLine, Plus, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { actions, health, healthTotal, kpis } from '../data/dashboard'
import { useQueueCounts } from '../data/counts'
import { burnRate, daysLeft, isAlert, isNoRecentUse, triggerDays } from '../data/reorder'
import { useAppData } from '../context/AppDataContext'
import { formatVariance, itemNameOf, labLabel } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MetricStrip } from '../components/ui/MetricStrip'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TBody, TD, TH, THead, TR, TableWrap } from '../components/ui/Table'

const healthBar = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-neutral-text',
} as const

export function CentralDashboard() {
  usePageTitle('Central · Dashboard')
  const counts = useQueueCounts()
  const { data } = useAppData()

  const lockedRequisitions = data.requisitions.filter(
    (requisition) => requisition.status === 'LOCKED_REVIEW',
  )
  const unreviewedFlags = data.auditFlags.filter((flag) => !flag.reviewed)
  const countFlagTypes = (types: string[]) =>
    unreviewedFlags.filter((flag) => types.includes(flag.type)).length
  const suspiciousCount = countFlagTypes([
    'DUPLICATE_REPLACEMENT',
    'RETIRED_RESCAN',
    'UNIT_AGE',
    'LOCATION_RATE',
  ])
  const rejectedCount = countFlagTypes(['REJECTED_REPLACEMENT'])
  const dormantCount = countFlagTypes(['DORMANT'])
  const reconCount = countFlagTypes(['RECONCILIATION'])

  const dashboardActions = actions.flatMap((task) => {
    if (task.id === 'a1') {
      if (counts.requisitions === 0) return []
      return [
        {
          ...task,
          title: `${counts.requisitions} requisition${counts.requisitions === 1 ? '' : 's'} locked (V ≥ +50%)`,
          detail: lockedRequisitions
            .map(
              (requisition) =>
                `${labLabel(requisition.labId)} ${itemNameOf(data.items, requisition.itemId)} ${formatVariance(requisition.variancePercent)}`,
            )
            .join(', '),
        },
      ]
    }
    if (task.id === 'a2') {
      if (counts.alerts === 0) return []
      return [
        {
          ...task,
          title: `${counts.alerts} Purchase Requisition Form${counts.alerts === 1 ? '' : 's'} drafted`,
        },
      ]
    }
    if (task.id === 'a3') {
      if (counts.turnover === 0) return []
      return [
        {
          ...task,
          title: `${counts.turnover} turnover${counts.turnover === 1 ? '' : 's'} awaiting disbursement`,
        },
      ]
    }
    if (task.id === 'a5') {
      if (counts.audit === 0) return []
      const details = [
        `${suspiciousCount} suspicious pattern${suspiciousCount === 1 ? '' : 's'}`,
        `${rejectedCount} rejected attempt${rejectedCount === 1 ? '' : 's'}`,
        `${dormantCount} dormant asset${dormantCount === 1 ? '' : 's'}`,
        `${reconCount} reconciliation discrepanc${reconCount === 1 ? 'y' : 'ies'}`,
      ]
      return [
        {
          ...task,
          title: `${counts.audit} audit-queue flags`,
          detail: details.join(', '),
        },
      ]
    }
    return [task]
  })

  const dashboardKpis = kpis.map((kpi) => {
    switch (kpi.cta) {
      case 'Reorder alerts':
        return { ...kpi, value: counts.alerts }
      case 'Requisition review':
        return { ...kpi, value: counts.requisitions }
      case 'Turnover approval':
        return { ...kpi, value: counts.turnover }
      case 'Audit queue':
        return { ...kpi, value: counts.audit }
      default:
        return kpi
    }
  })

  const healthAria = health.map((entry) => `${entry.value} ${entry.label}`).join(', ')
  const attentionCount = health
    .filter((entry) => entry.tone === 'warning' || entry.tone === 'danger')
    .reduce((total, entry) => total + entry.value, 0)

  const recentActivity = [...data.auditLog]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
  const formatAuditTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    })

  const outlookRows = data.forecast.map((row) => {
    const days = daysLeft(row, data.policy)
    const noRecent = isNoRecentUse(row, data.policy)
    const alert = isAlert(row, data.policy)
    return {
      item: row.name,
      days: noRecent ? 'No recent use' : days === null ? '—' : `${days.toFixed(1)} days`,
      trigger: `${triggerDays(row)} days`,
      status: noRecent ? 'NO RECENT USE' : alert ? 'ALERT · PR DRAFTED' : 'OK',
      tone: noRecent
        ? ('neutral' as const)
        : alert
          ? days !== null && days < 14
            ? ('danger' as const)
            : ('warning' as const)
          : ('success' as const),
      burn: burnRate(row, data.policy),
    }
  })

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

      <MetricStrip
        ariaLabel="Key figures"
        items={dashboardKpis.map((kpi) => ({
          label: kpi.label,
          value: kpi.value,
          href: kpi.href,
          cta: kpi.cta,
        }))}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Needs your action</h2>
            <span className="text-xs font-medium tabular-nums text-muted">
              {dashboardActions.length} open
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {dashboardActions.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
              >
                <span className="w-7 shrink-0 font-mono text-[11px] font-medium text-warm-muted">
                  {task.module}
                </span>
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
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2.5 text-[13px] font-medium text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                >
                  {task.cta}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
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

          <div className="flex flex-col">
            {health.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center gap-2.5 border-t border-line-soft py-2.5 first:border-t-0 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', healthBar[entry.tone])}
                />
                <span className="flex-1 text-[13px] text-ink">{entry.label}</span>
                <span className="text-[11px] tabular-nums text-muted">
                  {Math.round((entry.value / healthTotal) * 100)}%
                </span>
                <span className="w-6 text-right text-[15px] font-semibold tabular-nums text-ink">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-muted">
            {attentionCount} units need maintenance or repair.
          </p>

          <Link
            to="/central/repairs"
            className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-medium text-rust transition-colors hover:text-rust-deep"
          >
            Open Repair &amp; BER
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="flex min-w-0 flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Depletion outlook</h2>
            <Link
              to="/central/alerts"
              className="inline-flex min-h-11 items-center text-[13px] font-medium text-rust transition-colors hover:text-rust-deep"
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
                {outlookRows.map((row) => (
                  <TR key={row.item}>
                    <TD className="font-semibold">{row.item}</TD>
                    <TD numeric>{row.days}</TD>
                    <TD numeric>{row.trigger}</TD>
                    <TD>
                      <span className="flex flex-col items-start gap-1">
                        <Badge tone={row.tone}>{row.status}</Badge>
                        {row.status === 'ALERT · PR DRAFTED' ? (
                          <span className="whitespace-nowrap text-[11px] font-medium text-muted">
                            BR {row.burn.toFixed(2)}/day
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
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Recent activity (audit log)
          </h2>
          <ol className="m-0 flex list-none flex-col p-0">
            {recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex gap-3 border-t border-line-soft py-2.5 first:border-t-0 first:pt-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rust/40"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] leading-snug text-ink">{entry.detail}</span>
                  <span className="text-xs text-muted">
                    {entry.actor} · {formatAuditTime(entry.at)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
