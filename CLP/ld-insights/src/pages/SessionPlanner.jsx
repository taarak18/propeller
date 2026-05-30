import { useState, useMemo } from 'react'
import { api } from '../lib/api'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState, Spinner } from '../components/Loading'

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const today = () => new Date().toISOString().slice(0, 10)

export default function SessionPlanner() {
  const { data, loading, error, refetch } = useApi('/api/v1/interventions?status=ACTIVE')
  const active = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const [selectedId, setSelectedId] = useState('')
  const [sessionDate, setSessionDate] = useState(today())
  const [attended, setAttended] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [logged, setLogged] = useState(false)
  const [actionError, setActionError] = useState(null)

  const idOf = (i) => i.interventionId || i.id

  // Effective selection: explicit choice, otherwise default to the first active intervention.
  const effectiveId = selectedId || (active[0] ? idOf(active[0]) : '')

  const labelFor = (i) =>
    `${i.employeeName || i.employeeId || 'Employee'} — ${i.interventionType || 'Intervention'}`

  const handleLog = async (e) => {
    e?.preventDefault?.()
    if (!effectiveId) return
    setActionError(null)
    setSaving(true)
    try {
      await api.post(`/api/v1/interventions/${effectiveId}/sessions`, {
        sessionDate,
        attended,
        notes,
      })
      setLogged(true)
      setNotes('')
      await refetch()
      setTimeout(() => setLogged(false), 2500)
    } catch (err) {
      setActionError(err?.message || 'Failed to log session.')
    } finally {
      setSaving(false)
    }
  }

  const totalSessionsLogged = active.reduce((sum, i) => sum + (i.sessionsAttended || 0), 0)
  const avgCompletion = active.length
    ? Math.round(
        active.reduce((sum, i) => {
          const t = i.totalSessions || 0
          return sum + (t > 0 ? ((i.sessionsAttended || 0) / t) * 100 : 0)
        }, 0) / active.length
      )
    : 0

  const completionBars = active.slice(0, 6).map((i) => {
    const t = i.totalSessions || 0
    return { id: idOf(i), pct: t > 0 ? Math.round(((i.sessionsAttended || 0) / t) * 100) : 0 }
  })

  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-background">Trainer's Session Planner</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Active interventions on your roster — monitor progress and log session outcomes.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={refetch} className="border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-3 rounded-lg text-body-sm font-semibold flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {actionError && <ErrorState error={actionError} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left: Priority + Roster */}
        <div className="lg:col-span-2 space-y-md">
          {/* Priority (top 3 active) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">flag</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Active Roster</h3>
              <span className="ml-auto bg-secondary text-on-secondary text-label-md font-label-md px-2 py-0.5 rounded-full">
                {active.length} Active
              </span>
            </div>

            {loading ? (
              <Loading label="Loading active interventions…" />
            ) : error ? (
              <div className="p-md"><ErrorState error={error} onRetry={refetch} /></div>
            ) : active.length === 0 ? (
              <EmptyState icon="event_available" title="No active interventions" message="Approve a recommended intervention to start logging sessions." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant">
                {active.slice(0, 3).map((m) => {
                  const t = m.totalSessions || 0
                  const pct = t > 0 ? Math.round(((m.sessionsAttended || 0) / t) * 100) : 0
                  return (
                    <div key={idOf(m)} className="p-md flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-secondary-container flex items-center justify-center mb-2">
                        <span className="text-secondary font-bold text-body-sm">{initials(m.employeeName || m.employeeId)}</span>
                      </div>
                      <div className="text-body-sm font-bold text-on-background">{m.employeeName || m.employeeId}</div>
                      <div className="text-label-md text-on-surface-variant mb-2">{m.interventionType}</div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-error'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-label-md text-on-surface-variant">{pct}% Completion</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Roster Table */}
          {active.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-md border-b border-outline-variant">
                <h3 className="text-headline-sm font-headline-sm text-on-background">Full Roster</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      {['Employee', 'Type', 'Progress', 'Trainer', 'Action'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {active.map((m) => {
                      const t = m.totalSessions || 0
                      const pct = t > 0 ? Math.round(((m.sessionsAttended || 0) / t) * 100) : 0
                      return (
                        <tr key={idOf(m)} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                <span className="text-secondary font-bold text-label-md">{initials(m.employeeName || m.employeeId)}</span>
                              </div>
                              <span className="text-body-sm font-semibold text-on-background">{m.employeeName || m.employeeId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-body-sm text-on-surface-variant">{m.interventionType}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 bg-surface-container rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-error'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-data-tabular font-data-tabular text-on-surface">{m.sessionsAttended || 0}/{t}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-body-sm text-on-surface-variant">{m.assignedTrainer || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedId(idOf(m))} className="text-label-md font-bold text-secondary hover:underline">
                              Log Session
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Log + Performance */}
        <div className="space-y-md">
          {/* Quick Log */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_document</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Log a Session</h3>
            </div>
            <form onSubmit={handleLog} className="p-md space-y-3">
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Intervention</label>
                <div className="relative">
                  <select
                    value={effectiveId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    disabled={active.length === 0}
                    className="appearance-none w-full border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors disabled:opacity-60"
                  >
                    {active.length === 0 ? (
                      <option>No active interventions</option>
                    ) : (
                      active.map((m) => <option key={idOf(m)} value={idOf(m)}>{labelFor(m)}</option>)
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
                </div>
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Session Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Attended</label>
                <button
                  type="button"
                  onClick={() => setAttended((a) => !a)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${attended ? 'bg-secondary' : 'bg-outline-variant'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${attended ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Notes &amp; Feedback</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Session notes..."
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving || active.length === 0}
                className={`w-full py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${logged ? 'bg-emerald-600 text-white' : 'bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary'}`}
              >
                {saving ? <Spinner size={16} /> : logged ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> : null}
                {logged ? 'Session Logged!' : 'Save Session Log'}
              </button>
            </form>
          </div>

          {/* Roster Performance */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <h3 className="text-headline-sm font-headline-sm text-on-background mb-1">Roster Performance Overview</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Aggregate metrics across {active.length} active interventions.</p>
            <div className="grid grid-cols-2 gap-md mb-4">
              <div>
                <div className="text-display-lg font-display-lg text-on-background">{avgCompletion}%</div>
                <div className="text-body-sm text-on-surface-variant">Avg Completion</div>
              </div>
              <div>
                <div className="text-display-lg font-display-lg text-on-background">{totalSessionsLogged}</div>
                <div className="text-body-sm text-on-surface-variant">Sessions Logged</div>
              </div>
            </div>
            {completionBars.length > 0 && (
              <div className="flex items-end gap-1 h-16 border-b border-l border-outline-variant px-1 pb-1">
                {completionBars.map((b) => (
                  <div key={b.id} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div className="w-full bg-secondary rounded-sm transition-all" style={{ height: `${Math.max(4, b.pct)}%` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
