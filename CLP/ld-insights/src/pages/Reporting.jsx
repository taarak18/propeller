import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../lib/hooks'
import { Loading, ErrorState, EmptyState, Spinner } from '../components/Loading'

// templateType/period values are POC assumptions (not enumerated in CONTRACTS.md §4).
const TEMPLATES = [
  { value: 'COMPLIANCE_SUMMARY', label: 'Compliance Summary' },
  { value: 'AT_RISK_LEARNERS', label: 'At-Risk Learners' },
  { value: 'INTERVENTION_OUTCOMES', label: 'Intervention Outcomes' },
  { value: 'DEPARTMENT_BREAKDOWN', label: 'Department Breakdown' },
]
const PERIODS = [
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'LAST_QUARTER', label: 'Last quarter' },
  { value: 'YTD', label: 'Year to date' },
]

const statusStyle = (status) => {
  const s = (status || '').toUpperCase()
  if (['READY', 'COMPLETED', 'GENERATED', 'SUCCESS'].includes(s)) return 'bg-emerald-600/10 text-emerald-600'
  if (['FAILED', 'ERROR'].includes(s)) return 'bg-error-container text-error'
  return 'bg-amber-500/10 text-amber-500'
}

export default function Reporting() {
  const { data, loading, error, refetch } = useApi('/api/v1/reports')

  const [templateType, setTemplateType] = useState(TEMPLATES[0].value)
  const [period, setPeriod] = useState(PERIODS[0].value)
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const reports = Array.isArray(data) ? data : []

  const handleGenerate = async (e) => {
    e.preventDefault()
    setActionError(null)
    setGenerating(true)
    try {
      await api.post('/api/v1/reports/generate', { templateType, period })
      await refetch()
    } catch (err) {
      setActionError(err?.message || 'Failed to generate report.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (report) => {
    const id = report.reportId || report.id
    setActionError(null)
    setDownloadingId(id)
    try {
      const csv = await api.get(`/api/v1/reports/${id}/download`)
      const text = typeof csv === 'string' ? csv : JSON.stringify(csv)
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(report.name || report.type || 'report').replace(/\s+/g, '_')}_${id}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setActionError(err?.message || 'Failed to download report.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-background">Reporting</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Generate and download compliance and learning reports. Opted-out employees are pseudonymised by the service.
          </p>
        </div>
        <button
          onClick={refetch}
          className="border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
          Refresh
        </button>
      </div>

      {actionError && <ErrorState error={actionError} />}

      {/* Generate Report */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">summarize</span>
          <h3 className="text-headline-sm font-headline-sm text-on-background">Generate New Report</h3>
        </div>
        <form onSubmit={handleGenerate} className="p-md flex flex-wrap items-end gap-md">
          <div className="flex-1 min-w-[200px]">
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Template</label>
            <div className="relative">
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
              >
                {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">Period</label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
              >
                {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>expand_more</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {generating ? <Spinner size={16} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>}
            Generate
          </button>
        </form>
      </div>

      {/* Generated Reports */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant">
          <h3 className="text-headline-sm font-headline-sm text-on-background">Generated Reports</h3>
        </div>
        {loading ? (
          <Loading label="Loading reports…" />
        ) : error ? (
          <div className="p-md"><ErrorState error={error} onRetry={refetch} /></div>
        ) : reports.length === 0 ? (
          <EmptyState icon="description" title="No reports yet" message="Generate a report above to see it listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {['Report', 'Type', 'Generated', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {reports.map((r) => {
                  const id = r.reportId || r.id
                  const isReady = ['READY', 'COMPLETED', 'GENERATED', 'SUCCESS'].includes((r.status || '').toUpperCase())
                  return (
                    <tr key={id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-body-sm font-semibold text-on-background">{r.name || `Report ${id}`}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{r.type}</td>
                      <td className="px-4 py-3 text-data-tabular font-data-tabular text-on-surface-variant">{r.generatedAt || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-label-md font-label-md px-2 py-1 rounded-full ${statusStyle(r.status)}`}>{r.status || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === id || (r.status && !isReady)}
                          className="border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-3 rounded-lg text-label-md font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === id ? <Spinner size={14} /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>}
                          Download
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
