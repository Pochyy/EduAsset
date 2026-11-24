import { useState, type FormEvent } from 'react'
import { ArrowRight, Camera, Check, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { assetSummary } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn, nextNumericId } from '../lib/utils'
import type { SeedWorkOrder } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { Field, Input, Textarea } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'

const incidentTypes = [
  { id: 'defect', label: 'Defect' },
  { id: 'jam', label: 'Jam' },
  { id: 'broken', label: 'Broken' },
] as const

type IncidentType = (typeof incidentTypes)[number]['id']

const typeLabel = (type: IncidentType) =>
  incidentTypes.find((entry) => entry.id === type)?.label ?? type

export function LabReportIncident() {
  usePageTitle('Lab · Report Incident')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [asset, setAsset] = useState('')
  const [type, setType] = useState<IncidentType | ''>('')
  const [recurring, setRecurring] = useState(false)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(false)
  const [tried, setTried] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const normalizedAsset = asset.trim().toUpperCase()
  const knownUnit = data.units.find(
    (unit) =>
      unit.assetId.toUpperCase() === normalizedAsset &&
      unit.location.startsWith('WIL'),
  )

  const assetError =
    tried && !knownUnit
      ? normalizedAsset
        ? `${normalizedAsset} is not registered in your lab. Check the label or scan again.`
        : 'Scan or type the asset ID.'
      : undefined
  const typeError = tried && !type ? 'Choose what happened.' : undefined
  const descriptionError =
    tried && description.trim().length < 10
      ? 'Describe the problem in at least 10 characters.'
      : undefined
  const photoError = tried && !photo ? 'Attach a photo of the item’s condition.' : undefined
  const valid =
    Boolean(knownUnit) &&
    Boolean(type) &&
    description.trim().length >= 10 &&
    photo

  const outcome = recurring
    ? 'NEEDS_MAINTENANCE + service ticket'
    : type === 'broken'
      ? 'Inspection by staff (repair or retire)'
      : 'Logged in asset history'

  const summary = [
    { k: 'Asset', v: normalizedAsset },
    { k: 'Type', v: type ? `${typeLabel(type)}${recurring ? ' (recurring)' : ''}` : '—' },
    { k: 'Photo', v: photo ? 'Attached' : '—' },
    { k: 'Expected outcome', v: outcome },
  ]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTried(true)
    if (!valid) return
    setConfirm(true)
  }

  function sendReport() {
    if (!knownUnit || !type) return

    const workOrderId = nextNumericId(
      'WO',
      data.workOrders.map((workOrder) => workOrder.workOrderId),
    )
    const words = description.trim().split(/\s+/).slice(0, 5).join(' ')
    const title = words.charAt(0).toUpperCase() + words.slice(1)
    const status = recurring || type === 'broken' ? 'TICKET_DISPATCHED' : 'REPORTED'

    const workOrder: SeedWorkOrder = {
      workOrderId,
      assetId: knownUnit.assetId,
      title: title || `${typeLabel(type)} report`,
      description: description.trim(),
      reportedAt: new Date().toISOString(),
      status,
      quoteAmount: null,
      berPercent: null,
      closedAt: null,
    }

    dispatch({ type: 'work-order/add', workOrder })
    if (recurring) {
      dispatch({
        type: 'unit/patch',
        id: knownUnit.assetId,
        patch: { healthState: 'NEEDS_MAINTENANCE' },
      })
    }

    setConfirm(false)
    setAsset('')
    setType('')
    setRecurring(false)
    setDescription('')
    setPhoto(false)
    setTried(false)

    if (recurring) {
      showToast(
        'success',
        'Report submitted',
        `${knownUnit.assetId} set to NEEDS_MAINTENANCE; service ticket ${workOrderId} dispatched.`,
      )
    } else if (type === 'broken') {
      showToast(
        'success',
        'Report submitted',
        `Staff will inspect ${knownUnit.assetId}. Follow it in Work Orders.`,
      )
    } else {
      showToast(
        'success',
        'Report submitted',
        `Logged in the history of ${knownUnit.assetId}.`,
      )
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Equipment' },
          { label: 'Report Incident' },
        ]}
        title="Report a defect, jam or broken item"
        description="Scan the item’s QR code, describe what happened and attach a photo. Staff inspect it and decide whether to repair or retire it."
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <Card className="p-5">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Field
              label="Asset ID (scan QR or type)"
              htmlFor="incident-asset"
              error={assetError}
            >
              <div className="flex gap-2">
                <Input
                  id="incident-asset"
                  value={asset}
                  onChange={(event) => setAsset(event.target.value)}
                  placeholder="e.g. WIL-PRN-02"
                  aria-invalid={Boolean(assetError)}
                  className={cn('font-mono', assetError && 'border-danger')}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Scan QR code"
                  onClick={() => {
                    setAsset('WIL-PRN-02')
                    setTried(false)
                  }}
                >
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </Field>

            {knownUnit ? (
              <span className="flex items-start gap-1.5 text-xs font-medium text-success">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {assetSummary(knownUnit, data.items)}
              </span>
            ) : null}

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="text-xs font-medium text-muted">What happened?</legend>
              <div className="flex flex-wrap items-center gap-2">
                {incidentTypes.map((incident) => {
                  const selected = type === incident.id
                  return (
                    <button
                      key={incident.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(incident.id)}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-control border px-4 text-sm font-semibold transition-colors',
                        selected
                          ? 'border-amber bg-butter-soft text-rust'
                          : 'border-line bg-surface text-neutral-text hover:bg-butter-soft',
                      )}
                    >
                      {incident.label}
                    </button>
                  )
                })}
              </div>
              {typeError ? (
                <span role="alert" className="text-xs font-medium text-danger">
                  {typeError}
                </span>
              ) : null}
            </fieldset>

            <label className="flex min-h-11 items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
                className="h-5 w-5 accent-rust"
              />
              This keeps happening (recurring defect)
            </label>

            <Field
              label="Description"
              htmlFor="incident-description"
              error={descriptionError}
            >
              <Textarea
                id="incident-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Paper jams at tray 2 every 20 pages"
                aria-invalid={Boolean(descriptionError)}
                className={cn('min-h-24', descriptionError && 'border-danger')}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Photo of the item’s condition (required)
              </span>
              <button
                type="button"
                onClick={() => setPhoto((current) => !current)}
                className={cn(
                  'inline-flex min-h-[52px] items-center gap-2.5 self-start rounded-control border px-4 text-sm font-semibold transition-colors',
                  photo
                    ? 'border-success bg-success-bg text-success'
                    : 'border-dashed border-rust bg-surface text-rust hover:bg-butter-soft',
                )}
              >
                {photo ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Camera className="h-5 w-5" aria-hidden="true" />
                )}
                {photo ? 'Photo attached · tap to remove' : 'Take or upload a photo'}
              </button>
              {photoError ? (
                <span role="alert" className="text-xs font-medium text-danger">
                  {photoError}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="submit">Submit report</Button>
            </div>
          </form>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            What happens next
          </h2>
          <ol className="m-0 flex list-decimal flex-col gap-2.5 pl-5 text-[13px] leading-relaxed text-ink">
            <li>
              A recurring defect sets the asset to <strong>NEEDS_MAINTENANCE</strong> and
              dispatches a service ticket to the campus technician.
            </li>
            <li>
              A broken item is inspected by staff. If it is repairable and BER is below 50%,
              it goes <strong>UNDER_REPAIR</strong> and returns with the same asset ID.
            </li>
            <li>
              Otherwise it is <strong>CONDEMNED / BER</strong> and replaced through a verified
              replacement.
            </li>
          </ol>
          <Link
            to="/lab/work-orders"
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-medium text-rust transition-colors hover:text-rust-deep"
          >
            Track work orders
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit this report?"
        className="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Edit report
            </Button>
            <Button onClick={sendReport}>Submit report</Button>
          </>
        }
      >
        <dl className="m-0 divide-y divide-line-soft overflow-hidden rounded-control border border-line">
          {summary.map((row) => (
            <div
              key={row.k}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 odd:bg-paper"
            >
              <dt className="text-xs font-medium text-muted">{row.k}</dt>
              <dd className="m-0 text-[13px] font-medium text-ink">{row.v}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </>
  )
}
