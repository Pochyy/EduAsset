import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { seed } from '../data/seed'
import type {
  SeedAuditFlag,
  SeedItem,
  SeedRequisition,
  SeedTurnover,
  SeedUnit,
  SeedWorkOrder,
} from '../types'

export interface AppData {
  units: SeedUnit[]
  items: SeedItem[]
  requisitions: SeedRequisition[]
  turnovers: SeedTurnover[]
  workOrders: SeedWorkOrder[]
  auditFlags: SeedAuditFlag[]
}

export type AppDataAction =
  | { type: 'requisition/status'; id: string; status: string }
  | { type: 'turnover/status'; id: string; status: string }
  | { type: 'work-order/status'; id: string; status: string; patch?: Partial<SeedWorkOrder> }
  | { type: 'audit/review'; id: string; note: string; reviewer: string }
  | { type: 'unit/patch'; id: string; patch: Partial<SeedUnit> }

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
}

function reducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'requisition/status':
      return {
        ...state,
        requisitions: state.requisitions.map((requisition) =>
          requisition.requisitionId === action.id
            ? { ...requisition, status: action.status }
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
    case 'work-order/status':
      return {
        ...state,
        workOrders: state.workOrders.map((workOrder) =>
          workOrder.workOrderId === action.id
            ? { ...workOrder, ...action.patch, status: action.status }
            : workOrder,
        ),
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
