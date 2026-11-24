import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { portalHome } from './lib/utils'
import type { Portal } from './types'
import { AppShell } from './components/layout/AppShell'
import { CentralDashboard } from './screens/CentralDashboard'
import { ComingSoon } from './screens/ComingSoon'
import { LabDashboard } from './screens/LabDashboard'
import { LabInventory } from './screens/LabInventory'
import { LabReportIncident } from './screens/LabReportIncident'
import { LabRequisition } from './screens/LabRequisition'
import { LabTurnoverScan } from './screens/LabTurnoverScan'
import { LabWorkOrders } from './screens/LabWorkOrders'
import { Login } from './screens/Login'
import { NotFound } from './screens/NotFound'
import { ReorderAlerts } from './screens/ReorderAlerts'

interface Placeholder {
  path: string
  title: string
  srs: string
  summary: string
  items: string[]
  reference: string
}

const centralPlaceholders: Placeholder[] = [
  {
    path: 'requisitions',
    title: 'Requisition review',
    srs: '3.7–3.8',
    summary:
      'Compare a request with its baseline, surface live variance, and lock abnormal quantities for justification.',
    items: [
      'Live variance against the historical baseline',
      'Approve, reject or lock with a note',
      'Audit entry for every decision',
    ],
    reference: 'central-requisition-review.dc.html',
  },
  {
    path: 'turnover',
    title: 'Turnover approval & disbursement',
    srs: '3.13',
    summary:
      'Verify the returned consumable and release its replacement under the 1-to-1 turnover rule.',
    items: [
      'Four replacement rules and photo evidence',
      'Second approver confirmation',
      'Disbursement only after a verified turnover',
    ],
    reference: 'central-turnover-approval.dc.html',
  },
  {
    path: 'ledger',
    title: 'Master property & supply ledger',
    srs: '3.17–3.18',
    summary: 'One record per unit: ID, QR, location, inventory status and health state.',
    items: [
      'Filter by category, location and status',
      'Separate inventory status from health state',
      'Open a unit record and its full history',
    ],
    reference: 'central-master-ledger.dc.html',
  },
  {
    path: 'repairs',
    title: 'Repair & Beyond Economic Repair',
    srs: '3.21–3.23',
    summary:
      'Log repairs, compute BER from replacement value, and decide repair, return to service or condemn.',
    items: [
      'Repair history and quote entry',
      'BER calculation with a clear threshold',
      'Condemnation form and approval',
    ],
    reference: 'central-repair-ber.dc.html',
  },
  {
    path: 'replacements',
    title: 'Verified replacement',
    srs: '3.24–3.25',
    summary: 'Record a replacement against the four rules, with photos and a second approver.',
    items: [
      'Four-rule verification',
      'Photo evidence on the record',
      'Second-approver confirmation',
    ],
    reference: 'central-verified-replacement.dc.html',
  },
  {
    path: 'reconciliation',
    title: 'Reconciliation',
    srs: '3.26',
    summary: 'Reconcile a room on schedule and review every discrepancy with a note.',
    items: [
      'Scheduled room reconciliation',
      'Discrepancy list with variance',
      'Notes and a complete audit trail',
    ],
    reference: 'central-reconciliation.dc.html',
  },
  {
    path: 'audit',
    title: 'Audit queue',
    srs: '3.27',
    summary:
      'Review flagged patterns, rejected attempts, dormant assets and reconciliation discrepancies.',
    items: [
      'Severity and pattern grouping',
      'Review each flag with a note',
      'Queue counts stay visible in the sidebar',
    ],
    reference: 'central-audit-queue.dc.html',
  },
  {
    path: 'receive',
    title: 'Receive new items',
    srs: '3.30–3.34',
    summary:
      'Receive from a delivery record or PO with optional AI name and category, then a staff-typed quantity.',
    items: [
      'Delivery record lookup',
      'AI-assisted name and category',
      'Staff-typed quantity and QR generation',
    ],
    reference: 'central-receive-items.dc.html',
  },
]

function RequireAuth({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.portal !== portal) return <Navigate to={portalHome(user.portal)} replace />

  return <>{children}</>
}

function Landing() {
  const { user } = useAuth()
  return <Navigate to={user ? portalHome(user.portal) : '/login'} replace />
}

function placeholderRoute(
  portal: Portal,
  placeholder: Placeholder,
  portalLabel: string,
  portalPath: string,
) {
  return (
    <Route
      key={placeholder.path}
      path={placeholder.path}
      element={
        <ComingSoon
          breadcrumbs={[
            { label: portalLabel, href: portalPath },
            { label: placeholder.title },
          ]}
          title={placeholder.title}
          summary={placeholder.summary}
          srs={placeholder.srs}
          items={placeholder.items}
          reference={placeholder.reference}
          backTo={portalPath}
          backLabel={portal === 'central' ? 'Back to Central dashboard' : 'Back to Lab dashboard'}
        />
      }
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/central"
        element={
          <RequireAuth portal="central">
            <AppShell portal="central" />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CentralDashboard />} />
        <Route path="alerts" element={<ReorderAlerts />} />
        {centralPlaceholders.map((placeholder) =>
          placeholderRoute('central', placeholder, 'Central', '/central/dashboard'),
        )}
      </Route>

      <Route
        path="/lab"
        element={
          <RequireAuth portal="lab">
            <AppShell portal="lab" />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="requisition" element={<LabRequisition />} />
        <Route path="turnover" element={<LabTurnoverScan />} />
        <Route path="incidents" element={<LabReportIncident />} />
        <Route path="inventory" element={<LabInventory />} />
        <Route path="work-orders" element={<LabWorkOrders />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
