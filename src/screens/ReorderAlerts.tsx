import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  CircleCheck,
  FileText,
  Info,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from 'lucide-react'
import {
  burnRate,
  burnRateBasis,
  burnRateSeason,
  burnRateWindow,
  daysLeft,
  isAlert,
  isNoRecentUse,
  projectedDemand,
  triggerDays,
  windowDays,
  windowIssues,
  type BurnRateBasis,
  type ForecastRow,
} from '../data/reorder'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import { PolicySettingsDialog } from '../components/PolicySettingsDialog'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input } from '../components/ui/Field'
import { MetricStrip } from '../components/ui/MetricStrip'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TBody, TD, TH, THead, TR, TableWrap } from '../components/ui/Table'
import { Tabs } from '../components/ui/Tabs'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'

type TabKey = 'all' | 'alert' | 'ok'

interface DerivedRow {
  row: ForecastRow
  alert: boolean
  noRecent: boolean
  burn: number
  days: number | null
  trigger: number
  need: number
  basis: BurnRateBasis
  window: number
}

const alertTone = (entry: DerivedRow): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (entry.noRecent) return 'neutral'
  if (!entry.alert) return 'success'
  return entry.days !== null && entry.days < 14 ? 'danger' : 'warning'
}

export function ReorderAlerts() {
  usePageTitle('Central · Reorder Alerts')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()
  const policy = data.policy
  const items = data.forecast

  const [tab, setTab] = useState<TabKey>('all')
  const [loading, setLoading] = useState(false)
  const [prId, setPrId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [leadDraft, setLeadDraft] = useState('')
  const [bufferDraft, setBufferDraft] = useState('')
  const [tried, setTried] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const derived = useMemo<DerivedRow[]>(
    () =>
      items.map((row) => ({
        row,
        alert: isAlert(row, policy),
        noRecent: isNoRecentUse(row, policy),
        burn: burnRate(row, policy),
        days: daysLeft(row, policy),
        trigger: triggerDays(row),
        need: projectedDemand(row, policy),
        basis: burnRateBasis(row, policy),
        window: windowDays(row, policy),
      })),
    [items, policy],
  )

  const alerts = derived.filter((entry) => entry.alert)
  const rows = derived.filter((entry) =>
    tab === 'alert' ? entry.alert : tab === 'ok' ? !entry.alert : true,
  )

  const prRow = items.find((row) => row.id === prId) ?? null
  const prCalc = prRow
    ? {
        br: burnRate(prRow, policy),
        brWindow: burnRateWindow(prRow, policy),
        brSeason: burnRateSeason(prRow),
        d: daysLeft(prRow, policy),
        trig: triggerDays(prRow),
        need: projectedDemand(prRow, policy),
        basis: burnRateBasis(prRow, policy),
        window: windowDays(prRow, policy),
        windowIssues: windowIssues(prRow, policy),
      }
    : null

  const editingRow = items.find((row) => row.id === editingId) ?? null
  const editingDays = editingRow ? daysLeft(editingRow, policy) : null

  const leadNumber = Number(leadDraft)
  const bufferNumber = Number(bufferDraft)
  const leadError =
    tried && !(Number.isInteger(leadNumber) && leadNumber >= 14 && leadNumber <= 21)
      ? 'Enter a whole number from 14 to 21.'
      : undefined
  const bufferError =
    tried && !(Number.isInteger(bufferNumber) && bufferNumber >= 0 && bufferNumber <= 30)
      ? 'Enter a whole number from 0 to 30.'
      : undefined
  const previewTrigger =
    (Number.isFinite(leadNumber) ? leadNumber : 0) +
    (Number.isFinite(bufferNumber) ? bufferNumber : 0)
  const draftsValid =
    Number.isInteger(leadNumber) &&
    leadNumber >= 14 &&
    leadNumber <= 21 &&
    Number.isInteger(bufferNumber) &&
    bufferNumber >= 0 &&
    bufferNumber <= 30

  function recalculate() {
    setLoading(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setLoading(false)
      showToast(
        'info',
        'Forecast recalculated',
        'Burn rates use 14/42-day issuance windows and last-term seasonality.',
      )
    }, 1400)
  }

  function openSettings(row: ForecastRow) {
    setEditingId(row.id)
    setLeadDraft(String(row.lead))
    setBufferDraft(String(row.buffer))
    setTried(false)
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTried(true)
    if (!draftsValid || !editingRow) return

    dispatch({
      type: 'forecast/update',
      id: editingRow.id,
      patch: { lead: leadNumber, buffer: bufferNumber },
    })
    setEditingId(null)
    showToast(
      'success',
      'Forecast settings updated',
      `Status recalculated with the new trigger of ${leadNumber + bufferNumber} days.`,
    )
  }

  function downloadPr() {
    setPrId(null)
    showToast(
      'info',
      'Download prepared',
      'Prototype: the PDF export connects to the backend in the build.',
    )
  }

  const prFields = prRow && prCalc
    ? [
        { k: 'Item', v: `${prRow.name} (${prRow.code})` },
        { k: 'Requesting unit', v: 'WildCat Innovation Labs' },
        { k: 'Current stock', v: `${prRow.stock} units` },
        { k: 'Burn rate (BR = max(BR_w, BR_season))', v: `${prCalc.br.toFixed(2)} / day` },
        { k: 'BR basis', v: `${prCalc.basis} · ${prCalc.window}-day window` },
        {
          k: 'BR_w / BR_season',
          v: `${prCalc.brWindow.toFixed(2)} / ${prCalc.brSeason.toFixed(2)} per day`,
        },
        {
          k: 'Days to depletion',
          v: prCalc.d === null ? 'No recent use' : `${prCalc.d.toFixed(1)} days`,
        },
        { k: 'Trigger (L + S)', v: `${prCalc.trig} days` },
        {
          k: 'Projected demand over L + S',
          v: `${Math.ceil(prCalc.br * prCalc.trig)} units`,
        },
        { k: 'Requested quantity', v: `${Math.max(1, prCalc.need)} units` },
      ]
    : []

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Reorder Alerts' },
        ]}
        title="Reorder lead-time & depletion alerts"
        description="BR = max(BR_w, BR_season) · BR_w uses a 14-day window, or 42 days for low-volume items · D = stock ÷ BR · alert when D ≤ lead time + safety buffer."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPolicyOpen(true)}>
              <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              Policy settings
            </Button>
            <Button variant="secondary" onClick={recalculate} disabled={loading}>
              <RefreshCw
                className={cn(
                  'h-[18px] w-[18px]',
                  loading && 'animate-spin motion-reduce:animate-none',
                )}
                aria-hidden="true"
              />
              Recalculate
            </Button>
          </>
        }
      />

      <MetricStrip
        ariaLabel="Summary"
        items={[
          { label: 'Items at / below trigger', value: alerts.length },
          { label: 'Purchase Requisition Forms drafted', value: alerts.length },
          { label: 'Consumables tracked', value: items.length },
          { label: 'Data source', value: 'Verified QR issuance scans', text: true },
        ]}
      />

      <Card className="flex flex-col gap-4 p-5">
        <Tabs
          ariaLabel="Filter items"
          value={tab}
          onChange={(id) => setTab(id as TabKey)}
          tabs={[
            { id: 'all', label: 'All', count: derived.length },
            { id: 'alert', label: 'At / below trigger', count: alerts.length },
            { id: 'ok', label: 'OK / no recent use', count: derived.length - alerts.length },
          ]}
        />

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            aria-label="Recalculating forecast"
            className="flex flex-col gap-3.5 py-2"
          >
            <span className="block h-3.5 w-2/5 animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
            <span className="block h-3.5 w-[90%] animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
            <span className="block h-3.5 w-[85%] animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
            <span className="block h-3.5 w-[70%] animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
            <span className="text-xs text-muted">
              Recomputing 14/42-day burn rates and last-term seasonality…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title="No items in this view"
            description="Every consumable either has enough stock for its lead time and buffer, or has no recent use."
          />
        ) : (
          <TableWrap className="rounded-control">
            <Table className="min-w-[880px]">
              <THead>
                <tr>
                  <TH>Item</TH>
                  <TH numeric>Stock</TH>
                  <TH numeric>BR / day</TH>
                  <TH numeric>D (days)</TH>
                  <TH numeric>L + S</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((entry) => {
                  const { row, alert, noRecent, burn, days, basis, window } = entry
                  return (
                    <TR key={row.id}>
                      <TD>
                        <span className="flex flex-col gap-0.5">
                          <span className="font-semibold">{row.name}</span>
                          <span className="text-xs text-muted">
                            {row.code} · {windowIssues(row, policy)} used in {window} days
                          </span>
                        </span>
                      </TD>
                      <TD numeric>{row.stock}</TD>
                      <TD numeric>
                        <span className="flex flex-col items-end gap-0.5">
                          <span>{burn.toFixed(2)}</span>
                          <span className="text-[11px] font-normal text-muted">{basis}</span>
                        </span>
                      </TD>
                      <TD numeric className="font-semibold">
                        {noRecent ? 'No recent use' : days !== null ? days.toFixed(1) : '—'}
                      </TD>
                      <TD numeric>{triggerDays(row)} d</TD>
                      <TD>
                        <Badge tone={alertTone(entry)}>
                          {noRecent ? 'NO RECENT USE' : alert ? 'ALERT · PR DRAFTED' : 'OK'}
                        </Badge>
                      </TD>
                      <TD className="whitespace-nowrap text-right">
                        {alert ? (
                          <button
                            type="button"
                            onClick={() => setPrId(row.id)}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            View PR
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openSettings(row)}
                          aria-label={`Forecast settings for ${row.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" />
                          Settings
                        </button>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Dialog
        open={Boolean(prRow)}
        onClose={() => setPrId(null)}
        title={prRow ? `Purchase Requisition ${prRow.prNumber}` : 'Purchase Requisition'}
        eyebrow="Pre-generated · audit-ready"
        className="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPrId(null)}>
              Close
            </Button>
            <Button onClick={downloadPr}>Download PR</Button>
          </>
        }
      >
        <dl className="m-0 divide-y divide-line-soft overflow-hidden rounded-control border border-line">
          {prFields.map((field) => (
            <div
              key={field.k}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 odd:bg-paper"
            >
              <dt className="text-xs font-medium text-muted">{field.k}</dt>
              <dd className="m-0 text-[13px] font-medium text-ink">{field.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
          <span className="text-[13px] leading-relaxed text-ink">
            Requested quantity covers lead time + safety buffer at the current burn rate. The form
            follows the normal CIT purchasing approval route (14–21 days).
          </span>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editingRow)}
        onClose={() => setEditingId(null)}
        title="Forecast settings"
        className="max-w-lg"
      >
        {editingRow ? (
          <form
            id="forecast-settings"
            onSubmit={saveSettings}
            noValidate
            className="flex flex-col gap-4"
          >
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-ink">{editingRow.name}</span> ·{' '}
              {editingRow.code}. Adjust the procurement lead time and safety buffer for this item.
              Forecast window lengths are shared policy values.
            </p>

            <Field
              label="Procurement lead time (days)"
              htmlFor="forecast-lead"
              error={leadError}
              hint="Standard CIT purchasing approval is 14–21 calendar days."
            >
              <Input
                id="forecast-lead"
                type="number"
                inputMode="numeric"
                min={14}
                max={21}
                step={1}
                value={leadDraft}
                onChange={(event) => setLeadDraft(event.target.value)}
                aria-invalid={Boolean(leadError)}
                className={cn(leadError && 'border-danger')}
              />
            </Field>

            <Field
              label="Safety buffer (days of average demand)"
              htmlFor="forecast-buffer"
              error={bufferError}
              hint="0–30 days."
            >
              <Input
                id="forecast-buffer"
                type="number"
                inputMode="numeric"
                min={0}
                max={30}
                step={1}
                value={bufferDraft}
                onChange={(event) => setBufferDraft(event.target.value)}
                aria-invalid={Boolean(bufferError)}
                className={cn(bufferError && 'border-danger')}
              />
            </Field>

            {draftsValid ? (
              <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
                <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
                <span className="text-[13px] leading-relaxed text-ink">
                  New trigger: alert when D ≤ <strong>{previewTrigger}</strong> days. Current D ={' '}
                  {editingDays === null ? 'no recent use' : `${editingDays.toFixed(1)} days`}.
                </span>
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <PolicySettingsDialog open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  )
}
