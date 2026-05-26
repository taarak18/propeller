import { useState } from 'react'

const growthPlan = [
  {
    icon: 'groups',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    title: 'Leadership Peer Mentoring',
    status: 'In Progress',
    statusColor: 'text-secondary',
    statusBg: 'bg-secondary/10',
    desc: 'Weekly syncs focused on conflict resolution and team dynamics.',
    pct: 60,
    est: 'Est. finish: Nov 15',
    action: null,
  },
  {
    icon: 'menu_book',
    color: 'text-error',
    bg: 'bg-error-container',
    title: 'Data Privacy Refresh',
    status: 'Action Required',
    statusColor: 'text-error',
    statusBg: 'bg-error-container',
    desc: 'Mandatory compliance module assigned following recent policy updates.',
    pct: 0,
    est: null,
    action: 'Start Module',
  },
]

const competencies = [
  { icon: 'code', label: 'Advanced React', level: 'Level 3', color: 'text-secondary', bg: 'bg-secondary/10' },
  { icon: 'database', label: 'Data Modeling', level: 'Level 2', color: 'text-on-surface-variant', bg: 'bg-surface-container' },
  { icon: 'psychology', label: 'Agile Mindset', level: 'Level 4', color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  { icon: 'lock', label: 'Cloud Arch', level: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

const sessions = [
  { title: 'Conflict Resolution Workshop', date: 'Oct 24, 2:00 PM EST', facilitator: 'Sarah Jenkins (HR)', action: 'Join Link', actionColor: 'bg-secondary text-on-secondary' },
  { title: 'Q3 Security Briefing', date: 'Oct 28, 10:00 AM EST', facilitator: 'IT Security Team', action: 'Add to Cal', actionColor: 'border border-outline-variant text-on-surface' },
]

export default function Interventions() {
  const [activeItems] = useState(growthPlan.length)

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Learner Intervention Portal</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Your personal growth plan, competencies, and upcoming sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left: Growth Plan + Sessions */}
        <div className="lg:col-span-2 space-y-md">
          {/* Growth Plan */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">moving</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">My Growth Plan</h3>
              <span className="ml-auto bg-secondary text-on-secondary text-label-md font-label-md px-2 py-0.5 rounded-full">
                {activeItems} Active Items
              </span>
            </div>
            <div className="divide-y divide-outline-variant">
              {growthPlan.map((item) => (
                <div key={item.title} className="p-md">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${item.color}`} style={{ fontSize: 18 }}>{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-body-sm font-bold text-on-background">{item.title}</span>
                        <span className={`shrink-0 text-label-md font-label-md px-2 py-0.5 rounded-full ${item.statusBg} ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mb-3">{item.desc}</p>
                      {item.action ? (
                        <button className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold transition-colors">
                          {item.action}
                        </button>
                      ) : (
                        <div>
                          <div className="flex justify-between text-label-md text-on-surface-variant mb-1">
                            <span>{item.pct}% Completed</span>
                            <span>{item.est}</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">event_upcoming</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Upcoming Sessions</h3>
              <button className="ml-auto text-body-sm text-secondary hover:underline">View Calendar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    {['Session Title', 'Date & Time', 'Instructor/Facilitator', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {sessions.map((s) => (
                    <tr key={s.title} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-sm font-semibold text-on-background">{s.title}</td>
                      <td className="px-4 py-3 text-data-tabular font-data-tabular text-on-surface-variant">{s.date}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{s.facilitator}</td>
                      <td className="px-4 py-3">
                        <button className={`py-1.5 px-3 rounded-lg text-body-sm font-semibold transition-colors ${s.actionColor}`}>
                          {s.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Competencies */}
        <div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden sticky top-20">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">military_tech</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Competencies</h3>
            </div>
            <div className="p-md grid grid-cols-2 gap-3">
              {competencies.map(c => (
                <div key={c.label} className={`${c.bg} rounded-xl p-3 flex flex-col items-center text-center`}>
                  <span className={`material-symbols-outlined ${c.color} mb-1`} style={{ fontSize: 22 }}>{c.icon}</span>
                  <div className="text-body-sm font-semibold text-on-background leading-tight">{c.label}</div>
                  <div className={`text-label-md font-label-md mt-0.5 ${c.color}`}>{c.level}</div>
                </div>
              ))}
            </div>
            <div className="p-md border-t border-outline-variant">
              <button className="w-full border border-secondary text-secondary hover:bg-secondary/5 py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
                View All Competencies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
