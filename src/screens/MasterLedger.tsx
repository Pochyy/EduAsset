import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Plus, QrCode, Search, Wrench, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { healthStatus, inventoryStatus } from '../lib/lab'
import { qrPath } from '../lib/qr'
import { usePageTitle } from '../lib/usePageTitle'
import type { SeedUnit } from '../types'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { Button, buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '../components/ui/Table'

interface HistoryEntry {
  event: string
  meta: string
}

const healthFor = (unit: SeedUnit): { label: string; tone: BadgeTone } =>
  unit.healthState === 'NOT_APPLICABLE'
    ? { label: '—', tone: 'neutral' }
    : healthStatus(unit.healthState)

const baseHistory = (unit: SeedUnit): HistoryEntry[] => {
  const entries: HistoryEntry[] = [
    {
      event: `Received under ${unit.deliveryRecordId}`,
      meta: `${unit.deliveryDate} · Property Custodian`,
    },
  ]

  if (unit.inventoryStatus === 'ISSUED_IN_USE') {
    entries.push({ event: `Issued to ${unit.location}`, meta: 'Current record · Lab Assistant' })
  }
  if (unit.inventoryStatus === 'RETURNED_EMPTY') {
    entries.push({
      event: 'Scanned as RETURNED_EMPTY (turnover)',
      meta: 'Current record · Lab Assistant',
    })
  }
  if (unit.healthState === 'NEEDS_MAINTENANCE') {
    entries.push({
      event: 'Set to NEEDS_MAINTENANCE by an open work order',
      meta: 'Current record · System',
    })
  }
  if (unit.healthState === 'UNDER_REPAIR') {
    entries.push({ event: 'Under repair', meta: 'Current record · Property Custodian' })
  }
  if (unit.healthState === 'CONDEMNED_BER') {
    entries.push({ event: 'Condemned / BER', meta: 'Current record · Property Custodian' })
  }
  if (unit.inventoryStatus === 'RETIRED') {
    entries.push({ event: 'Retired from service', meta: 'Current record · Property Custodian' })
  }

  return entries
}

export function MasterLedger() {
  usePageTitle('Central · Master Ledger')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [inventory, setInventory] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [serialDraft, setSerialDraft] = useState('')
  const [unitLogs, setUnitLogs] = useState<Record<string, HistoryEntry[]>>({})
  const [itemLogs, setItemLogs] = useState<Record<string, HistoryEntry[]>>({})
  const closeRef = useRef<HTMLButtonElement>(null)

  const openUnit = data.units.find((unit) => unit.assetId === openId)
  const openItem = openUnit
    ? data.items.find((item) => item.itemId === openUnit.itemId)
    : undefined

  useEffect(() => {
    if (!openId) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openId])

  const needle = query.trim().toLowerCase()
  const rows = data.units.filter((unit) => {
    const matchesSearch =
      !needle ||
      unit.assetId.toLowerCase().includes(needle) ||
      unit.itemName.toLowerCase().includes(needle)
    const matchesCategory = category === 'all' || unit.category === category
    const matchesInventory = inventory === 'all' || unit.inventoryStatus === inventory
    return matchesSearch && matchesCategory && matchesInventory
  })

  function openRecord(unit: SeedUnit) {
    setOpenId(unit.assetId)
    setSerialDraft(unit.serialNumber ?? '')
  }

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setInventory('all')
  }

  function saveSerial() {
    if (!openUnit) return
    const serial = serialDraft.trim()
    dispatch({
      type: 'unit/patch',
      id: openUnit.assetId,
      patch: { serialNumber: serial || null },
    })
    setUnitLogs((current) => ({
      ...current,
      [openUnit.assetId]: [
        ...(current[openUnit.assetId] ?? []),
        {
          event: 'Manufacturer serial updated',
          meta: 'Just now · Property Custodian',
        },
      ],
    }))
    showToast(
      'success',
      'Serial saved',
      `${openUnit.assetId} · ${serial || 'no serial recorded'}. The asset ID and QR code are unchanged.`,
    )
  }

  function toggleOneToOne() {
    if (!openUnit || !openItem) return
    const next = !openItem.requireOneToOne
    dispatch({
      type: 'item/patch',
      id: openItem.itemId,
      patch: { requireOneToOne: next },
    })
    setItemLogs((current) => ({
      ...current,
      [openItem.itemId]: [
        ...(current[openItem.itemId] ?? []),
        {
          event: next
            ? 'Marked “Require 1-to-1 Return”'
            : 'Removed “Require 1-to-1 Return”',
          meta: 'Just now · Property Custodian',
        },
      ],
    }))
    showToast(
      'success',
      next ? '1-to-1 Return required' : '1-to-1 Return removed',
      `${openItem.name} · applies to all units of this item.`,
    )
  }

  const history = openUnit
    ? [
        ...baseHistory(openUnit),
        ...(unitLogs[openUnit.assetId] ?? []),
        ...(itemLogs[openUnit.itemId] ?? []),
      ]
    : []

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Units & assets' },
          { label: 'Master Ledger' },
        ]}
        title="Master property & supply ledger"
        description="One unit, one record, one QR code. Inventory status and health state are tracked separately."
        actions={
          <Link to="/central/receive" className={buttonStyles('primary')}>
            <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
            Receive new items
          </Link>
        }
      />

      <Card className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto] xl:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ledger-search" className="text-xs font-semibold text-muted">
            Search asset ID or item
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              id="ledger-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. KB-0152"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ledger-category" className="text-xs font-semibold text-muted">
            Category
          </label>
          <Select
            id="ledger-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            <option value="DURABLE">Durable capital asset</option>
            <option value="CONSUMABLE">High-turnover consumable</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ledger-inventory" className="text-xs font-semibold text-muted">
            Inventory status
          </label>
          <Select
            id="ledger-inventory"
            value={inventory}
            onChange={(event) => setInventory(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="IN_STOCK">IN_STOCK</option>
            <option value="ISSUED_IN_USE">ISSUED / IN_USE</option>
            <option value="RETURNED_EMPTY">RETURNED_EMPTY</option>
            <option value="RETIRED">RETIRED</option>
          </Select>
        </div>

        <Button variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      </Card>

      <section className="flex flex-col gap-3">
        <p role="status" className="text-[13px] text-muted">
          Showing {rows.length} of {data.units.length} units (sample data)
        </p>

        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={Search}
              title="No units match these filters"
              description="Check the asset ID, or clear the filters. Units only enter the ledger through a delivery-linked receiving record."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : (
          <TableWrap>
            <Table className="min-w-[920px]">
              <THead>
                <tr>
                  <TH>Asset ID</TH>
                  <TH>Item</TH>
                  <TH>Category</TH>
                  <TH>Location</TH>
                  <TH>Inventory status</TH>
                  <TH>Health</TH>
                  <TH>
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((unit) => {
                  const inv = inventoryStatus(unit.inventoryStatus)
                  const health = healthFor(unit)
                  return (
                    <TR key={unit.assetId}>
                      <TD className="whitespace-nowrap">
                        <span className="font-mono text-xs font-bold">{unit.assetId}</span>
                      </TD>
                      <TD>{unit.itemName}</TD>
                      <TD className="whitespace-nowrap">
                        {unit.category === 'DURABLE' ? 'Durable asset' : 'Consumable'}
                      </TD>
                      <TD className="whitespace-nowrap">{unit.location}</TD>
                      <TD>
                        <Badge tone={inv.tone}>{inv.label}</Badge>
                      </TD>
                      <TD>
                        <Badge tone={health.tone}>{health.label}</Badge>
                      </TD>
                      <TD className="text-right">
                        <button
                          type="button"
                          onClick={() => openRecord(unit)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-control px-2.5 text-[13px] font-semibold text-rust transition-colors hover:bg-butter-soft hover:text-rust-deep"
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </section>

      {openUnit ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/45"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpenId(null)
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-record-title"
            className="ea-dialog-in flex h-full w-full max-w-[460px] flex-col gap-4 overflow-y-auto bg-surface p-6 shadow-[-12px_0_32px_rgba(23,23,23,0.2)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-semibold tracking-[0.08em] text-rust">
                  UNIT RECORD
                </span>
                <h2
                  id="unit-record-title"
                  className="font-mono text-[22px] font-bold tracking-[-0.02em] text-ink"
                >
                  {openUnit.assetId}
                </h2>
                <span className="text-sm text-neutral-text">{openUnit.itemName}</span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close unit record"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-paper text-neutral-text transition-colors hover:bg-butter-soft"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-card border border-line p-4">
              <svg
                viewBox="0 0 25 25"
                role="img"
                aria-label={`QR code for ${openUnit.assetId}`}
                className="h-28 w-28 shrink-0 text-ink"
              >
                <path d={qrPath(openUnit.assetId)} fill="currentColor" />
              </svg>
              <div className="flex flex-col gap-2">
                <span className="text-xs leading-relaxed text-muted">
                  The QR code only encodes the asset ID. Status is always decided by the
                  database.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast(
                      'info',
                      'Label ready to print',
                      `${openUnit.assetId} with the asset ID printed under the code (prototype: sends to your printer in the build).`,
                    )
                  }
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Reprint QR label
                </Button>
              </div>
            </div>

            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                {
                  k: 'Category',
                  v:
                    openUnit.category === 'DURABLE'
                      ? 'Durable capital asset'
                      : 'High-turnover consumable',
                },
                { k: 'Location', v: openUnit.location },
                { k: 'Inventory status', v: inventoryStatus(openUnit.inventoryStatus).label },
                { k: 'Health state', v: healthFor(openUnit).label },
                { k: 'Delivery record', v: openUnit.deliveryRecordId },
                { k: 'Manufacturer serial', v: openUnit.serialNumber ?? '—' },
                { k: 'Linked machine', v: openUnit.linkedMachineId ?? '—' },
                { k: 'QR payload', v: `/items/${openUnit.assetId}` },
              ].map((field) => (
                <div key={field.k}>
                  <dt className="text-xs font-semibold text-muted">{field.k}</dt>
                  <dd className="m-0 mt-0.5 text-sm font-semibold text-ink">{field.v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-1.5 rounded-card border border-line p-4">
              <label htmlFor="unit-serial" className="text-xs font-semibold text-muted">
                Edit manufacturer serial (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="unit-serial"
                  value={serialDraft}
                  onChange={(event) => setSerialDraft(event.target.value)}
                  placeholder="e.g. CR3V3P-88120"
                  className="min-w-[180px] flex-1"
                />
                <Button onClick={saveSerial}>Save serial</Button>
              </div>
              <span className="text-xs leading-relaxed text-muted">
                Optional. Changing the serial does not change the asset ID or QR code.
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-card border border-line p-4">
              <label className="flex min-h-11 flex-wrap items-center gap-2.5 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(openItem?.requireOneToOne)}
                  onChange={toggleOneToOne}
                  className="h-5 w-5 accent-rust"
                />
                <span>Require 1-to-1 Return</span>
                <Badge tone={openItem?.requireOneToOne ? 'success' : 'neutral'}>
                  {openItem?.requireOneToOne ? 'Required' : 'Not required'}
                </Badge>
              </label>
              <span className="text-xs leading-relaxed text-muted">
                A new unit is released only after the spent unit is scanned and marked
                RETURNED_EMPTY. This is an item setting and applies to all units of{' '}
                {openUnit.itemName}.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[15px] font-bold text-ink">History (uneditable audit log)</h3>
              <ol className="m-0 flex list-none flex-col gap-0 border-l-2 border-line-soft p-0 pl-1">
                {history.map((entry, index) => (
                  <li
                    key={`${entry.event}-${index}`}
                    className="relative pb-3.5 pl-[18px]"
                  >
                    <span className="absolute left-[-7px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-amber" />
                    <span className="block text-[13px] font-semibold text-ink">
                      {entry.event}
                    </span>
                    <span className="text-xs text-muted">{entry.meta}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {openUnit.category === 'DURABLE' ? (
                <Link to="/central/repairs" className={buttonStyles('secondary')}>
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  Repair &amp; BER
                </Link>
              ) : null}
              <Link
                to="/central/replacements"
                className="inline-flex min-h-11 items-center px-2.5 text-[13px] font-semibold text-rust transition-colors hover:text-rust-deep"
              >
                Start replacement
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
