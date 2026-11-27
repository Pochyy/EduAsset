import { useState, type FormEvent } from 'react'
import { Camera, Info, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  activeUnitForSlot,
  shortLocation,
  slotNameFor,
  turnoverSlots,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn, nextNumericId } from '../lib/utils'
import type { SeedAuditFlag, SeedTurnover, TurnoverExceptionType } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { QrScannerDialog } from '../components/QrScannerDialog'

interface ScanResult {
  id: string
  ok: boolean
  status: 'RETURNED_EMPTY' | 'RETURNED_PARTIAL' | null
}

interface ScanLog {
  id: string
  machineId: string
  slotName: string
  when: string
  ok: boolean
  status: 'RETURNED_EMPTY' | 'RETURNED_PARTIAL' | null
}

const nextFlagId = (flags: SeedAuditFlag[]) => {
  const highest = flags.reduce((max, flag) => {
    const value = Number(flag.id.replace(/\D/g, ''))
    return Number.isFinite(value) ? Math.max(value, max) : max
  }, 0)
  return `f${highest + 1}`
}

const exceptionLabel: Record<TurnoverExceptionType, string> = {
  FIRST_INSTALL: 'First install in an empty slot',
  DEFECTIVE_ON_ARRIVAL: 'Defective on arrival',
}

