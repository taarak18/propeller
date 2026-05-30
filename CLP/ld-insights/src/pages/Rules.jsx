import { useState, useMemo } from 'react'
import { api } from '../lib/api'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState, Spinner } from '../components/Loading'

const METRICS = [
  'training_attendance_percentage',
  'competency_average_score',
  'score_trend',
  'milestone_completion_percentage',
  'days_since_progress',
]
const OPERATORS = [
  { value: 'less_than', label: 'is less than' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'equals', label: 'is equal to' },
]
const PERIODS = ['30_days', '60_days', '90_days', 'all_time']
const SEVERITIES = [
  { value: 'CRITICAL', label: 'Critical', color: 'text-error' },
  { value: 'HIGH', label: 'High', color: 'text-amber-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-500' },
  { value: 'LOW', label: 'Low', color: 'text-emerald-600' },
]
const sevColor = (s) => SEVERITIES.find((x) => x.value === s)?.color || 'text-on-surface-variant'

// Tolerate either a parsed object or a JSON string for ruleDefinitionJson.
function parseDef(def) {
  if (!def) return null
  if (typeof def === 'object') return def
  try {
    return JSON.parse(def)
  } catch {
    return null
  }
}
function summarizeDef(def) {
  const parsed = parseDef(def)
  if (!parsed || !Array.isArray(parsed.criteria)) return 'No criteria'
  return parsed.criteria
    .map((c) => `${c.metric} ${c.operator} ${c.value}${c.period ? ` (${c.period})` : ''}`)
    .join(` ${parsed.operator || 'AND'} `)
}

