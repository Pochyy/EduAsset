import { useState } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import {
  formatPeso,
  formatShortDate,
  isOpenWorkOrder,
  workOrderNote,
  workOrderStatus,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedWorkOrder } from '../types'
import { Badge } from '../components/ui/Badge'
import { buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'

type WorkOrderTab = 'open' | 'closed'

function WorkOrderProgress({ workOrder }: { workOrder: SeedWorkOrder }) {
  const active =
    workOrder.status === 'REPORTED'
      ? 0
      : workOrder.status === 'TICKET_DISPATCHED'
        ? 1
        : workOrder.status === 'AWAITING_DECISION'
          ? 2
          : 4

  const steps = [
    { label: 'Reported', sub: 'Lab Assistant' },
    { label: 'Ticket dispatched', sub: 'Campus technician' },
    {
      label: 'Quote & BER check',
      sub:
        workOrder.quoteAmount !== null
          ? formatPeso(workOrder.quoteAmount)
          : 'Pending',
    },
    {
      label:
        workOrder.status === 'CLOSED_CONDEMNED'
          ? 'Condemned / replaced'
          : 'Back in service',
      sub: workOrder.closedAt ? formatShortDate(workOrder.closedAt) : 'Same asset ID',
    },
  ]

  return (
    <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => {
        const done = index < active
        const current = index === active
        return (
          <li
            key={step.label}
            className={cn(
              'border-t-2 pt-2',
              done ? 'border-success' : current ? 'border-amber' : 'border-line',
            )}
          >
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  done ? 'bg-success' : current ? 'bg-amber' : 'bg-line',
                )}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold leading-snug text-ink">
                  {step.label}
                </span>
                <span className="text-[11px] leading-snug text-muted">{step.sub}</span>
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function LabWorkOrders() {
  usePageTitle('Lab · Work Orders')
  const { data } = useAppData()
  const [tab, setTab] = useState<WorkOrderTab>('open')

  const openOrders = data.workOrders
    .filter(isOpenWorkOrder)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
  const closedOrders = data.workOrders
    .filter((workOrder) => !isOpenWorkOrder(workOrder))
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
  const orders = tab === 'open' ? openOrders : closedOrders

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Equipment' },
          { label: 'Work Orders' },
        ]}
        title="Work orders"
        description="Service tickets and repair decisions for equipment you reported."
        actions={
          <Link to="/lab/incidents" className={buttonStyles('primary')}>
            <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
            Report an incident
          </Link>
        }
      />

      <Tabs
        ariaLabel="Work order status"
        value={tab}
        onChange={(id) => setTab(id as WorkOrderTab)}
        tabs={[
          { id: 'open', label: 'Open', count: openOrders.length },
          { id: 'closed', label: 'Closed', count: closedOrders.length },
        ]}
      />

      <section className="flex flex-col gap-4">
        {orders.length === 0 ? (
          <Card>
            <EmptyState
              icon={Wrench}
              title={
                tab === 'open' ? 'No open work orders' : 'No closed work orders yet'
              }
              description={
                tab === 'open'
                  ? 'Equipment issues you report will appear here.'
                  : 'When equipment returns to service or is condemned, its work order moves here.'
              }
            />
          </Card>
        ) : (
          orders.map((workOrder) => {
            const status = workOrderStatus(workOrder.status)
            return (
              <Card key={workOrder.workOrderId} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
                      {workOrder.title}
                    </h2>
                    <p className="text-[13px] text-muted">
                      {workOrder.workOrderId} · {workOrder.assetId} · reported{' '}
                      {formatShortDate(workOrder.reportedAt)}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>

                <WorkOrderProgress workOrder={workOrder} />

                <p className="text-[13px] leading-relaxed text-muted">
                  {workOrderNote(workOrder)}
                </p>
              </Card>
            )
          })
        )}
      </section>
    </>
  )
}
