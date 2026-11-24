import { useState, type FormEvent } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import {
  formatVariance,
  itemNameOf,
  labRequisitionCatalog,
  requisitionNote,
  requisitionStatus,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn, nextNumericId } from '../lib/utils'
import type { SeedRequisition } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'

type Band = 'none' | 'normal' | 'elevated' | 'abnormal'

const bandStyles: Record<Band, string> = {
  none: 'border-line bg-paper',
  normal: 'border-success-line bg-success-bg',
  elevated: 'border-warning-line bg-warning-bg',
  abnormal: 'border-danger-line bg-danger-bg',
}

const varianceColors: Record<Band, string> = {
  none: 'text-neutral-text',
  normal: 'text-success',
  elevated: 'text-warning',
  abnormal: 'text-danger',
}

const bandCopy: Record<Band, { title: string; text: string }> = {
  none: {
    title: 'Enter a quantity to see how it compares',
    text: 'Requests within +25% of the baseline are processed automatically.',
  },
  normal: {
    title: 'Normal: processed automatically',
    text: 'Within +25% of your historical baseline and standard quota.',
  },
  elevated: {
    title: 'Elevated: justification needed',
    text: 'Between +25% and +50% of the baseline. Add a short reason and the request is processed.',
  },
  abnormal: {
    title: 'Abnormal surge: sent to the Central Property Custodian',
    text: '+50% or more above baseline. Automated approval is locked and an anomaly flag is logged; the custodian decides.',
  },
}

export function LabRequisition() {
  usePageTitle('Lab · Supply Requisition')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [itemId, setItemId] = useState('TNR')
  const [quantity, setQuantity] = useState('4')
  const [justification, setJustification] = useState('')
  const [tried, setTried] = useState(false)

  const selected =
    labRequisitionCatalog.find((entry) => entry.itemId === itemId) ?? labRequisitionCatalog[0]
  const quantityNumber = Number(quantity)
  const quantityValid =
    quantity.trim() !== '' &&
    Number.isInteger(quantityNumber) &&
    quantityNumber >= 1 &&
    quantityNumber <= 100
  const currentVolume = selected.used + (quantityValid ? quantityNumber : 0)
  const variance = ((currentVolume - selected.baseline) / selected.baseline) * 100
  const band: Band = !quantityValid
    ? 'none'
    : variance <= 25
      ? 'normal'
      : variance < 50
        ? 'elevated'
        : 'abnormal'

  const quantityError =
    tried && !quantityValid ? 'Enter a whole number from 1 to 100.' : undefined
  const justificationError =
    tried && band === 'elevated' && justification.trim().length < 5
      ? 'Add a short justification (at least 5 characters).'
      : undefined

  const history = [...data.requisitions]
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, 4)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTried(true)
    if (!quantityValid || (band === 'elevated' && justification.trim().length < 5)) return

    const id = nextNumericId(
      'RQ',
      data.requisitions.map((requisition) => requisition.requisitionId),
    )
    const status =
      band === 'abnormal'
        ? 'LOCKED_REVIEW'
        : band === 'elevated'
          ? 'APPROVED'
          : 'AUTO_PROCESSED'
    const requisition: SeedRequisition = {
      requisitionId: id,
      labId: 'WIL-LAB-3',
      itemId: selected.itemId,
      quantity: quantityNumber,
      unit: selected.unit,
      baselineVolume: selected.baseline,
      currentTermVolume: currentVolume,
      variancePercent: Math.round(variance * 10) / 10,
      status,
      requestedAt: new Date().toISOString(),
      justification: band === 'elevated' ? justification.trim() : null,
    }

    dispatch({ type: 'requisition/add', requisition })
    setQuantity('')
    setJustification('')
    setTried(false)

    if (band === 'abnormal') {
      showToast(
        'info',
        `${id} sent for review`,
        'The Central Property Custodian will approve or reject it. You will see the decision here.',
      )
    } else if (band === 'elevated') {
      showToast('success', `${id} submitted`, 'Processed with your justification.')
    } else {
      showToast(
        'success',
        `${id} submitted`,
        'Processed automatically within standard quota.',
      )
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Supplies' },
          { label: 'Supply Requisition' },
        ]}
        title="Request supplies"
        description="Your request is compared with this lab’s historical term baseline before it is processed."
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr] xl:items-start">
        <Card className="p-5">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              New requisition · WIL Lab 3
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Item" htmlFor="requisition-item">
                <Select
                  id="requisition-item"
                  value={itemId}
                  onChange={(event) => {
                    setItemId(event.target.value)
                    setJustification('')
                    setTried(false)
                  }}
                >
                  {labRequisitionCatalog.map((entry) => (
                    <option key={entry.itemId} value={entry.itemId}>
                      {itemNameOf(data.items, entry.itemId)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={`Quantity (${selected.unit})`}
                htmlFor="requisition-quantity"
                error={quantityError}
              >
                <Input
                  id="requisition-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  step={1}
                  value={quantity}
                  placeholder="e.g. 2"
                  aria-invalid={Boolean(quantityError)}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={cn(quantityError && 'border-danger')}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-control border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">Baseline (Hbase)</span>
                <span className="mt-1 block text-xl font-semibold leading-tight text-ink">
                  {selected.baseline} {selected.unit}
                </span>
              </div>
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">
                  This term incl. request
                </span>
                <span className="mt-1 block text-xl font-semibold leading-tight text-ink">
                  {currentVolume} {selected.unit}
                </span>
              </div>
              <div className="bg-surface p-3">
                <span className="text-xs font-medium text-muted">Variance V</span>
                <span
                  className={cn(
                    'mt-1 block text-xl font-semibold leading-tight tabular-nums',
                    varianceColors[band],
                  )}
                >
                  {quantityValid ? formatVariance(variance) : '—'}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'flex flex-col gap-1 rounded-control border p-4',
                bandStyles[band],
              )}
            >
              <strong className="text-sm font-semibold text-ink">{bandCopy[band].title}</strong>
              <span className="text-[13px] leading-relaxed text-ink">
                {bandCopy[band].text}
              </span>
            </div>

            {band === 'elevated' ? (
              <Field
                label="Justification (required for +25% to +50%)"
                htmlFor="requisition-justification"
                error={justificationError}
              >
                <Input
                  id="requisition-justification"
                  value={justification}
                  placeholder="e.g. Special Capstone Defense Week"
                  aria-invalid={Boolean(justificationError)}
                  onChange={(event) => setJustification(event.target.value)}
                  className={cn(justificationError && 'border-danger')}
                />
              </Field>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="submit">
                {band === 'abnormal' ? 'Submit for custodian review' : 'Submit requisition'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            This term’s requests
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {history.map((requisition) => {
              const status = requisitionStatus(requisition.status)
              return (
                <li
                  key={requisition.requisitionId}
                  className="flex flex-col gap-1 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
                >
                  <span className="flex items-start justify-between gap-2">
                    <strong className="text-[13px] font-semibold text-ink">
                      {requisition.requisitionId}
                    </strong>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </span>
                  <span className="text-[13px] text-ink">
                    {itemNameOf(data.items, requisition.itemId)} · {requisition.quantity}{' '}
                    {requisition.unit}
                  </span>
                  <span className="text-xs text-muted">{requisitionNote(requisition)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
