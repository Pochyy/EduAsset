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
  SeedAuditFlag,
  SeedItem,
  SeedRequisition,
  SeedTurnover,
  SeedUnit,
  SeedWorkOrder,
  TermCalendar,
} from '../types'

export interface AppData {
  units: SeedUnit[]
  items: SeedItem[]
  requisitions: SeedRequisition[]
  turnovers: SeedTurnover[]
  workOrders: SeedWorkOrder[]
  auditFlags: SeedAuditFlag[]
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
  | { type: 'turnover/status'; id: string; status: string }
  | { type: 'turnover/release'; turnoverId: string; oldUnitId: string; newUnit: SeedUnit }
  | { type: 'work-order/add'; workOrder: SeedWorkOrder }
  | { type: 'work-order/status'; id: string; status: string; patch?: Partial<SeedWorkOrder> }
  | { type: 'audit/add'; flag: SeedAuditFlag }
  | { type: 'audit/review'; id: string; note: string; reviewer: string }
  | { type: 'unit/patch'; id: string; patch: Partial<SeedUnit> }
  | { type: 'units/add'; units: SeedUnit[] }
  | { type: 'item/patch'; id: string; patch: Partial<SeedItem> }
  | { type: 'item/add'; item: SeedItem }
  | { type: 'forecast/update'; id: string; patch: Partial<ForecastRow> }
  | { type: 'policy/update'; patch: Partial<PolicySettings> }

interface AppDataContextValue {
  data: AppData
  dispatch: Dispatch<AppDataAction>
}

const initialData: AppData = {
  units: seed.units,
  items: seed.items,
  requisitions: seed.requisitions,
  turnovers: seed.turnovers,
  workOrders: seed.workOrders,
  auditFlags: seed.auditFlags,
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
    case 'turnover/status':
      return {
        ...state,
        turnovers: state.turnovers.map((turnover) =>
          turnover.turnoverId === action.id ? { ...turnover, status: action.status } : turnover,
        ),
      }
    case 'turnover/release': {
      let units = state.units.map((unit) =>
        unit.assetId === action.oldUnitId
          ? { ...unit, inventoryStatus: 'RETURNED_EMPTY' }
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
    case 'unit/patch':
      return {
        ...state,
        units: state.units.map((unit) =>
          unit.assetId === action.id ? { ...unit, ...action.patch } : unit,
        ),
      }
    case 'units/add':
      return {
        ...state,
        units: [...action.units, ...state.units],
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
    case 'policy/update':
      return {
        ...state,
        policy: { ...state.policy, ...action.patch },
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
