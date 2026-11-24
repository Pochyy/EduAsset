import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  PackagePlus,
  Repeat,
  ScanLine,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Portal } from '../../types'
import type { QueueCounts } from '../../data/counts'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  count?: number
  countKey?: keyof QueueCounts
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const centralNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/central/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Demand',
    items: [
      { label: 'Reorder Alerts', to: '/central/alerts', icon: Bell, countKey: 'alerts' },
      {
        label: 'Requisition Review',
        to: '/central/requisitions',
        icon: ClipboardList,
        countKey: 'requisitions',
      },
    ],
  },
  {
    label: 'Turnover',
    items: [
      { label: 'Turnover Approval', to: '/central/turnover', icon: Repeat, countKey: 'turnover' },
    ],
  },
  {
    label: 'Units & assets',
    items: [
      { label: 'Master Ledger', to: '/central/ledger', icon: BookOpen },
      { label: 'Repair & BER', to: '/central/repairs', icon: Wrench },
      { label: 'Replacements', to: '/central/replacements', icon: ArrowLeftRight },
      { label: 'Reconciliation', to: '/central/reconciliation', icon: ScanLine },
      { label: 'Audit Queue', to: '/central/audit', icon: ShieldCheck, countKey: 'audit' },
    ],
  },
  {
    label: 'Intake',
    items: [{ label: 'Receive New Items', to: '/central/receive', icon: PackagePlus }],
  },
]

export const labNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/lab/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Supplies',
    items: [
      { label: 'Supply Requisition', to: '/lab/requisition', icon: ClipboardList },
      { label: 'Turnover Scan', to: '/lab/turnover', icon: ScanLine },
    ],
  },
  {
    label: 'Equipment',
    items: [
      { label: 'Report Incident', to: '/lab/incidents', icon: AlertTriangle },
      { label: 'Lab Inventory', to: '/lab/inventory', icon: Boxes },
      { label: 'Work Orders', to: '/lab/work-orders', icon: ListChecks, countKey: 'workOrders' },
    ],
  },
]

export const navFor = (portal: Portal) => (portal === 'central' ? centralNav : labNav)

export const alertsCount = (portal: Portal) => (portal === 'central' ? 11 : 2)

export const alertsHref = (portal: Portal) =>
  portal === 'central' ? '/central/audit' : '/lab/dashboard'
