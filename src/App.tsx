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
import { RequisitionReview } from './screens/RequisitionReview'
import { TurnoverApproval } from './screens/TurnoverApproval'
import { MasterLedger } from './screens/MasterLedger'
import { Reconciliation } from './screens/Reconciliation'
import { AuditQueue } from './screens/AuditQueue'

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
        <Route path="requisitions" element={<RequisitionReview />} />
        <Route path="turnover" element={<TurnoverApproval />} />
        <Route path="ledger" element={<MasterLedger />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="audit" element={<AuditQueue />} />
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
