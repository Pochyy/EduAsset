import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { portalHome } from './lib/utils'
import type { Portal } from './types'
import { AppShell } from './components/layout/AppShell'
import { CentralDashboard } from './screens/CentralDashboard'
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
import { RepairBer } from './screens/RepairBer'
import { VerifiedReplacement } from './screens/VerifiedReplacement'
import { ReceiveItems } from './screens/ReceiveItems'

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
        <Route path="repairs" element={<RepairBer />} />
        <Route path="replacements" element={<VerifiedReplacement />} />
        <Route path="receive" element={<ReceiveItems />} />
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
