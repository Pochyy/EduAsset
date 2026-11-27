import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { initialForecast, type ForecastRow } from '../data/reorder'
import { seed } from '../data/seed'
import type {
  PolicySettings,
  SeedAuditEntry,
  SeedAuditFlag,
  SeedCondemnation,
  SeedItem,
  SeedLot,
  SeedMachineSlot,
  SeedRepair,
  SeedReplacement,
  SeedRequisition,
  SeedTurnover,
  SeedUnit,
  SeedWorkOrder,
  TermCalendar,
} from '../types'

export interface AppData {
  units: SeedUnit[]
  items: SeedItem[]
  machineSlots: SeedMachineSlot[]
  requisitions: SeedRequisition[]
  turnovers: SeedTurnover[]
  replacements: SeedReplacement[]
  repairs: SeedRepair[]
  lots: SeedLot[]
  condemnations: SeedCondemnation[]
  workOrders: SeedWorkOrder[]
  auditFlags: SeedAuditFlag[]
  auditLog: SeedAuditEntry[]
  forecast: ForecastRow[]
  term: TermCalendar
  policy: PolicySettings
}

export type AppDataAction =
  | { type: 'requisition/add'; requisition: SeedRequisition }
  | { type: 'requisition/status'; id: string; status: string }
  | {
      type: 'requisition/decide'
      id: string
      decision: 'approve' | 'reject'
      note: string
      reviewer: string
    }
  | { type: 'turnover/add'; turnover: SeedTurnover }
  | { type: 'replacement/update'; id: string; patch: Partial<SeedReplacement> }
  | { type: 'repair/add'; repair: SeedRepair }
  | {
      type: 'repair/decide'
      id: string
      decision: 'APPROVED' | 'PENDING_DECISION'
    }
  | {
      type: 'turnover/status'
      id: string
      status: string
      oldStatus?: 'RETURNED_EMPTY' | 'RETURNED_PARTIAL'
    }
  | {
      type: 'turnover/release'
      turnoverId: string
      oldUnitId: string | null
      oldStatus: 'RETURNED_EMPTY' | 'RETURNED_PARTIAL'
      newUnit: SeedUnit
    }
  | { type: 'work-order/add'; workOrder: SeedWorkOrder }
  | { type: 'work-order/status'; id: string; status: string; patch?: Partial<SeedWorkOrder> }
  | { type: 'audit/add'; flag: SeedAuditFlag }
  | { type: 'audit/review'; id: string; note: string; reviewer: string }
  | { type: 'audit/log'; entry: SeedAuditEntry }
  | { type: 'unit/patch'; id: string; patch: Partial<SeedUnit> }
  | { type: 'units/add'; units: SeedUnit[] }
  | { type: 'item/patch'; id: string; patch: Partial<SeedItem> }
  | { type: 'item/add'; item: SeedItem }
  | { type: 'forecast/update'; id: string; patch: Partial<ForecastRow> }
  | { type: 'forecast/add'; row: ForecastRow }
  | { type: 'policy/update'; patch: Partial<PolicySettings> }
  | { type: 'lot/add'; lot: SeedLot }
  | { type: 'lot/issue'; lotId: string; quantity: number }
  | { type: 'condemnation/recommend'; condemnation: SeedCondemnation }
  | {
      type: 'condemnation/decide'
      id: string
      status: 'APPROVED' | 'OVERRIDDEN'
      decidedBy: string
      reason: string | null
    }

interface AppDataContextValue {
  data: AppData
  dispatch: Dispatch<AppDataAction>
}

const initialData: AppData = {
  units: seed.units,
  items: seed.items,
  machineSlots: seed.machineSlots,
  requisitions: seed.requisitions,
  turnovers: seed.turnovers,
  replacements: seed.replacements,
  repairs: seed.repairs,
  lots: seed.lots,
  condemnations: seed.condemnations,
  workOrders: seed.workOrders,
  auditFlags: seed.auditFlags,
  auditLog: seed.auditLog,
  forecast: initialForecast,
  term: seed.term,
  policy: seed.policy,
}

function reducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'requisition/add':
      return {
        ...state,
        requisitions: [action.requisition, ...state.requisitions],
      }
    case 'requisition/status':
      return {
        ...state,
        requisitions: state.requisitions.map((requisition) =>
          requisition.requisitionId === action.id
            ? { ...requisition, status: action.status }
            : requisition,
        ),
      }
    case 'requisition/decide':
      return {
        ...state,
        requisitions: state.requisitions.map((requisition) =>
          requisition.requisitionId === action.id
            ? {
                ...requisition,
                status: action.decision === 'approve' ? 'APPROVED' : 'REJECTED',
                reviewNote: action.note || null,
                reviewedBy: action.reviewer,
                reviewedAt: new Date().toISOString(),
              }
            : requisition,
        ),
      }
    case 'turnover/add':
      return {
        ...state,
        turnovers: [action.turnover, ...state.turnovers],
      }
    case 'replacement/update':
      return {
        ...state,
        replacements: state.replacements.map((replacement) =>
          replacement.replacementId === action.id
            ? { ...replacement, ...action.patch }
            : replacement,
        ),
      }
    case 'repair/add':
      return {
        ...state,
        repairs: [...state.repairs, action.repair],
      }
    case 'repair/decide':
      return {
        ...state,
        repairs: state.repairs.map((repair) =>
          repair.repairId === action.id ? { ...repair, decision: action.decision } : repair,
        ),
      }
    case 'turnover/status':
      return {
        ...state,
        turnovers: state.turnovers.map((turnover) =>
          turnover.turnoverId === action.id
            ? {
                ...turnover,
                status: action.status,
                ...(action.oldStatus ? { oldStatus: action.oldStatus } : {}),
              }
            : turnover,
        ),
      }
    case 'turnover/release': {
      let units = state.units.map((unit) =>
        unit.assetId === action.oldUnitId
          ? {
              ...unit,
              inventoryStatus: action.oldStatus,
              slotId: null,
            }
          : unit,
      )
      units = units.some((unit) => unit.assetId === action.newUnit.assetId)
        ? units.map((unit) =>
            unit.assetId === action.newUnit.assetId ? { ...unit, ...action.newUnit } : unit,
          )
        : [action.newUnit, ...units]

      return {
        ...state,
        turnovers: state.turnovers.map((turnover) =>
          turnover.turnoverId === action.turnoverId
            ? { ...turnover, status: 'RELEASED' }
            : turnover,
        ),
        units,
        forecast: state.forecast.map((row) =>
          row.itemId === action.newUnit.itemId
            ? {
                ...row,
                stock: Math.max(0, row.stock - 1),
                issues14: row.issues14 + 1,
                issues42: row.issues42 + 1,
              }
            : row,
        ),
      }
    }
    case 'work-order/add':
      return {
        ...state,
        workOrders: [action.workOrder, ...state.workOrders],
      }
    case 'work-order/status':
      return {
        ...state,
        workOrders: state.workOrders.map((workOrder) =>
          workOrder.workOrderId === action.id
            ? { ...workOrder, ...action.patch, status: action.status }
            : workOrder,
        ),
      }
    case 'audit/add':
      return {
        ...state,
        auditFlags: [action.flag, ...state.auditFlags],
      }
    case 'audit/review':
      return {
        ...state,
        auditFlags: state.auditFlags.map((flag) =>
          flag.id === action.id
            ? {
                ...flag,
                reviewed: true,
                reviewNote: action.note,
                reviewedBy: action.reviewer,
                reviewedAt: new Date().toISOString(),
              }
            : flag,
        ),
      }
    case 'audit/log':
      return {
        ...state,
        auditLog: [action.entry, ...state.auditLog],
      }
    case 'unit/patch':
      return {
        ...state,
        units: state.units.map((unit) =>
          unit.assetId === action.id ? { ...unit, ...action.patch } : unit,
        ),
      }
    case 'units/add': {
      const consumable = action.units.filter((unit) => unit.category === 'CONSUMABLE')
      const counts = new Map<string, number>()
      for (const unit of consumable) {
        counts.set(unit.itemId, (counts.get(unit.itemId) ?? 0) + 1)
      }
      const existingItemIds = new Set(state.forecast.map((row) => row.itemId))
      const newRows = [...counts.entries()]
        .filter(([itemId]) => !existingItemIds.has(itemId))
        .map(([itemId, count]) => {
          const unit = consumable.find((entry) => entry.itemId === itemId)!
          return {
            id: `item-${itemId.toLowerCase()}`,
            itemId,
            name: unit.itemName,
            code: itemId,
            stock: count,
            issues14: 0,
            issues42: 0,
            lastTermIssues: null,
            lead: 21,
            buffer: 7,
            prNumber: '',
          }
        })
      return {
        ...state,
        units: [...action.units, ...state.units],
        forecast: [
          ...state.forecast.map((row) => {
            const count = counts.get(row.itemId) ?? 0
            return count > 0 ? { ...row, stock: row.stock + count } : row
          }),
          ...newRows,
        ],
      }
    }
    case 'item/patch':
      return {
        ...state,
        items: state.items.map((item) =>
          item.itemId === action.id ? { ...item, ...action.patch } : item,
        ),
      }
    case 'item/add':
      return {
        ...state,
        items: state.items.some((item) => item.itemId === action.item.itemId)
          ? state.items
          : [action.item, ...state.items],
      }
    case 'forecast/update':
      return {
        ...state,
        forecast: state.forecast.map((row) =>
          row.id === action.id ? { ...row, ...action.patch } : row,
        ),
      }
    case 'forecast/add':
      return {
        ...state,
        forecast: state.forecast.some((row) => row.id === action.row.id)
          ? state.forecast
          : [...state.forecast, action.row],
      }
    case 'policy/update':
      return {
        ...state,
        policy: { ...state.policy, ...action.patch },
      }
    case 'lot/add':
      return {
        ...state,
        lots: [action.lot, ...state.lots],
        forecast: state.forecast.map((row) =>
          row.lotItemId === action.lot.itemId
            ? { ...row, stock: row.stock + action.lot.qtyReceived }
            : row,
        ),
      }
    case 'lot/issue': {
      const lot = state.lots.find((entry) => entry.lotId === action.lotId)
      if (!lot) return state
      return {
        ...state,
        lots: state.lots.map((entry) =>
          entry.lotId === action.lotId
            ? { ...entry, qtyOnHand: Math.max(0, entry.qtyOnHand - action.quantity) }
            : entry,
        ),
        forecast: state.forecast.map((row) =>
          row.lotItemId === lot.itemId || row.itemId === lot.itemId
            ? {
                ...row,
                stock: Math.max(0, row.stock - action.quantity),
                issues14: row.issues14 + action.quantity,
                issues42: row.issues42 + action.quantity,
              }
            : row,
        ),
      }
    }
    case 'condemnation/recommend':
      return {
        ...state,
        condemnations: [action.condemnation, ...state.condemnations],
      }
    case 'condemnation/decide':
      return {
        ...state,
        condemnations: state.condemnations.map((condemnation) =>
          condemnation.id === action.id
            ? {
                ...condemnation,
                status: action.status,
                decidedBy: action.decidedBy,
                decisionReason: action.reason,
                decidedAt: new Date().toISOString(),
              }
            : condemnation,
        ),
      }
    default:
      return state
  }
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, initialData)

  return (
    <AppDataContext.Provider value={{ data, dispatch }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppDataProvider')
  return context
}
