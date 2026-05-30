// Reusable, on-brand loading / error / empty states.
// Uses the existing Tailwind design tokens only — no new colors.

export function Spinner({ size = 20 }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-outline-variant border-t-secondary align-middle"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  )
}

export function Loading({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-12 text-on-surface-variant ${className}`}>
      <Spinner />
      <span className="text-body-sm">{label}</span>
    </div>
  )
}

// A skeleton block that matches the surface tokens.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-surface-container rounded-lg ${className}`} />
}

export function ErrorState({ error, onRetry, className = '' }) {
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong.'
  return (
    <div
      className={`bg-error-container/40 border border-error/20 rounded-xl p-md flex items-start gap-3 ${className}`}
    >
      <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: 20 }}>
        error
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-bold text-error">Unable to load data</div>
        <p className="text-body-sm text-on-surface-variant mt-0.5 break-words">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 border border-outline-variant hover:bg-surface-container text-on-surface py-1.5 px-3 rounded-lg text-label-md font-semibold transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title = 'Nothing here yet', message, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 24 }}>
          {icon}
        </span>
      </div>
      <div className="text-body-sm font-bold text-on-background">{title}</div>
      {message && <p className="text-body-sm text-on-surface-variant mt-1 max-w-sm">{message}</p>}
    </div>
  )
}
