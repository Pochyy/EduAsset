export type Portal = 'central' | 'lab'

export type Role =
  | 'CENTRAL_CUSTODIAN'
  | 'SECOND_APPROVER'
  | 'LAB_MANAGER'
  | 'LAB_ASSISTANT'
  | 'TECHNICIAN'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  portal: Portal
}

export interface SeedUser {
  id: string
  name: string
  email: string
  role: string
  portal: 'CENTRAL' | 'LAB' | null
}

export interface SeedItem {
  itemId: string
  name: string
  category: string
  unit: string
  leadTimeDays: number
  safetyBufferDays: number
  replacementValue: number | null
  requireOneToOne: boolean
}

export interface SeedUnit {
  assetId: string
  itemId: string
  itemName: string
  category: string
  location: string
  inventoryStatus: string
  healthState: string
  deliveryRecordId: string
  deliveryDate: string
  serialNumber: string | null
  linkedMachineId: string | null
  pendingDisbursement: boolean
}

export type VarianceBand = 'NORMAL' | 'ELEVATED' | 'ABNORMAL' | 'NO_BASELINE'

export interface PolicySettings {
  varianceNormalPct: number
  varianceLockPct: number
  forecastWindowDays: number
  lowVolumeWindowDays: number
  lowVolumeIssueThreshold: number
}

export interface TermCalendar {
  weeksInTerm: number
  weeksElapsed: number
}

export interface SeedRequisition {
  requisitionId: string
  labId: string
  itemId: string
  quantity: number
  unit: string
  /** Historical full-term baseline (H_base). Zero means no usable baseline. */
  baselineVolume: number
  /** Pro-rated expected volume E for the elapsed portion of the term; null when no baseline exists. */
  expectedVolume: number | null
  /** Volume requisitioned so far this term including this request (C_t). */
  currentTermVolume: number
  variancePercent: number | null
  band: VarianceBand
  weeksElapsed: number
  weeksInTerm: number
  status: string
  requestedAt: string
  justification: string | null
  reviewNote?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
}

export interface SeedTurnover {
  turnoverId: string
  machineId: string
  location: string
  itemId: string
  oldAssetId: string
  newAssetId: string
  status: string
  requestedAt: string
}

export interface SeedWorkOrder {
  workOrderId: string
  assetId: string
  title: string
  description: string
  reportedAt: string
  status: string
  quoteAmount: number | null
  berPercent: number | null
  closedAt: string | null
}

export interface SeedAuditFlag {
  id: string
  type: string
  severity: string
  title: string
  entityId: string
  meta: string
  detail: string
  reviewed: boolean
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export interface SeedData {
  meta: Record<string, unknown>
  term: TermCalendar
  policy: PolicySettings
  users: SeedUser[]
  items: SeedItem[]
  units: SeedUnit[]
  requisitions: SeedRequisition[]
  turnovers: SeedTurnover[]
  workOrders: SeedWorkOrder[]
  auditFlags: SeedAuditFlag[]
}
