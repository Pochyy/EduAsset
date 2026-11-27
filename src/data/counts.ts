import { useAppData } from '../context/AppDataContext'
import { isAlert } from './reorder'

export interface QueueCounts {
  alerts: number
  requisitions: number
  turnover: number
  audit: number
  workOrders: number
}

const CLOSED_WORK_ORDERS = new Set(['CLOSED_REPAIRED', 'CLOSED_CONDEMNED'])

export function useQueueCounts(): QueueCounts {
  const { data } = useAppData()

  return {
    alerts: data.forecast.filter((row) => isAlert(row, data.policy)).length,
    requisitions: data.requisitions.filter(
      (requisition) => requisition.status === 'LOCKED',
    ).length,
    turnover: data.turnovers.filter(
      (turnover) => turnover.status === 'READY_TO_APPROVE',
    ).length,
    audit: data.auditFlags.filter(
      (flag) => !flag.reviewed && flag.type !== 'VARIANCE',
    ).length,
    workOrders: data.workOrders.filter(
      (workOrder) => !CLOSED_WORK_ORDERS.has(workOrder.status),
    ).length,
  }
}
