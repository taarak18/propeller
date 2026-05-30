import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/authContext'
import { TENANTS } from '../lib/auth'
import { ErrorState, Spinner } from '../components/Loading'

const PURPOSES = [
  { key: 'risk_profiling', label: 'Risk Profiling', desc: 'Automated at-risk classification (GDPR Art.22 / CCPA / DPDP / Law 25).' },
  { key: 'anonymised_benchmarking', label: 'Anonymised Benchmarking', desc: 'Include in anonymised cross-org benchmarks.' },
  { key: 'ml_scoring', label: 'ML Scoring', desc: 'Use data in ML risk scoring models.' },
  { key: 'trainer_notes', label: 'Trainer Notes', desc: 'Allow trainers to attach private notes.' },
  { key: 'third_party_sharing', label: 'Third-Party Sharing', desc: 'Share data with third-party processors.' },
]
const JURISDICTIONS = ['EU', 'UK', 'US', 'CA', 'IN']

const isActive = (record) => ['GRANTED', 'ACTIVE'].includes((record?.status || '').toUpperCase())

export default function Settings() {
  const { principal, logout } = useAuth() || {}
  const [notifications, setNotifications] = useState({ email: true, inApp: true, weekly: false })
  const [threshold, setThreshold] = useState(85)

  const [employeeId, setEmployeeId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('EU')
  const [consents, setConsents] = useState(null) // array | null
  const [loadedFor, setLoadedFor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyPurpose, setBusyPurpose] = useState(null)
  const [error, setError] = useState(null)

  const tenantName = TENANTS.find((t) => t.id === principal?.tenantId)?.name || principal?.tenantId

  // Index loaded records by purpose for quick status lookup.
  const byPurpose = {}
  if (Array.isArray(consents)) {
    for (const c of consents) byPurpose[c.purpose] = c
  }

  const loadConsents = async (e) => {
    e?.preventDefault?.()
    if (!employeeId.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/consents/${employeeId.trim()}`)
      setConsents(Array.isArray(res) ? res : res?.consents || [])
      setLoadedFor(employeeId.trim())
    } catch (err) {
      setError(err?.message || 'Failed to load consents.')
      setConsents(null)
    } finally {
      setLoading(false)
    }
  }

  const grant = async (purpose) => {
    setError(null)
    setBusyPurpose(purpose)
    try {
      await api.post('/api/v1/consents', { employeeId: loadedFor, purpose, action: 'GRANT', jurisdiction })
      await reload()
    } catch (err) {
      setError(err?.message || 'Failed to grant consent.')
    } finally {
      setBusyPurpose(null)
    }
  }

  const withdraw = async (purpose) => {
    setError(null)
    setBusyPurpose(purpose)
    try {
      await api.del(`/api/v1/consents/${loadedFor}/purpose/${purpose}`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Failed to withdraw consent.')
    } finally {
      setBusyPurpose(null)
    }
  }

  const reload = async () => {
    const res = await api.get(`/api/v1/consents/${loadedFor}`)
    setConsents(Array.isArray(res) ? res : res?.consents || [])
  }

  const riskActive = isActive(byPurpose['risk_profiling'])

  return (
    <div className="space-y-lg max-w-2xl">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Settings</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Manage consent &amp; privacy, account preferences, and system configuration.
        </p>
      </div>

      {/* Consent Management — compliance demo */}
      <div className="bg-surface-container-lowest border border-secondary/30 rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">shield_person</span>
          <h3 className="text-headline-sm font-headline-sm text-on-background">Consent &amp; Privacy</h3>
        </div>

        <div className="p-md space-y-4">
          <form onSubmit={loadConsents} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Employee ID</label>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="emp_123"
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Jurisdiction</label>
              <div className="relative">
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                >
                  {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !employeeId.trim()}
              className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>}
              Load
            </button>
          </form>

          {error && <ErrorState error={error} />}

          {loadedFor && !loading && (
            <>
              {/* Prominent risk-profiling opt-out */}
              <div className={`rounded-xl p-md border ${riskActive ? 'border-error/30 bg-error-container/30' : 'border-emerald-600/30 bg-emerald-600/5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-body-sm font-bold text-on-background flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>policy</span>
                      Automated Risk Profiling
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      {riskActive
                        ? `${loadedFor} is currently included in automated risk profiling.`
                        : `${loadedFor} has opted out — risk assessment is suppressed and reports pseudonymise this employee.`}
                    </p>
                  </div>
                  {riskActive ? (
                    <button
                      onClick={() => withdraw('risk_profiling')}
                      disabled={busyPurpose === 'risk_profiling'}
                      className="shrink-0 bg-error hover:opacity-90 text-on-error py-2 px-4 rounded-lg text-body-sm font-bold flex items-center gap-1 transition-colors disabled:opacity-60"
                    >
                      {busyPurpose === 'risk_profiling' ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>}
                      Opt out
                    </button>
                  ) : (
                    <button
                      onClick={() => grant('risk_profiling')}
                      disabled={busyPurpose === 'risk_profiling'}
                      className="shrink-0 border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold flex items-center gap-1 transition-colors disabled:opacity-60"
                    >
                      {busyPurpose === 'risk_profiling' ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      Re-grant
                    </button>
                  )}
                </div>
              </div>

              {/* All purposes */}
              <div className="divide-y divide-outline-variant border border-outline-variant rounded-xl overflow-hidden">
                {PURPOSES.map(({ key, label, desc }) => {
                  const active = isActive(byPurpose[key])
                  const busy = busyPurpose === key
                  return (
                    <div key={key} className="p-md flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-body-sm font-semibold text-on-background">{label}</div>
                        <div className="text-body-sm text-on-surface-variant">{desc}</div>
                        <span className={`inline-block mt-1 text-label-md font-label-md px-2 py-0.5 rounded-full ${active ? 'bg-emerald-600/10 text-emerald-600' : 'bg-surface-container text-on-surface-variant'}`}>
                          {active ? 'Active' : (byPurpose[key]?.status || 'Not granted')}
                        </span>
                      </div>
                      <button
                        onClick={() => (active ? withdraw(key) : grant(key))}
                        disabled={busy}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${active ? 'bg-secondary' : 'bg-outline-variant'}`}
                        title={active ? 'Withdraw' : 'Grant'}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notification Preferences (local UI only) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant">
          <h3 className="text-headline-sm font-headline-sm text-on-background">Notification Preferences</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {[
            { key: 'email', label: 'Email Alerts', desc: 'Receive urgent alerts via email' },
            { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications inside the dashboard' },
            { key: 'weekly', label: 'Weekly Summary Report', desc: 'Get a weekly digest every Monday' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="p-md flex items-center justify-between">
              <div>
                <div className="text-body-sm font-semibold text-on-background">{label}</div>
                <div className="text-body-sm text-on-surface-variant">{desc}</div>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifications[key] ? 'bg-secondary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Threshold (local UI only) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="text-headline-sm font-headline-sm text-on-background mb-1">Compliance Alert Threshold</h3>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Trigger alerts when department compliance drops below this value.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={60}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-secondary"
          />
          <span className="text-headline-md font-headline-md text-on-background w-16 text-center">{threshold}%</span>
        </div>
        <div className="flex justify-between text-label-md text-on-surface-variant mt-1">
          <span>60%</span><span>80%</span><span>100%</span>
        </div>
      </div>

      {/* Account */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="text-headline-sm font-headline-sm text-on-background mb-4">Account</h3>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="text-secondary font-bold text-headline-md">{(principal?.name || 'A').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="text-body-sm font-bold text-on-background">{principal?.name || 'Demo User'}</div>
            <div className="text-body-sm text-on-surface-variant">{principal?.userId}</div>
            <div className="text-label-md text-secondary mt-1">{(principal?.roles || []).join(', ')} · {tenantName}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
            Edit Profile
          </button>
          <button
            onClick={() => logout?.()}
            className="border border-error/30 bg-error-container/30 hover:bg-error-container text-error py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
