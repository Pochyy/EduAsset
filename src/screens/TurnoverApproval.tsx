import { useState } from 'react'
import { Check, Info, Lock, Repeat } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import {
  formatShortDate,
  itemNameOf,
  shortLocation,
  turnoverDetails,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedTurnover, SeedUnit } from '../types'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'

interface TurnoverMeta {
  machineId: string
  itemId: string
  oldUnitId: string
  newUnitId: string
}

const metaFor = (turnover: SeedTurnover): TurnoverMeta =>
  turnoverDetails[turnover.turnoverId] ?? {
    machineId: turnover.machineId,
    itemId: turnover.itemId,
    oldUnitId: turnover.oldAssetId,
    newUnitId: turnover.newAssetId,
  }

const statusFor = (turnover: SeedTurnover): { label: string; tone: BadgeTone } => {
  if (turnover.status === 'RELEASED') return { label: 'RELEASED', tone: 'success' }
  if (turnover.status === 'READY_TO_APPROVE') {
    return { label: 'READY TO APPROVE', tone: 'warning' }
  }
  return { label: 'AWAITING SPENT-UNIT SCAN', tone: 'neutral' }
}

function TurnoverSteps({
  meta,
  scanned,
  released,
}: {
  meta: TurnoverMeta
  scanned: boolean
  released: boolean
}) {
  const steps = [
    {
      title: 'Replacement requested',
      detail: `${meta.newUnitId} for this machine`,
      state: 'done' as const,
    },
    {
      title: 'Spent unit scanned',
      detail: scanned
        ? `${meta.oldUnitId} → RETURNED_EMPTY`
        : `Waiting for ${meta.oldUnitId}`,
      state: scanned ? ('done' as const) : ('now' as const),
    },
    {
      title: 'Custodian approval',
      detail: released
        ? `Approved · ${meta.newUnitId} IN_USE`
        : scanned
          ? 'Your decision'
          : 'Locked',
      state: released ? ('done' as const) : scanned ? ('now' as const) : ('todo' as const),
    },
  ]

  return (
    <ol className="m-0 grid list-none gap-2 p-0 md:grid-cols-3">
      {steps.map((step, index) => {
        const done = step.state === 'done'
        const current = step.state === 'now'
        return (
          <li
            key={step.title}
            className={cn(
              'border-t-2 pt-2',
              done ? 'border-success' : current ? 'border-amber' : 'border-line',
            )}
          >
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  done
                    ? 'bg-success text-white'
                    : current
                      ? 'bg-amber text-ink'
                      : 'bg-neutral-bg text-neutral-text',
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold leading-snug text-ink">
                  {step.title}
                </span>
                <span className="text-[11px] leading-snug text-muted">{step.detail}</span>
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function TurnoverApproval() {
  usePageTitle('Central · Turnover Approval')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const turnovers = [...data.turnovers].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  )
  const confirming = turnovers.find((turnover) => turnover.turnoverId === confirmId)
  const confirmingMeta = confirming ? metaFor(confirming) : null

  function release(turnover: SeedTurnover, meta: TurnoverMeta) {
    const oldUnit = data.units.find((unit) => unit.assetId === meta.oldUnitId)
    const machine = data.units.find((unit) => unit.assetId === meta.machineId)
    const newUnit: SeedUnit = {
      assetId: meta.newUnitId,
      itemId: meta.itemId,
      itemName: itemNameOf(data.items, meta.itemId),
      category: 'CONSUMABLE',
      location: machine?.location ?? oldUnit?.location ?? 'WIL Lab',
      inventoryStatus: 'IN_USE',
      healthState: 'NOT_APPLICABLE',
      deliveryRecordId: oldUnit?.deliveryRecordId ?? `TO-${turnover.turnoverId}`,
      deliveryDate: new Date().toISOString().slice(0, 10),
      serialNumber: null,
      linkedMachineId: meta.machineId,
      pendingDisbursement: false,
    }

    dispatch({
      type: 'turnover/release',
      turnoverId: turnover.turnoverId,
      oldUnitId: meta.oldUnitId,
      newUnit,
    })
    setConfirmId(null)
    showToast(
      'success',
      `${meta.newUnitId} released`,
      `Linked to ${meta.machineId} and logged in the audit trail.`,
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Turnover' },
          { label: 'Turnover Approval' },
        ]}
        title="Turnover approval & disbursement"
        description="A new unit is released only when the previous unit on that machine is RETURNED_EMPTY."
      />

      <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
        <span className="text-[13px] leading-relaxed text-ink">
          Lab assistants scan the spent unit in the WIL portal. You verify the turnover here and
          approve the release; the new unit becomes IN_USE on the linked machine.
        </span>
      </div>

      <section className="flex flex-col gap-4">
        {turnovers.length === 0 ? (
          <Card>
            <EmptyState
              icon={Repeat}
              title="No turnover requests"
              description="Turnovers appear here once a lab requests a replacement for a spent unit."
            />
          </Card>
        ) : (
          turnovers.map((turnover) => {
            const meta = metaFor(turnover)
            const scannerStatus = statusFor(turnover)
            const scanned = turnover.status !== 'AWAITING_SPENT_SCAN'
            const released = turnover.status === 'RELEASED'
            const canApprove = turnover.status === 'READY_TO_APPROVE'
            const machine = data.units.find((unit) => unit.assetId === meta.machineId)
            const machineText = machine
              ? `${machine.assetId} · ${shortLocation(machine.location)}`
              : meta.machineId

            return (
              <Card key={turnover.turnoverId} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                      {machineText}
                    </h2>
                    <p className="text-[13px] text-muted">
                      {itemNameOf(data.items, meta.itemId)} · requested{' '}
                      {formatShortDate(turnover.requestedAt)}
                    </p>
                  </div>
                  <Badge tone={scannerStatus.tone}>{scannerStatus.label}</Badge>
                </div>

                <TurnoverSteps meta={meta} scanned={scanned} released={released} />

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {canApprove ? (
                    <Button onClick={() => setConfirmId(turnover.turnoverId)}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Approve disbursement
                    </Button>
                  ) : null}

                  {turnover.status === 'AWAITING_SPENT_SCAN' ? (
                    <>
                      <span className="flex items-center gap-1.5 text-[13px] text-muted">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Locked until the spent unit is scanned as RETURNED_EMPTY
                      </span>
                      <Button disabled>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Approve disbursement
                      </Button>
                    </>
                  ) : null}

                  {released ? (
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-success">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Released · new unit is IN_USE on {meta.machineId}
                    </span>
                  ) : null}
                </div>
              </Card>
            )
          })
        )}
      </section>

      <Dialog
        open={Boolean(confirming && confirmingMeta)}
        onClose={() => setConfirmId(null)}
        title={confirmingMeta ? `Release ${confirmingMeta.newUnitId}?` : 'Release unit'}
        className="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirming && confirmingMeta) release(confirming, confirmingMeta)
              }}
            >
              Release unit
            </Button>
          </>
        }
      >
        {confirming && confirmingMeta ? (
          <p className="text-sm leading-relaxed text-neutral-text">
            {confirmingMeta.oldUnitId} was verified as RETURNED_EMPTY.{' '}
            {confirmingMeta.newUnitId} will be set to IN_USE and linked to{' '}
            {confirmingMeta.machineId}. This is recorded in the audit log.
          </p>
        ) : null}
      </Dialog>
    </>
  )
}
