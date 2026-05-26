import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const competencies = [
  { name: 'Regulatory Compliance', level: 'Advanced', pct: 90 },
  { name: 'Financial Modeling', level: 'Proficient', pct: 70 },
  { name: 'Risk Assessment', level: 'Developing', pct: 40 },
  { name: 'Client Communication', level: 'Proficient', pct: 72 },
]

const levelColor = { Advanced: 'text-emerald-600', Proficient: 'text-secondary', Developing: 'text-amber-500' }
const levelBar = { Advanced: 'bg-emerald-600', Proficient: 'bg-secondary', Developing: 'bg-amber-500' }

const timeline = [
  { icon: 'verified', color: 'text-emerald-600', bg: 'bg-emerald-600/10', date: 'Oct 12, 2023', title: 'Completed: Global Ethics Certification', detail: 'Score: 94% (Pass)' },
  { icon: 'flag', color: 'text-error', bg: 'bg-error-container', date: 'Sep 28, 2023', title: 'Intervention Triggered', detail: 'Missed milestone in Risk Assessment Module. Auto-assigned to peer mentoring.' },
  { icon: 'play_arrow', color: 'text-secondary', bg: 'bg-secondary/10', date: 'Sep 05, 2023', title: 'Enrolled: Adv. Financial Modeling', detail: null },
]

const interventions = [
  { type: 'Peer Mentoring', icon: 'group', domain: 'Risk Assessment', date: 'Sep 28, 2023', status: 'In Progress', pct: 45 },
  { type: 'Remediation Course', icon: 'menu_book', domain: 'Q1 Compliance Updates', date: 'Feb 10, 2023', status: 'Resolved', pct: 100 },
]

export default function EmployeeProfile() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('competencies')

  return (
    <div className="space-y-lg">
      {/* Back */}
      <button
        onClick={() => navigate('/at-risk')}
        className="flex items-center gap-1 text-body-sm text-secondary hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        Back to Directory / Learner Profile
      </button>

      {/* Profile Header */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
          <div className="h-16 w-16 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="text-secondary font-bold text-headline-md">SJ</span>
          </div>
          <div className="flex-1">
            <h1 className="text-headline-md font-headline-md text-on-background">Sarah Jenkins</h1>
            <p className="text-body-sm text-on-surface-variant">Senior Financial Analyst • Global Markets Div.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
                s.jenkins@enterprise.com
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                Tenured: 3 Yrs
              </span>
            </div>
          </div>
          {/* Health Score */}
          <div className="bg-surface-container rounded-xl p-md text-center min-w-[140px] border border-outline-variant">
            <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">Learning Health Score</div>
            <div className="text-display-lg font-display-lg text-on-background">88<span className="text-headline-sm text-on-surface-variant">/100</span></div>
            <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600 text-body-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
              On Track
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {[
          { icon: 'event_available', label: 'YTD Attendance Rate', value: '96%', sub: 'YTD', color: 'text-emerald-600' },
          { icon: 'grading', label: 'Avg Assessment Score', value: '82%', sub: 'All Time', color: 'text-secondary' },
          { icon: 'flag', label: 'Milestones Achieved', value: '4 / 5', sub: 'Q3 2023', color: 'text-on-background' },
        ].map(k => (
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
          { key: 'competencies', label: 'Competency Profile' },
          { key: 'timeline', label: 'Learning Timeline' },
          { key: 'interventions', label: 'Intervention History' },
        ].map(t => (
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

      {/* Competency Profile */}
      {tab === 'competencies' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-headline-sm font-headline-sm text-on-background">Competency Profile</h3>
            <button className="text-body-sm text-secondary hover:underline">View Details</button>
          </div>
          <div className="space-y-5">
            {competencies.map(c => (
              <div key={c.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body-sm font-semibold text-on-background">{c.name}</span>
                  <span className={`text-label-md font-label-md ${levelColor[c.level]}`}>{c.level}</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${levelBar[c.level]} transition-all duration-500`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Timeline */}
      {tab === 'timeline' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="text-headline-sm font-headline-sm text-on-background mb-6">Learning Timeline</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant" />
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`h-10 w-10 rounded-full ${t.bg} flex items-center justify-center shrink-0 z-10`}>
                    <span className={`material-symbols-outlined ${t.color}`} style={{ fontSize: 18 }}>{t.icon}</span>
                  </div>
                  <div className="pt-1.5 pb-1">
                    <div className="text-label-md text-on-surface-variant mb-0.5">{t.date}</div>
                    <div className="text-body-sm font-semibold text-on-background">{t.title}</div>
                    {t.detail && <div className="text-body-sm text-on-surface-variant mt-0.5">{t.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Intervention History */}
      {tab === 'interventions' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant flex items-center justify-between">
            <div>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Intervention History</h3>
              <p className="text-body-sm text-on-surface-variant">Log of coaching, mentoring, and remediation paths.</p>
            </div>
            <button className="border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-3 rounded-lg text-body-sm font-semibold flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Download Report
            </button>
          </div>
          <div className="p-md space-y-4">
            {interventions.map((inv, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>{inv.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-body-sm font-bold text-on-background">{inv.type}</span>
                    <span className={`text-label-md font-label-md ${inv.status === 'Resolved' ? 'text-emerald-600' : 'text-secondary'}`}>{inv.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${inv.status === 'Resolved' ? 'bg-emerald-600' : 'bg-secondary'}`}
                      style={{ width: `${inv.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-data-tabular font-data-tabular text-on-surface shrink-0">{inv.pct}%</span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border-t border-outline-variant">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {['Intervention Type', 'Domain Area', 'Date Initiated', 'Progress / Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {interventions.map((inv, i) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-body-sm font-semibold text-on-background">{inv.type}</td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">{inv.domain}</td>
                    <td className="px-4 py-3 text-data-tabular font-data-tabular text-on-surface-variant">{inv.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-label-md font-label-md px-2 py-1 rounded-full ${inv.status === 'Resolved' ? 'bg-emerald-600/10 text-emerald-600' : 'bg-secondary/10 text-secondary'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-surface-container rounded transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
