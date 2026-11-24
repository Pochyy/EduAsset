import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { portalHome } from './lib/utils'
import type { Portal } from './types'
import { AppShell } from './components/layout/AppShell'
import { CentralDashboard } from './screens/CentralDashboard'
import { ComingSoon } from './screens/ComingSoon'
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

const labPlaceholders: Placeholder[] = [
  {
    path: 'requisition',
    title: 'Supply requisition',
    srs: '3.6',
    summary: 'Request supplies with live variance against the lab baseline before submission.',
    items: [
      'Baseline and current-term volume',
      'Variance warning at +50%',
      'Justification when the request is abnormal',
    ],
    reference: 'lab-supply-requisition.dc.html',
  },
  {
    path: 'turnover',
    title: 'Turnover scan',
    srs: '3.11–3.12',
    summary: 'Scan the spent consumable, attach the return, and release its replacement 1-to-1.',
    items: [
      'QR scan of the old unit',
      'Return status before release',
      '1-to-1 replacement pairing',
    ],
    reference: 'lab-turnover-scan.dc.html',
  },
  {
    path: 'inventory',
    title: 'Lab inventory',
    srs: '3.14',
    summary: "See the lab's machines, supplies and status at a glance.",
    items: [
      'Machines and linked units',
      'Supply stock by item',
      'Health and inventory status',
    ],
    reference: 'lab-inventory.dc.html',
  },
  {
    path: 'incidents',
    title: 'Report incident',
    srs: '3.19',
    summary: 'Report a defect or incident against a specific unit and route it to a work order.',
    items: [
      'Pick the affected unit',
      'Describe the defect and severity',
      'Create a work order for the technician',
    ],
    reference: 'lab-report-incident.dc.html',
  },
  {
    path: 'work-orders',
    title: 'Work orders',
    srs: '3.20',
    summary: 'Track technician work orders, quotes and repair status.',
    items: [
      'Status from reported to closed',
      'Quote and BER visibility',
      'Repair history per unit',
    ],
    reference: 'lab-work-orders.dc.html',
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
        <Route
          path="dashboard"
          element={
            <ComingSoon
              breadcrumbs={[
                { label: 'WIL Lab', href: '/lab/dashboard' },
                { label: 'Dashboard' },
              ]}
              title="Lab dashboard"
              summary="Your machines, supplies and requests at a glance."
              srs="3.37"
              items={[
                'Quick actions for requisitions, scans and incidents',
                'Lab supply levels and machine health',
                'Open requests and work-order status',
              ]}
              reference="lab-dashboard.dc.html"
              backTo="/lab/dashboard"
              backLabel="Back to Lab dashboard"
            />
          }
        />
        {labPlaceholders.map((placeholder) =>
          placeholderRoute('lab', placeholder, 'WIL Lab', '/lab/dashboard'),
        )}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
