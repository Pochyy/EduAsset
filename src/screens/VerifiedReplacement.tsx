import { useState } from 'react'
import { AlertTriangle, Camera, Check, QrCode, X } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { formatShortDate } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedAuditFlag } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'

const oldAssetId = 'KB-0007'
const requestDate = '2026-11-17'

interface Rejection {
  id: string
  when: string
  reason: string
}

const nextFlagId = (flags: SeedAuditFlag[]) => {
  const highest = flags.reduce((max, flag) => {
    const value = Number(flag.id.replace(/\D/g, ''))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
  return `f${highest + 1}`
}

export function VerifiedReplacement() {
  usePageTitle('Central · Verified Replacement')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [oldScan, setOldScan] = useState(oldAssetId)
  const [oldVerified, setOldVerified] = useState(true)
  const [oldError, setOldError] = useState('')
  const [newId, setNewId] = useState('')
  const [oldPhoto, setOldPhoto] = useState(false)
  const [newPhoto, setNewPhoto] = useState(false)
  const [approver, setApprover] = useState('')
  const [phase, setPhase] = useState<'edit' | 'pending' | 'done'>('edit')
  const [rejections, setRejections] = useState<Rejection[]>([])

  const oldUnit = data.units.find((unit) => unit.assetId === oldAssetId)
  if (!oldUnit) return null

  const normalizedNewId = newId.trim().toUpperCase()
  const newUnit = data.units.find((unit) => unit.assetId === normalizedNewId)
  const candidates = data.units.filter(
    (unit) => unit.itemId === 'KB_USB' && unit.inventoryStatus === 'IN_STOCK',
  )

  const ruleOld = oldVerified && oldUnit.inventoryStatus === 'RETIRED'
  const submitted = phase !== 'edit'
  const ruleStock =
    submitted || (Boolean(newUnit) && newUnit?.inventoryStatus === 'IN_STOCK')
  const ruleDate =
    submitted || (Boolean(newUnit) && (newUnit?.deliveryDate ?? '') > requestDate)
  const ruleDifferent =
    submitted || (Boolean(normalizedNewId) && normalizedNewId !== oldAssetId)
  const allValid = Boolean(newUnit) && ruleStock && ruleDate && ruleDifferent
  const failed = Boolean(normalizedNewId) && !allValid && phase === 'edit'
  const missing: string[] = []
  if (!normalizedNewId) missing.push('choose the new unit')
  if (!oldVerified) missing.push('verify the old-unit scan')
  if (!oldPhoto) missing.push('attach the old unit photo')
  if (!newPhoto) missing.push('attach the new unit photo')
  if (!approver) missing.push('select the second approver')
  const canSubmit =
    allValid && oldVerified && oldPhoto && newPhoto && Boolean(approver) && phase === 'edit'

  const steps = [
    { label: 'Request raised', done: true },
    { label: 'New unit verified', done: allValid },
    { label: 'Submitted', done: phase !== 'edit' },
    { label: 'Second person confirmed', done: phase === 'done' },
  ]

  function verifyOld() {
    const scanned = oldScan.trim().toUpperCase()
    const ok = scanned === oldAssetId
    setOldVerified(ok)
    setOldError(ok ? '' : `That is not the unit being replaced. Scan ${oldAssetId}.`)
    if (ok) {
      showToast('success', 'Old unit verified', `${oldAssetId} matches this replacement request.`)
    }
  }

  function rejectAttempt() {
    const reason = !newUnit
      ? 'Not a valid replacement candidate'
      : newUnit.inventoryStatus !== 'IN_STOCK'
        ? 'Previously issued unit'
        : !ruleDate
          ? 'Delivery record predates the request'
          : 'Same asset ID as the old unit'

    const flag: SeedAuditFlag = {
      id: nextFlagId(data.auditFlags),
      type: 'REJECTED_REPLACEMENT',
      severity: 'HIGH',
      title: `Replacement rejected: ${normalizedNewId || 'unknown unit'}`,
      entityId: normalizedNewId || oldAssetId,
      meta: `${normalizedNewId || '—'} · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Property Custodian account`,
      detail: `${normalizedNewId || 'The selected unit'} was offered as the new unit for ${oldAssetId}. ${reason}. The act was logged for audit.`,
      reviewed: false,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
    }

    dispatch({ type: 'audit/add', flag })
    setRejections((current) => [
      {
        id: normalizedNewId || 'Unknown',
        when: 'Just now · Property Custodian',
        reason,
      },
      ...current,
    ])
    setNewId('')
    showToast(
      'error',
      'Rejected attempt logged',
      `${normalizedNewId || 'The unit'} cannot replace ${oldAssetId}. The attempt is logged in the Audit Queue.`,
    )
  }

  function submitForApproval() {
    setPhase('pending')
    showToast(
      'info',
      'Submitted for confirmation',
      `${approver} must confirm before the replacement completes.`,
    )
  }

  function confirmAsApprover() {
    dispatch({
      type: 'unit/patch',
      id: oldAssetId,
      patch: { inventoryStatus: 'RETIRED', healthState: 'CONDEMNED_BER' },
    })
    dispatch({
      type: 'unit/patch',
      id: normalizedNewId,
      patch: {
        inventoryStatus: 'ISSUED_IN_USE',
        healthState: 'OPERATIONAL',
        location: oldUnit!.location,
      },
    })
    setPhase('done')
    showToast(
      'success',
      'Replacement complete',
      `${oldAssetId} → ${normalizedNewId} linked and saved in the audit log.`,
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Units & assets' },
          { label: 'Replacements' },
        ]}
        title="Replacement RR-0043"
        description="Requested by WIL Lab Assistant on Nov 17 · Reason: broken keyboard at WIL workstation 5 (photo attached)."
      />

      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {steps.map((entry, index) => (
          <li
            key={entry.label}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold',
              entry.done
                ? 'border-success-line bg-success-bg text-success'
                : 'border-line bg-surface text-muted',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[11px]',
                entry.done ? 'bg-success text-white' : 'bg-neutral-bg text-neutral-text',
              )}
            >
              {entry.done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            {entry.label}
          </li>
        ))}
      </ol>

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-rust">OLD UNIT</span>
            <Badge tone={phase === 'done' ? 'danger' : 'warning'}>
              {phase === 'done' ? 'RETIRED' : 'PENDING RETIREMENT'}
            </Badge>
          </div>
          <strong className="font-mono text-2xl text-rust">{oldUnit.assetId}</strong>
          <span className="text-[13px] text-neutral-text">
            {oldUnit.itemName} · {oldUnit.location} · Health: {oldUnit.healthState} (not
            repairable)
          </span>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="replacement-old" className="text-xs font-semibold text-muted">
              Scan or type the old unit’s asset ID
            </label>
            <div className="flex gap-2">
              <Input
                id="replacement-old"
                value={oldScan}
                onChange={(event) => {
                  setOldScan(event.target.value)
                  setOldVerified(false)
                  setOldError('')
                }}
                placeholder={`e.g. ${oldAssetId}`}
                className="font-mono"
              />
              <Button variant="secondary" onClick={verifyOld}>
                Verify scan
              </Button>
            </div>
            {oldError ? (
              <span role="alert" className="text-xs font-medium text-danger">
                {oldError}
              </span>
            ) : null}
          </div>
          <Button
            variant={oldPhoto ? 'secondary' : 'ghost'}
            className={cn(
              'self-start border-dashed',
              oldPhoto && 'border-success text-success',
            )}
            onClick={() => setOldPhoto((current) => !current)}
          >
            {oldPhoto ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {oldPhoto ? 'Condition photo attached' : 'Attach condition photo (required)'}
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-rust">NEW UNIT</span>
            <Badge
              tone={
                phase === 'done'
                  ? 'success'
                  : !normalizedNewId
                    ? 'neutral'
                    : allValid
                      ? 'success'
                      : 'danger'
              }
            >
              {phase === 'done'
                ? 'ISSUED / IN_USE'
                : !normalizedNewId
                  ? 'NOT SELECTED'
                  : allValid
                    ? 'VALID'
                    : 'INVALID'}
            </Badge>
          </div>

          <label htmlFor="replacement-new" className="text-xs font-semibold text-muted">
            Scan or type the new unit’s asset ID
          </label>
          <div className="flex gap-2">
            <Input
              id="replacement-new"
              value={newId}
              onChange={(event) => {
                setNewId(event.target.value)
                if (phase !== 'edit') setPhase('edit')
              }}
              placeholder="e.g. KB-0152"
              className="font-mono"
            />
            <Button
              variant="secondary"
              size="icon"
              aria-label="Scan QR with camera"
              onClick={() =>
                showToast(
                  'info',
                  'Camera scanner',
                  'Opens the phone camera or webcam QR reader in the build. Type or pick an ID here.',
                )
              }
            >
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Candidates · IN_STOCK, never issued
            </span>
            <div className="flex flex-wrap gap-2">
              {candidates.map((candidate) => {
                const selected = candidate.assetId === normalizedNewId
                return (
                  <button
                    key={candidate.assetId}
                    type="button"
                    onClick={() => {
                      setNewId(candidate.assetId)
                      if (phase !== 'edit') setPhase('edit')
                    }}
                    className={cn(
                      'flex min-h-11 flex-col items-start gap-0.5 rounded-control border px-3 py-1.5 text-left font-mono text-[13px] font-semibold text-ink transition-colors',
                      selected
                        ? 'border-2 border-amber bg-butter-soft'
                        : 'border-line bg-surface hover:bg-butter-soft',
                    )}
                  >
                    <strong>{candidate.assetId}</strong>
                    <span className="font-sans text-[11px] font-normal text-muted">
                      {candidate.deliveryRecordId} · {formatShortDate(candidate.deliveryDate)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <span className="text-[13px] text-neutral-text">
            {!normalizedNewId
              ? 'The QR code only identifies the unit; the ledger decides whether it is valid.'
              : newUnit
                ? `${newUnit.assetId} · ${newUnit.inventoryStatus} · ${newUnit.deliveryRecordId} (${formatShortDate(newUnit.deliveryDate)})`
                : 'No unit with this ID exists in the ledger.'}
          </span>

          <Button
            variant={newPhoto ? 'secondary' : 'ghost'}
            className={cn(
              'self-start border-dashed',
              newPhoto && 'border-success text-success',
            )}
            onClick={() => setNewPhoto((current) => !current)}
          >
            {newPhoto ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {newPhoto ? 'New unit photo attached' : 'Attach new unit photo (required)'}
          </Button>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[15px] font-bold text-ink">Validation rules</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {[
              {
                ok: ruleOld,
                text: 'Old unit set to RETIRED (or sent to repair)',
                note: oldVerified
                  ? `${oldAssetId} inspected: not repairable → RETIRED`
                  : `Scan ${oldAssetId} to verify the old unit`,
              },
              {
                ok: ruleStock,
                text: 'New unit is IN_STOCK with no issue or usage history',
                note: submitted
                  ? 'Never issued'
                  : !normalizedNewId
                    ? 'Scan or pick a unit'
                    : !newUnit
                      ? `${normalizedNewId} is not in the ledger`
                      : newUnit.inventoryStatus !== 'IN_STOCK'
                        ? `${newUnit.assetId} was previously issued (${newUnit.inventoryStatus})`
                        : 'Never issued',
              },
              {
                ok: ruleDate,
                text: `Delivery record dated after the request (${requestDate})`,
                note: !newUnit
                  ? '—'
                  : `${newUnit.deliveryRecordId} received ${formatShortDate(newUnit.deliveryDate)}${ruleDate ? '' : ' (before the request)'}`,
              },
              {
                ok: ruleDifferent,
                text: 'New asset ID differs from the old ID',
                note: !normalizedNewId
                  ? '—'
                  : ruleDifferent
                    ? `${normalizedNewId} ≠ ${oldAssetId}`
                    : 'Same unit as the old one',
              },
            ].map((rule) => (
              <li key={rule.text} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                    rule.ok
                      ? 'bg-success text-white'
                      : !normalizedNewId && !rule.text.startsWith('Old')
                        ? 'bg-neutral-bg text-neutral-text'
                        : 'bg-danger text-white',
                  )}
                >
                  {rule.ok ? (
                    <Check className="h-3 w-3" />
                  ) : !normalizedNewId && !rule.text.startsWith('Old') ? (
                    '•'
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">{rule.text}</span>
                  <span
                    className={cn(
                      'text-xs',
                      rule.ok || !normalizedNewId ? 'text-muted' : 'text-danger',
                    )}
                  >
                    {rule.note}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[15px] font-bold text-ink">
            Evidence &amp; two-person verification
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="replacement-approver" className="text-xs font-semibold text-muted">
              Second approver (required)
            </label>
            <Select
              id="replacement-approver"
              value={approver}
              onChange={(event) => setApprover(event.target.value)}
            >
              <option value="">Select inventory staff…</option>
              <option value="Inventory staff A">Inventory staff A</option>
              <option value="Inventory staff B">Inventory staff B</option>
            </Select>
          </div>

          {missing.length > 0 && !failed ? (
            <div className="flex items-start gap-3 rounded-control border border-warning-line bg-warning-bg p-4">
              <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                To submit: {missing.join(', ')}.
              </span>
            </div>
          ) : null}

          {failed ? (
            <div className="flex items-start gap-3 rounded-control border border-danger-line bg-danger-bg p-4">
              <X className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                This unit cannot be used as a replacement. Submitting logs a rejected attempt and
                adds a flag to the Audit Queue.
              </span>
            </div>
          ) : null}

          {phase === 'pending' ? (
            <div className="flex flex-col gap-2 rounded-control border border-butter-line bg-butter-soft p-4">
              <strong className="text-sm font-semibold text-ink">
                Waiting for {approver} to confirm
              </strong>
              <span className="text-[13px] text-ink">
                Shown here so you can try the approver’s step in this prototype.
              </span>
              <Button className="self-start" onClick={confirmAsApprover}>
                Confirm as {approver}
              </Button>
            </div>
          ) : null}

          {phase === 'done' ? (
            <div className="flex items-start gap-3 rounded-control border border-success-line bg-success-bg p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                <strong>Replacement complete.</strong> {oldAssetId} is RETIRED,{' '}
                {normalizedNewId} is ISSUED / IN_USE at {oldUnit.location}. The old → new link,
                verifier and time are saved in the audit log.
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {failed ? (
              <Button variant="danger" onClick={rejectAttempt}>
                Log rejected attempt
              </Button>
            ) : null}
            {canSubmit ? (
              <Button onClick={submitForApproval}>Submit for second approval</Button>
            ) : null}
            {phase === 'edit' && !canSubmit && !failed ? (
              <Button disabled>Submit for second approval</Button>
            ) : null}
          </div>
        </Card>
      </div>

      {rejections.length > 0 ? (
        <Card className="flex flex-col gap-2 p-5">
          <h2 className="text-[15px] font-bold text-ink">Rejected attempts (logged)</h2>
          {rejections.map((rejection) => (
            <div
              key={`${rejection.id}-${rejection.when}`}
              className="flex flex-wrap items-center gap-2 rounded-control border border-line-soft px-3.5 py-2.5 text-[13px]"
            >
              <strong className="font-mono">{rejection.id}</strong>
              <span className="text-muted">{rejection.when}</span>
              <span className="text-danger">{rejection.reason}</span>
            </div>
          ))}
          <span className="text-xs text-muted">
            Each rejection is recorded in the audit history and routed to the Audit Queue.
          </span>
        </Card>
      ) : null}
    </>
  )
}
