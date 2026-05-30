import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/', filled: true },
  { icon: 'warning', label: 'At-Risk Monitor', to: '/at-risk' },
  { icon: 'assignment_turned_in', label: 'Intervention Tracking', to: '/interventions' },
  { icon: 'settings', label: 'Rule Configuration', to: '/rules' },
  { icon: 'analytics', label: 'Reporting', to: '/reporting' },
  { icon: 'calendar_today', label: "Session Planner", to: '/sessions' },
]

const bottomItems = [
  { icon: 'settings', label: 'Settings', to: '/settings' },
  { icon: 'help', label: 'Help', to: '/help' },
]

export default function SideNav({ open, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          bg-surface border-r border-outline-variant fixed left-0 top-0 h-full w-64 flex flex-col pt-16 z-40 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Company header */}
        <div className="p-gutter border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-on-primary font-bold text-lg">C</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-body-sm font-bold text-on-surface truncate">L&amp;D Admin</h2>
              <p className="text-label-md text-on-surface-variant">Enterprise Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map(({ icon, label, to, filled }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm transition-all ${
                      isActive
                        ? 'text-secondary bg-secondary-fixed font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={isActive && filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {icon}
                      </span>
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-outline-variant">
          <button className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-2 px-4 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Intervention
          </button>
          <ul className="mt-3 space-y-1">
            {bottomItems.map(({ icon, label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all text-body-sm"
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  )
}
