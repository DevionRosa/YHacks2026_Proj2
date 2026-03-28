import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import CalendarView from './components/CalendarView'
import SpendingChart from './components/SpendingChart'
import CarbonMeter from './components/CarbonMeter'
import './index.css'

const API = 'http://localhost:8000'

const NAV = [
  { id: 'dashboard',  icon: '🏠', label: 'Dashboard' },
  { id: 'calendar',   icon: '📅', label: 'Calendar' },
  { id: 'spending',   icon: '💳', label: 'Spending' },
  { id: 'carbon',     icon: '🌱', label: 'Carbon' },
]

export default function App() {
  const [page, setPage]         = useState('dashboard')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [running, setRunning]   = useState(false)
  const [logs, setLogs]         = useState([])
  const [wsConnected, setWsConnected] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/dashboard`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // WebSocket log stream
  useEffect(() => {
    let ws
    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/logs')
      ws.onopen    = () => setWsConnected(true)
      ws.onclose   = () => { setWsConnected(false); setTimeout(connect, 3000) }
      ws.onerror   = () => ws.close()
      ws.onmessage = (e) => {
        try {
          const log = JSON.parse(e.data)
          setLogs(prev => [...prev.slice(-199), log])
        } catch {}
      }
    }
    connect()
    return () => ws?.close()
  }, [])

  const runPipeline = async () => {
    setRunning(true)
    setLogs([])
    try {
      await fetch(`${API}/api/run-pipeline?email_source=mock`, { method: 'POST' })
      await fetchDashboard()
    } catch (err) {
      console.error('Pipeline error:', err)
    } finally {
      setRunning(false)
    }
  }

  const pageTitle = NAV.find(n => n.id === page)?.label ?? 'Momma'

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🤖</div>
          <div>
            <div className="sidebar-logo-text">Momma</div>
            <div className="sidebar-logo-sub">AI Secretary</div>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(n => (
          <button
            key={n.id}
            id={`nav-${n.id}`}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </button>
        ))}

        <div className="sidebar-section-label" style={{marginTop: 8}}>Actions</div>
        <button
          id="btn-run-pipeline"
          className={`run-btn ${running ? 'loading' : ''}`}
          style={{width:'100%', justifyContent:'center', marginBottom: 8}}
          onClick={runPipeline}
          disabled={running}
        >
          {running ? 'Processing…' : '▶ Run Pipeline'}
        </button>

        <div className="sidebar-bottom">
          <div className="nav-item" style={{cursor:'default'}}>
            <span className="status-dot" />
            <span style={{fontSize:13, color: wsConnected ? '#34d399' : '#94a3b8'}}>
              {wsConnected ? 'Agent Online' : 'Connecting…'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-title">{pageTitle}</div>
          <div className="top-bar-right">
            <span className="badge blue">Mock Mode</span>
            <span style={{fontSize:13, color:'var(--text-muted)'}}>
              {new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})}
            </span>
          </div>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              {page === 'dashboard' && (
                <Dashboard
                  data={data}
                  logs={logs}
                  running={running}
                  onRunPipeline={runPipeline}
                />
              )}
              {page === 'calendar'  && <CalendarView events={data?.events ?? []} />}
              {page === 'spending'  && <SpendingChart spending={data?.spending} />}
              {page === 'carbon'    && <CarbonMeter carbon={data?.carbon} stats={data?.stats} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
