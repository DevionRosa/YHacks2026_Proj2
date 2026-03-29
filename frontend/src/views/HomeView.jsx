import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Bot } from 'lucide-react'
import TodoListPanel from '../components/TodoListPanel'

export default function HomeView({ data, logs, running, onRunPipeline, todoState }) {

  const carbon = data?.carbon
  const weekChart = useMemo(
    () => buildWeekSeries(carbon?.total_kg ?? 0),
    [carbon?.total_kg]
  )

  const emissionsBlurb = useMemo(() => {
    const t = carbon?.total_kg ?? 0
    if (t <= 0) {
      return 'This week, log trips and fuel to see your emissions trend here.'
    }
    const last = weekChart[weekChart.length - 1]?.kg ?? t
    const first = weekChart[0]?.kg ?? t * 0.4
    const raw = first > 0 ? ((last - first) / first) * 100 : 10
    const pct = Math.min(999, Math.abs(Math.round(raw)))
    const up = last >= first
    return `This week your estimated footprint is ${up ? 'up' : 'down'} about ${pct}% vs. the start of the week — mostly from logged travel and fuel.`
  }, [carbon?.total_kg, weekChart])

  if (!data) {
    return (
      <div className="stack">
        <div className="panel panel-center empty-panel">
          <p className="empty-title">Overview unavailable</p>
          <p className="muted">
            Start the backend, then tap <strong>Refresh</strong> or <strong>Run assistant</strong>.
          </p>
        </div>
        <section className="panel todo-offline-section" aria-labelledby="todo-offline-heading">
          <h2 id="todo-offline-heading" className="section-title">
            To-do list
          </h2>
          <p className="muted todo-offline-hint">
            Your tasks are saved on this device. Open the <strong>Tasks</strong> tab anytime.
          </p>
          <div className="todo-offline-body">
            <TodoListPanel todoState={todoState} variant="full" />
          </div>
        </section>
      </div>
    )
  }

  const { stats, briefing, events, optimal_slot } = data
  const today = new Date().toISOString().slice(0, 10)
  const todayEvents = (events ?? []).filter((e) => e.start?.startsWith(today))
  const openTasks = todoState.todos.filter((t) => !t.done).length

  return (
    <div className="dashboard-home">
      <div className="dash-top-row">
        <WireCard title="Overview">
          <div className="wire-tier wire-tier-compact">
            <p className="wire-label">Today you got</p>
            <div className="wire-lines" aria-hidden>
              <span className="wire-dash">
                {stats?.events_today ?? 0} meeting
                {(stats?.events_today ?? 0) !== 1 ? 's' : ''} on the calendar
              </span>
              <span className="wire-dash">
                $
                {(stats?.monthly_spend ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                spent this month
              </span>
              {optimal_slot && (
                <span className="wire-dash">
                  Best gym window {optimal_slot.start_display} – {optimal_slot.end_display}
                </span>
              )}
            </div>
          </div>
          <div className="wire-tier wire-tier-compact wire-tier-muted">
            <p className="wire-muted-line">
              Unimportant · <strong>33</strong> spam
            </p>
          </div>
          <div className="wire-tier wire-tier-grow">
            <h3 className="wire-subtitle">Today&apos;s to-do list</h3>
            <TodoListPanel todoState={todoState} />
          </div>
        </WireCard>

        <WireCard title="Calendar">
          <div className="cal-split">
            <div className="cal-split-left">
              <div className="cal-split-placeholder" aria-hidden />
              <div className="cal-tasks-pill">
                Any tasks?{' '}
                <span className="cal-tasks-count">
                  {openTasks} open {openTasks === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <div className="cal-split-right">
              <h3 className="wire-subtitle wire-subtitle-tight">Today</h3>
              {todayEvents.length === 0 ? (
                <p className="muted cal-empty">Nothing scheduled for today.</p>
              ) : (
                <ul className="cal-today-list">
                  {todayEvents.map((ev) => (
                    <li key={ev.id} className="cal-today-item">
                      <span className={`cal-dot cal-dot-${ev.color ?? 'blue'}`} aria-hidden />
                      <div>
                        <div className="cal-today-title">{ev.title}</div>
                        <div className="cal-today-meta">
                          <EventTime start={ev.start} />
                          {ev.location && <span>{ev.location}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </WireCard>

        <WireCard title="Carbon">
          <div className="carbon-chart-box">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weekChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'CO₂']}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--accent)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="carbon-summary">{emissionsBlurb}</p>
        </WireCard>
      </div>

      <section className="agent-dock" aria-label="AI assistant">
        <div className="agent-dock-head">
          <div className="agent-dock-title">
            <span className="agent-icon-wrap" aria-hidden>
              <Bot size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="agent-dock-heading">Momma</h2>
              <p className="agent-dock-sub">Assistant — chat and actions will live here</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={onRunPipeline}
            disabled={running}
          >
            {running ? 'Working…' : 'Run assistant'}
          </button>
        </div>
        <div className="agent-dock-body">
          <div className="agent-dock-chat-placeholder">
            <p className="muted small">
              Space reserved for conversational AI. For now, use <strong>Run assistant</strong> for a
              fresh briefing.
            </p>
          </div>
          <div className="agent-dock-briefing">
            <h3 className="agent-dock-section-label">Daily briefing</h3>
            <div className="briefing markdown-body briefing-compact">
              {briefing ? (
                <ReactMarkdown>{briefing}</ReactMarkdown>
              ) : (
                <p className="muted">No briefing yet — run the assistant to generate one.</p>
              )}
            </div>
          </div>
          <div className="agent-dock-logs">
            <h3 className="agent-dock-section-label">Activity</h3>
            <div className="log-box log-box-agent" id="log-stream">
              {logs.length === 0 ? (
                <p className="muted log-placeholder">Logs appear when the assistant runs.</p>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className={`log-line log-${l.level ?? 'info'}`}>
                    <span className="log-time">{l.ts?.slice(11, 19)}</span>
                    {l.msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function WireCard({ title, children }) {
  return (
    <div className="wire-card-wrap">
      <h2 className="wire-card-heading">{title}</h2>
      <div className="wire-card">{children}</div>
    </div>
  )
}

function buildWeekSeries(monthlyTotalKg) {
  const base = Math.max(monthlyTotalKg, 120)
  const points = [0.22, 0.38, 0.52, 0.61, 0.74, 0.88, 1.0]
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return points.map((p, i) => ({
    label: labels[i],
    kg: Math.round(base * p * 10) / 10,
  }))
}

function EventTime({ start }) {
  let timeStr = '—'
  try {
    timeStr = new Date(start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    /* keep dash */
  }
  return <span>{timeStr}</span>
}
