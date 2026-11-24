import type { BadgeTone } from '../components/ui/Badge'
import type { SeedItem, SeedRequisition, SeedUnit, SeedWorkOrder } from '../types'

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
  'DRM-WIL-2026-004',
  'FIL-WIL-2026-014',
  'BP-A4-0028',
] as const
export const inventoryPeripheralIds = ['KB-0031', 'KB-0032', 'MS-0031', 'MON-0031'] as const
export const dashboardRequisitionIds = ['RQ-1021', 'RQ-1019', 'RQ-1016'] as const

export const labRequisitionCatalog = [
  { itemId: 'TNR', baseline: 6, used: 4, unit: 'cartridges' },
  { itemId: 'A4', baseline: 2, used: 10, unit: 'reams' },
  { itemId: 'PLA', baseline: 10, used: 3, unit: 'spools' },
  { itemId: 'CTN', baseline: 10, used: 1, unit: 'cartridges' },
] as const

export const turnoverMachines = [
  {
    key: 'prn',
    machineId: 'WIL-PRN-01',
    activeUnitId: 'TNR-WIL-2026-001',
    newUnitId: 'TNR-WIL-2026-002',
    wrongUnitId: 'TNR-WIL-2026-003',
  },
  {
    key: '3dp',
    machineId: 'WIL-3DP-001',
    activeUnitId: 'FIL-WIL-2026-014',
    newUnitId: 'FIL-WIL-2026-015',
    wrongUnitId: 'FIL-WIL-2026-009',
  },
] as const

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
    case 'ISSUED_IN_USE':
      return { label: 'ISSUED / IN_USE', tone: 'success' }
    case 'RETURNED_EMPTY':
      return { label: 'RETURNED_EMPTY', tone: 'neutral' }
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

export const formatVariance = (variance: number) =>
  `${variance >= 0 ? '+' : ''}${Math.round(variance * 10) / 10}%`

export const requisitionNote = (requisition: SeedRequisition) => {
  const variance = formatVariance(requisition.variancePercent)
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
  return linked.find((candidate) => candidate.inventoryStatus === 'ISSUED_IN_USE') ?? linked[0]
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
  if (active?.inventoryStatus === 'RETURNED_EMPTY') {
    return 'Spent unit returned · replacement awaiting custodian approval'
  }
  return 'In service · no active ticket'
}

export const workOrderNote = (workOrder: SeedWorkOrder) => {
  switch (workOrder.status) {
    case 'TICKET_DISPATCHED':
      return 'Asset set to NEEDS_MAINTENANCE. The campus technician will inspect it and send a repair quote.'
    case 'AWAITING_DECISION':
      return workOrder.quoteAmount !== null && workOrder.berPercent !== null
        ? `Quote ${formatPeso(workOrder.quoteAmount)} pushes BER to ${workOrder.berPercent}%. Maintenance is blocked; the custodian is finalizing condemnation.`
        : 'A repair quote is under review against the 50% BER threshold.'
    case 'CLOSED_REPAIRED':
      return 'Repaired below the 50% BER limit and returned to service with the same asset ID and history.'
    case 'CLOSED_CONDEMNED':
      return 'BER exceeded the 50% threshold; the unit was condemned and requires a verified replacement.'
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