export default function Rules() {
  const { data, loading, error, refetch } = useApi('/api/v1/rules')

  const [ruleName, setRuleName] = useState('')
  const [metric, setMetric] = useState(METRICS[0])
  const [operator, setOperator] = useState(OPERATORS[0].value)
  const [value, setValue] = useState(80)
  const [period, setPeriod] = useState(PERIODS[0])
  const [severity, setSeverity] = useState('CRITICAL')

  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [testResult, setTestResult] = useState(null)

  const rules = useMemo(() => (Array.isArray(data) ? data : []), [data])

  // Group rules by severity for the library tabs.
  const groups = useMemo(() => {
    const g = {}
    for (const r of rules) {
      const key = r.severity || 'UNSPECIFIED'
      ;(g[key] = g[key] || []).push(r)
    }
    return g
  }, [rules])
  const groupKeys = Object.keys(groups)
  const [activeTab, setActiveTab] = useState(null)
  const currentTab = activeTab && groups[activeTab] ? activeTab : groupKeys[0]

  const buildDefinition = () => ({
    operator: 'AND',
    criteria: [{ metric, period, operator, value: Number(value) }],
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setActionError(null)
    setSaving(true)
    try {
      await api.post('/api/v1/rules', {
        ruleName,
        severity,
        isActive: false,
        ruleDefinitionJson: buildDefinition(),
      })
      setRuleName('')
      await refetch()
    } catch (err) {
      setActionError(err?.message || 'Failed to save rule.')
    } finally {
      setSaving(false)
    }
  }

  const idOf = (r) => r.ruleId || r.id

  const toggleActive = async (r) => {
    const id = idOf(r)
    setActionError(null)
    setBusyId(id)
    try {
      if (r.isActive) {
        // No dedicated deactivate endpoint — use the general update.
        await api.put(`/api/v1/rules/${id}`, { ...r, isActive: false })
      } else {
        await api.put(`/api/v1/rules/${id}/activate`)
      }
      await refetch()
    } catch (err) {
      setActionError(err?.message || 'Failed to update rule state.')
    } finally {
      setBusyId(null)
    }
  }

  const testRule = async (r) => {
    const id = idOf(r)
    setActionError(null)
    setBusyId(id)
    setTestResult(null)
    try {
      // profiles must be supplied for a meaningful match count; POC sends an empty set.
      const res = await api.post(`/api/v1/rules/${id}/test`, { profiles: [] })
      setTestResult({ ruleName: r.ruleName, res })
    } catch (err) {
      setActionError(err?.message || 'Rule test failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Risk Rule Configuration</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Define automated triggers and actions for proactive intervention.
        </p>
      </div>

      {actionError && <ErrorState error={actionError} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-md">
        {/* Rule Builder */}
        <div className="lg:col-span-3 space-y-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Configure Rule Logic</h3>
            </div>

            <form onSubmit={handleSave} className="p-md space-y-5">
              {/* Rule Name */}
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Rule Name</label>
                <input
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Low Attendance Trigger"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              {/* IF Condition */}
              <div className="bg-surface-container rounded-xl p-md space-y-3">
                <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Condition (IF)</div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">IF</span>
                  <select value={metric} onChange={(e) => setMetric(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={operator} onChange={(e) => setOperator(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-20 border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm text-center"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">OVER</span>
                  <span className="text-on-surface-variant">Period</span>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* THEN Outcome */}
              <div className="bg-surface-container rounded-xl p-md space-y-3">
                <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Outcome (THEN)</div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">THEN Flag learner with Severity:</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {SEVERITIES.map((r) => (
                    <label key={r.value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${severity === r.value ? 'border-secondary bg-secondary/5' : 'border-outline-variant hover:bg-surface-container'}`}>
                      <input type="radio" name="severity" value={r.value} checked={severity === r.value} onChange={() => setSeverity(r.value)} className="accent-secondary" />
                      <span className={`text-body-sm font-semibold ${r.color}`}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {saving ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>}
                  Save Rule
                </button>
                <button type="button" onClick={() => setRuleName('')} className="flex-1 border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
                  Discard Changes
                </button>
              </div>
            </form>
          </div>

          {/* Test Result */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary">visibility</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Rule Test Result</h3>
            </div>
            {testResult ? (
              <div>
                <p className="text-body-sm text-on-surface-variant mb-2">
                  Result for <span className="font-semibold text-on-background">{testResult.ruleName}</span>:
                </p>
                <pre className="text-label-md text-on-surface bg-surface-container-low rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(testResult.res, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant">
                Use “Test” on a rule in the library to evaluate it. (POC sends an empty profile set — supply profiles for real match counts.)
              </p>
            )}
          </div>
        </div>

        {/* Right: Rules Library */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden sticky top-20">
            <div className="p-md border-b border-outline-variant">
              <h3 className="text-headline-sm font-headline-sm text-on-background">Rules Library</h3>
            </div>

            {loading ? (
              <Loading label="Loading rules…" />
            ) : error ? (
              <div className="p-md"><ErrorState error={error} onRetry={refetch} /></div>
            ) : rules.length === 0 ? (
              <EmptyState icon="rule" title="No rules yet" message="Create your first risk rule with the builder." />
            ) : (
              <>
                {/* Severity tabs */}
                <div className="border-b border-outline-variant flex">
                  {groupKeys.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`flex-1 py-2 text-body-sm font-semibold transition-colors border-b-2 -mb-px ${currentTab === cat ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant'}`}
                    >
                      {cat} ({groups[cat].length})
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-outline-variant">
                  {(groups[currentTab] || []).map((rule) => {
                    const id = idOf(rule)
                    const busy = busyId === id
                    return (
                      <div key={id} className="p-md flex items-start gap-3">
                        <button
                          onClick={() => toggleActive(rule)}
                          disabled={busy}
                          className={`relative inline-flex h-5 w-9 shrink-0 mt-0.5 items-center rounded-full transition-colors disabled:opacity-60 ${rule.isActive ? 'bg-secondary' : 'bg-outline-variant'}`}
                          title={rule.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${rule.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm font-semibold text-on-background truncate">{rule.ruleName}</span>
                            <span className={`ml-auto text-label-md font-label-md ${sevColor(rule.severity)}`}>{rule.severity}</span>
                          </div>
                          <div className="text-body-sm text-on-surface-variant break-words">{summarizeDef(rule.ruleDefinitionJson)}</div>
                          <div className="flex items-center gap-3 mt-1">
                            {rule.version != null && <span className="text-label-md text-on-surface-variant">v{rule.version}</span>}
                            {!rule.isActive && <span className="text-label-md text-on-surface-variant">Inactive</span>}
                            <button
                              onClick={() => testRule(rule)}
                              disabled={busy}
                              className="text-label-md text-secondary hover:underline font-bold flex items-center gap-1 disabled:opacity-60"
                            >
                              {busy ? <Spinner size={12} /> : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>science</span>}
                              Test
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
