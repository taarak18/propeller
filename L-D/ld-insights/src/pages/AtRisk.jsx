import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const learners = [
  { id: 1, empId: 'EMP-8492', name: 'Sarah Jenkins', dept: 'Customer Support', risk: 'Critical', trigger: 'Low Attendance', metric: 'Compliance: 42%', threshold: 'Threshold: 80%', avatar: 'SJ' },
  { id: 2, empId: 'EMP-9103', name: 'Marcus Chen', dept: 'Engineering', risk: 'Elevated', trigger: 'Assessment Score', metric: 'Assessment: 65%', threshold: 'Target: 75%', avatar: 'MC' },
  { id: 3, empId: 'EMP-3321', name: 'David Rodriguez', dept: 'Sales', risk: 'Elevated', trigger: 'Low Engagement', metric: 'Activity Drop: -30%', threshold: 'Last 14 days', avatar: 'DR' },
  { id: 4, empId: 'EMP-4472', name: 'James Smith', dept: 'Sales N.A.', risk: 'Critical', trigger: 'Low Attendance', metric: 'Compliance: 62%', threshold: 'Threshold: 80%', avatar: 'JS' },
  { id: 5, empId: 'EMP-5581', name: 'Priya Patel', dept: 'HR', risk: 'Elevated', trigger: 'Assessment Score', metric: 'Assessment: 72%', threshold: 'Target: 75%', avatar: 'PP' },
  { id: 6, empId: 'EMP-6610', name: 'Carlos Rivera', dept: 'Sales EMEA', risk: 'Critical', trigger: 'Low Engagement', metric: 'Activity Drop: -45%', threshold: 'Last 14 days', avatar: 'CR' },
]

const riskCfg = {
  Critical: { bg: 'bg-error-container', text: 'text-error', dot: 'bg-error', icon: 'warning', label: 'Critical' },
  Elevated: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500', icon: 'flag', label: 'Elevated' },
}

export default function AtRisk() {
  const navigate = useNavigate()
  const [riskFilter, setRiskFilter] = useState('All Risk Levels')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [triggerFilter, setTriggerFilter] = useState('All Trigger Types')
  const [selected, setSelected] = useState([])

  const departments = ['All Departments', ...new Set(learners.map(l => l.dept))]
  const triggers = ['All Trigger Types', 'Low Attendance', 'Assessment Score', 'Low Engagement']

  const filtered = learners.filter(l => {
    if (riskFilter !== 'All Risk Levels' && l.risk !== riskFilter) return false
    if (deptFilter !== 'All Departments' && l.dept !== deptFilter) return false
    if (triggerFilter !== 'All Trigger Types' && l.trigger !== triggerFilter) return false
    return true
  })

  const toggleSelect = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

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
          <div className="text-display-lg font-display-lg text-error">{learners.filter(l => l.risk === 'Critical').length}</div>
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
          <div className="text-display-lg font-display-lg text-amber-500">{learners.filter(l => l.risk === 'Elevated').length}</div>
          <div className="text-body-sm text-on-surface-variant mt-1">Monitoring required</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Active Interventions</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>assignment_turned_in</span>
          </div>
          <div className="text-display-lg font-display-lg text-on-background">142</div>
          <div className="text-body-sm text-on-surface-variant mt-1">Across all departments</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { value: riskFilter, setter: setRiskFilter, options: ['All Risk Levels', 'Critical', 'Elevated'] },
          { value: deptFilter, setter: setDeptFilter, options: departments },
          { value: triggerFilter, setter: setTriggerFilter, options: triggers },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
            >
              {f.options.map(o => <option key={o}>{o}</option>)}
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

      {/* Learner Cards (top 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {filtered.slice(0, 3).map(l => {
          const cfg = riskCfg[l.risk]
          return (
            <div key={l.id} className={`bg-surface-container-lowest border rounded-xl p-md ${selected.includes(l.id) ? 'border-secondary ring-1 ring-secondary' : 'border-outline-variant'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(l.id)} onChange={() => toggleSelect(l.id)} className="accent-secondary" />
                  <div className="h-9 w-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="text-secondary font-bold text-body-sm">{l.avatar}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-label-md font-label-md px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
                  {l.risk}
                </span>
              </div>
              <div className="text-body-sm font-bold text-on-background">{l.name}</div>
              <div className="text-label-md text-on-surface-variant mb-3">{l.empId}</div>
              <div className={`text-body-sm font-semibold ${l.risk === 'Critical' ? 'text-error' : 'text-amber-500'}`}>{l.metric}</div>
              <div className="text-label-md text-on-surface-variant mb-3">{l.threshold}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/at-risk/${l.id}`)}
                  className="flex-1 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-1.5 px-2 rounded-lg text-label-md font-bold transition-colors text-center"
                >
                  Launch Intervention
                </button>
                <button
                  onClick={() => navigate(`/at-risk/${l.id}`)}
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
                {['Learner', 'Department', 'Risk Level', 'Triggering Metric', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(l => {
                const cfg = riskCfg[l.risk]
                return (
                  <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(l.id)} onChange={() => toggleSelect(l.id)} className="accent-secondary" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                          <span className="text-secondary font-bold text-label-md">{l.avatar}</span>
                        </div>
                        <div>
                          <div className="text-body-sm font-semibold text-on-background">{l.name}</div>
                          <div className="text-label-md text-on-surface-variant">{l.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">{l.dept}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-label-md font-label-md px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
                        {l.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-body-sm font-semibold text-on-background">{l.trigger}</div>
                      <div className="text-label-md text-on-surface-variant">{l.metric}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/at-risk/${l.id}`)} className="text-label-md text-secondary hover:underline font-bold">
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
          <span>Showing 1 to {filtered.length} of {learners.length} at-risk learners</span>
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
    </div>
  )
}
