import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState, Spinner } from '../components/Loading'

const statusCfg = {
  RECOMMENDED: { label: 'Recommended', color: 'text-on-surface-variant', bg: 'bg-surface-container', icon: 'lightbulb' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'pending' },
  ACTIVE: { label: 'Active', color: 'text-secondary', bg: 'bg-secondary/10', icon: 'play_circle' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-600/10', icon: 'check_circle' },
  EVALUATED: { label: 'Evaluated', color: 'text-emerald-600', bg: 'bg-emerald-600/10', icon: 'task_alt' },
  CANCELLED: { label: 'Cancelled', color: 'text-on-surface-variant', bg: 'bg-surface-container', icon: 'block' },
  ESCALATED: { label: 'Escalated', color: 'text-error', bg: 'bg-error-container', icon: 'priority_high' },
}
const cfgFor = (s) => statusCfg[s] || { label: s || 'Unknown', color: 'text-on-surface-variant', bg: 'bg-surface-container', icon: 'help' }

const emptyForm = {
  employeeId: '',
  interventionType: 'COACHING',
  description: '',
  startDate: '',
  endDate: '',
  totalSessions: 4,
  assignedTrainer: '',
}

export default function Interventions() {
  const { data: list, loading, error, refetch } = useApi('/api/v1/interventions')
  const { data: summary, refetch: refetchSummary } = useApi('/api/v1/interventions/summary')

  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [completeFor, setCompleteFor] = useState(null) // interventionId currently completing
  const [completeVals, setCompleteVals] = useState({ preValue: '', postValue: '' })

  const interventions = Array.isArray(list) ? list : []

  const refreshAll = () => Promise.all([refetch(), refetchSummary()])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setActionError(null)
    setCreating(true)
    try {
      await api.post('/api/v1/interventions', {
        ...form,
        totalSessions: Number(form.totalSessions) || 0,
        riskId: form.riskId || undefined,
      })
      setForm(emptyForm)
      await refreshAll()
    } catch (err) {
      setActionError(err?.message || 'Failed to create intervention.')
    } finally {
      setCreating(false)
    }
  }

  const runAction = async (id, fn) => {
    setActionError(null)
    setBusyId(id)
    try {
      await fn()
      await refreshAll()
    } catch (err) {
      setActionError(err?.message || 'Action failed.')
    } finally {
      setBusyId(null)
    }
  }

  const approve = (id) => runAction(id, () => api.put(`/api/v1/interventions/${id}/approve`))
  const reject = (id) => runAction(id, () => api.put(`/api/v1/interventions/${id}/reject`))

  const submitComplete = (id) =>
    runAction(id, async () => {
      await api.put(`/api/v1/interventions/${id}/complete`, {
        preValue: Number(completeVals.preValue) || 0,
        postValue: Number(completeVals.postValue) || 0,
      })
      setCompleteFor(null)
      setCompleteVals({ preValue: '', postValue: '' })
    })

  const summaryCards = [
    { label: 'Active', value: summary?.active ?? 0, color: 'text-secondary', icon: 'play_circle' },
    { label: 'Pending Approval', value: summary?.pendingApproval ?? 0, color: 'text-amber-500', icon: 'pending' },
    { label: 'Completed', value: summary?.completed ?? 0, color: 'text-emerald-600', icon: 'check_circle' },
  ]

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Intervention Tracking</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Review, approve, and track remediation interventions across the organization.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <div className="flex items-start justify-between mb-2">
              <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{c.label}</span>
              <span className={`material-symbols-outlined ${c.color}`} style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <div className={`text-display-lg font-display-lg ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {actionError && <ErrorState error={actionError} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left: Intervention list */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">moving</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Interventions</h3>
              <span className="ml-auto bg-secondary text-on-secondary text-label-md font-label-md px-2 py-0.5 rounded-full">
                {interventions.length} Total
              </span>
            </div>

            {loading ? (
              <Loading label="Loading interventions…" />
            ) : error ? (
              <div className="p-md"><ErrorState error={error} onRetry={refetch} /></div>
            ) : interventions.length === 0 ? (
              <EmptyState
                icon="assignment_turned_in"
                title="No interventions yet"
                message="Interventions are auto-created when risks are detected, or you can create one with the form."
              />
            ) : (
              <div className="divide-y divide-outline-variant">
                {interventions.map((inv) => {
                  const cfg = cfgFor(inv.status)
                  const id = inv.interventionId || inv.id
                  const total = inv.totalSessions || 0
                  const done = inv.sessionsAttended || 0
                  const p = total > 0 ? Math.round((done / total) * 100) : 0
                  const canApprove = ['PENDING_APPROVAL', 'RECOMMENDED'].includes(inv.status)
                  const canComplete = inv.status === 'ACTIVE'
                  const busy = busyId === id
                  return (
                    <div key={id} className="p-md">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <span className={`material-symbols-outlined ${cfg.color}`} style={{ fontSize: 18 }}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-body-sm font-bold text-on-background">
                              {inv.interventionType || 'Intervention'}
                              {(inv.employeeName || inv.employeeId) && (
                                <span className="text-on-surface-variant font-normal"> · {inv.employeeName || inv.employeeId}</span>
                              )}
                            </span>
                            <span className={`shrink-0 text-label-md font-label-md px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {inv.description && <p className="text-body-sm text-on-surface-variant mb-3">{inv.description}</p>}

                          {total > 0 && (
                            <div className="mb-3">
                              <div className="flex justify-between text-label-md text-on-surface-variant mb-1">
                                <span>{done}/{total} sessions</span>
                                {inv.assignedTrainer && <span>Trainer: {inv.assignedTrainer}</span>}
                              </div>
                              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${p}%` }} />
                              </div>
                            </div>
                          )}

                          {typeof inv.improvementPct === 'number' && (
                            <div className="text-label-md text-emerald-600 mb-3">Improvement: {inv.improvementPct}%</div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {canApprove && (
                              <>
                                <button
                                  disabled={busy}
                                  onClick={() => approve(id)}
                                  className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-1.5 px-3 rounded-lg text-label-md font-bold transition-colors disabled:opacity-60 flex items-center gap-1"
                                >
                                  {busy ? <Spinner size={14} /> : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
                                  Approve
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => reject(id)}
                                  className="border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-3 rounded-lg text-label-md font-semibold transition-colors disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {canComplete && completeFor !== id && (
                              <button
                                disabled={busy}
                                onClick={() => { setCompleteFor(id); setCompleteVals({ preValue: '', postValue: '' }) }}
                                className="bg-emerald-600 hover:opacity-90 text-white py-1.5 px-3 rounded-lg text-label-md font-bold transition-colors disabled:opacity-60 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                                Complete
                              </button>
                            )}
                          </div>

                          {/* Inline complete form */}
                          {canComplete && completeFor === id && (
                            <div className="mt-3 bg-surface-container rounded-xl p-md space-y-3">
                              <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Record Outcome</div>
                              <div className="flex flex-wrap gap-3">
                                <div>
                                  <label className="text-label-md text-on-surface-variant block mb-1">Pre value</label>
                                  <input
                                    type="number"
                                    value={completeVals.preValue}
                                    onChange={(e) => setCompleteVals((v) => ({ ...v, preValue: e.target.value }))}
                                    className="w-28 border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-label-md text-on-surface-variant block mb-1">Post value</label>
                                  <input
                                    type="number"
                                    value={completeVals.postValue}
                                    onChange={(e) => setCompleteVals((v) => ({ ...v, postValue: e.target.value }))}
                                    className="w-28 border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  disabled={busy}
                                  onClick={() => submitComplete(id)}
                                  className="bg-emerald-600 hover:opacity-90 text-white py-1.5 px-3 rounded-lg text-label-md font-bold transition-colors disabled:opacity-60 flex items-center gap-1"
                                >
                                  {busy ? <Spinner size={14} /> : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
                                  Save Outcome
                                </button>
                                <button
                                  onClick={() => setCompleteFor(null)}
                                  className="border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-3 rounded-lg text-label-md font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Create intervention */}
        <div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden sticky top-20">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">add_task</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">New Intervention</h3>
            </div>
            <form onSubmit={handleCreate} className="p-md space-y-3">
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Employee ID</label>
                <input
                  required
                  value={form.employeeId}
                  onChange={(e) => setField('employeeId', e.target.value)}
                  placeholder="emp_123"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Type</label>
                <div className="relative">
                  <select
                    value={form.interventionType}
                    onChange={(e) => setField('interventionType', e.target.value)}
                    className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                  >
                    {['COACHING', 'MENTORING', 'REMEDIATION_COURSE', 'PEER_SUPPORT', 'TRAINING_PLAN'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
                </div>
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={2}
                  placeholder="What's the plan?"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Start</label>
                  <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">End</label>
                  <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Sessions</label>
                  <input type="number" min={0} value={form.totalSessions} onChange={(e) => setField('totalSessions', e.target.value)} className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Trainer</label>
                  <input value={form.assignedTrainer} onChange={(e) => setField('assignedTrainer', e.target.value)} placeholder="Trainer name" className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors" />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {creating ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>}
                Create Intervention
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
