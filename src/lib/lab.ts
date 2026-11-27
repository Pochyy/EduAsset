import type { BadgeTone } from '../components/ui/Badge'
import type {
  SeedItem,
  SeedMachineSlot,
  SeedRequisition,
  SeedUnit,
  SeedWorkOrder,
} from '../types'

export const dashboardMachineIds = ['WIL-PRN-01', 'WIL-PRN-02', 'WIL-3DP-002'] as const
export const inventoryMachineIds = [
  'WIL-PRN-01',
  'WIL-PRN-02',
  'WIL-3DP-001',
  'WIL-3DP-002',
  'SHR-0003',
] as const
export const inventoryConsumableIds = [
  'TNR-WIL-2026-001',
  'TNR-WIL-2026-002',
  'DRM-WIL-2026-004',
  'DRM-WIL-2026-005',
  'FIL-WIL-2026-014',
  'FIL-WIL-2026-015',
] as const
export const inventoryPeripheralIds = ['KB-0031', 'KB-0032', 'MS-0031', 'MON-0031'] as const
export const dashboardRequisitionIds = ['RQ-1021', 'RQ-1019', 'RQ-1016'] as const

export const labRequisitionCatalog = [
  { itemId: 'TNR', baseline: 8, used: 5, unit: 'cartridges' },
  { itemId: 'A4', baseline: 2, used: 0, unit: 'reams' },
  { itemId: 'PLA', baseline: 8, used: 8, unit: 'spools' },
  { itemId: 'CTN', baseline: 16, used: 10, unit: 'cartridges' },
  { itemId: 'THRM', baseline: 0, used: 0, unit: 'rolls' },
] as const

export interface TurnoverSlotDemo {
  key: string
  machineId: string
  slotId: string
  slotName: string
  partialAllowed: boolean
  suggestedNewUnitId: string | null
  wrongUnitId: string | null
}

export const turnoverSlots: TurnoverSlotDemo[] = [
  {
    key: '3dp-spool1',
    machineId: 'WIL-3DP-001',
    slotId: '3DP1-SPL1',
    slotName: 'Spool-1',
    partialAllowed: true,
    suggestedNewUnitId: 'FIL-WIL-2026-015',
    wrongUnitId: 'FIL-WIL-2026-009',
  },
  {
    key: 'prn-black',
    machineId: 'WIL-PRN-01',
    slotId: 'PRN01-BLK',
    slotName: 'Black',
    partialAllowed: false,
    suggestedNewUnitId: 'TNR-WIL-2026-002',
    wrongUnitId: 'TNR-WIL-2026-003',
  },
  {
    key: 'prn-drum',
    machineId: 'WIL-PRN-01',
    slotId: 'PRN01-DRM',
    slotName: 'Drum',
    partialAllowed: false,
    suggestedNewUnitId: 'DRM-WIL-2026-005',
    wrongUnitId: 'DRM-WIL-2026-003',
  },
  {
    key: 'prn2-drum',
    machineId: 'WIL-PRN-02',
    slotId: 'PRN02-DRM',
    slotName: 'Drum',
    partialAllowed: false,
    suggestedNewUnitId: null,
    wrongUnitId: 'DRM-WIL-2026-003',
  },
  {
    key: '3dp-spool2',
    machineId: 'WIL-3DP-001',
    slotId: '3DP1-SPL2',
    slotName: 'Spool-2',
    partialAllowed: true,
    suggestedNewUnitId: null,
    wrongUnitId: null,
  },
]

export const activeUnitForSlot = (slotId: string, units: SeedUnit[]) =>
  units.find(
    (unit) => unit.slotId === slotId && unit.inventoryStatus === 'IN_USE',
  )

export const slotsForMachine = (machineId: string, slots: SeedMachineSlot[]) =>
  slots.filter((slot) => slot.machineId === machineId)

export const slotNameFor = (slots: SeedMachineSlot[], slotId: string | null) =>
  slotId ? (slots.find((slot) => slot.id === slotId)?.slotName ?? slotId) : '—'

export const slotSummary = (
  machineId: string,
  slots: SeedMachineSlot[],
  units: SeedUnit[],
) =>
  slotsForMachine(machineId, slots)
    .map((slot) => {
      const active = activeUnitForSlot(slot.id, units)
      return `${slot.slotName}: ${active?.assetId ?? 'empty'}`
    })
    .join(' · ')

export const labLabel = (labId: string) => labId.replace('WIL-LAB-', 'WIL Lab ')

const CLOSED_WORK_ORDERS = new Set(['CLOSED_REPAIRED', 'CLOSED_CONDEMNED'])

export interface StatusDisplay {
  label: string
  tone: BadgeTone
}

export const healthStatus = (value: string): StatusDisplay => {
  switch (value) {
    case 'OPERATIONAL':
      return { label: 'OPERATIONAL', tone: 'success' }
    case 'NEEDS_MAINTENANCE':
      return { label: 'NEEDS MAINTENANCE', tone: 'warning' }
    case 'UNDER_REPAIR':
      return { label: 'UNDER REPAIR', tone: 'warning' }
    case 'CONDEMNED_BER':
      return { label: 'CONDEMNED / BER', tone: 'danger' }
    default:
      return { label: value.replaceAll('_', ' '), tone: 'neutral' }
  }
}

