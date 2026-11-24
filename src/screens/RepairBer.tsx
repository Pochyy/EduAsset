import { useState } from 'react'
import { AlertTriangle, FileText, Lock, Wrench } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { formatPeso, healthStatus } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { Field, Input } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '../components/ui/Table'

interface RepairEntry {
  when: string
  what: string
  cost: number
}

const assetIds = ['WIL-3DP-002', 'WIL-PRN-02', 'WIL-PRN-01']

const baseRepairs: Record<string, RepairEntry[]> = {
  'WIL-3DP-002': [
    { when: 'Month 4', what: 'Replaced extruder assembly', cost: 4500 },
    { when: 'Month 9', what: 'Replaced mainboard and motor', cost: 6000 },
  ],
  'WIL-PRN-02': [{ when: 'Jun 2026', what: 'Fuser replacement', cost: 3800 }],
  'WIL-PRN-01': [{ when: 'Feb 2026', what: 'Pickup roller kit', cost: 1500 }],
}

const percent = (value: number) => `${(Math.floor(value * 10 + 1e-9) / 10).toFixed(1)}%`

export function RepairBer() {
  usePageTitle('Central · Repair & BER')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [selectedId, setSelectedId] = useState('WIL-3DP-002')
  const [quote, setQuote] = useState('5000')
  const [repairable, setRepairable] = useState(true)
  const [tried, setTried] = useState(false)
  const [extraRepairs, setExtraRepairs] = useState<Record<string, RepairEntry[]>>({})
  const [confirmCondemn, setConfirmCondemn] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const assetUnits = assetIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))

  const selected = assetUnits.find((unit) => unit.assetId === selectedId) ?? assetUnits[0]
  if (!selected) return null

  const item = data.items.find((entry) => entry.itemId === selected.itemId)
  const replacementValue = item?.replacementValue ?? 0
  const repairs = [...(baseRepairs[selected.assetId] ?? []), ...(extraRepairs[selected.assetId] ?? [])]
  const cumulative = repairs.reduce((total, repair) => total + repair.cost, 0)
  const quoteNumber = Number(quote)
  const quoteValid = quote.trim() !== '' && Number.isFinite(quoteNumber) && quoteNumber > 0
  const ber = quoteValid
    ? ((cumulative + quoteNumber) / replacementValue) * 100
    : (cumulative / replacementValue) * 100
  const blocked = quoteValid && (ber >= 50 || !repairable)
  const canRepair = quoteValid && ber < 50 && repairable
  const condemned = selected.healthState === 'CONDEMNED_BER'
  const underRepair = selected.healthState === 'UNDER_REPAIR'
  const quoteError =
    tried && !quoteValid ? 'Enter the technician quote as an amount above ₱0.' : undefined

  const assetCards = assetUnits.map((unit) => {
    const unitRepairs = [
      ...(baseRepairs[unit.assetId] ?? []),
      ...(extraRepairs[unit.assetId] ?? []),
    ]
    const unitCumulative = unitRepairs.reduce((total, repair) => total + repair.cost, 0)
    const unitItem = data.items.find((entry) => entry.itemId === unit.itemId)
    const unitValue = unitItem?.replacementValue ?? 0
    const unitPercent = unitValue ? (unitCumulative / unitValue) * 100 : 0
    const health = healthStatus(unit.healthState)
    return { unit, unitCumulative, unitPercent, unitValue, health }
  })

  function selectAsset(id: string) {
    setSelectedId(id)
    setQuote('')
    setRepairable(true)
    setTried(false)
  }

  function approveRepair() {
    if (!quoteValid) {
      setTried(true)
      return
    }
    dispatch({
      type: 'unit/patch',
      id: selected.assetId,
      patch: { healthState: 'UNDER_REPAIR' },
    })
    setExtraRepairs((current) => ({
      ...current,
      [selected.assetId]: [
        ...(current[selected.assetId] ?? []),
        { when: 'Now', what: 'Approved repair (quote)', cost: quoteNumber },
      ],
    }))
    setQuote('')
    setTried(false)
    showToast(
      'success',
      'Repair approved',
      `${selected.assetId} moved to UNDER_REPAIR; it returns to service with the same asset ID and history.`,
    )
  }

  function returnToService() {
    if (blocked) {
      showToast(
        'error',
        'Cannot return to service',
        'The pending quote still puts this asset at or above the 50% BER limit. Clear or reduce the quote first.',
      )
      return
    }
    dispatch({
      type: 'unit/patch',
      id: selected.assetId,
      patch: { healthState: 'OPERATIONAL' },
    })
    setQuote('')
    showToast(
      'success',
      'Returned to service',
      `${selected.assetId} is OPERATIONAL with the same asset ID, QR code and repair history.`,
    )
  }

  function condemn() {
    if (!quoteValid) {
      setTried(true)
      return
    }
    setConfirmCondemn(false)
    dispatch({
      type: 'unit/patch',
      id: selected.assetId,
      patch: { healthState: 'CONDEMNED_BER', inventoryStatus: 'RETIRED' },
    })
    setShowForm(true)
    showToast(
      'success',
      `${selected.assetId} condemned`,
      'Repair invoice blocked; form CD-2026-0019 pre-filled.',
    )
  }

  const formFields = [
    { k: 'Property tag / asset ID', v: selected.assetId },
    { k: 'Description', v: selected.itemName },
    { k: 'Serial number', v: selected.serialNumber ?? '—' },
    { k: 'Location / custodian', v: `${selected.location} · WIL Lab Manager` },
    { k: 'Replacement value', v: formatPeso(replacementValue) },
    { k: 'Calculated BER', v: percent(ber) },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Units & assets' },
          { label: 'Repair & BER' },
        ]}
        title="Repair & Beyond Economic Repair"
        description="BER = ((cumulative repair costs + pending quote) ÷ current replacement cost) × 100 · below 50% repair is approved · 50% or higher maintenance is blocked."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_2fr] xl:items-start">
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Durable assets
          </h2>
          <div className="flex flex-col gap-2.5">
            {assetCards.map(({ unit, unitCumulative, unitPercent, unitValue, health }) => {
              const active = selected.assetId === unit.assetId
              const barColor =
                unitPercent >= 50 ? 'bg-danger' : unitPercent >= 35 ? 'bg-amber' : 'bg-success'
              return (
                <button
                  key={unit.assetId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectAsset(unit.assetId)}
                  className={cn(
                    'flex w-full flex-col gap-1.5 rounded-card border-2 p-3.5 text-left transition-colors',
                    active
                      ? 'border-amber bg-butter-soft'
                      : 'border-transparent bg-surface hover:bg-paper',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-sm font-bold text-ink">{unit.assetId}</strong>
                    <Badge tone={health.tone}>{health.label}</Badge>
                  </span>
                  <span className="text-xs text-muted">{unit.itemName}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-neutral-bg">
                    <span
                      className={cn('block h-full', barColor)}
                      style={{ width: `${Math.min(100, unitPercent * 2)}%` }}
                    />
                  </span>
                  <span className="text-xs text-neutral-text">
                    Cumulative {formatPeso(unitCumulative)} · {percent(unitPercent)} of{' '}
                    {formatPeso(unitValue)}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-mono text-xl font-bold tracking-[-0.02em] text-ink">
                  {selected.assetId}
                </h2>
                <span className="text-[13px] text-muted">
                  {selected.itemName} · {selected.location} · Custodian: WIL Lab Manager
                </span>
              </div>
              <Badge tone={healthStatus(selected.healthState).tone}>
                {healthStatus(selected.healthState).label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-control border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { k: 'Replacement value', v: formatPeso(replacementValue) },
                { k: 'Repairs to date', v: formatPeso(cumulative) },
                { k: '50% limit', v: formatPeso(replacementValue / 2) },
              ].map((metric) => (
                <div key={metric.k} className="bg-surface p-3">
                  <span className="text-xs font-semibold text-muted">{metric.k}</span>
                  <span className="mt-1 block text-xl font-bold leading-tight text-ink">
                    {metric.v}
                  </span>
                </div>
              ))}
            </div>

            <TableWrap>
              <Table className="min-w-[520px]">
                <THead>
                  <tr>
                    <TH>Repair</TH>
                    <TH>Work done</TH>
                    <TH numeric>Invoice</TH>
                    <TH numeric>Cumulative BER</TH>
                  </tr>
                </THead>
                <TBody>
                  {(() => {
                    let running = 0
                    return repairs.map((repair, index) => {
                      running += repair.cost
                      return (
                        <TR key={`${repair.when}-${index}`}>
                          <TD className="whitespace-nowrap">{repair.when}</TD>
                          <TD>{repair.what}</TD>
                          <TD numeric>{formatPeso(repair.cost)}</TD>
                          <TD numeric className="font-semibold">
                            {percent((running / replacementValue) * 100)}
                          </TD>
                        </TR>
                      )
                    })
                  })()}
                </TBody>
              </Table>
            </TableWrap>
          </Card>

          {!condemned ? (
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
                Log repair quote
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Technician quote (₱)"
                  htmlFor="repair-quote"
                  error={quoteError}
                >
                  <Input
                    id="repair-quote"
                    type="number"
                    inputMode="decimal"
                    value={quote}
                    onChange={(event) => {
                      setQuote(event.target.value)
                      setTried(false)
                    }}
                    placeholder="e.g. 5000"
                    aria-invalid={Boolean(quoteError)}
                    className={cn(quoteError && 'border-danger')}
                  />
                </Field>

                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="text-xs font-semibold text-muted">Inspection result</legend>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {[
                      { value: true, label: 'Repairable' },
                      { value: false, label: 'Not repairable' },
                    ].map((option) => {
                      const active = repairable === option.value
                      return (
                        <button
                          key={option.label}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setRepairable(option.value)
                            setTried(false)
                          }}
                          className={cn(
                            'inline-flex min-h-11 items-center rounded-control border px-4 text-sm font-semibold transition-colors',
                            active
                              ? 'border-amber bg-butter-soft text-rust'
                              : 'border-line bg-surface text-neutral-text hover:bg-butter-soft',
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </div>

              <div
                className={cn(
                  'flex items-center gap-4 rounded-control border p-4',
                  !quoteValid
                    ? 'border-line bg-paper'
                    : blocked
                      ? 'border-danger-line bg-danger-bg'
                      : 'border-success-line bg-success-bg',
                )}
              >
                <span
                  className={cn(
                    'text-[28px] font-extrabold tabular-nums',
                    !quoteValid
                      ? 'text-neutral-text'
                      : blocked
                        ? 'text-danger'
                        : 'text-success',
                  )}
                >
                  {percent(ber)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-sm font-semibold text-ink">
                    {!quoteValid
                      ? 'Enter a quote to see the decision'
                      : blocked
                        ? repairable
                          ? 'BER is 50% or higher: maintenance blocked'
                          : 'Not repairable: retire the unit'
                        : 'Below 50%: repair approved'}
                  </strong>
                  <span className="text-[13px] text-neutral-text">
                    {!quoteValid
                      ? `Cumulative repairs so far: ${formatPeso(cumulative)} of ${formatPeso(replacementValue)}.`
                      : `${formatPeso(cumulative)} + ${formatPeso(quoteNumber)} = ${formatPeso(cumulative + quoteNumber)} of ${formatPeso(replacementValue)} replacement value.`}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {canRepair ? (
                  <Button onClick={approveRepair}>
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                    Approve repair → UNDER_REPAIR
                  </Button>
                ) : null}
                {blocked ? (
                  <Button variant="danger" onClick={() => setConfirmCondemn(true)}>
                    Block maintenance &amp; condemn
                  </Button>
                ) : null}
              </div>

              {underRepair ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3.5">
                  <span className="max-w-md text-[13px] leading-relaxed text-muted">
                    {blocked
                      ? 'The pending quote is at or above the 50% BER limit. Clear or reduce it before returning the asset to service.'
                      : 'Repair completed? Return this asset to service with the same asset ID, QR code and history.'}
                  </span>
                  <Button onClick={returnToService} disabled={blocked}>
                    Mark repaired · return to service
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : (
            <div className="flex items-start gap-3 rounded-control border border-danger-line bg-danger-bg p-4">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
              <span className="flex flex-col gap-1.5">
                <strong className="text-sm font-semibold text-ink">
                  {selected.assetId} is CONDEMNED / BER and RETIRED
                </strong>
                <span className="text-[13px] leading-relaxed text-ink">
                  It can never be issued again. The pre-filled Condemnation and Disposal form is
                  ready for the Property Office.
                </span>
                <Button
                  variant="secondary"
                  className="mt-1 self-start"
                  onClick={() => setShowForm(true)}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View condemnation form
                </Button>
              </span>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={confirmCondemn}
        onClose={() => setConfirmCondemn(false)}
        title={`Condemn ${selected.assetId}?`}
        className="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCondemn(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={condemn}>
              Condemn and generate form
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-neutral-text">
            The repair invoice will be blocked, the health state becomes CONDEMNED / BER and the
            inventory status RETIRED. A retired unit can never be issued again. This cannot be
            undone from the app.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Condemnation & Disposal Form"
        eyebrow="Pre-filled · PAR/ICS-compliant"
        className="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                showToast(
                  'info',
                  'Download prepared',
                  'Prototype: PDF generation connects to the backend in the build.',
                )
              }}
            >
              Download form
            </Button>
          </>
        }
      >
        <div className="overflow-hidden rounded-card border border-line">
          <div className="flex items-center justify-between bg-amber px-4 py-3 text-[13px] text-ink">
            <strong>CIT Property Office</strong>
            <span>CD-2026-0019</span>
          </div>
          <dl className="m-0 grid grid-cols-2">
            {formFields.map((field) => (
              <div key={field.k} className="border-t border-line-soft px-4 py-2.5">
                <dt className="text-xs font-semibold text-muted">{field.k}</dt>
                <dd className="m-0 mt-0.5 text-sm font-semibold text-ink">{field.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-1.5 border-t border-line-soft px-4 py-3">
            <span className="text-xs font-semibold text-muted">Maintenance expense ledger</span>
            {repairs.map((repair, index) => (
              <span
                key={`${repair.when}-${index}`}
                className="flex justify-between gap-2 text-[13px] text-ink"
              >
                <span>
                  {repair.when} · {repair.what}
                </span>
                <strong>{formatPeso(repair.cost)}</strong>
              </span>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  )
}
