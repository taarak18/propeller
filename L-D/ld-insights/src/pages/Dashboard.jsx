const kpis = [
  {
    label: 'Org Compliance',
    value: '92%',
    trend: '+1.2% from last month',
    trendUp: true,
    icon: 'verified_user',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-surface-container',
    trendColor: 'text-emerald-600',
  },
  {
    label: 'Attendance Trend',
    value: '+3%',
    trend: 'Steady growth Q3',
    trendUp: null,
    icon: 'groups',
    iconColor: 'text-secondary',
    iconBg: 'bg-surface-container',
    trendColor: 'text-on-surface-variant',
  },
  {
    label: 'At-Risk Learners',
    value: '42',
    trend: '+5 since last week',
    trendUp: true,
    icon: 'warning',
    iconColor: 'text-error',
    iconBg: 'bg-error-container',
    trendColor: 'text-error',
    accent: true,
  },
  {
    label: 'Active Interventions',
    value: '15',
    trend: '6 awaiting review',
    trendUp: null,
    icon: 'assignment_late',
    iconColor: 'text-amber-500',
    iconBg: 'bg-surface-container',
    trendColor: 'text-on-surface-variant',
  },
]

const alerts = [
  { entity: 'Dept: Sales N.A.', time: '2h ago', message: 'Compliance drop below 85% threshold.' },
  { entity: 'Learner: J. Smith', time: '4h ago', message: 'Missed 3 consecutive mandatory sessions.' },
  { entity: 'Course: Data Privacy', time: '1d ago', message: 'High failure rate (42%) in final assessment.' },
  { entity: 'System: Integration', time: '1d ago', message: 'HRIS data sync failed for 24 hours.' },
  { entity: 'Dept: Engineering', time: '2d ago', message: 'Security training deadline approaching (48h).' },
]

const riskData = [
  { label: 'High Risk', count: 42, pct: 5, color: 'bg-error', textColor: 'text-error', icon: 'error' },
  { label: 'Medium Risk', count: 128, pct: 15, color: 'bg-amber-500', textColor: 'text-amber-500', icon: 'warning' },
  { label: 'Low Risk', count: 684, pct: 80, color: 'bg-emerald-600', textColor: 'text-emerald-600', icon: 'check_circle' },
]

export default function Dashboard() {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">
          Organization Learning Health
        </h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Executive overview of compliance, risk, and intervention metrics.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:shadow-sm transition-shadow ${kpi.accent ? 'relative overflow-hidden' : ''}`}
          >
            {kpi.accent && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-error-container rounded-bl-full opacity-50" />
            )}
            <div className={`flex justify-between items-start mb-4 ${kpi.accent ? 'relative z-10' : ''}`}>
              <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className={`h-8 w-8 rounded-full ${kpi.iconBg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${kpi.iconColor}`} style={{ fontSize: 18 }}>
                  {kpi.icon}
                </span>
              </div>
            </div>
            <div className={kpi.accent ? 'relative z-10' : ''}>
              <div className={`text-display-lg font-display-lg ${kpi.accent ? 'text-error' : 'text-on-background'}`}>
                {kpi.value}
              </div>
              <div className={`flex items-center gap-1 mt-2 text-body-sm ${kpi.trendColor}`}>
                {kpi.trendUp !== null && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    trending_up
                  </span>
                )}
                <span>{kpi.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-md">
          {/* Compliance Trend Chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col h-96">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-on-background">
                Compliance Trend (6 Months)
              </h3>
              <button className="text-body-sm text-secondary hover:underline">Export Data</button>
            </div>
            <div className="flex-1 relative w-full border-b border-l border-outline-variant flex items-end pt-8 pb-6 px-4">
              {/* Y-axis labels */}
              <div className="absolute -left-7 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant pb-6 pt-0">
                {['100%', '75%', '50%', '25%', '0%'].map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
              {/* Grid dots */}
              <div
                className="absolute inset-0 z-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(#c6c6cd 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              {/* SVG Line Chart */}
              <svg className="absolute inset-0 h-full w-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0058be" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 L20,60 L40,65 L60,30 L80,20 L100,10"
                  fill="none"
                  stroke="#0058be"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M0,80 L20,60 L40,65 L60,30 L80,20 L100,10 L100,100 L0,100 Z"
                  fill="url(#grad)"
                  opacity="0.2"
                />
                {/* Data points */}
                {[
                  [0, 80], [20, 60], [40, 65], [60, 30], [80, 20], [100, 10],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="2" fill="#0058be" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-on-surface-variant px-4">
                {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <h3 className="text-headline-sm font-headline-sm text-on-background mb-6">
              Learner Risk Distribution
            </h3>
            <div className="space-y-6">
              {riskData.map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-body-sm mb-2">
                    <span className={`font-semibold flex items-center gap-1 ${r.textColor}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{r.icon}</span>
                      {r.label}
                    </span>
                    <span className="text-on-surface-variant">
                      {r.count} Learners ({r.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full transition-all duration-500`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts */}
        <div className="flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-error/20 rounded-xl flex flex-col overflow-hidden shadow-[0px_4px_20px_rgba(15,23,42,0.04)]">
            <div className="bg-error-container p-4 border-b border-error/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">notifications_active</span>
              <h3 className="text-headline-sm font-headline-sm text-error">Urgent Alerts</h3>
              <span className="ml-auto bg-error text-on-error text-xs px-2 py-1 rounded-full font-bold">
                {alerts.length}
              </span>
            </div>
            <ul className="divide-y divide-outline-variant">
              {alerts.map((alert) => (
                <li key={alert.entity} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-body-sm font-bold text-on-background">{alert.entity}</span>
                    <span className="text-label-md text-error ml-2 shrink-0">{alert.time}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mb-2">{alert.message}</p>
                  <button className="text-label-md text-secondary hover:underline font-bold">
                    View Details →
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 bg-surface border-t border-outline-variant text-center">
              <button className="text-body-sm text-secondary font-bold hover:underline">
                View All Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
