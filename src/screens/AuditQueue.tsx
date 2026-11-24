import { useState } from 'react'
import { ArrowRight, Check, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { formatShortDate } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import type { SeedAuditFlag } from '../types'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Textarea } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { cn } from '../lib/utils'

type FlagTab = 'pattern' | 'rejected' | 'dormant' | 'recon' | 'variance' | 'reviewed'

const tabDefs: Array<{ id: FlagTab; label: string }> = [
  { id: 'pattern', label: 'Suspicious patterns' },
  { id: 'rejected', label: 'Rejected attempts' },
  { id: 'dormant', label: 'Dormant assets' },
  { id: 'recon', label: 'Reconciliation' },
  { id: 'variance', label: 'Variance anomalies' },
  { id: 'reviewed', label: 'Reviewed' },
]

const patternTypes = new Set([
  'DUPLICATE_REPLACEMENT',
  'RETIRED_RESCAN',
  'UNIT_AGE',
  'LOCATION_RATE',
])

const tabFor = (flag: SeedAuditFlag): FlagTab => {
  if (flag.reviewed) return 'reviewed'
  if (flag.type === 'REJECTED_REPLACEMENT') return 'rejected'
  if (flag.type === 'DORMANT') return 'dormant'
  if (flag.type === 'RECONCILIATION') return 'recon'
  if (flag.type === 'VARIANCE') return 'variance'
  if (patternTypes.has(flag.type)) return 'pattern'
  return 'pattern'
}

const badgeFor = (flag: SeedAuditFlag): { label: string; tone: BadgeTone } => {
  if (flag.reviewed) return { label: 'REVIEWED', tone: 'success' }
  switch (flag.type) {
    case 'DUPLICATE_REPLACEMENT':
      return { label: 'SUSPICIOUS PATTERN', tone: 'danger' }
    case 'REJECTED_REPLACEMENT':
      return { label: 'REJECTED ATTEMPT', tone: 'danger' }
    case 'DORMANT':
      return { label: 'DORMANT', tone: 'warning' }
    case 'VARIANCE':
      return { label: 'V ≥ +50%', tone: 'warning' }
    case 'RETIRED_RESCAN':
      return { label: 'RETIRED RESCAN', tone: 'danger' }
    case 'UNIT_AGE':
      return { label: 'UNIT AGE', tone: 'danger' }
    case 'LOCATION_RATE':
      return { label: 'LOCATION RATE', tone: 'warning' }
    case 'RECONCILIATION':
      return { label: 'RECONCILIATION', tone: 'warning' }
    default:
      return { label: flag.severity, tone: flag.severity === 'HIGH' ? 'danger' : 'warning' }
  }
}

const actionFor = (flag: SeedAuditFlag): { to: string; label: string } => {
  switch (flag.type) {
    case 'DUPLICATE_REPLACEMENT':
    case 'UNIT_AGE':
      return { to: '/central/replacements', label: 'Open replacements' }
    case 'VARIANCE':
      return { to: '/central/requisitions', label: 'Decide in Requisition Review' }
    case 'RECONCILIATION':
      return { to: '/central/reconciliation', label: 'Open reconciliation' }
    default:
      return { to: '/central/ledger', label: 'Open ledger' }
  }
}

export function AuditQueue() {
  usePageTitle('Central · Audit Queue')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [tab, setTab] = useState<FlagTab>('pattern')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)

  const tabs = tabDefs.map((definition) => ({
    id: definition.id,
    label: definition.label,
    count: data.auditFlags.filter((flag) => tabFor(flag) === definition.id).length,
  }))

  const flags = data.auditFlags.filter((flag) => tabFor(flag) === tab)
  const noteError =
    tried && note.trim().length < 10
      ? 'Write at least 10 characters so the audit trail explains the decision.'
      : undefined

  function startReview(flag: SeedAuditFlag) {
    setReviewingId(flag.id)
    setNote('')
    setTried(false)
  }

  function saveReview() {
    if (!reviewingId) return
    if (note.trim().length < 10) {
      setTried(true)
      return
    }
    dispatch({
      type: 'audit/review',
      id: reviewingId,
      note: note.trim(),
      reviewer: 'Property Custodian',
    })
    setReviewingId(null)
    showToast('success', 'Flag reviewed', 'Your note is saved in the audit trail.')
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Units & assets' },
          { label: 'Audit Queue' },
        ]}
        title="Audit queue"
        description="Suspicious patterns, rejected replacement attempts, reconciliation discrepancies and dormant assets that need a custodian’s review."
      />

      <Tabs
        ariaLabel="Flag types"
        value={tab}
        onChange={(id) => {
          setTab(id as FlagTab)
          setReviewingId(null)
        }}
        tabs={tabs}
      />

      <section className="flex flex-col gap-4">
        {flags.length === 0 ? (
          <Card>
            <EmptyState
              icon={Check}
              title="Nothing to review here"
              description="New flags appear automatically when the system detects a pattern, a rejected attempt or a discrepancy."
            />
          </Card>
        ) : (
          flags.map((flag) => {
            const badge = badgeFor(flag)
            const action = actionFor(flag)
            const reviewing = reviewingId === flag.id
            const canReview =
              !flag.reviewed && flag.type !== 'VARIANCE' && !reviewing
            return (
              <Card key={flag.id} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        flag.severity === 'HIGH'
                          ? 'bg-danger-bg text-danger'
                          : 'bg-warning-bg text-warning',
                      )}
                    >
                      <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <strong className="text-[15px] font-semibold leading-snug text-ink">
                        {flag.title}
                      </strong>
                      <span className="text-xs text-muted">{flag.meta}</span>
                    </div>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>

                <p className="text-sm leading-relaxed text-ink">{flag.detail}</p>

                {reviewing ? (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`flag-note-${flag.id}`}
                      className="text-xs font-medium text-muted"
                    >
                      Review note (required)
                    </label>
                    <Textarea
                      id={`flag-note-${flag.id}`}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="What did you check and what was decided?"
                      aria-invalid={Boolean(noteError)}
                      className={cn('min-h-24', noteError && 'border-danger')}
                    />
                    {noteError ? (
                      <span role="alert" className="text-xs font-medium text-danger">
                        {noteError}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {flag.reviewed ? (
                  <div className="flex items-start gap-3 rounded-control border border-success-line bg-success-bg p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span className="text-[13px] leading-relaxed text-ink">
                      <strong>Reviewed</strong>
                      {flag.reviewedBy ? ` · ${flag.reviewedBy}` : ''}
                      {flag.reviewedAt ? ` · ${formatShortDate(flag.reviewedAt)}` : ''} —{' '}
                      {flag.reviewNote}
                    </span>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    to={action.to}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {canReview ? (
                    <Button variant="secondary" onClick={() => startReview(flag)}>
                      Mark as reviewed
                    </Button>
                  ) : null}

                  {reviewing ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setReviewingId(null)
                          setNote('')
                          setTried(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveReview}>Save review</Button>
                    </>
                  ) : null}
                </div>
              </Card>
            )
          })
        )}
      </section>
    </>
  )
}
