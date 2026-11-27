import { useState } from 'react'
import { ClipboardList, SlidersHorizontal } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  formatShortDate,
  formatVariance,
  itemNameOf,
  labLabel,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedRequisition, VarianceBand } from '../types'
import { PolicySettingsDialog } from '../components/PolicySettingsDialog'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Textarea } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '../components/ui/Table'
import { Tabs } from '../components/ui/Tabs'

type QueueTab = 'locked' | 'justified' | 'auto' | 'decided'
type Decision = 'approve' | 'reject'

const queueFor = (requisition: SeedRequisition): QueueTab => {
  if (requisition.status === 'LOCKED_REVIEW') return 'locked'
  if (requisition.status === 'REJECTED' || requisition.reviewedAt) return 'decided'
  if (requisition.status === 'APPROVED' && requisition.justification) return 'justified'
  if (requisition.status === 'AUTO_PROCESSED') return 'auto'
  return 'auto'
}

const queueLabels: Record<QueueTab, string> = {
  locked: 'Locked for review',
  justified: 'Justified (+25% to +50%)',
  auto: 'Auto-processed',
  decided: 'Decided',
}

const statusFor = (
  requisition: SeedRequisition,
  queue: QueueTab,
): { label: string; tone: BadgeTone; note: string } => {
  if (queue === 'locked' && requisition.band === 'NO_BASELINE') {
    return {
      label: 'NO BASELINE · MANUAL REVIEW',
      tone: 'warning',
      note: 'Variance V cannot be computed; collect-baseline mode',
    }
  }
  if (queue === 'locked') {
    return { label: 'LOCKED · REVIEW', tone: 'danger', note: 'Anomaly flag logged' }
  }
  if (queue === 'justified') {
    return {
      label: 'PROCESSED WITH JUSTIFICATION',
      tone: 'warning',
      note: requisition.justification
        ? `Justification: ${requisition.justification}`
        : 'Justification recorded',
    }
  }
  if (queue === 'auto') {
    return { label: 'AUTO-PROCESSED', tone: 'success', note: 'Within standard quota' }
  }
  return {
    label:
      requisition.status === 'APPROVED'
        ? 'APPROVED BY CUSTODIAN'
        : 'REJECTED BY CUSTODIAN',
    tone: requisition.status === 'APPROVED' ? 'success' : 'neutral',
    note: requisition.reviewNote
      ? `Note: ${requisition.reviewNote}`
      : 'Decided by Property Custodian',
  }
}

const varianceColor = (band: VarianceBand) =>
  band === 'ABNORMAL'
    ? 'text-danger'
    : band === 'ELEVATED'
      ? 'text-warning'
      : band === 'NO_BASELINE'
        ? 'text-neutral-text'
        : 'text-success'

const varianceSurface = (band: VarianceBand) =>
  band === 'ABNORMAL'
    ? 'bg-danger-bg'
    : band === 'ELEVATED'
      ? 'bg-warning-bg'
      : 'bg-surface'

