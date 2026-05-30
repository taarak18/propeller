import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/authContext'
import { TENANTS, ROLES } from '../lib/auth'

export default function TopNav({ onMenuToggle }) {
  const [searchValue, setSearchValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { principal, switchPrincipal, logout } = useAuth() || {}
  const menuRef = useRef(null)

  const tenantId = principal?.tenantId
  const role = principal?.roles?.[0]
  const tenantName = TENANTS.find((t) => t.id === tenantId)?.name || tenantId || 'Unknown tenant'
  const initial = (principal?.name || 'A').trim().charAt(0).toUpperCase()

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const onSwitchTenant = (e) => switchPrincipal?.({ tenantId: e.target.value })
  const onSwitchRole = (e) => switchPrincipal?.({ roles: [e.target.value] })

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-gutter h-16">
      {/* Left: Logo + mobile menu toggle */}
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 hover:bg-surface-container-low rounded-full transition-colors"
          onClick={onMenuToggle}
        >
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
        </button>
        <span className="text-headline-sm font-headline-sm font-bold text-on-background tracking-tight">
          L&amp;D Insights
        </span>
      </div>

      {/* Right: Search, Notifications, Avatar + account menu */}
      <div className="flex items-center gap-md">
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 16 }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-sm focus:outline-none focus:border-secondary transition-colors w-64 text-on-surface"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <span className="material-symbols-outlined text-secondary">notifications</span>
          <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full"></span>
        </button>

        {/* Current tenant + role pill (hidden on small screens) */}
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <span className="text-label-md font-label-md text-on-surface truncate max-w-[12rem]">{tenantName}</span>
          <span className="text-label-md text-on-surface-variant">{role || '—'}</span>
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity select-none"
          >
            <span className="text-body-sm font-bold text-secondary">{initial}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.08)] overflow-hidden z-50">
              <div className="p-md border-b border-outline-variant">
                <div className="text-body-sm font-bold text-on-background truncate">{principal?.name || 'Demo User'}</div>
                <div className="text-label-md text-on-surface-variant truncate">{principal?.userId}</div>
              </div>

              <div className="p-md space-y-3">
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Tenant
                  </label>
                  <div className="relative">
                    <select
                      value={tenantId || ''}
                      onChange={onSwitchTenant}
                      className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                    >
                      {TENANTS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={role || ''}
                      onChange={onSwitchRole}
                      className="appearance-none w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 16 }}>
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-md border-t border-outline-variant">
                <button
                  onClick={() => { setMenuOpen(false); logout?.() }}
                  className="w-full border border-error/30 bg-error-container/30 hover:bg-error-container text-error py-2 px-4 rounded-lg text-body-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
