import { useState } from 'react'
import { Boxes, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import {
  activeUnitForSlot,
  healthStatus,
  inventoryConsumableIds,
  inventoryMachineIds,
  inventoryPeripheralIds,
  inventoryStatus,
  itemNameOf,
  shortLocation,
  slotNameFor,
  slotsForMachine,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import type { SeedUnit } from '../types'
import type { BadgeTone } from '../components/ui/Badge'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '../components/ui/Table'
import { Tabs } from '../components/ui/Tabs'

type InventoryTab = 'machines' | 'consumables' | 'peripherals'

interface InventoryRow {
  id: string
  item: string
  location: string
  extra: string
  extraLines?: string[]
  status: string
  tone: BadgeTone
  partial?: boolean
}

const columnFourLabel: Record<InventoryTab, string> = {
  machines: 'Installed consumables',
  consumables: 'Installed on / location',
  peripherals: 'Assigned to',
}

export function LabInventory() {
  usePageTitle('Lab · Inventory')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()
  const [tab, setTab] = useState<InventoryTab>('machines')
  const [query, setQuery] = useState('')

  const machineRows: InventoryRow[] = inventoryMachineIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is SeedUnit => Boolean(unit))
    .map((unit) => {
      const status = healthStatus(unit.healthState)
      const slots = slotsForMachine(unit.assetId, data.machineSlots)
      const extraLines = slots.map((slot) => {
        const active = activeUnitForSlot(slot.id, data.units)
        return `${slot.slotName}: ${active?.assetId ?? 'empty'}`
      })
      return {
        id: unit.assetId,
        item: itemNameOf(data.items, unit.itemId),
        location: shortLocation(unit.location),
        extra: extraLines.join(' · ') || '—',
        extraLines: extraLines.length ? extraLines : undefined,
        status: status.label,
        tone: status.tone,
      }
    })

  const consumableRows: InventoryRow[] = inventoryConsumableIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is SeedUnit => Boolean(unit))
    .map((unit) => {
      const status = inventoryStatus(unit.inventoryStatus)
      const slot = slotNameFor(data.machineSlots, unit.slotId ?? null)
      return {
        id: unit.assetId,
        item: itemNameOf(data.items, unit.itemId),
        location: shortLocation(unit.location),
        extra:
          unit.inventoryStatus === 'RETURNED_PARTIAL'
            ? `Returned partial · ${unit.linkedMachineId ?? 'unassigned'}`
            : unit.slotId
              ? `${slot} · ${unit.linkedMachineId ?? '—'}`
              : unit.linkedMachineId ?? '—',
        status: status.label,
        tone: status.tone,
        partial: unit.inventoryStatus === 'RETURNED_PARTIAL',
      }
    })

  const peripheralRows: InventoryRow[] = inventoryPeripheralIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is SeedUnit => Boolean(unit))
    .map((unit) => {
      const status = healthStatus(unit.healthState)
      return {
        id: unit.assetId,
        item: itemNameOf(data.items, unit.itemId),
        location: shortLocation(unit.location),
        extra: unit.linkedMachineId ? `Workstation ${unit.linkedMachineId}` : '—',
        status: status.label,
        tone: status.tone,
      }
    })

  const rowsByTab: Record<InventoryTab, InventoryRow[]> = {
    machines: machineRows,
    consumables: consumableRows,
    peripherals: peripheralRows,
  }

  const needle = query.trim().toLowerCase()
  const rows = rowsByTab[tab].filter(
    (row) =>
      !needle ||
      row.id.toLowerCase().includes(needle) ||
      row.item.toLowerCase().includes(needle),
  )

  function reissuePartial(unit: SeedUnit) {
    if (!unit.linkedMachineId) {
      showToast(
        'error',
        'No machine for this spool',
        'A partial spool needs a machine before it can be re-issued.',
      )
      return
    }
    const emptySlot = slotsForMachine(unit.linkedMachineId, data.machineSlots).find(
      (slot) => !activeUnitForSlot(slot.id, data.units),
    )
    if (!emptySlot) {
      showToast(
        'error',
        'No empty slot on that machine',
        'Return or release the active unit before re-issuing this partial spool.',
      )
      return
    }
    dispatch({
      type: 'unit/patch',
      id: unit.assetId,
      patch: { inventoryStatus: 'IN_USE', slotId: emptySlot.id },
    })
    showToast(
      'success',
      `${unit.assetId} re-issued`,
      `Installed in ${unit.linkedMachineId}/${emptySlot.slotName}. A partial spool does not count as a new unit.`,
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'WIL Lab', href: '/lab/dashboard' },
          { label: 'Equipment' },
          { label: 'Lab Inventory' },
        ]}
        title="Lab inventory & equipment status"
        description="Every unit registered to your lab, which consumable is active on which machine, and each machine’s health."
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            ariaLabel="Inventory views"
            value={tab}
            onChange={(id) => setTab(id as InventoryTab)}
            tabs={[
              { id: 'machines', label: 'Machines' },
              { id: 'consumables', label: 'Consumables' },
              { id: 'peripherals', label: 'Peripherals' },
            ]}
          />

          <div className="relative w-full sm:w-[280px]">
            <label htmlFor="lab-inventory-search" className="sr-only">
              Search this lab
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              id="lab-inventory-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search asset ID or item"
              className="pl-9"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No matching units in your lab"
            description="Try another asset ID, or switch views."
          />
        ) : (
          <TableWrap>
            <Table className="min-w-[900px]">
              <THead>
                <tr>
                  <TH>Asset ID</TH>
                  <TH>Item</TH>
                  <TH>Location</TH>
                  <TH>{columnFourLabel[tab]}</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const unit = data.units.find((candidate) => candidate.assetId === row.id)
                  return (
                    <TR key={row.id}>
                      <TD className="whitespace-nowrap">
                        <span className="font-mono text-xs font-bold">{row.id}</span>
                      </TD>
                      <TD>{row.item}</TD>
                      <TD className="whitespace-nowrap">{row.location}</TD>
                      <TD className="font-mono text-xs">
                        {row.extraLines ? (
                          <span className="flex flex-col gap-0.5">
                            {row.extraLines.map((line) => (
                              <span key={line}>{line}</span>
                            ))}
                          </span>
                        ) : (
                          row.extra
                        )}
                      </TD>
                      <TD>
                        <Badge tone={row.tone}>{row.status}</Badge>
                      </TD>
                      <TD className="text-right">
                        {row.partial && unit ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => reissuePartial(unit)}
                          >
                            Re-issue
                          </Button>
                        ) : null}
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        )}

        <p className="text-[13px] leading-relaxed text-muted">
          Something broken or jamming?{' '}
          <Link
            to="/lab/incidents"
            className="font-semibold text-rust underline-offset-4 hover:text-rust-deep hover:underline"
          >
            Report an incident
          </Link>
          . Need a new cartridge?{' '}
          <Link
            to="/lab/turnover"
            className="font-semibold text-rust underline-offset-4 hover:text-rust-deep hover:underline"
          >
            Do a turnover scan
          </Link>
          .
        </p>
      </Card>
    </>
  )
}
