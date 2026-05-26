import { useState } from 'react'

const mentees = [
  { id: 1, name: 'Sarah Jenkins', cohort: 'Sales Cohort A', pct: 45, risk: 'Critical', riskIcon: 'trending_down', riskColor: 'text-error', nextSession: 'Today, 2:00 PM', avatar: 'SJ' },
  { id: 2, name: 'Marcus Johnson', cohort: 'Eng Bootcamp', pct: 60, risk: 'Behind Schedule', riskIcon: 'hourglass_empty', riskColor: 'text-amber-500', nextSession: 'Tomorrow, 10:00 AM', avatar: 'MJ' },
  { id: 3, name: 'David Lee', cohort: 'Leadership Track', pct: 30, risk: 'Low Engagement', riskIcon: 'warning', riskColor: 'text-amber-500', nextSession: 'Unscheduled', avatar: 'DL' },
  { id: 4, name: 'Elena Rodriguez', cohort: 'Sales Cohort B', pct: 55, risk: 'Behind Schedule', riskIcon: 'hourglass_empty', riskColor: 'text-amber-500', nextSession: 'Jun 3, 11:00 AM', avatar: 'ER' },
]

const weekData = [
  { label: 'Wk 1', pct: 40 },
  { label: 'Wk 2', pct: 55 },
  { label: 'Wk 3', pct: 68 },
  { label: 'Wk 4', pct: 75 },
  { label: 'Current', pct: 85 },
]

export default function SessionPlanner() {
  const [selectedMentee, setSelectedMentee] = useState('Sarah Jenkins')
  const [sessionType, setSessionType] = useState('Check-in')
  const [notes, setNotes] = useState('')
  const [actions, setActions] = useState('')
  const [logged, setLogged] = useState(false)

  const handleLog = () => {
    setLogged(true)
    setTimeout(() => { setLogged(false); setNotes(''); setActions('') }, 2000)
  }

  const critical = mentees.filter(m => m.risk === 'Critical')

  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-background">Trainer's Session Planner</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Manage your roster, monitor risks, and log session outcomes.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-3 rounded-lg text-body-sm font-semibold flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
            Calendar View
          </button>
          <button className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-3 rounded-lg text-body-sm font-bold flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_box</span>
            Quick Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left: Priority Mentees + Roster Table */}
        <div className="lg:col-span-2 space-y-md">
          {/* Priority Mentees */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-error">flag</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Priority Mentees</h3>
              <span className="ml-auto bg-error-container text-error text-label-md font-label-md px-2 py-0.5 rounded-full">
                {critical.length} Critical
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant">
              {mentees.slice(0, 3).map(m => (
                <div key={m.id} className="p-md flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-secondary-container flex items-center justify-center mb-2">
                    <span className="text-secondary font-bold text-body-sm">{m.avatar}</span>
                  </div>
                  <div className="text-body-sm font-bold text-on-background">{m.name}</div>
                  <div className="text-label-md text-on-surface-variant mb-2">{m.cohort}</div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${m.pct >= 70 ? 'bg-emerald-600' : m.pct >= 50 ? 'bg-amber-500' : 'bg-error'}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className="text-label-md text-on-surface-variant">{m.pct}% Completion</div>
                </div>
              ))}
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant">
              <h3 className="text-headline-sm font-headline-sm text-on-background">Full Roster</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    {['Mentee', 'Risk Factor', 'Progress', 'Next Session', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {mentees.map(m => (
                    <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="text-secondary font-bold text-label-md">{m.avatar}</span>
                          </div>
                          <span className="text-body-sm font-semibold text-on-background">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-body-sm font-semibold ${m.riskColor}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{m.riskIcon}</span>
                          {m.risk}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${m.pct >= 70 ? 'bg-emerald-600' : m.pct >= 50 ? 'bg-amber-500' : 'bg-error'}`}
                              style={{ width: `${m.pct}%` }}
                            />
                          </div>
                          <span className="text-data-tabular font-data-tabular text-on-surface">{m.pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{m.nextSession}</td>
                      <td className="px-4 py-3">
                        {m.nextSession === 'Unscheduled' ? (
                          <button className="text-label-md font-bold text-secondary hover:underline">Schedule</button>
                        ) : (
                          <button onClick={() => setSelectedMentee(m.name)} className="text-label-md font-bold text-secondary hover:underline">
                            Log Session
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Quick Log + Performance */}
        <div className="space-y-md">
          {/* Quick Log */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_document</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Quick Log</h3>
            </div>
            <div className="p-md space-y-3">
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Select Mentee</label>
                <select
                  value={selectedMentee}
                  onChange={e => setSelectedMentee(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
                >
                  {mentees.map(m => <option key={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Session Type</label>
                <div className="flex gap-2">
                  {['Check-in', 'Remediation'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSessionType(t)}
                      className={`flex-1 py-2 rounded-lg text-body-sm font-semibold transition-colors ${sessionType === t ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Notes & Feedback</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Session notes..."
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Action Items / Next Steps</label>
                <textarea
                  value={actions}
                  onChange={e => setActions(e.target.value)}
                  rows={2}
                  placeholder="Action items..."
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleLog}
                className={`w-full py-2 px-4 rounded-lg text-body-sm font-bold transition-colors ${logged ? 'bg-emerald-600 text-white' : 'bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary'}`}
              >
                {logged ? '✓ Session Logged!' : 'Save Session Log'}
              </button>
            </div>
          </div>

          {/* Roster Performance */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <h3 className="text-headline-sm font-headline-sm text-on-background mb-1">Roster Performance Overview</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Aggregate metrics across {mentees.length + 8} active mentees.</p>
            <div className="grid grid-cols-2 gap-md mb-4">
              <div>
                <div className="text-display-lg font-display-lg text-on-background">85%</div>
                <div className="text-body-sm text-on-surface-variant">Avg Completion</div>
              </div>
              <div>
                <div className="text-display-lg font-display-lg text-on-background">24</div>
                <div className="text-body-sm text-on-surface-variant">Sessions Logged</div>
              </div>
            </div>
            {/* Mini sparkline bar chart */}
            <div className="flex items-end gap-1 h-16 border-b border-l border-outline-variant px-1 pb-1">
              {weekData.map(w => (
                <div key={w.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full bg-secondary rounded-sm transition-all"
                    style={{ height: `${w.pct}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
              {weekData.map(w => <span key={w.label}>{w.label}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
