import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Mail, CheckCircle2, RefreshCcw, Loader2 } from 'lucide-react'
import TodoListPanel from '../components/TodoListPanel'

export default function HomeView({ todoState }) {
  const [emailAnalysis, setEmailAnalysis] = useState('')
  const [dashboardData, setDashboardData] = useState({ tasks: [], total_kg: 0 })
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Fetch initial data from backend
  const fetchInitialData = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/dashboard-data')
      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      console.error("Dashboard load failed:", err)
    }
  }

  // 2. Sync Emails and Sanitize AI Output
  const syncEmailInsights = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/sync-emails')
      const data = await response.json()

      let rawContent = data.analysis;

      // SENIOR FIX: Strip the "Thinking Process"
      // If the model includes a </think> tag, we take everything AFTER it.
      if (rawContent.includes('</think>')) {
        rawContent = rawContent.split('</think>')[1].trim();
      }
      // Fallback: If it uses <think> but forgot the closing tag, 
      // or if it just starts with "Thus we need to...", we clean that up.
      else if (rawContent.includes('<think>')) {
        rawContent = rawContent.split('<think>')[1].trim();
      }

      setEmailAnalysis(rawContent)
    } catch (err) {
      console.error("Email sync failed:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  return (
    <div className="pro-container">
      {/* TOP HALF: INTELLIGENCE FEED */}
      <section className="dashboard-half email-section">
        <header className="section-header">
          <div className="title-group">
            <Mail size={20} className="accent-icon" />
            <h2 className="pro-title">Intelligence Feed</h2>
          </div>
          <button
            className={`sync-btn ${isSyncing ? 'loading' : ''}`}
            onClick={syncEmailInsights}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 size={16} className="spinning" /> : <RefreshCcw size={16} />}
            {isSyncing ? 'Analyzing...' : 'Sync Inbox'}
          </button>
        </header>

        <div className="content-card email-card">
          {emailAnalysis ? (
            <div className="markdown-body">
              <ReactMarkdown>{emailAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state-centered">
              <p className="muted">No recent analysis. Run sync to process your emails.</p>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM HALF: ACTION ITEMS */}
      <section className="dashboard-half tasks-section">
        <header className="section-header">
          <div className="title-group">
            <CheckCircle2 size={20} className="accent-icon" />
            <h2 className="pro-title">Today's To-Do List</h2>
          </div>
          <div className="stats-group">
            <span className="carbon-stat">
              <strong>{dashboardData.total_kg.toFixed(1)}kg</strong> CO₂ today
            </span>
            <span className="task-badge">
              {todoState.todos.filter(t => !t.done).length} Remaining
            </span>
          </div>
        </header>

        <div className="content-card task-card">
          <TodoListPanel todoState={todoState} />
        </div>
      </section>
    </div>
  )
}