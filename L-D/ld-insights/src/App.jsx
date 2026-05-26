import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AtRisk from './pages/AtRisk'
import Interventions from './pages/Interventions'
import Rules from './pages/Rules'
import Reporting from './pages/Reporting'
import Settings from './pages/Settings'
import Help from './pages/Help'
import EmployeeProfile from './pages/EmployeeProfile'
import SessionPlanner from './pages/SessionPlanner'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="at-risk" element={<AtRisk />} />
          <Route path="at-risk/:id" element={<EmployeeProfile />} />
          <Route path="interventions" element={<Interventions />} />
          <Route path="rules" element={<Rules />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="sessions" element={<SessionPlanner />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
