import ReactMarkdown from 'react-markdown'

export default function Dashboard({ data, logs, running, onRunPipeline }) {
  if (!data) return <div className="empty-state"><div className="spinner" /></div>

  const { stats, briefing, events, optimal_slot } = data
  const today = new Date().toISOString().slice(0, 10)
  const todayEvents = (events ?? []).filter(e => e.start?.startsWith(today))
  const spendPct = Math.min(100, ((stats?.monthly_spend ?? 0) / (stats?.spend_budget ?? 2000)) * 100)
  const co2Pct   = Math.min(100, ((stats?.monthly_co2_kg ?? 0) / (stats?.co2_target_kg ?? 200)) * 100)

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="stats-grid fade-in">
        <StatCard
          color="purple" icon="📅"
          value={stats?.events_today ?? 0}
          label="Meetings Today"
          sub="Across all calendars"
        />
        <StatCard
          color="teal" icon="💳"
          value={`$${(stats?.monthly_spend ?? 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`}
          label="Spent This Month"
          sub={`${spendPct.toFixed(0)}% of $${(stats?.spend_budget ?? 2000).toLocaleString()} budget`}
        />
        <StatCard
          color="green" icon="🌱"
          value={`${(stats?.monthly_co2_kg ?? 0).toFixed(1)} kg`}
          label="CO₂ This Month"
          sub={`${co2Pct.toFixed(0)}% of ${stats?.co2_target_kg ?? 200} kg target`}
        />
        <StatCard
          color="amber" icon="🏋️"
          value={optimal_slot ? optimal_slot.start_display : '—'}
          label="Best Gym Slot"
          sub={optimal_slot ? `Until ${optimal_slot.end_display}` : 'No free slot 5–9 PM'}
        />
      </div>

      {/* ── Daily Briefing ── */}
      <div className="briefing-card fade-in-2">
        <div className="briefing-header">
          <div className="briefing-label">Daily Briefing</div>
          <button
            id="btn-refresh-briefing"
            className={`run-btn ${running ? 'loading' : ''}`}
            onClick={onRunPipeline}
            disabled={running}
            style={{padding:'6px 16px', fontSize:12}}
          >
            {running ? 'Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
        <div className="briefing-body">
          {briefing
            ? <ReactMarkdown>{briefing}</ReactMarkdown>
            : <p style={{color:'var(--text-muted)'}}>Run the pipeline to generate your daily briefing.</p>
          }
        </div>

        {optimal_slot && (
          <div className="slot-banner">
            <div className="slot-banner-icon">🏋️</div>
            <div className="slot-banner-text">
              <div className="slot-banner-title">
                Optimal Gym Slot: {optimal_slot.start_display} – {optimal_slot.end_display}
              </div>
              <div className="slot-banner-sub">
                {optimal_slot.gap_available_minutes} min free window found · Largest gap in 5–9 PM
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2 fade-in-3">
        {/* ── Today's Events ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Today's Schedule</div>
            <span className="badge blue">{todayEvents.length} events</span>
          </div>
          <div className="card-body">
            {todayEvents.length === 0 ? (
              <div className="empty-state" style={{padding:'24px'}}>
                <div className="empty-state-icon">🎉</div>
                Clear calendar today!
              </div>
            ) : (
              <div className="event-list">
                {todayEvents.map(ev => (
                  <EventRow key={ev.id} ev={ev} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Progress + Log ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Monthly Goals</div>
          </div>
          <div className="card-body">
            <ProgressBar label="Monthly Budget" pct={spendPct} color="teal"
              left={`$${(stats?.monthly_spend??0).toFixed(0)} spent`}
              right={`$${(stats?.spend_budget??2000).toLocaleString()}`} />
            <ProgressBar label="Carbon Target" pct={co2Pct} color="green"
              left={`${(stats?.monthly_co2_kg??0).toFixed(1)} kg`}
              right={`${stats?.co2_target_kg??200} kg`} />

            <div style={{marginTop:20}}>
              <div className="card-title" style={{marginBottom:10}}>🔎 Agent Logs</div>
              <div className="log-stream" id="log-stream">
                {logs.length === 0
                  ? <div className="log-line" style={{color:'var(--text-muted)'}}>Run the pipeline to see live logs…</div>
                  : logs.map((l, i) => (
                    <div key={i} className={`log-line ${l.level}`}>
                      <span className="log-ts">{l.ts?.slice(11,19)}</span>
                      {l.msg}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ color, icon, value, label, sub }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function ProgressBar({ label, pct, color, left, right }) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <span style={{color:'var(--text-muted)', fontSize:12}}>{left} / {right}</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${color}`} style={{width:`${Math.min(pct,100)}%`}} />
      </div>
    </div>
  )
}

function EventRow({ ev }) {
  const color = ev.color ?? 'blue'
  let timeStr = '—'
  try { timeStr = new Date(ev.start).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) } catch {}
  return (
    <div className="event-item">
      <div className={`event-dot ${color}`} />
      <div className="event-info">
        <div className="event-title">{ev.title}</div>
        <div className="event-meta">
          <span className="event-time">{timeStr}</span>
          {ev.location && <span>📍 {ev.location}</span>}
        </div>
      </div>
      <span className={`event-badge ${color}`}>{color}</span>
    </div>
  )
}
