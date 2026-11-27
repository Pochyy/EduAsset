import { lockedRequisitions, readyTurnovers, unreviewedFlags } from './seed'

export const kpis = [
  {
    label: 'Items at / below restock trigger',
    value: 3,
    href: '/central/alerts',
    cta: 'Reorder alerts',
  },
  {
    label: 'Requisitions locked for review',
    value: lockedRequisitions,
    href: '/central/requisitions',
    cta: 'Requisition review',
  },
  {
    label: 'Turnovers awaiting approval',
    value: readyTurnovers,
    href: '/central/turnover',
    cta: 'Turnover approval',
  },
  {
    label: 'Open audit-queue flags',
    value: unreviewedFlags,
    href: '/central/audit',
    cta: 'Audit queue',
  },
]

export const actions = [
  {
    id: 'a1',
    module: 'M1',
    title: '2 requisitions locked (V ≥ +50%)',
    detail: 'WIL Lab 3 bond paper +400%, Lab 1 filament +62.5%',
    href: '/central/requisitions',
    cta: 'Review',
  },
  {
    id: 'a2',
    module: 'M1',
    title: '3 Purchase Requisition Forms drafted',
    detail: 'Toner W9004MC, color toner and A4 bond paper reached the trigger',
    href: '/central/alerts',
    cta: 'Open',
  },
  {
    id: 'a3',
    module: 'M2',
    title: '1 turnover awaiting disbursement',
    detail: 'TNR-WIL-2026-001 returned empty on WIL-PRN-01',
    href: '/central/turnover',
    cta: 'Approve',
  },
  {
    id: 'a4',
    module: 'M3',
    title: 'Repair quote pushes WIL-3DP-002 to 55.3% BER',
    detail: 'Maintenance is blocked; condemnation form ready',
    href: '/central/repairs',
    cta: 'Decide',
  },
  {
    id: 'a5',
    module: 'M3',
    title: `${unreviewedFlags} audit-queue flags`,
    detail: '4 suspicious patterns, 1 rejected attempt, 2 dormant assets, 1 reconciliation discrepancy',
    href: '/central/audit',
    cta: 'Review',
  },
]

export const health = [
  { label: 'Operational', value: 128, tone: 'success' as const },
  { label: 'Needs maintenance', value: 4, tone: 'warning' as const },
  { label: 'Under repair', value: 2, tone: 'danger' as const },
  { label: 'Condemned / BER', value: 3, tone: 'neutral' as const },
]

export const healthTotal = health.reduce((total, item) => total + item.value, 0)