export function RequisitionReview() {
  usePageTitle('Central · Requisition Review')
  const { data, dispatch } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [tab, setTab] = useState<QueueTab>('locked')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [decision, setDecision] = useState<Decision>('approve')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const policy = data.policy

  const rows = [...data.requisitions]
    .filter((requisition) => queueFor(requisition) === tab)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))

  const counts = (['locked', 'justified', 'auto', 'decided'] as QueueTab[]).reduce(
    (result, queue) => {
      result[queue] = data.requisitions.filter(
        (requisition) => queueFor(requisition) === queue,
      ).length
      return result
    },
    {} as Record<QueueTab, number>,
  )

  const flagged = data.requisitions.filter(
    (requisition) => requisition.band === 'ABNORMAL' || requisition.band === 'NO_BASELINE',
  )
  const termReport = {
    flagged: flagged.length,
    confirmed: flagged.filter((requisition) => requisition.status === 'APPROVED').length,
    rejected: flagged.filter((requisition) => requisition.status === 'REJECTED').length,
    pending: flagged.filter((requisition) => requisition.status === 'LOCKED_REVIEW').length,
  }

  const reviewing = data.requisitions.find(
    (requisition) => requisition.requisitionId === reviewingId,
  )
  const reasonError =
    tried && decision === 'reject' && reason.trim().length < 10
      ? 'A rejection needs a reason of at least 10 characters.'
      : undefined

  function openReview(requisition: SeedRequisition) {
    setReviewingId(requisition.requisitionId)
    setDecision('approve')
    setReason('')
    setTried(false)
  }

  function submitDecision() {
    if (!reviewing) return
    if (decision === 'reject' && reason.trim().length < 10) {
      setTried(true)
      return
    }

    const reviewer = user?.name ?? 'Property Custodian'
    dispatch({
      type: 'requisition/decide',
      id: reviewing.requisitionId,
      decision,
      note: reason.trim(),
      reviewer,
    })
    dispatch({
      type: 'audit/log',
      entry: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: reviewer,
        action: 'REQUISITION_DECIDED',
        entityType: 'REQUISITION',
        entityId: reviewing.requisitionId,
        detail: `${reviewing.requisitionId} ${decision === 'approve' ? 'approved' : 'rejected'}${reason.trim() ? `: ${reason.trim()}` : '.'}`,
      },
    })
    setReviewingId(null)
    showToast(
      'success',
      `${reviewing.requisitionId} ${decision === 'approve' ? 'approved' : 'rejected'}`,
      'Decision and note recorded in the audit trail.',
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Demand' },
          { label: 'Requisition Review' },
        ]}
        title="Requisition review"
        description={`V = ((C_t − E) ÷ E) × 100, where E = Hbase × week ${data.term.weeksElapsed} ÷ ${data.term.weeksInTerm} · ≤ +${policy.varianceNormalPct}% auto-processed · +${policy.varianceNormalPct}% to +${policy.varianceLockPct}% needs justification · ≥ +${policy.varianceLockPct}% or no baseline is locked for review.`}
        actions={
          <Button variant="secondary" onClick={() => setPolicyOpen(true)}>
            <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
            Policy settings
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <Tabs
          ariaLabel="Requisition queues"
          value={tab}
          onChange={(id) => setTab(id as QueueTab)}
          tabs={(['locked', 'justified', 'auto', 'decided'] as QueueTab[]).map((queue) => ({
            id: queue,
            label: queueLabels[queue],
            count: counts[queue],
          }))}
        />

        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === 'locked' ? 'No locked requisitions' : 'Nothing in this queue'}
            description={
              tab === 'locked'
                ? 'Every requisition this term is within +50% of its historical baseline, or has already been decided.'
                : 'Requisitions appear here as labs submit them.'
            }
          />
        ) : (
          <TableWrap>
            <Table className="min-w-[900px]">
              <THead>
                <tr>
                  <TH>Requisition</TH>
                  <TH>Item</TH>
                  <TH>Qty</TH>
                  <TH numeric>Expected → current</TH>
                  <TH numeric>V</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((requisition) => {
                  const queue = queueFor(requisition)
                  const status = statusFor(requisition, queue)
                  return (
                    <TR key={requisition.requisitionId}>
                      <TD>
                        <span className="flex flex-col gap-0.5">
                          <strong className="text-[13px] font-semibold">
                            {requisition.requisitionId}
                          </strong>
                          <span className="text-xs text-muted">
                            {labLabel(requisition.labId)} ·{' '}
                            {formatShortDate(requisition.requestedAt)}
                          </span>
                        </span>
                      </TD>
                      <TD>{itemNameOf(data.items, requisition.itemId)}</TD>
                      <TD className="whitespace-nowrap">
                        {requisition.quantity} {requisition.unit}
                      </TD>
                      <TD numeric>
                        {requisition.expectedVolume === null
                          ? '—'
                          : Math.round(requisition.expectedVolume * 100) / 100}{' '}
                        → {requisition.currentTermVolume}
                      </TD>
                      <TD
                        numeric
                        className={cn(
                          'font-semibold',
                          varianceColor(requisition.band),
                        )}
                      >
                        {formatVariance(requisition.variancePercent)}
                      </TD>
                      <TD>
                        <span className="flex flex-col items-start gap-1">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <span className="text-xs text-muted">{status.note}</span>
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap text-right">
                        {queue === 'locked' ? (
                          <Button onClick={() => openReview(requisition)}>Review</Button>
                        ) : null}
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Term variance review
            </h2>
            <p className="text-[13px] text-muted">
              Flagged requisitions this term and the Custodian decisions recorded against them.
            </p>
          </div>
          <span className="text-xs text-muted">
            Week {data.term.weeksElapsed} of {data.term.weeksInTerm}
          </span>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Flagged', value: termReport.flagged },
            { label: 'Confirmed (approved)', value: termReport.confirmed },
            { label: 'Rejected', value: termReport.rejected },
            { label: 'Pending', value: termReport.pending },
          ].map((item) => (
            <div key={item.label} className="rounded-control border border-line bg-paper p-3">
              <dt className="text-xs font-medium text-muted">{item.label}</dt>
              <dd className="m-0 mt-1 text-xl font-semibold tabular-nums text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs leading-relaxed text-muted">
          Confirmed means the Custodian approved a flagged request after review. This report is
          derived from the live queue; no separate tally is stored.
        </p>
      </Card>

      <Dialog
        open={Boolean(reviewing)}
        onClose={() => setReviewingId(null)}
        title={reviewing ? `Review ${reviewing.requisitionId}` : 'Review requisition'}
        eyebrow={
          reviewing?.band === 'NO_BASELINE'
            ? 'No baseline · manual review'
            : `Locked · V ≥ +${policy.varianceLockPct}%`
        }
        className="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewingId(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'reject' ? 'danger' : 'primary'}
              onClick={submitDecision}
            >
              {decision === 'reject' ? 'Reject requisition' : 'Approve requisition'}
            </Button>
          </>
        }
      >
        {reviewing ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-control border border-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">Historical baseline</span>
                <span className="mt-1 block text-[22px] font-semibold leading-tight text-ink">
                  {reviewing.baselineVolume > 0
                    ? `${reviewing.baselineVolume} ${reviewing.unit}`
                    : 'None'}
                </span>
              </div>
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">
                  Expected at week {reviewing.weeksElapsed}
                </span>
                <span className="mt-1 block text-[22px] font-semibold leading-tight text-ink">
                  {reviewing.expectedVolume === null
                    ? '—'
                    : `${Math.round(reviewing.expectedVolume * 100) / 100} ${reviewing.unit}`}
                </span>
              </div>
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">This term</span>
                <span className="mt-1 block text-[22px] font-semibold leading-tight text-ink">
                  {reviewing.currentTermVolume} {reviewing.unit}
                </span>
              </div>
              <div className={cn('p-3', varianceSurface(reviewing.band))}>
                <span className="text-xs font-medium text-muted">Variance V</span>
                <span
                  className={cn(
                    'mt-1 block text-[22px] font-semibold leading-tight',
                    varianceColor(reviewing.band),
                  )}
                >
                  {formatVariance(reviewing.variancePercent)}
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-ink">
              {labLabel(reviewing.labId)} requested{' '}
              <strong>
                {reviewing.quantity} {reviewing.unit}
              </strong>{' '}
              of {itemNameOf(data.items, reviewing.itemId)}.{' '}
              {reviewing.band === 'NO_BASELINE'
                ? 'No usable historical baseline exists, so V cannot be computed. Approve the request or reject it with a reason; the item enters collect-baseline mode until a full term of data exists.'
                : `Automated approval was locked because V is at or above +${policy.varianceLockPct}%; an anomaly flag was logged in the audit trail.`}
            </p>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="text-xs font-medium text-muted">Decision</legend>
              <div className="flex flex-wrap items-center gap-2.5">
                {(['approve', 'reject'] as Decision[]).map((value) => {
                  const selected = decision === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setDecision(value)
                        setTried(false)
                      }}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-control border px-4 text-sm font-semibold transition-colors',
                        selected
                          ? value === 'approve'
                            ? 'border-success bg-success-bg text-success'
                            : 'border-danger bg-danger-bg text-danger'
                          : 'border-line bg-surface text-neutral-text hover:bg-butter-soft',
                      )}
                    >
                      {value === 'approve' ? 'Approve requisition' : 'Reject requisition'}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-reason" className="text-xs font-medium text-muted">
                {decision === 'reject'
                  ? 'Reason for rejection (required)'
                  : 'Note for the audit trail (optional)'}
              </label>
              <Textarea
                id="review-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain the decision for the audit trail"
                aria-invalid={Boolean(reasonError)}
                className={cn('min-h-24', reasonError && 'border-danger')}
              />
              {reasonError ? (
                <span role="alert" className="text-xs font-medium text-danger">
                  {reasonError}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>

      <PolicySettingsDialog open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  )
}
