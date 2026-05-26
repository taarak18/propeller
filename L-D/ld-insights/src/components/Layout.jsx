import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import SideNav from './SideNav'

export default function Layout() {
  const [sideNavOpen, setSideNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-on-background font-sans antialiased">
      <TopNav onMenuToggle={() => setSideNavOpen((o) => !o)} />
      <SideNav open={sideNavOpen} onClose={() => setSideNavOpen(false)} />

      <div className="flex h-screen pt-16">
        {/* Spacer for fixed sidebar on desktop */}
        <div className="hidden md:block w-64 shrink-0" />

        <main className="flex-1 p-gutter overflow-y-auto">
          <div className="max-w-container-max mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
