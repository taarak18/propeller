import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState } from '../components/Loading'

// Handles all four backend risk levels (CRITICAL/HIGH/MEDIUM/LOW); falls back gracefully.
const riskCfg = {
  CRITICAL: { bg: 'bg-error-container', text: 'text-error', dot: 'bg-error', icon: 'warning', label: 'Critical' },
  HIGH: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500', icon: 'flag', label: 'High' },
  MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500', icon: 'flag', label: 'Medium' },
  LOW: { bg: 'bg-emerald-600/10', text: 'text-emerald-600', dot: 'bg-emerald-600', icon: 'check_circle', label: 'Low' },
}
const cfgFor = (level) => riskCfg[level] || { bg: 'bg-surface-container', text: 'text-on-surface-variant', dot: 'bg-outline-variant', icon: 'help', label: level || 'Unknown' }

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const RISK_LEVELS = ['All Risk Levels', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function AtRisk() {
  const navigate = useNavigate()
  const [riskFilter, setRiskFilter] = useState('All Risk Levels')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [triggerFilter, setTriggerFilter] = useState('All Trigger Types')
  const [selected, setSelected] = useState([])

  const path = useMemo(() => {
    const params = new URLSearchParams()
    if (riskFilter !== 'All Risk Levels') params.set('riskLevel', riskFilter)
    if (deptFilter !== 'All Departments') params.set('dept', deptFilter)
    if (triggerFilter !== 'All Trigger Types') params.set('trigger', triggerFilter)
    const qs = params.toString()
    return `/api/v1/risk/at-risk${qs ? `?${qs}` : ''}`
  }, [riskFilter, deptFilter, triggerFilter])

  const { data, loading, error, refetch } = useApi(path)
  const { data: summary } = useApi('/api/v1/risk/summary')

  const learners = useMemo(() => (Array.isArray(data) ? data : []), [data])

  // Build dropdown options from the rows we have, keeping any active selection visible.
  const departments = useMemo(() => {
    const set = new Set(learners.map((l) => l.department).filter(Boolean))
    if (deptFilter !== 'All Departments') set.add(deptFilter)
    return ['All Departments', ...set]
  }, [learners, deptFilter])

  const triggers = useMemo(() => {
    const set = new Set(learners.map((l) => l.trigger).filter(Boolean))
    if (triggerFilter !== 'All Trigger Types') set.add(triggerFilter)
    return ['All Trigger Types', ...set]
  }, [learners, triggerFilter])

  const criticalCount = summary?.critical ?? 0
  const elevatedCount = (summary?.high ?? 0) + (summary?.medium ?? 0)
  const pendingReviews = summary?.pendingReviews ?? 0

  const toggleSelect = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const keyOf = (l) => l.riskId || l.employeeId

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">At-Risk Learner Monitor</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Centralized overview of employees flagged for early intervention.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-error-container border border-outline-variant rounded-xl p-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-label-md font-label-md text-error uppercase tracking-wider">Critical Risk</span>
            <span className="material-symbols-outlined text-error" style={{ fontSize: 20 }}>warning</span>
          </div>
          <div className="text-display-lg font-display-lg text-error">{criticalCount}</div>
          <div className="text-body-sm text-error mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_down</span>
            Requires immediate attention
          </div>
        </div>
        <div className="bg-amber-500/10 border border-outline-variant rounded-xl p-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-label-md font-label-md text-amber-500 uppercase tracking-wider">Elevated Risk</span>
            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 20 }}>assignment_ind</span>
          </div>
          <div className="text-display-lg font-display-lg text-amber-500">{elevatedCount}</div>
          <div className="text-body-sm text-on-surface-variant mt-1">High + Medium · monitoring required</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Pending Reviews</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>fact_check</span>
          </div>
          <div className="text-display-lg font-display-lg text-on-background">{pendingReviews}</div>
          <div className="text-body-sm text-on-surface-variant mt-1">Awaiting human review</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { value: riskFilter, setter: setRiskFilter, options: RISK_LEVELS },
          { value: deptFilter, setter: setDeptFilter, options: departments },
          { value: triggerFilter, setter: setTriggerFilter, options: triggers },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
            >
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
          </div>
        ))}

        {selected.length > 0 && (
          <div className="ml-auto flex gap-2 items-center">
            <span className="text-body-sm text-on-surface-variant">{selected.length} selected</span>
            <button className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-1.5 px-3 rounded-lg text-body-sm font-bold transition-colors">
              Assign Remediation
            </button>
            <button className="border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-3 rounded-lg text-body-sm font-semibold transition-colors">
              Message Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <Loading label="Loading at-risk learners…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : learners.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl">
          <EmptyState
            icon="shield_person"
            title="No at-risk learners"
            message="No employees match these filters. Ingest assessment/attendance data to surface at-risk learners."
          />
        </div>
      ) : (
        <>
          {/* Learner Cards (top 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            {learners.slice(0, 3).map((l) => {
              const cfg = cfgFor(l.riskLevel)
              const id = keyOf(l)
              return (
                <div key={id} className={`bg-surface-container-lowest border rounded-xl p-md ${selected.includes(id) ? 'border-secondary ring-1 ring-secondary' : 'border-outline-variant'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleSelect(id)} className="accent-secondary" />
                      <div className="h-9 w-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                        <span className="text-secondary font-bold text-body-sm">{initials(l.employeeName)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-label-md font-label-md px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-body-sm font-bold text-on-background">{l.employeeName}</div>
                  <div className="text-label-md text-on-surface-variant mb-3">{l.employeeId}</div>
                  <div className={`text-body-sm font-semibold ${cfg.text}`}>{l.trigger}</div>
                  <div className="text-label-md text-on-surface-variant">
                    {l.metric != null && <span>Metric: {l.metric}</span>}
                    {l.threshold != null && <span> · Threshold: {l.threshold}</span>}
                  </div>
                  {l.requiresHumanReview && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-label-md font-label-md px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>gavel</span>
                        Needs review
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/at-risk/${l.employeeId}`)}
                      className="flex-1 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-1.5 px-2 rounded-lg text-label-md font-bold transition-colors text-center"
                    >
                      Launch Intervention
                    </button>
                    <button
                      onClick={() => navigate(`/at-risk/${l.employeeId}`)}
                      className="flex-1 border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-2 rounded-lg text-label-md font-semibold transition-colors text-center"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-4 py-3 w-10"><input type="checkbox" className="accent-secondary" /></th>
                    {['Learner', 'Department', 'Risk Level', 'Triggering Metric', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {learners.map((l) => {
                    const cfg = cfgFor(l.riskLevel)
                    const id = keyOf(l)
                    return (
                      <tr key={id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleSelect(id)} className="accent-secondary" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                              <span className="text-secondary font-bold text-label-md">{initials(l.employeeName)}</span>
                            </div>
                            <div>
                              <div className="text-body-sm font-semibold text-on-background flex items-center gap-2">
                                {l.employeeName}
                                {l.requiresHumanReview && (
                                  <span className="inline-flex items-center gap-1 text-label-md font-label-md px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>gavel</span>
                                    Needs review
                                  </span>
                                )}
                              </div>
                              <div className="text-label-md text-on-surface-variant">{l.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">{l.department}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-label-md font-label-md px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-body-sm font-semibold text-on-background">{l.trigger}</div>
                          <div className="text-label-md text-on-surface-variant">
                            {l.metric != null && <span>{l.metric}</span>}
                            {l.threshold != null && <span> (threshold {l.threshold})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate(`/at-risk/${l.employeeId}`)} className="text-label-md text-secondary hover:underline font-bold">
                            Profile
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-md border-t border-outline-variant flex items-center justify-between text-body-sm text-on-surface-variant">
              <span>Showing 1 to {learners.length} of {learners.length} at-risk learners</span>
              <div className="flex gap-1">
                <button className="p-1.5 rounded hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                </button>
                <button className="p-1.5 rounded hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
