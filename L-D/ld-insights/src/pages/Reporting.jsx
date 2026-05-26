const deptData = [
  { dept: 'Engineering', compliance: 94, learners: 210, atRisk: 8 },
  { dept: 'Sales N.A.', compliance: 72, learners: 145, atRisk: 18 },
  { dept: 'Operations', compliance: 88, learners: 320, atRisk: 12 },
  { dept: 'HR', compliance: 97, learners: 65, atRisk: 1 },
  { dept: 'Finance', compliance: 85, learners: 90, atRisk: 5 },
  { dept: 'Marketing', compliance: 91, learners: 78, atRisk: 3 },
  { dept: 'Sales EMEA', compliance: 69, learners: 130, atRisk: 21 },
]

const topCourses = [
  { name: 'Data Privacy Essentials', completions: 654, failRate: 8 },
  { name: 'Security Awareness', completions: 598, failRate: 5 },
  { name: 'Ethics & Compliance 101', completions: 541, failRate: 12 },
  { name: 'Workplace Safety', completions: 489, failRate: 3 },
  { name: 'Anti-Harassment Training', completions: 471, failRate: 6 },
]

export default function Reporting() {
  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-background">Reporting</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Department-level breakdowns and course performance analytics.
          </p>
        </div>
        <button className="border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold flex items-center gap-2 transition-colors shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Dept Compliance Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant">
            <h3 className="text-headline-sm font-headline-sm text-on-background">Department Compliance</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {[...deptData].sort((a, b) => a.compliance - b.compliance).map((d) => (
              <div key={d.dept} className="px-md py-3 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div className="w-28 shrink-0 text-body-sm font-semibold text-on-background truncate">{d.dept}</div>
                <div className="flex-1">
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${d.compliance >= 90 ? 'bg-emerald-600' : d.compliance >= 80 ? 'bg-amber-500' : 'bg-error'}`}
                      style={{ width: `${d.compliance}%` }}
                    />
                  </div>
                </div>
                <div className="text-data-tabular font-data-tabular text-on-surface w-12 text-right">{d.compliance}%</div>
                <div className="text-body-sm text-on-surface-variant w-16 text-right">{d.learners} ppl</div>
                <div className={`text-label-md font-label-md w-16 text-right ${d.atRisk > 10 ? 'text-error' : d.atRisk > 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {d.atRisk} at risk
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant">
            <h3 className="text-headline-sm font-headline-sm text-on-background">Top Courses by Completion</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {topCourses.map((c, i) => (
              <div key={c.name} className="px-md py-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                <span className="text-headline-md font-headline-md text-on-surface-variant w-6 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-semibold text-on-background truncate">{c.name}</div>
                  <div className="text-label-md text-on-surface-variant mt-1">{c.completions} completions</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-headline-sm font-headline-sm ${c.failRate > 10 ? 'text-error' : c.failRate > 7 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {c.failRate}%
                  </div>
                  <div className="text-label-md text-on-surface-variant">fail rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Heatmap (bar-based) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="text-headline-sm font-headline-sm text-on-background mb-6">Monthly Compliance Trend by Department</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr>
                <th className="text-left pb-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Department</th>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m) => (
                  <th key={m} className="text-center pb-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {deptData.map((d) => {
                const trend = [d.compliance - 8, d.compliance - 5, d.compliance - 2, d.compliance - 1, d.compliance].map((v) =>
                  Math.max(60, Math.min(100, v + Math.round((Math.random() - 0.5) * 4)))
                )
                return (
                  <tr key={d.dept}>
                    <td className="py-3 font-semibold text-on-background pr-4">{d.dept}</td>
                    {trend.map((val, idx) => (
                      <td key={idx} className="py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-label-md font-label-md ${val >= 90 ? 'bg-emerald-600/10 text-emerald-600' : val >= 80 ? 'bg-amber-500/10 text-amber-500' : 'bg-error-container text-error'}`}>
                          {val}%
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
