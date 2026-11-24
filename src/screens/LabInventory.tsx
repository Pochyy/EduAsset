import { useState } from 'react'
import { Boxes, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import {
  healthStatus,
  inventoryConsumableIds,
  inventoryMachineIds,
  inventoryPeripheralIds,
  inventoryStatus,
  itemNameOf,
  linkedConsumable,
  shortLocation,
} from '../lib/lab'
import { usePageTitle } from '../lib/usePageTitle'
import type { SeedUnit } from '../types'
import type { BadgeTone } from '../components/ui/Badge'
import { Badge } from '../components/ui/Badge'
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
  status: string
  tone: BadgeTone
}

const columnFourLabel: Record<InventoryTab, string> = {
  machines: 'Installed consumable',
  consumables: 'Installed on / location',
  peripherals: 'Assigned to',
}

export function LabInventory() {
  usePageTitle('Lab · Inventory')
  const { data } = useAppData()
  const [tab, setTab] = useState<InventoryTab>('machines')
  const [query, setQuery] = useState('')

  const machineRows: InventoryRow[] = inventoryMachineIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is SeedUnit => Boolean(unit))
    .map((unit) => {
      const status = healthStatus(unit.healthState)
      return {
        id: unit.assetId,
        item: itemNameOf(data.items, unit.itemId),
        location: shortLocation(unit.location),
        extra: linkedConsumable(unit, data.units)?.assetId ?? '—',
        status: status.label,
        tone: status.tone,
      }
    })

  const consumableRows: InventoryRow[] = inventoryConsumableIds
    .map((id) => data.units.find((unit) => unit.assetId === id))
    .filter((unit): unit is SeedUnit => Boolean(unit))
    .map((unit) => {
      const status = inventoryStatus(unit.inventoryStatus)
      return {
        id: unit.assetId,
        item: itemNameOf(data.items, unit.itemId),
        location: shortLocation(unit.location),
        extra: unit.linkedMachineId ?? '—',
        status: status.label,
        tone: status.tone,
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
            <Table className="min-w-[760px]">
              <THead>
                <tr>
                  <TH>Asset ID</TH>
                  <TH>Item</TH>
                  <TH>Location</TH>
                  <TH>{columnFourLabel[tab]}</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD className="whitespace-nowrap">
                      <span className="font-mono text-xs font-bold">{row.id}</span>
                    </TD>
                    <TD>{row.item}</TD>
                    <TD className="whitespace-nowrap">{row.location}</TD>
                    <TD className="whitespace-nowrap font-mono text-xs">{row.extra}</TD>
                    <TD>
                      <Badge tone={row.tone}>{row.status}</Badge>
                    </TD>
                  </TR>
                ))}
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
