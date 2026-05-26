import { useState } from 'react'

const library = {
  'Skill Gap': [
    { name: 'Competency Assessment Drop', rule: "Score < 60% on 2 consecutive tests", active: true },
    { name: 'Consecutive Milestone Failures', rule: "Status 'Failed' ≥ 3 times", active: true },
    { name: 'Certification Expiry Near', rule: "Days to expire < 15", active: false },
    { name: 'Skill Stagnation', rule: "No level progression in 60 days", active: true },
  ],
  'Compliance': [
    { name: 'Compliance Threshold Drop', rule: "Compliance % < 85%", active: true },
    { name: 'Mandatory Deadline Miss', rule: "Course not completed before deadline", active: true },
  ],
  'Engagement': [
    { name: 'Extended Inactivity', rule: "No login for 7 consecutive days", active: true },
  ],
}

const conditions = ['Assessment Score', 'Milestone Status', 'Days Inactive', 'Compliance %', 'Course Completion']
const operators = ['is equal to', 'is greater than', 'is less than', 'results in']
const outcomes = ['Failed', 'Passed', 'Below Threshold', 'Expired']
const riskLevels = [
  { label: 'Critical (Red)', value: 'critical', color: 'text-error' },
  { label: 'Warning (Amber)', value: 'warning', color: 'text-amber-500' },
]

export default function Rules() {
  const [ruleName, setRuleName] = useState('')
  const [category, setCategory] = useState('Compliance')
  const [condition, setCondition] = useState('Assessment Score')
  const [operator, setOperator] = useState('is equal to')
  const [outcome, setOutcome] = useState('Failed')
  const [frequency, setFrequency] = useState('2')
  const [riskLevel, setRiskLevel] = useState('critical')
  const [activeTab, setActiveTab] = useState('Skill Gap')
  const [isDraft, setIsDraft] = useState(true)
  const [library_, setLibrary] = useState(library)

  const previewCount = frequency === '2' ? 118 : 42

  const toggleRule = (cat, idx) => {
    setLibrary(prev => ({
      ...prev,
      [cat]: prev[cat].map((r, i) => i === idx ? { ...r, active: !r.active } : r),
    }))
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Risk Rule Configuration</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Define automated triggers and actions for proactive intervention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-md">
        {/* Rule Builder */}
        <div className="lg:col-span-3 space-y-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Configure Rule Logic</h3>
              {isDraft && (
                <span className="ml-auto text-label-md font-label-md px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                  Draft Mode
                </span>
              )}
            </div>

            <div className="p-md space-y-5">
              {/* Rule Name */}
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Rule Name</label>
                <input
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="e.g. High-Risk Assessment Trigger"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {['Compliance', 'Skill Gap', 'Engagement'].map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-body-sm font-semibold transition-colors ${category === c ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* IF Condition */}
              <div className="bg-surface-container rounded-xl p-md space-y-3">
                <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Condition (IF)</div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">IF</span>
                  <select value={condition} onChange={e => setCondition(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {conditions.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={operator} onChange={e => setOperator(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {operators.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <select value={outcome} onChange={e => setOutcome(e.target.value)}
                    className="border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm">
                    {outcomes.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">AND</span>
                  <span className="text-on-surface-variant">Frequency / Duration</span>
                  <span className="text-on-surface-variant">≥ is exactly</span>
                  <input
                    type="number"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    min={1} max={10}
                    className="w-16 border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:border-secondary text-body-sm text-center"
                  />
                  <span className="text-on-surface-variant">times</span>
                </div>
                <button className="flex items-center gap-1 text-secondary text-body-sm hover:underline">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                  Add Condition
                </button>
              </div>

              {/* THEN Outcome */}
              <div className="bg-surface-container rounded-xl p-md space-y-3">
                <div className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Outcome (THEN)</div>
                <div className="flex flex-wrap gap-2 items-center text-body-sm">
                  <span className="font-bold text-on-background">THEN Flag learner with Risk Level:</span>
                </div>
                <div className="flex gap-3">
                  {riskLevels.map(r => (
                    <label key={r.value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${riskLevel === r.value ? 'border-secondary bg-secondary/5' : 'border-outline-variant hover:bg-surface-container'}`}>
                      <input type="radio" name="riskLevel" value={r.value} checked={riskLevel === r.value} onChange={() => setRiskLevel(r.value)} className="accent-secondary" />
                      <span className={`text-body-sm font-semibold ${r.color}`}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => setIsDraft(false)} className="flex-1 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold transition-colors">
                  Save Rule Logic
                </button>
                <button onClick={() => { setRuleName(''); setIsDraft(true) }} className="flex-1 border border-outline-variant hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
                  Discard Changes
                </button>
              </div>
            </div>
          </div>

          {/* Impact Preview */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary">visibility</span>
              <h3 className="text-headline-sm font-headline-sm text-on-background">Impact Preview</h3>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Based on current live data, applying this rule logic would result in:
            </p>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <div className="text-display-lg font-display-lg text-on-background">{previewCount}</div>
                <div className="text-body-sm text-on-surface-variant">Learners Flagged</div>
              </div>
              <div>
                <div className="text-headline-md font-headline-md text-on-surface-variant">
                  {((previewCount / 854) * 100).toFixed(1)}%
                </div>
                <div className="text-body-sm text-on-surface-variant">Affected Population</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3">
              <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontSize: 16 }}>info</span>
              <span>
                This preview uses a 30-day trailing dataset. Adjusting the frequency threshold to '2 times' would increase flags to 118 learners.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Rules Library */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden sticky top-20">
            <div className="p-md border-b border-outline-variant">
              <h3 className="text-headline-sm font-headline-sm text-on-background">Active Rules Library</h3>
            </div>

            {/* Category tabs */}
            <div className="border-b border-outline-variant flex">
              {Object.keys(library_).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex-1 py-2 text-body-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === cat ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant'}`}
                >
                  {cat} ({library_[cat].length})
                </button>
              ))}
            </div>

            <div className="divide-y divide-outline-variant">
              {library_[activeTab].map((rule, idx) => (
                <div key={rule.name} className="p-md flex items-start gap-3">
                  <button
                    onClick={() => toggleRule(activeTab, idx)}
                    className={`relative inline-flex h-5 w-9 shrink-0 mt-0.5 items-center rounded-full transition-colors ${rule.active ? 'bg-secondary' : 'bg-outline-variant'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${rule.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-body-sm font-semibold text-on-background">{rule.name}</span>
                      <span className="material-symbols-outlined text-on-surface-variant ml-auto" style={{ fontSize: 16 }}>chevron_right</span>
                    </div>
                    <div className="text-body-sm text-on-surface-variant">{rule.rule}</div>
                    {!rule.active && (
                      <span className="text-label-md text-on-surface-variant">Inactive</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-md border-t border-outline-variant">
              <button className="flex items-center gap-1 text-secondary text-body-sm font-semibold hover:underline">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                New Category
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
