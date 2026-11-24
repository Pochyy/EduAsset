import { useState, type FormEvent } from 'react'
import { CheckCircle2, QrCode, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { shortLocation, turnoverMachines } from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedUnit } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'

interface ScanResult {
  id: string
  ok: boolean
}

interface ScanLog {
  id: string
  machineId: string
  when: string
  ok: boolean
}

const machineLabel = (unit: SeedUnit) =>
  `${unit.assetId} · ${unit.itemName} · ${shortLocation(unit.location)}`

export function LabTurnoverScan() {
  usePageTitle('Lab · Turnover Scan')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [machineKey, setMachineKey] = useState<string>(turnoverMachines[0].key)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [log, setLog] = useState<ScanLog[]>([])

  const machineConfig =
    turnoverMachines.find((entry) => entry.key === machineKey) ?? turnoverMachines[0]
  const activeUnit = data.units.find(
    (unit) => unit.assetId === machineConfig.activeUnitId,
  )

  const banner = !result
    ? {
        tone: 'warning' as const,
        title: `Issuance locked for ${machineConfig.newUnitId}`,
        text: `Scan ${machineConfig.activeUnitId}, the spent unit active on ${machineConfig.machineId}, to complete the turnover.`,
      }
    : result.ok
      ? {
          tone: 'success' as const,
          title: `Turnover complete: ${machineConfig.activeUnitId} is RETURNED_EMPTY`,
          text: `${machineConfig.newUnitId} is unlocked and waiting for the custodian’s disbursement approval.`,
        }
      : {
          tone: 'danger' as const,
          title: 'Wrong unit scanned',
          text: 'Issuance stays locked until the correct spent unit is scanned.',
        }

  function checkScan(raw: string) {
    const id = raw.trim().toUpperCase()
    if (!id) {
      showToast('error', 'Nothing scanned', 'Scan the QR code or type the asset ID.')
      return
    }

    const ok = id === machineConfig.activeUnitId
    setResult({ id, ok })
    setInput('')
    setLog((current) => [
      {
        id,
        machineId: machineConfig.machineId,
        when: 'Just now · Lab Assistant',
        ok,
      },
      ...current,
    ])

    if (ok) {
      dispatch({
        type: 'unit/patch',
        id: machineConfig.activeUnitId,
        patch: { inventoryStatus: 'RETURNED_EMPTY' },
      })
      const turnover = data.turnovers.find(
        (entry) =>
          entry.machineId === machineConfig.machineId && entry.status !== 'RELEASED',
      )
      if (turnover) {
        dispatch({
          type: 'turnover/status',
          id: turnover.turnoverId,
          status: 'READY_TO_APPROVE',
        })
      }
      showToast(
        'success',
        `${id} returned empty`,
        `Turnover recorded. Waiting for the custodian to release ${machineConfig.newUnitId}.`,
      )
    } else {
      showToast(
        'error',
        'Scan does not match',
        `${id} is not active on ${machineConfig.machineId}. Issuance stays locked.`,
      )
    }
  }

  function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    checkScan(input)
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
        description="Scan the spent unit before a new cartridge, drum or spool is released."
      />

      <Card className="grid gap-4 p-5 md:grid-cols-3 md:items-end">
        <Field label="Machine" htmlFor="turnover-machine">
          <Select
            id="turnover-machine"
            value={machineKey}
            onChange={(event) => {
              setMachineKey(event.target.value)
              setResult(null)
              setInput('')
            }}
          >
            {turnoverMachines.map((entry) => {
              const unit = data.units.find((candidate) => candidate.assetId === entry.machineId)
              return (
                <option key={entry.key} value={entry.key}>
                  {unit ? machineLabel(unit) : entry.machineId}
                </option>
              )
            })}
          </Select>
        </Field>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Requested new unit</span>
          <strong className="flex min-h-11 items-center font-mono text-[15px] font-semibold text-ink">
            {machineConfig.newUnitId}
          </strong>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">
            Currently active on this machine
          </span>
          <strong className="flex min-h-11 items-center font-mono text-[15px] font-semibold text-ink">
            {activeUnit?.assetId ?? machineConfig.activeUnitId}
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
              <span className="text-[13px]">Point the camera at the spent unit’s QR code</span>
            </span>
          </div>

          <form onSubmit={scan} noValidate className="flex flex-wrap items-end gap-2.5">
            <Field label="Or type the asset ID" htmlFor="turnover-input" className="min-w-[220px] flex-1">
              <Input
                id="turnover-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="e.g. TNR-WIL-2026-001"
                className="font-mono"
              />
            </Field>
            <Button type="submit">Verify scan</Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Demo scans:</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-mono"
              onClick={() => checkScan(machineConfig.activeUnitId)}
            >
              {machineConfig.activeUnitId}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-mono"
              onClick={() => checkScan(machineConfig.wrongUnitId)}
            >
              {machineConfig.wrongUnitId}
            </Button>
          </div>
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
                  { k: 'Expected', v: machineConfig.activeUnitId },
                  { k: 'Status', v: result.ok ? 'RETURNED_EMPTY' : 'Unchanged' },
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
                  ? `The Central Property Custodian now verifies the turnover and approves the release. You will see ${machineConfig.newUnitId} become ISSUED / IN_USE and active on ${machineConfig.machineId}.`
                  : `This is not the unit active on ${machineConfig.machineId}. Issuance stays locked and the scan was recorded in the audit log. Find the spent unit that was in the machine and scan it.`}
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
              <span className="text-muted">{entry.machineId}</span>
              <Badge tone={entry.ok ? 'success' : 'danger'}>
                {entry.ok ? 'RETURNED_EMPTY' : 'MISMATCH · LOGGED'}
              </Badge>
              <span className="ml-auto text-muted">{entry.when}</span>
            </div>
          ))}
          <span className="text-xs text-muted">
            Every attempt is kept, including mismatches, with the account and time.
          </span>
        </Card>
      ) : null}
    </>
  )
}