export const inventoryStatus = (value: string): StatusDisplay => {
  switch (value) {
    case 'IN_STOCK':
      return { label: 'IN STOCK', tone: 'info' }
    case 'IN_USE':
      return { label: 'IN_USE', tone: 'success' }
    case 'RETURNED_EMPTY':
      return { label: 'RETURNED_EMPTY', tone: 'neutral' }
    case 'RETURNED_PARTIAL':
      return { label: 'RETURNED_PARTIAL', tone: 'warning' }
    case 'RETIRED':
      return { label: 'RETIRED', tone: 'neutral' }
    default:
      return { label: value.replaceAll('_', ' '), tone: 'neutral' }
  }
}

export const requisitionStatus = (value: string): StatusDisplay => {
  switch (value) {
    case 'LOCKED_REVIEW':
      return { label: 'WAITING FOR CUSTODIAN', tone: 'warning' }
    case 'APPROVED':
    case 'AUTO_PROCESSED':
      return { label: 'PROCESSED', tone: 'success' }
    case 'REJECTED':
      return { label: 'REJECTED', tone: 'danger' }
    default:
      return { label: value.replaceAll('_', ' '), tone: 'neutral' }
  }
}

export const workOrderStatus = (value: string): StatusDisplay => {
  switch (value) {
    case 'TICKET_DISPATCHED':
      return { label: 'TICKET DISPATCHED', tone: 'info' }
    case 'AWAITING_DECISION':
      return { label: 'AWAITING DECISION', tone: 'warning' }
    case 'CLOSED_REPAIRED':
      return { label: 'CLOSED · REPAIRED', tone: 'success' }
    case 'CLOSED_CONDEMNED':
      return { label: 'CLOSED · CONDEMNED', tone: 'danger' }
    case 'REPORTED':
      return { label: 'REPORTED', tone: 'neutral' }
    default:
      return { label: value.replaceAll('_', ' '), tone: 'neutral' }
  }
}

export const shortLocation = (location: string) => location.replace(/^WIL /, '')

export const itemNameOf = (items: SeedItem[], itemId: string) =>
  items.find((item) => item.itemId === itemId)?.name ?? itemId

export const formatVariance = (variance: number | null) =>
  variance === null
    ? '—'
    : `${variance >= 0 ? '+' : ''}${Math.round(variance * 10) / 10}%`

export const requisitionNote = (requisition: SeedRequisition) => {
  const variance = formatVariance(requisition.variancePercent)
  if (requisition.band === 'NO_BASELINE') {
    return 'No baseline · manual review (collect-baseline mode)'
  }
  if (requisition.status === 'LOCKED_REVIEW') return `V ${variance} · auto-approval locked`
  if (requisition.justification) return `Justified: ${requisition.justification}`
  return `V ${variance} · within quota`
}

export const assetSummary = (unit: SeedUnit, items: SeedItem[]) => {
  const status =
    unit.healthState === 'NOT_APPLICABLE'
      ? inventoryStatus(unit.inventoryStatus)
      : healthStatus(unit.healthState)
  return `${itemNameOf(items, unit.itemId)} · ${unit.location} · ${status.label}`
}

export const machineTitle = (unit: SeedUnit, items: SeedItem[]) =>
  `${itemNameOf(items, unit.itemId)} · ${shortLocation(unit.location)}`

export const isOpenWorkOrder = (workOrder: SeedWorkOrder) =>
  !CLOSED_WORK_ORDERS.has(workOrder.status)

export const linkedConsumable = (unit: SeedUnit, units: SeedUnit[]) => {
  const linked = units.filter(
    (candidate) =>
      candidate.category === 'CONSUMABLE' &&
      candidate.linkedMachineId === unit.assetId,
  )
  return linked.find((candidate) => candidate.inventoryStatus === 'IN_USE') ?? linked[0]
}

export const machineNote = (
  unit: SeedUnit,
  units: SeedUnit[],
  workOrders: SeedWorkOrder[],
) => {
  const workOrder = workOrders.find(
    (candidate) => candidate.assetId === unit.assetId && isOpenWorkOrder(candidate),
  )
  const active = linkedConsumable(unit, units)

  if (unit.healthState === 'UNDER_REPAIR') {
    return workOrder
      ? `${workOrder.title} · ${workOrder.workOrderId} awaiting a decision`
      : 'Out of service · repair decision pending'
  }
  if (unit.healthState === 'NEEDS_MAINTENANCE') {
    return workOrder
      ? `${workOrder.title} · ${workOrder.workOrderId} dispatched`
      : 'Needs maintenance · ticket pending'
  }
  if (
    active?.inventoryStatus === 'RETURNED_EMPTY' ||
    active?.inventoryStatus === 'RETURNED_PARTIAL'
  ) {
    return 'Spent unit returned · replacement awaiting custodian approval'
  }
  return 'In service · no active ticket'
}

export const workOrderNote = (workOrder: SeedWorkOrder, thresholdPct = 50) => {
  switch (workOrder.status) {
    case 'TICKET_DISPATCHED':
      return 'Asset set to NEEDS_MAINTENANCE. The campus technician will inspect it and send a repair quote.'
    case 'AWAITING_DECISION':
      return workOrder.quoteAmount !== null && workOrder.berPercent !== null
        ? `Quote ${formatPeso(workOrder.quoteAmount)} pushes BER to ${workOrder.berPercent}%. Maintenance is blocked at the ${thresholdPct}% threshold; the custodian is deciding the condemnation recommendation.`
        : `A repair quote is under review against the ${thresholdPct}% BER threshold.`
    case 'CLOSED_REPAIRED':
      return `Repaired below the ${thresholdPct}% BER limit and returned to service with the same asset ID and history.`
    case 'CLOSED_CONDEMNED':
      return `BER reached the ${thresholdPct}% threshold; the unit was condemned and requires a verified replacement.`
    default:
      return workOrder.description
  }
}

export const formatPeso = (amount: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
