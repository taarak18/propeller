import { useState } from 'react'
import { devLogin, TENANTS, ROLES } from '../lib/auth'
import { Spinner } from './Loading'

// Dev-only login gate. Mints an HS256 dev JWT via /api/auth/dev-token.
// No real IdP — picks a tenant + role for the POC.
export default function DevLogin({ onLoggedIn }) {
  const [tenantId, setTenantId] = useState(TENANTS[0].id)
  const [role, setRole] = useState(ROLES[0])
  const [name, setName] = useState('Demo Admin')
  const [userId, setUserId] = useState('u_admin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await devLogin({ userId, tenantId, name, roles: [role] })
      onLoggedIn?.()
    } catch (err) {
      setError(err?.message || 'Dev login failed. Is profile-service running on :8082?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-sans antialiased flex items-center justify-center p-gutter">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(15,23,42,0.06)]">
        <div className="p-md border-b border-outline-variant flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-on-primary font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-headline-sm font-headline-sm font-bold text-on-background tracking-tight">
              L&amp;D Insights
            </h1>
            <p className="text-label-md text-on-surface-variant">Dev sign-in (POC)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-md space-y-5">
          <p className="text-body-sm text-on-surface-variant">
            Pick a tenant and role to mint a dev token. All API calls use this token.
          </p>

          <div>
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Tenant
            </label>
            <div className="relative">
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
              >
                {TENANTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                style={{ fontSize: 16 }}
              >
                expand_more
              </span>
            </div>
          </div>

          <div>
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                style={{ fontSize: 16 }}
              >
                expand_more
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
                User ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-error-container/40 border border-error/20 rounded-lg p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: 16 }}>
                error
              </span>
              <span className="text-body-sm text-error break-words">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2.5 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
