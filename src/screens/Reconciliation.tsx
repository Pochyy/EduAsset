import { useState } from 'react'
import { AlertTriangle, Camera, Check, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../lib/usePageTitle'
import type { SeedAuditFlag } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Field'
import { MetricStrip } from '../components/ui/MetricStrip'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '../components/ui/Table'
import { QrScannerDialog } from '../components/QrScannerDialog'

type Phase = 'idle' | 'scan' | 'done'

const roomOf = (location: string) => location.match(/^WIL Lab \d/)?.[0] ?? location

export function Reconciliation() {
  usePageTitle('Central · Reconciliation')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const rooms = Array.from(
    new Set(
      data.units
        .filter(
          (unit) =>
            unit.category === 'DURABLE' && unit.location.startsWith('WIL Lab'),
        )
        .map((unit) => roomOf(unit.location)),
    ),
  ).sort()

  const [phase, setPhase] = useState<Phase>('idle')
  const [room, setRoom] = useState(rooms.includes('WIL Lab 3') ? 'WIL Lab 3' : rooms[0] ?? 'WIL Lab 3')
  const [frequency, setFrequency] = useState('weekly')
  const [scans, setScans] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const expectedUnits = data.units.filter(
    (unit) => unit.category === 'DURABLE' && roomOf(unit.location) === room,
  )
  const expectedIds = expectedUnits.map((unit) => unit.assetId)
  const matched = expectedUnits.filter((unit) => scans.includes(unit.assetId))
  const missing = expectedUnits.filter((unit) => !scans.includes(unit.assetId))
  const unexpected = scans.filter((id) => !expectedIds.includes(id))
  const progress = expectedUnits.length
    ? (matched.length / expectedUnits.length) * 100
    : 0
  const discrepancies = missing.length + unexpected.length
  const nextScan =
    frequency === 'weekly'
      ? `${room} · Wed Nov 26, 2026 · repeats weekly`
      : `${room} · Sat Dec 19, 2026 · repeats monthly`

  function startSession() {
    setPhase('scan')
    setScans([])
    setInput('')
    setInputError('')
  }

  function addScan(value = input) {
    const id = value.trim().toUpperCase()
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)+$/.test(id)) {
      setInputError('Enter an asset ID such as KB-0031.')
      return
    }
    if (scans.includes(id)) {
      setInputError(`${id} was already scanned in this session.`)
      return
    }
    setScans((current) => [...current, id])
    setInput('')
    setInputError('')
  }

  function finishSession() {
    const flagId = (() => {
      const highest = data.auditFlags.reduce((max, flag) => {
        const value = Number(flag.id.replace(/\D/g, ''))
        return Number.isFinite(value) ? Math.max(max, value) : max
      }, 0)
      return `f${highest + 1}`
    })()

    setPhase('done')

    if (discrepancies === 0) {
      showToast('success', 'Room reconciled', 'All expected units were found.')
      return
    }

    const summary = [
      missing.length ? `${missing.length} missing` : '',
      unexpected.length ? `${unexpected.length} unexpected` : '',
    ]
      .filter(Boolean)
      .join(' · ')

    const flag: SeedAuditFlag = {
      id: flagId,
      type: 'RECONCILIATION',
      severity: 'MEDIUM',
      title: `Reconciliation: ${summary} from ${room}`,
      entityId: room,
      meta: `${matched.length} of ${expectedUnits.length} scanned · ${room}`,
      detail: [
        missing.length
          ? `Missing: ${missing.map((unit) => unit.assetId).join(', ')}.`
          : '',
        unexpected.length ? `Unexpected: ${unexpected.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      reviewed: false,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
    }

    dispatch({ type: 'audit/add', flag })
    showToast(
      'error',
      'Discrepancies found',
      `${missing.length} missing and ${unexpected.length} unexpected unit(s) sent to the Audit Queue.`,
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Units & assets' },
          { label: 'Reconciliation' },
        ]}
        title="Periodic reconciliation"
        description="Scan every unit in a room. The system compares the scans with the ledger and flags missing or unexpected asset IDs."
      />

      {phase === 'idle' ? (
        <>
          <Card className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reconciliation-room" className="text-xs font-medium text-muted">
                Room to reconcile
              </label>
              <Select
                id="reconciliation-room"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
              >
                {rooms.map((entry) => {
                  const count = data.units.filter(
                    (unit) =>
                      unit.category === 'DURABLE' && roomOf(unit.location) === entry,
                  ).length
                  return (
                    <option key={entry} value={entry}>
                      {entry} ({count} units expected)
                    </option>
                  )
                })}
              </Select>
            </div>
            <Button onClick={startSession}>
              <ScanLine className="h-[18px] w-[18px]" aria-hidden="true" />
              Start scan session
            </Button>

            <div className="flex flex-wrap items-end gap-3 border-t border-line-soft pt-4 md:col-span-2">
              <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
                <label
                  htmlFor="reconciliation-frequency"
                  className="text-xs font-medium text-muted"
                >
                  Scheduled scans
                </label>
                <Select
                  id="reconciliation-frequency"
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                >
                  <option value="weekly">Weekly · next Nov 26, 2026</option>
                  <option value="monthly">Monthly · next Dec 19, 2026</option>
                </Select>
              </div>
              <span className="min-w-[220px] flex-1 text-[13px] text-neutral-text">
                Next scan: {nextScan}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  showToast(
                    'success',
                    'Schedule saved',
                    `Next scan: ${room} on ${
                      frequency === 'weekly' ? 'Nov 26, 2026' : 'Dec 19, 2026'
                    }, repeating ${frequency}.`,
                  )
                }
              >
                Save schedule
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-butter-soft text-rust">
                <ScanLine className="h-6 w-6" aria-hidden="true" />
              </span>
              <strong className="text-base font-semibold text-ink">No session in progress</strong>
              <p className="max-w-[420px] text-[13px] leading-relaxed text-muted">
                Pick a room and start a session. Staff scan each QR code with a phone camera or
                webcam; nothing else is needed.
              </p>
            </div>
          </Card>
        </>
      ) : null}

      {phase === 'scan' ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Scanning {room}
            </h2>
            <span className="text-[13px] font-medium text-neutral-text">
              {matched.length} of {expectedUnits.length} expected units scanned
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={expectedUnits.length}
            aria-valuenow={matched.length}
            aria-label="Expected units scanned"
            className="h-2.5 overflow-hidden rounded-full bg-neutral-bg"
          >
            <span
              className="block h-full bg-success transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              addScan()
            }}
            noValidate
            className="flex flex-wrap items-end gap-2.5"
          >
            <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
              <label htmlFor="reconciliation-scan" className="text-xs font-medium text-muted">
                Scanned asset ID
              </label>
              <Input
                id="reconciliation-scan"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value)
                  setInputError('')
                }}
                placeholder="Scan a QR code or type an ID"
                className="font-mono"
              />
            </div>
            <Button type="submit" variant="secondary">
              Add scan
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Scan with camera
            </Button>
            {inputError ? (
              <span role="alert" className="w-full text-xs font-medium text-danger">
                {inputError}
              </span>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Quick scan (demo):</span>
            {[...expectedIds.slice(0, 6), 'KB-0099']
              .filter((id) => !scans.includes(id))
              .map((id) => (
                <Button
                  key={id}
                  variant="secondary"
                  size="sm"
                  className="font-mono"
                  onClick={() => {
                    setScans((current) => [...current, id])
                    setInputError('')
                  }}
                >
                  {id}
                </Button>
              ))}
          </div>

          <TableWrap>
            <Table className="min-w-[520px]">
              <THead>
                <tr>
                  <TH>Expected unit</TH>
                  <TH>Item</TH>
                  <TH>Result</TH>
                </tr>
              </THead>
              <TBody>
                {expectedUnits.map((unit) => {
                  const scanned = scans.includes(unit.assetId)
                  return (
                    <TR key={unit.assetId}>
                      <TD className="font-mono text-xs font-bold">{unit.assetId}</TD>
                      <TD>{unit.itemName}</TD>
                      <TD>
                        <Badge tone={scanned ? 'success' : 'neutral'}>
                          {scanned ? 'SCANNED' : 'NOT YET SCANNED'}
                        </Badge>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>

          {unexpected.length > 0 ? (
            <div className="flex items-start gap-3 rounded-control border border-warning-line bg-warning-bg p-4">
              <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                <strong>Unexpected in this room:</strong> {unexpected.join(', ')} (not registered
                to {room})
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPhase('idle')
                setScans([])
              }}
            >
              Cancel session
            </Button>
            <Button onClick={finishSession}>Finish &amp; compare</Button>
          </div>
        </Card>
      ) : null}

      {phase === 'done' ? (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Reconciliation result · {room}
          </h2>

          <MetricStrip
            ariaLabel="Reconciliation result"
            items={[
              { label: 'Matched', value: matched.length },
              { label: 'Missing', value: missing.length },
              { label: 'Unexpected', value: unexpected.length },
            ]}
          />

          {discrepancies > 0 ? (
            <div className="flex items-start gap-3 rounded-control border border-danger-line bg-danger-bg p-4">
              <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                {missing.length ? `Missing: ${missing.map((unit) => unit.assetId).join(', ')}. ` : ''}
                {unexpected.length ? `Unexpected: ${unexpected.join(', ')}. ` : ''}
                Each discrepancy was added to the Audit Queue for review.{' '}
                <Link
                  to="/central/audit"
                  className="font-semibold text-rust-deep underline underline-offset-4"
                >
                  Open Audit Queue
                </Link>
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-control border border-success-line bg-success-bg p-4">
              <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                Every expected unit was found and nothing unexpected was scanned.
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setPhase('idle')
                setScans([])
                setInput('')
                setInputError('')
              }}
            >
              Start a new session
            </Button>
          </div>
        </Card>
      ) : null}

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(value) => addScan(value)}
        title="Scan the unit in this room"
      />
    </>
  )
}
