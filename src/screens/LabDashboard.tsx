import { AlertTriangle, ArrowRight, ClipboardList, Repeat } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import {
  dashboardMachineIds,
  dashboardRequisitionIds,
  healthStatus,
  isOpenWorkOrder,
  itemNameOf,
  linkedConsumable,
  machineNote,
  machineTitle,
  requisitionStatus,
  workOrderStatus,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { cn } from '../lib/utils'

const quickActions = [
  {
    title: 'Request supplies',
    sub: 'Toner, paper, filament',
    to: '/lab/requisition',
    icon: ClipboardList,
  },
  {
    title: 'Turnover scan',
    sub: 'Return a spent cartridge or spool',
    to: '/lab/turnover',
    icon: Repeat,
  },
  {
    title: 'Report an incident',
    sub: 'Defect, jam or broken item',
    to: '/lab/incidents',
    icon: AlertTriangle,
  },
]

export function LabDashboard() {
  usePageTitle('Lab · Dashboard')
  const { data } = useAppData()

  const machines = dashboardMachineIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))

  const requisitions = dashboardRequisitionIds
    .map((id) => data.requisitions.find((requisition) => requisition.requisitionId === id))
    .filter((requisition): requisition is NonNullable<typeof requisition> => Boolean(requisition))

  const openWorkOrders = data.workOrders
    .filter(isOpenWorkOrder)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Dashboard' },
        ]}
        title="Lab dashboard"
        description="Your machines, supplies and requests at a glance."
      />

      <section aria-label="Quick actions" className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex min-h-[88px] items-center gap-4 rounded-card bg-amber p-5 text-ink transition-colors hover:bg-amber-hover"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-ink text-amber">
                <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-[15px] leading-snug">{action.title}</strong>
                <span className="text-xs leading-snug text-[#3A2A00]">{action.sub}</span>
              </span>
              <ArrowRight
                className="ml-auto h-4 w-4 shrink-0 text-ink/70 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </section>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Machines &amp; active consumables
          </h2>
          <Link
            to="/lab/inventory"
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
          >
            Lab inventory
          </Link>
        </div>

        <div className="grid divide-y divide-line-soft md:grid-cols-3 md:divide-x md:divide-y-0">
          {machines.map((machine) => {
            const health = healthStatus(machine.healthState)
            const active = linkedConsumable(machine, data.units)
            return (
              <div
                key={machine.assetId}
                className={cn(
                  'flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0',
                  'md:px-5 md:py-0 md:first:pl-0 md:last:pr-0',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-mono text-xs text-ink">{machine.assetId}</strong>
                  <Badge tone={health.tone}>{health.label}</Badge>
                </div>
                <span className="text-[13px] font-medium text-ink">
                  {machineTitle(machine, data.items)}
                </span>
                <span className="text-[13px] text-ink">
                  Active unit:{' '}
                  <span className="font-mono text-xs font-semibold">
                    {active?.assetId ?? '—'}
                  </span>
                </span>
                <span className="text-xs leading-relaxed text-muted">
                  {machineNote(machine, data.units, data.workOrders)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
              My requisitions
            </h2>
            <Link
              to="/lab/requisition"
              className="inline-flex min-h-11 items-center text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
            >
              New request
            </Link>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {requisitions.map((requisition) => {
              const status = requisitionStatus(requisition.status)
              return (
                <li
                  key={requisition.requisitionId}
                  className="flex items-center justify-between gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">
                      {itemNameOf(data.items, requisition.itemId)}
                    </span>
                    <span className="text-xs text-muted">
                      {requisition.requisitionId} · {requisition.quantity} {requisition.unit}
                    </span>
                  </span>
                  <Badge tone={status.tone} className="shrink-0">
                    {status.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
              Open work orders
            </h2>
            <Link
              to="/lab/work-orders"
              className="inline-flex min-h-11 items-center text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
            >
              All work orders
            </Link>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {openWorkOrders.map((workOrder) => {
              const status = workOrderStatus(workOrder.status)
              return (
                <li
                  key={workOrder.workOrderId}
                  className="flex items-center justify-between gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">{workOrder.title}</span>
                    <span className="text-xs text-muted">
                      {workOrder.workOrderId} · {workOrder.assetId}
                    </span>
                  </span>
                  <Badge tone={status.tone} className="shrink-0">
                    {status.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
