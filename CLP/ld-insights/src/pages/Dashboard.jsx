import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState } from '../components/Loading'

// Static presentation config for the 4 KPI cards; values are filled from the API.
function buildKpis(kpis) {
  const k = kpis || {}
  return [
    {
      label: 'Org Compliance',
      value: k.orgCompliance != null ? `${k.orgCompliance}%` : '—',
      trend: 'Organization-wide compliance',
      trendUp: true,
      icon: 'verified_user',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-surface-container',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Attendance Trend',
      value: k.attendanceTrend != null ? `${k.attendanceTrend > 0 ? '+' : ''}${k.attendanceTrend}%` : '—',
      trend: 'Change vs last period',
      trendUp: null,
      icon: 'groups',
      iconColor: 'text-secondary',
      iconBg: 'bg-surface-container',
      trendColor: 'text-on-surface-variant',
    },
    {
      label: 'At-Risk Learners',
      value: k.atRiskLearners != null ? `${k.atRiskLearners}` : '—',
      trend: 'Flagged for intervention',
      trendUp: true,
      icon: 'warning',
      iconColor: 'text-error',
      iconBg: 'bg-error-container',
      trendColor: 'text-error',
      accent: true,
    },
    {
      label: 'Active Interventions',
      value: k.activeInterventions != null ? `${k.activeInterventions}` : '—',
      trend: `${k.awaitingReview ?? 0} awaiting review`,
      trendUp: null,
      icon: 'assignment_late',
      iconColor: 'text-amber-500',
      iconBg: 'bg-surface-container',
      trendColor: 'text-on-surface-variant',
    },
  ]
}

function buildRiskData(dist) {
  const d = dist || {}
  const high = d.high ?? 0
  const medium = d.medium ?? 0
  const low = d.low ?? 0
  const total = high + medium + low
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0)
  return [
    { label: 'High Risk', count: high, pct: pct(high), color: 'bg-error', textColor: 'text-error', icon: 'error' },
    { label: 'Medium Risk', count: medium, pct: pct(medium), color: 'bg-amber-500', textColor: 'text-amber-500', icon: 'warning' },
    { label: 'Low Risk', count: low, pct: pct(low), color: 'bg-emerald-600', textColor: 'text-emerald-600', icon: 'check_circle' },
  ]
}

// Map [{month,value}] → svg points in the 0..100 viewBox (y inverted: value 100 → top).
function buildTrendPoints(trend) {
  const pts = Array.isArray(trend) ? trend : []
  if (pts.length === 0) return { coords: [], months: [] }
  const coords = pts.map((p, i) => {
    const x = pts.length === 1 ? 0 : (i / (pts.length - 1)) * 100
    const y = 100 - Math.max(0, Math.min(100, p.value ?? 0))
    return [Number(x.toFixed(2)), Number(y.toFixed(2))]
  })
  return { coords, months: pts.map((p) => p.month) }
}

export default function Dashboard() {
  const { data, loading, error, refetch } = useApi('/api/v1/dashboard/summary')

  if (loading) return <Loading label="Loading dashboard…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const kpis = buildKpis(data?.kpis)
  const riskData = buildRiskData(data?.riskDistribution)
  const { coords, months } = buildTrendPoints(data?.complianceTrend)
  const alerts = Array.isArray(data?.alerts) ? data.alerts : []

  const linePath = coords.length
    ? coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
    : ''
  const areaPath = coords.length
    ? `${linePath} L${coords[coords.length - 1][0]},100 L${coords[0][0]},100 Z`
    : ''

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
            {coords.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState icon="show_chart" title="No trend data" message="Compliance trend will appear once reporting aggregates are built." />
              </div>
            ) : (
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
                  <path d={linePath} fill="none" stroke="#0058be" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d={areaPath} fill="url(#grad)" opacity="0.2" />
                  {coords.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="2" fill="#0058be" vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-on-surface-variant px-4">
                  {months.map((m, i) => (
                    <span key={`${m}-${i}`}>{m}</span>
                  ))}
                </div>
              </div>
            )}
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
            {alerts.length === 0 ? (
              <EmptyState icon="notifications_off" title="No urgent alerts" message="You're all caught up." />
            ) : (
              <ul className="divide-y divide-outline-variant">
                {alerts.map((alert, i) => (
                  <li key={`${alert.entity}-${i}`} className="p-4 hover:bg-surface-container-low transition-colors">
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
            )}
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