export function LabTurnoverScan() {
  usePageTitle('Lab · Turnover Scan')
  const { data, dispatch } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [slotKey, setSlotKey] = useState<string>(turnoverSlots[0].key)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [returnMode, setReturnMode] = useState<'empty' | 'partial'>('empty')
  const [log, setLog] = useState<ScanLog[]>([])
  const [exceptionType, setExceptionType] =
    useState<TurnoverExceptionType>('FIRST_INSTALL')
  const [exceptionNewId, setExceptionNewId] = useState('')
  const [exceptionReason, setExceptionReason] = useState('')
  const [exceptionTried, setExceptionTried] = useState(false)
  const [requestNewId, setRequestNewId] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const slotConfig =
    turnoverSlots.find((entry) => entry.key === slotKey) ?? turnoverSlots[0]
  const machine = data.units.find((unit) => unit.assetId === slotConfig.machineId)
  const slotLabel = slotNameFor(data.machineSlots, slotConfig.slotId)
  const activeUnit = activeUnitForSlot(slotConfig.slotId, data.units)
  const openTurnover = data.turnovers.find(
    (turnover) =>
      turnover.slotId === slotConfig.slotId && turnover.status !== 'RELEASED',
  )
  const requestedNewId = openTurnover?.newAssetId ?? null
  const canScan = Boolean(
    activeUnit && openTurnover?.status === 'AWAITING_SPENT_SCAN',
  )

  const suggestedUnit = slotConfig.suggestedNewUnitId
    ? data.units.find((unit) => unit.assetId === slotConfig.suggestedNewUnitId)
    : null
  const exceptionCandidates = data.units.filter((unit) => {
    const item = data.items.find((entry) => entry.itemId === unit.itemId)
    const alreadyRequested = data.turnovers.some(
      (turnover) =>
        turnover.status !== 'RELEASED' && turnover.newAssetId === unit.assetId,
    )
    return (
      unit.inventoryStatus === 'IN_STOCK' &&
      Boolean(item?.requireOneToOne) &&
      !alreadyRequested &&
      (!suggestedUnit || unit.itemId === suggestedUnit.itemId)
    )
  })
  const selectedExceptionUnit =
    exceptionCandidates.find((unit) => unit.assetId === exceptionNewId) ??
    exceptionCandidates[0]

  const requestCandidates = activeUnit
    ? data.units.filter((unit) => {
        const item = data.items.find((entry) => entry.itemId === unit.itemId)
        const alreadyRequested = data.turnovers.some(
          (turnover) =>
            turnover.status !== 'RELEASED' && turnover.newAssetId === unit.assetId,
        )
        return (
          unit.inventoryStatus === 'IN_STOCK' &&
          !unit.slotId &&
          unit.itemId === activeUnit.itemId &&
          Boolean(item?.requireOneToOne) &&
          !alreadyRequested
        )
      })
    : []
  const selectedRequestUnit =
    requestCandidates.find((unit) => unit.assetId === requestNewId) ??
    requestCandidates[0]

  const exceptionReasonError =
    exceptionTried && exceptionReason.trim().length < 5
      ? 'Add a short reason (at least 5 characters).'
      : undefined
  const exceptionUnitError =
    exceptionTried && !selectedExceptionUnit
      ? 'Select an IN_STOCK 1-to-1 unit.'
      : undefined

  const banner = result
    ? result.ok
      ? {
          tone: 'success' as const,
          title:
            result.status === 'RETURNED_PARTIAL'
              ? `Turnover complete: ${result.id} is RETURNED_PARTIAL`
              : `Turnover complete: ${result.id} is RETURNED_EMPTY`,
          text: requestedNewId
            ? `${requestedNewId} is unlocked and waiting for the custodian’s disbursement approval.`
            : 'The spent unit is returned; the custodian now verifies the turnover.',
        }
      : {
          tone: 'danger' as const,
          title: 'Wrong unit scanned',
          text: 'Issuance stays locked until the correct spent unit is scanned.',
        }
    : activeUnit
      ? openTurnover
        ? openTurnover.status === 'READY_TO_APPROVE'
          ? {
              tone: 'warning' as const,
              title: `${slotLabel} is awaiting Custodian approval`,
              text: `The spent unit ${activeUnit.assetId} has been scanned; ${openTurnover.newAssetId} is waiting for release.`,
            }
          : {
              tone: 'warning' as const,
              title: `Issuance locked for ${openTurnover.newAssetId}`,
              text: `Scan ${activeUnit.assetId}, the unit IN_USE in ${slotConfig.machineId}/${slotLabel}, to complete the turnover.`,
            }
        : {
            tone: 'success' as const,
            title: `${slotLabel} is in service`,
            text: `The active unit is ${activeUnit.assetId}. No replacement request is open for this slot.`,
          }
      : openTurnover
        ? {
            tone: 'warning' as const,
            title:
              openTurnover.status === 'AWAITING_APPROVAL'
                ? `${slotLabel} has an exception awaiting approval`
                : `${slotLabel} is awaiting Custodian approval`,
            text: `The slot is empty. ${openTurnover.newAssetId} is waiting for the Custodian.`,
          }
        : {
            tone: 'warning' as const,
            title: `${slotLabel} is empty`,
            text: slotConfig.suggestedNewUnitId
              ? 'Request a first-install or defective-on-arrival exception below to put a unit into this slot.'
              : 'This slot is available for a re-issued partial spool from Lab Inventory.',
          }

  function logAudit(action: string, entityId: string, detail: string) {
    dispatch({
      type: 'audit/log',
      entry: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: user?.name ?? 'Lab user',
        action,
        entityType: 'UNIT',
        entityId,
        detail,
      },
    })
  }

  function selectSlot(key: string) {
    setSlotKey(key)
    setResult(null)
    setInput('')
    setReturnMode('empty')
    setExceptionTried(false)
    setExceptionNewId('')
    setExceptionReason('')
  }

  function checkScan(raw: string) {
    const id = raw.trim().toUpperCase()
    if (!activeUnit || !canScan) {
      showToast(
        'error',
        'No scan is available',
        'This slot has no open turnover waiting for a spent-unit scan.',
      )
      return
    }
    if (!id) {
      showToast('error', 'Nothing scanned', 'Scan the QR code or type the asset ID.')
      return
    }

    const ok = id === activeUnit.assetId
    const status =
      ok && slotConfig.partialAllowed && returnMode === 'partial'
        ? ('RETURNED_PARTIAL' as const)
        : ok
          ? ('RETURNED_EMPTY' as const)
          : null

    setResult({ id, ok, status })
    setInput('')
    setLog((current) => [
      {
        id,
        machineId: slotConfig.machineId,
        slotName: slotLabel,
        when: 'Just now · Lab Assistant',
        ok,
        status,
      },
      ...current,
    ])

    if (ok && status) {
      dispatch({
        type: 'unit/patch',
        id: activeUnit.assetId,
        patch: { inventoryStatus: status, slotId: null },
      })
      if (openTurnover) {
        dispatch({
          type: 'turnover/status',
          id: openTurnover.turnoverId,
          status: 'READY_TO_APPROVE',
          oldStatus: status,
        })
      }
      logAudit(
        'TURNOVER_SCANNED',
        activeUnit.assetId,
        `${activeUnit.assetId} scanned as ${status} in ${slotConfig.machineId}/${slotLabel}.`,
      )
      showToast(
        'success',
        `${id} ${status === 'RETURNED_PARTIAL' ? 'returned partially used' : 'returned empty'}`,
        `Turnover recorded. Waiting for the custodian to release ${requestedNewId ?? 'the new unit'}.`,
      )
    } else {
      logAudit(
        'TURNOVER_MISMATCH',
        id,
        `${id} scan mismatch in ${slotConfig.machineId}/${slotLabel}; issuance stayed locked.`,
      )
      showToast(
        'error',
        'Scan does not match',
        `${id} is not IN_USE in ${slotConfig.machineId}/${slotLabel}. Issuance stays locked.`,
      )
    }
  }

  function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    checkScan(input)
  }

  function requestReplacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeUnit || !selectedRequestUnit) return

    const turnoverId = nextNumericId(
      'TO',
      data.turnovers.map((turnover) => turnover.turnoverId),
    )
    const turnover: SeedTurnover = {
      turnoverId,
      machineId: slotConfig.machineId,
      slotId: slotConfig.slotId,
      location: machine?.location ?? 'WIL Lab',
      itemId: activeUnit.itemId,
      oldAssetId: activeUnit.assetId,
      oldStatus: null,
      newAssetId: selectedRequestUnit.assetId,
      status: 'AWAITING_SPENT_SCAN',
      requestedAt: new Date().toISOString(),
      exceptionType: null,
      exceptionReason: null,
    }
    dispatch({ type: 'turnover/add', turnover })
    logAudit(
      'TURNOVER_REQUESTED',
      turnoverId,
      `${selectedRequestUnit.assetId} requested for ${slotConfig.machineId}/${slotLabel}; waiting for ${activeUnit.assetId} to be scanned.`,
    )
    setRequestNewId('')
    showToast(
      'info',
      `${turnoverId} requested`,
      `Scan ${activeUnit.assetId} to complete the spent-unit turnover.`,
    )
  }

  function requestException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setExceptionTried(true)
    if (!selectedExceptionUnit || exceptionReason.trim().length < 5) return

    const turnoverId = nextNumericId(
      'TO',
      data.turnovers.map((turnover) => turnover.turnoverId),
    )
    const reason = exceptionReason.trim().replace(/[.!?]+$/, '')
    const turnover: SeedTurnover = {
      turnoverId,
      machineId: slotConfig.machineId,
      slotId: slotConfig.slotId,
      location: machine?.location ?? 'WIL Lab',
      itemId: selectedExceptionUnit.itemId,
      oldAssetId: null,
      newAssetId: selectedExceptionUnit.assetId,
      status: 'AWAITING_APPROVAL',
      requestedAt: new Date().toISOString(),
      exceptionType,
      exceptionReason: reason,
      oldStatus: null,
    }
    const flag: SeedAuditFlag = {
      id: nextFlagId(data.auditFlags),
      type: 'TURNOVER_EXCEPTION',
      severity: 'MEDIUM',
      title: `Turnover exception: ${exceptionLabel[exceptionType]}`,
      entityId: slotConfig.slotId,
      meta: `${slotConfig.machineId}/${slotLabel} · ${selectedExceptionUnit.assetId}`,
      detail: `${exceptionLabel[exceptionType]} requested for ${slotConfig.machineId}/${slotLabel}: ${reason}. The Custodian must approve the exception before ${selectedExceptionUnit.assetId} is released.`,
      reviewed: false,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
    }

    dispatch({ type: 'turnover/add', turnover })
    dispatch({ type: 'audit/add', flag })
    logAudit(
      'TURNOVER_EXCEPTION_REQUESTED',
      selectedExceptionUnit.assetId,
      `${exceptionLabel[exceptionType]} exception requested for ${slotConfig.machineId}/${slotLabel}: ${reason}.`,
    )
    setExceptionTried(false)
    setExceptionReason('')
    setExceptionNewId('')
    showToast(
      'info',
      `${turnoverId} sent for approval`,
      `${selectedExceptionUnit.assetId} is waiting for the Custodian’s exception decision.`,
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Supplies' },
          { label: 'Turnover Scan' },
        ]}
        title="Turnover scan"
        description="Scan the spent unit in a machine slot before a new cartridge, drum or spool is released."
      />

      <Card className="grid gap-4 p-5 md:grid-cols-3 md:items-end">
        <Field label="Machine slot" htmlFor="turnover-slot">
          <Select
            id="turnover-slot"
            value={slotKey}
            onChange={(event) => selectSlot(event.target.value)}
          >
            {turnoverSlots.map((entry) => {
              const unit = data.units.find((candidate) => candidate.assetId === entry.machineId)
              return (
                <option key={entry.key} value={entry.key}>
                  {entry.machineId} / {entry.slotName}
                  {unit ? ` · ${shortLocation(unit.location)}` : ''}
                </option>
              )
            })}
          </Select>
        </Field>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Requested new unit</span>
          <strong className="flex min-h-11 items-center font-mono text-[15px] font-semibold text-ink">
            {requestedNewId ?? '—'}
          </strong>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">
            Currently IN_USE in this slot
          </span>
          <strong className="flex min-h-11 items-center font-mono text-[15px] font-semibold text-ink">
            {activeUnit?.assetId ?? 'Empty'}
          </strong>
        </div>
      </Card>

      <div
        className={cn(
          'flex flex-col gap-1 rounded-control border p-4',
          banner.tone === 'success' && 'border-success-line bg-success-bg',
          banner.tone === 'warning' && 'border-warning-line bg-warning-bg',
          banner.tone === 'danger' && 'border-danger-line bg-danger-bg',
        )}
      >
        <strong className="text-[15px] font-semibold text-ink">{banner.title}</strong>
        <span className="text-[13px] leading-relaxed text-ink">{banner.text}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Camera / webcam scanner
          </h2>

          <div
            role="img"
            aria-label="Camera viewfinder"
            className="relative flex h-[280px] items-center justify-center rounded-card border-2 border-[#2A2418] bg-ink text-butter"
          >
            <span className="absolute left-5 top-5 h-9 w-9 rounded-tl-md border-l-[5px] border-t-[5px] border-amber" />
            <span className="absolute right-5 top-5 h-9 w-9 rounded-tr-md border-r-[5px] border-t-[5px] border-amber" />
            <span className="absolute bottom-5 left-5 h-9 w-9 rounded-bl-md border-b-[5px] border-l-[5px] border-amber" />
            <span className="absolute bottom-5 right-5 h-9 w-9 rounded-br-md border-b-[5px] border-r-[5px] border-amber" />
            <span className="flex flex-col items-center gap-2 px-10 text-center">
              <QrCode className="h-9 w-9" aria-hidden="true" />
              <span className="text-[13px]">
                {canScan
                  ? `Scan ${activeUnit?.assetId} with the camera`
                  : 'Select a slot with an open turnover'}
              </span>
            </span>
          </div>

          {canScan ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Scan with camera
                </Button>
                <span className="text-xs text-muted">
                  Or type the asset ID below if the camera is unavailable.
                </span>
              </div>

              <form onSubmit={scan} noValidate className="flex flex-wrap items-end gap-2.5">
                <Field
                  label="Type the asset ID"
                  htmlFor="turnover-input"
                  className="min-w-[220px] flex-1"
                >
                  <Input
                    id="turnover-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={`e.g. ${activeUnit?.assetId}`}
                    className="font-mono"
                  />
                </Field>
                <Button type="submit">Verify scan</Button>
              </form>

              {slotConfig.partialAllowed ? (
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="text-xs font-medium text-muted">Return condition</legend>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'empty', label: 'Returned empty' },
                        { id: 'partial', label: 'Returned partial (spool still usable)' },
                      ] as const
                    ).map((option) => {
                      const selected = returnMode === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setReturnMode(option.id)}
                          className={cn(
                            'inline-flex min-h-11 items-center rounded-control border px-4 text-sm font-semibold transition-colors',
                            selected
                              ? 'border-amber bg-butter-soft text-ink'
                              : 'border-line bg-surface text-neutral-text hover:bg-butter-soft',
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  <span className="text-xs leading-relaxed text-muted">
                    A partial spool is returned to stock for later re-issue and never counts as a
                    new unit (FR-2.11).
                  </span>
                </fieldset>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted">Demo scans:</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="font-mono"
                  onClick={() => checkScan(activeUnit?.assetId ?? '')}
                >
                  {activeUnit?.assetId}
                </Button>
                {slotConfig.wrongUnitId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="font-mono"
                    onClick={() => checkScan(slotConfig.wrongUnitId ?? '')}
                  >
                    {slotConfig.wrongUnitId}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-control border border-line bg-paper p-4">
              <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                {activeUnit
                  ? openTurnover
                    ? `No further scan is needed. ${openTurnover.newAssetId} is waiting for the Custodian’s approval.`
                    : 'This slot has no open turnover. Request a replacement unit before scanning the spent unit.'
                  : openTurnover
                    ? `No further scan is needed. ${openTurnover.newAssetId} is waiting for the Custodian’s approval.`
                    : 'The slot is empty. Use the exception request below to install a new unit.'}
              </span>
            </div>
          )}

          {activeUnit && !openTurnover ? (
            requestCandidates.length > 0 ? (
              <form
                onSubmit={requestReplacement}
                noValidate
                className="flex flex-col gap-3 border-t border-line-soft pt-4"
              >
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[13px] font-semibold text-ink">Request replacement</h3>
                  <p className="text-xs leading-relaxed text-muted">
                    Choose an IN_STOCK 1-to-1 unit. The spent unit must be scanned before release.
                  </p>
                </div>
                <Field label="New unit" htmlFor="turnover-request-unit">
                  <Select
                    id="turnover-request-unit"
                    value={selectedRequestUnit?.assetId ?? ''}
                    onChange={(event) => setRequestNewId(event.target.value)}
                  >
                    {requestCandidates.map((unit) => (
                      <option key={unit.assetId} value={unit.assetId}>
                        {unit.assetId} · {unit.itemName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" variant="secondary" className="self-start">
                  Request replacement
                </Button>
              </form>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted">
                No IN_STOCK, never-issued unit is available for this item. Receive a new unit first,
                then request the replacement.
              </p>
            )
          ) : null}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Scan result</h2>

          {!result ? (
            <p className="text-[13px] leading-relaxed text-muted">
              No scan yet. The result and the unit’s new status appear here.
            </p>
          ) : (
            <>
              <dl className="m-0 flex flex-col gap-2.5">
                {[
                  { k: 'Scanned', v: result.id },
                  { k: 'Expected', v: activeUnit?.assetId ?? '—' },
                  {
                    k: 'Status',
                    v: result.ok ? result.status ?? 'Unchanged' : 'Unchanged',
                  },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted">{row.k}</dt>
                    <dd className="m-0 text-right font-semibold text-ink">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <Badge tone={result.ok ? 'success' : 'danger'} className="self-start">
                {result.ok ? 'VERIFIED MATCH' : 'MISMATCH · LOGGED'}
              </Badge>
              <p
                className={cn(
                  'text-[13px] leading-relaxed',
                  result.ok ? 'text-muted' : 'text-danger',
                )}
              >
                {result.ok
                  ? `The Central Property Custodian now verifies the turnover and approves the release. You will see ${requestedNewId ?? 'the new unit'} become IN_USE in ${slotConfig.machineId}/${slotLabel}.`
                  : `This is not the unit IN_USE in ${slotConfig.machineId}/${slotLabel}. Issuance stays locked and the scan was recorded in the audit log. Find the spent unit that was in the slot and scan it.`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => setResult(null)}>
                  Scan again
                </Button>
                <Link
                  to="/lab/dashboard"
                  className="inline-flex min-h-11 items-center px-2.5 text-[13px] font-medium text-rust transition-colors hover:text-rust-deep"
                >
                  Back to dashboard
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      {!activeUnit && !openTurnover && slotConfig.suggestedNewUnitId ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Request a turnover exception
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Allowed only for an empty slot. The Custodian must approve the reason before a unit
              is released.
            </p>
          </div>

          {exceptionCandidates.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-muted">
              There is no eligible IN_STOCK 1-to-1 unit for this slot. Receive a new unit first,
              then request the exception.
            </p>
          ) : (
            <form onSubmit={requestException} noValidate className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Exception type" htmlFor="exception-type">
                  <Select
                    id="exception-type"
                    value={exceptionType}
                    onChange={(event) =>
                      setExceptionType(event.target.value as TurnoverExceptionType)
                    }
                  >
                    <option value="FIRST_INSTALL">First install in an empty slot</option>
                    <option value="DEFECTIVE_ON_ARRIVAL">Defective on arrival</option>
                  </Select>
                </Field>

                <Field
                  label="New unit"
                  htmlFor="exception-unit"
                  error={exceptionUnitError}
                  hint="Only IN_STOCK, never-issued 1-to-1 units appear here."
                >
                  <Select
                    id="exception-unit"
                    value={selectedExceptionUnit?.assetId ?? ''}
                    onChange={(event) => setExceptionNewId(event.target.value)}
                    aria-invalid={Boolean(exceptionUnitError)}
                  >
                    {exceptionCandidates.map((unit) => (
                      <option key={unit.assetId} value={unit.assetId}>
                        {unit.assetId} · {unit.itemName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="Reason for the exception (required)"
                htmlFor="exception-reason"
                error={exceptionReasonError}
                hint="Record what happened; the reason is logged in the audit queue."
              >
                <Textarea
                  id="exception-reason"
                  value={exceptionReason}
                  onChange={(event) => setExceptionReason(event.target.value)}
                  placeholder={
                    exceptionType === 'FIRST_INSTALL'
                      ? 'e.g. No drum was installed when the machine was delivered.'
                      : 'e.g. The new spool arrived cracked and cannot be installed.'
                  }
                  aria-invalid={Boolean(exceptionReasonError)}
                />
              </Field>

              <div className="flex justify-end">
                <Button type="submit">Send exception for approval</Button>
              </div>
            </form>
          )}
        </Card>
      ) : null}

      {log.length > 0 ? (
        <Card className="flex flex-col gap-2 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Scan audit trail
          </h2>
          {log.map((entry, index) => (
            <div
              key={`${entry.id}-${index}`}
              className="flex flex-wrap items-center gap-2.5 border-t border-line-soft py-2.5 text-[13px] first:border-t-0 first:pt-0"
            >
              <strong className="font-mono">{entry.id}</strong>
              <span className="text-muted">
                {entry.machineId} / {entry.slotName}
              </span>
              <Badge tone={entry.ok ? 'success' : 'danger'}>
                {entry.ok ? entry.status ?? 'RETURNED' : 'MISMATCH · LOGGED'}
              </Badge>
              <span className="ml-auto text-muted">{entry.when}</span>
            </div>
          ))}
          <span className="text-xs text-muted">
            Every attempt is kept, including mismatches, with the account and time.
          </span>
        </Card>
      ) : null}

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(value) => checkScan(value)}
        title={`Scan ${activeUnit?.assetId ?? 'the spent unit'}`}
      />
    </>
  )
}
