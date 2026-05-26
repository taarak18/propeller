import { useState } from 'react'

export default function Settings() {
  const [notifications, setNotifications] = useState({ email: true, inApp: true, weekly: false })
  const [threshold, setThreshold] = useState(85)

  return (
    <div className="space-y-lg max-w-2xl">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Settings</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Manage your account preferences and system configuration.
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant">
          <h3 className="text-headline-sm font-headline-sm text-on-background">Notification Preferences</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {[
            { key: 'email', label: 'Email Alerts', desc: 'Receive urgent alerts via email' },
            { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications inside the dashboard' },
            { key: 'weekly', label: 'Weekly Summary Report', desc: 'Get a weekly digest every Monday' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="p-md flex items-center justify-between">
              <div>
                <div className="text-body-sm font-semibold text-on-background">{label}</div>
                <div className="text-body-sm text-on-surface-variant">{desc}</div>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifications[key] ? 'bg-secondary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Threshold */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="text-headline-sm font-headline-sm text-on-background mb-1">Compliance Alert Threshold</h3>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Trigger alerts when department compliance drops below this value.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={60}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-secondary"
          />
          <span className="text-headline-md font-headline-md text-on-background w-16 text-center">{threshold}%</span>
        </div>
        <div className="flex justify-between text-label-md text-on-surface-variant mt-1">
          <span>60%</span><span>80%</span><span>100%</span>
        </div>
      </div>

      {/* Account */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="text-headline-sm font-headline-sm text-on-background mb-4">Account</h3>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="text-secondary font-bold text-headline-md">A</span>
          </div>
          <div>
            <div className="text-body-sm font-bold text-on-background">Administrator</div>
            <div className="text-body-sm text-on-surface-variant">admin@enterprise.com</div>
            <div className="text-label-md text-secondary mt-1">L&amp;D Admin · Enterprise Suite</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
            Edit Profile
          </button>
          <button className="border border-error/30 bg-error-container/30 hover:bg-error-container text-error py-2 px-4 rounded-lg text-body-sm font-semibold transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
