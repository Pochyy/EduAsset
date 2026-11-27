import { useState } from 'react'
import { Check, Info, Lock, Repeat } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  activeUnitForSlot,
  formatShortDate,
  itemNameOf,
  shortLocation,
  slotNameFor,
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

const statusFor = (turnover: SeedTurnover): { label: string; tone: BadgeTone } => {
  if (turnover.status === 'RELEASED') return { label: 'RELEASED', tone: 'success' }
  if (turnover.status === 'READY_TO_APPROVE') {
    return { label: 'READY TO APPROVE', tone: 'warning' }
  }
  if (turnover.status === 'AWAITING_APPROVAL') {
    return { label: 'EXCEPTION AWAITING APPROVAL', tone: 'warning' }
  }
  return { label: 'AWAITING SPENT-UNIT SCAN', tone: 'neutral' }
}

const exceptionLabel = (type: SeedTurnover['exceptionType']) =>
  type === 'FIRST_INSTALL'
    ? 'First install in an empty slot'
    : type === 'DEFECTIVE_ON_ARRIVAL'
      ? 'Defective on arrival'
      : null

function TurnoverSteps({
  turnover,
  slotLabel,
  oldUnit,
  released,
}: {
  turnover: SeedTurnover
  slotLabel: string
  oldUnit: SeedUnit | undefined
  released: boolean
}) {
  const exception = Boolean(turnover.exceptionType)
  const ready = turnover.status === 'READY_TO_APPROVE'
  const awaitingApproval = turnover.status === 'AWAITING_APPROVAL'
  const scanned = ready || released

  const steps = [
    {
      title: 'Replacement requested',
      detail: `${turnover.newAssetId} for ${turnover.machineId}/${slotLabel}`,
      state: 'done' as const,
    },
    {
      title: exception ? 'Exception recorded' : 'Spent unit scanned',
      detail: exception
        ? `${exceptionLabel(turnover.exceptionType)} · ${turnover.exceptionReason}`
        : scanned
          ? `${turnover.oldAssetId} → ${turnover.oldStatus ?? oldUnit?.inventoryStatus ?? 'RETURNED_EMPTY'}`
          : `Waiting for ${turnover.oldAssetId}`,
      state: exception || scanned ? ('done' as const) : ('now' as const),
    },
    {
      title: 'Custodian approval',
      detail: released
        ? `Released · ${turnover.newAssetId} is IN_USE`
        : ready || awaitingApproval
          ? 'Your decision'
          : 'Locked',
      state: released ? ('done' as const) : ready || awaitingApproval ? ('now' as const) : ('todo' as const),
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
  const { user } = useAuth()
  const { showToast } = useToast()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const turnovers = [...data.turnovers].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  )
  const confirming = turnovers.find((turnover) => turnover.turnoverId === confirmId)

  function release(turnover: SeedTurnover) {
    const oldUnit = turnover.oldAssetId
      ? data.units.find((unit) => unit.assetId === turnover.oldAssetId)
      : undefined
    const machine = data.units.find((unit) => unit.assetId === turnover.machineId)
    const existingNew = data.units.find((unit) => unit.assetId === turnover.newAssetId)
    const activeInSlot = activeUnitForSlot(turnover.slotId ?? '', data.units)

    if (activeInSlot && activeInSlot.assetId !== turnover.oldAssetId) {
      showToast(
        'error',
        'Slot is occupied',
        `${activeInSlot.assetId} is still IN_USE in this slot. Return it before releasing another unit.`,
      )
      return
    }
    if (
      !turnover.exceptionType &&
      (!oldUnit ||
        !['RETURNED_EMPTY', 'RETURNED_PARTIAL'].includes(oldUnit.inventoryStatus))
    ) {
      showToast(
        'error',
        'Spent unit is not returned',
        'The old unit must be scanned as RETURNED_EMPTY or RETURNED_PARTIAL before release.',
      )
      return
    }
    if (
      existingNew &&
      (existingNew.inventoryStatus !== 'IN_STOCK' || Boolean(existingNew.slotId))
    ) {
      showToast(
        'error',
        'New unit is not available',
        `${turnover.newAssetId} is not IN_STOCK with an empty slot. Choose another candidate.`,
      )
      return
    }

    const oldStatus = turnover.oldStatus ?? 'RETURNED_EMPTY'
    const newUnit: SeedUnit = existingNew
      ? {
          ...existingNew,
          inventoryStatus: 'IN_USE',
          location: oldUnit?.location ?? machine?.location ?? existingNew.location,
          linkedMachineId: turnover.machineId,
          slotId: turnover.slotId,
          pendingDisbursement: false,
        }
      : {
          assetId: turnover.newAssetId,
          itemId: turnover.itemId,
          itemName: itemNameOf(data.items, turnover.itemId),
          category: 'CONSUMABLE',
          location: oldUnit?.location ?? machine?.location ?? 'WIL Lab',
          inventoryStatus: 'IN_USE',
          healthState: 'NOT_APPLICABLE',
          deliveryRecordId: oldUnit?.deliveryRecordId ?? `TO-${turnover.turnoverId}`,
          deliveryDate: new Date().toISOString().slice(0, 10),
          serialNumber: null,
          linkedMachineId: turnover.machineId,
          slotId: turnover.slotId,
          pendingDisbursement: false,
        }

    dispatch({
      type: 'turnover/release',
      turnoverId: turnover.turnoverId,
      oldUnitId: turnover.oldAssetId,
      oldStatus,
      newUnit,
    })
    dispatch({
      type: 'audit/log',
      entry: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: user?.name ?? 'Property Custodian',
        action: turnover.exceptionType ? 'TURNOVER_EXCEPTION_APPROVED' : 'TURNOVER_RELEASED',
        entityType: 'UNIT',
        entityId: turnover.newAssetId,
        detail: `${turnover.newAssetId} released into ${turnover.machineId}/${slotNameFor(
          data.machineSlots,
          turnover.slotId,
        )}${turnover.exceptionType ? ` after a ${exceptionLabel(turnover.exceptionType)?.toLowerCase()} exception` : ''}.`,
      },
    })
    setConfirmId(null)
    showToast(
      'success',
      `${turnover.newAssetId} released`,
      `Linked to ${turnover.machineId}/${slotNameFor(data.machineSlots, turnover.slotId)} and logged in the audit trail.`,
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
        description="A new unit is released only when the spent unit in its machine slot is returned, or when you approve a logged exception."
      />

      <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
        <span className="text-[13px] leading-relaxed text-ink">
          Lab assistants scan the spent unit in a machine slot. You verify the turnover or the
          exception reason here; the new unit becomes IN_USE in that slot.
        </span>
      </div>

      <section className="flex flex-col gap-4">
        {turnovers.length === 0 ? (
          <Card>
            <EmptyState
              icon={Repeat}
              title="No turnover requests"
              description="Turnovers appear here once a lab requests a replacement for a machine slot."
            />
          </Card>
        ) : (
          turnovers.map((turnover) => {
            const slotLabel = slotNameFor(data.machineSlots, turnover.slotId)
            const scannerStatus = statusFor(turnover)
            const released = turnover.status === 'RELEASED'
            const canApprove =
              turnover.status === 'READY_TO_APPROVE' ||
              turnover.status === 'AWAITING_APPROVAL'
            const machine = data.units.find((unit) => unit.assetId === turnover.machineId)
            const oldUnit = turnover.oldAssetId
              ? data.units.find((unit) => unit.assetId === turnover.oldAssetId)
              : undefined
            const machineText = machine
              ? `${machine.assetId} · ${shortLocation(machine.location)}`
              : turnover.machineId

            return (
              <Card key={turnover.turnoverId} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                      {machineText} / {slotLabel}
                    </h2>
                    <p className="text-[13px] text-muted">
                      {itemNameOf(data.items, turnover.itemId)} · requested{' '}
                      {formatShortDate(turnover.requestedAt)}
                    </p>
                  </div>
                  <Badge tone={scannerStatus.tone}>{scannerStatus.label}</Badge>
                </div>

                {turnover.exceptionType ? (
                  <div className="flex items-start gap-3 rounded-control border border-warning-line bg-warning-bg p-3">
                    <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning" aria-hidden="true" />
                    <span className="text-[13px] leading-relaxed text-ink">
                      <strong>{exceptionLabel(turnover.exceptionType)}.</strong>{' '}
                      {turnover.exceptionReason}
                    </span>
                  </div>
                ) : null}

                <TurnoverSteps
                  turnover={turnover}
                  slotLabel={slotLabel}
                  oldUnit={oldUnit}
                  released={released}
                />

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {canApprove ? (
                    <Button onClick={() => setConfirmId(turnover.turnoverId)}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {turnover.exceptionType ? 'Approve exception & release' : 'Approve disbursement'}
                    </Button>
                  ) : null}

                  {turnover.status === 'AWAITING_SPENT_SCAN' ? (
                    <>
                      <span className="flex items-center gap-1.5 text-[13px] text-muted">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Locked until the spent unit is scanned as RETURNED_EMPTY or RETURNED_PARTIAL
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
                      Released · new unit is IN_USE in {turnover.machineId}/{slotLabel}
                    </span>
                  ) : null}
                </div>
              </Card>
            )
          })
        )}
      </section>

      <Dialog
        open={Boolean(confirming)}
        onClose={() => setConfirmId(null)}
        title={confirming ? `Release ${confirming.newAssetId}?` : 'Release unit'}
        className="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirming) release(confirming)
              }}
            >
              Release unit
            </Button>
          </>
        }
      >
        {confirming ? (
          <p className="text-sm leading-relaxed text-neutral-text">
            {confirming.exceptionType ? (
              <>
                The {exceptionLabel(confirming.exceptionType)?.toLowerCase() ?? 'turnover'}{' '}
                exception was approved: “{confirming.exceptionReason}”.{' '}
              </>
            ) : (
              <>
                {confirming.oldAssetId} was verified as{' '}
                {confirming.oldStatus ?? 'RETURNED_EMPTY'}.{' '}
              </>
            )}
            {confirming.newAssetId} will be set to IN_USE in{' '}
            {confirming.machineId}/{slotNameFor(data.machineSlots, confirming.slotId)}. This is
            recorded in the audit log.
          </p>
        ) : null}
      </Dialog>
    </>
  )
}
