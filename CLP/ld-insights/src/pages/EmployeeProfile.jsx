import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState } from '../components/Loading'

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const pct = (n) => (typeof n === 'number' ? Math.round(n) : null)

// Map an assessment score → an on-brand color band.
const scoreColor = (p) => (p >= 80 ? 'text-emerald-600' : p >= 60 ? 'text-secondary' : 'text-amber-500')
const scoreBar = (p) => (p >= 80 ? 'bg-emerald-600' : p >= 60 ? 'bg-secondary' : 'bg-amber-500')

const statusStyle = (status) => {
  const s = (status || '').toUpperCase()
  if (['COMPLETED', 'PASSED', 'PRESENT', 'ACHIEVED'].includes(s)) return 'bg-emerald-600/10 text-emerald-600'
  if (['FAILED', 'ABSENT', 'MISSED'].includes(s)) return 'bg-error-container text-error'
  return 'bg-amber-500/10 text-amber-500'
}

export default function EmployeeProfile() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('assessments')

  const { data, loading, error, refetch } = useApi(id ? `/api/v1/employees/${id}` : null)

  if (loading) return <Loading label="Loading employee profile…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const emp = data || {}
  const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.employeeId || 'Employee'
  const metrics = emp.metrics || {}
  const attendance = Array.isArray(emp.attendance) ? emp.attendance : []
  const assessments = Array.isArray(emp.assessments) ? emp.assessments : []
  const milestones = Array.isArray(emp.milestones) ? emp.milestones : []

  // Composite "health score" derived from available metrics (no dedicated field in the contract).
  const healthVals = [metrics.attendancePct, metrics.avgScore, metrics.milestoneCompletionPct].filter(
    (n) => typeof n === 'number'
  )
  const health = healthVals.length ? Math.round(healthVals.reduce((a, b) => a + b, 0) / healthVals.length) : null
  const trendUp = (metrics.scoreTrend ?? 0) >= 0

  const milestonesAchieved = milestones.filter((m) =>
    ['COMPLETED', 'ACHIEVED', 'PASSED'].includes((m.status || '').toUpperCase())
  ).length

  const kpiCards = [
    {
      icon: 'event_available',
      label: 'Attendance Rate',
      value: pct(metrics.attendancePct) != null ? `${pct(metrics.attendancePct)}%` : '—',
      sub: 'YTD',
      color: 'text-emerald-600',
    },
    {
      icon: 'grading',
      label: 'Avg Assessment Score',
      value: pct(metrics.avgScore) != null ? `${pct(metrics.avgScore)}%` : '—',
      sub: 'All Time',
      color: 'text-secondary',
    },
    {
      icon: 'flag',
      label: 'Milestones Achieved',
      value: milestones.length ? `${milestonesAchieved} / ${milestones.length}` : pct(metrics.milestoneCompletionPct) != null ? `${pct(metrics.milestoneCompletionPct)}%` : '—',
      sub: 'Progress',
      color: 'text-on-background',
    },
  ]

  return (
    <div className="space-y-lg">
      {/* Back */}
      <button
        onClick={() => navigate('/at-risk')}
        className="flex items-center gap-1 text-body-sm text-secondary hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        Back to At-Risk Monitor / Learner Profile
      </button>

      {/* Profile Header */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
          <div className="h-16 w-16 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="text-secondary font-bold text-headline-md">{initials(fullName)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-headline-md font-headline-md text-on-background flex items-center gap-2">
              {fullName}
              {emp.riskProfilingOptOut && (
                <span className="inline-flex items-center gap-1 text-label-md font-label-md px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>privacy_tip</span>
                  Profiling opted-out
                </span>
              )}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              {[emp.jobTitle, emp.department].filter(Boolean).join(' • ') || '—'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-body-sm text-on-surface-variant">
              {emp.workEmail && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
                  {emp.workEmail}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>badge</span>
                {emp.employeeId}
              </span>
            </div>
          </div>
          {/* Health Score (derived) */}
          <div className="bg-surface-container rounded-xl p-md text-center min-w-[140px] border border-outline-variant">
            <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">Learning Health Score</div>
            <div className="text-display-lg font-display-lg text-on-background">
              {health != null ? health : '—'}
              <span className="text-headline-sm text-on-surface-variant">/100</span>
            </div>
            <div className={`flex items-center justify-center gap-1 mt-1 text-body-sm ${trendUp ? 'text-emerald-600' : 'text-error'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{trendUp ? 'trending_up' : 'trending_down'}</span>
              {trendUp ? 'On Track' : 'Declining'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <div className="flex items-start justify-between mb-2">
              <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{k.sub}</span>
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>{k.icon}</span>
            </div>
            <div className={`text-headline-md font-headline-md ${k.color}`}>{k.value}</div>
            <div className="text-body-sm text-on-surface-variant">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant flex gap-0">
        {[
          { key: 'assessments', label: `Assessments (${assessments.length})` },
          { key: 'attendance', label: `Attendance (${attendance.length})` },
          { key: 'milestones', label: `Milestones (${milestones.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-body-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Assessments */}
      {tab === 'assessments' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-headline-sm font-headline-sm text-on-background">Assessment Results</h3>
          </div>
          {assessments.length === 0 ? (
            <EmptyState icon="grading" title="No assessments" message="No assessment records ingested for this employee yet." />
          ) : (
            <div className="space-y-5">
              {assessments.map((a, i) => {
                const max = a.maxScore || 100
                const p = max ? Math.round(((a.score ?? 0) / max) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body-sm font-semibold text-on-background">
                        {a.assessmentName || a.competency || a.trainingModule || 'Assessment'}
                      </span>
                      <span className={`text-label-md font-label-md ${scoreColor(p)}`}>
                        {a.score ?? '—'}/{max} {a.rating ? `· ${a.rating}` : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBar(p)} transition-all duration-500`} style={{ width: `${p}%` }} />
                    </div>
                    {(a.competency || a.assessmentDate) && (
                      <div className="text-label-md text-on-surface-variant mt-1">
                        {[a.competency, a.assessmentDate].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="text-headline-sm font-headline-sm text-on-background mb-6">Training Attendance</h3>
          {attendance.length === 0 ? (
            <EmptyState icon="event_busy" title="No attendance records" message="No training attendance ingested for this employee yet." />
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant" />
              <div className="space-y-6">
                {attendance.map((s, i) => {
                  const present = ['PRESENT', 'COMPLETED', 'ATTENDED'].includes((s.status || '').toUpperCase())
                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`h-10 w-10 rounded-full ${present ? 'bg-emerald-600/10' : 'bg-error-container'} flex items-center justify-center shrink-0 z-10`}>
                        <span className={`material-symbols-outlined ${present ? 'text-emerald-600' : 'text-error'}`} style={{ fontSize: 18 }}>
                          {present ? 'check' : 'close'}
                        </span>
                      </div>
                      <div className="pt-1.5 pb-1">
                        <div className="text-label-md text-on-surface-variant mb-0.5">{s.sessionDate}</div>
                        <div className="text-body-sm font-semibold text-on-background">
                          {s.trainingModule || s.sessionType || 'Session'}
                          <span className={`ml-2 text-label-md font-label-md px-2 py-0.5 rounded-full ${statusStyle(s.status)}`}>{s.status}</span>
                        </div>
                        {(s.sessionType || s.reason) && (
                          <div className="text-body-sm text-on-surface-variant mt-0.5">
                            {[s.sessionType, s.reason].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant">
            <h3 className="text-headline-sm font-headline-sm text-on-background">Competency Milestones</h3>
            <p className="text-body-sm text-on-surface-variant">Progression across competency milestones.</p>
          </div>
          {milestones.length === 0 ? (
            <EmptyState icon="flag" title="No milestones" message="No competency milestone records for this employee yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low">
                    {['Milestone', 'Competency', 'Completion Date', 'Proficiency', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {milestones.map((m, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-sm font-semibold text-on-background">{m.milestoneName || '—'}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{m.competency || '—'}</td>
                      <td className="px-4 py-3 text-data-tabular font-data-tabular text-on-surface-variant">{m.completionDate || '—'}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{m.proficiencyLevel || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-label-md font-label-md px-2 py-1 rounded-full ${statusStyle(m.status)}`}>{m.status || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
