import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  Wallet,
  Leaf,
  Play,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Overview', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'spending', label: 'Spending', icon: Wallet },
  { id: 'carbon', label: 'Carbon', icon: Leaf },
]

export default function Layout({
  activeTab,
  onTabChange,
  onRunPipeline,
  onRefresh,
  running,
  wsConnected,
  children,
}) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-brand">
          <span className="header-logo" aria-hidden>
            M
          </span>
          <div>
            <h1 className="header-title">Momma</h1>
            <p className="header-sub">Chat, calendar, spending, and footprint in one place</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={running}
            title="Reload dashboard from the server"
          >
            <RefreshCw size={18} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRunPipeline}
            disabled={running}
            id="btn-run-pipeline"
            title="Process mail and regenerate briefing"
          >
            <Play size={18} fill="currentColor" aria-hidden />
            {running ? 'Working…' : 'Run assistant'}
          </button>
        </div>
      </header>

      <div className="status-bar" role="status">
        {wsConnected ? (
          <>
            <Wifi size={16} className="status-ok" aria-hidden />
            <span>Live updates on</span>
          </>
        ) : (
          <>
            <WifiOff size={16} aria-hidden />
            <span>Connecting to live updates…</span>
          </>
        )}
        <span className="status-pill">Demo data</span>
      </div>

      <nav className="tabs" aria-label="Main sections">
        {TABS.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              id={`nav-${tab.id}`}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <TabIcon size={18} strokeWidth={2} aria-hidden />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <main className="main">{children}</main>
    </div>
  )
}
