import { useState } from 'react'

export default function TopNav({ onMenuToggle }) {
  const [searchValue, setSearchValue] = useState('')

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

      {/* Right: Search, Notifications, Avatar */}
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

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity select-none">
          <span className="text-body-sm font-bold text-secondary">A</span>
        </div>
      </div>
    </header>
  )
}
