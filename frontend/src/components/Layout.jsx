import { LayoutDashboard, Calendar, Wallet, Leaf } from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Overview', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'spending', label: 'Spending', icon: Wallet },
  { id: 'carbon', label: 'Carbon', icon: Leaf },
]

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="logo-square">M</div>
          <span className="brand-text">M.O.M.</span>
        </div>
        <div className="nav-links">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}