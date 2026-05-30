import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DevLogin from './components/DevLogin'
import { AuthContext } from './lib/authContext'
import { isLoggedIn as authIsLoggedIn, logout as authLogout, getPrincipal, devLogin } from './lib/auth'
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
  const [loggedIn, setLoggedIn] = useState(authIsLoggedIn())
  const [principal, setPrincipal] = useState(getPrincipal())
  // Bumped on login / tenant-role switch so the router subtree remounts and pages refetch.
  const [sessionKey, setSessionKey] = useState(0)

  const syncSession = useCallback(() => {
    setLoggedIn(authIsLoggedIn())
    setPrincipal(getPrincipal())
    setSessionKey((k) => k + 1)
  }, [])

  // Re-mint a token with a new tenant/role (keeps name + userId).
  const switchPrincipal = useCallback(
    async (next) => {
      const current = getPrincipal() || {}
      await devLogin({
        userId: next.userId ?? current.userId ?? 'u_admin',
        tenantId: next.tenantId ?? current.tenantId,
        name: next.name ?? current.name ?? 'Demo Admin',
        roles: next.roles ?? current.roles ?? ['LD_ADMIN'],
      })
      syncSession()
    },
    [syncSession]
  )

  const logout = useCallback(() => {
    authLogout()
    syncSession()
  }, [syncSession])

  if (!loggedIn) {
    return <DevLogin onLoggedIn={syncSession} />
  }

  return (
    <AuthContext.Provider value={{ principal, switchPrincipal, logout, sessionKey }}>
      <BrowserRouter key={sessionKey}>
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
    </AuthContext.Provider>
  )
}
