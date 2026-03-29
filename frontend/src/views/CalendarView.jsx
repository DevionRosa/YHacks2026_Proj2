const COLOR = {
  blue: '#3b5bdb',
  green: '#0d9488',
  orange: '#d97706',
  red: '#dc2626',
  purple: '#7c3aed',
}

export default function CalendarView({ events = [] }) {
  const sorted = [...events].sort((a, b) => a.start?.localeCompare(b.start))
  const grouped = sorted.reduce((acc, ev) => {
    const day = ev.start?.slice(0, 10) ?? 'Unknown'
    if (!acc[day]) acc[day] = []
    acc[day].push(ev)
    return acc
  }, {})

  const formatDate = (iso) => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const duration = (start, end) => {
    try {
      const mins = (new Date(end) - new Date(start)) / 60000
      return mins >= 60
        ? `${(mins / 60).toFixed(1).replace('.0', '')} h`
        : `${Math.round(mins)} min`
    } catch {
      return ''
    }
  }

  if (events.length === 0) {
    return (
      <div className="panel panel-center empty-panel">
        <p className="empty-title">No events yet</p>
        <p className="muted">Run the assistant to load your calendar.</p>
      </div>
    )
  }

  return (
    <div className="stack">
      {Object.entries(grouped).map(([day, dayEvents]) => {
        const isToday = day === new Date().toISOString().slice(0, 10)
        return (
          <section key={day} className="panel">
            <div className="day-header">
              <h2 className="day-title">
                {isToday ? 'Today — ' : ''}
                {formatDate(day)}
              </h2>
              <span className="badge">{dayEvents.length}</span>
            </div>
            <ul className="calendar-list">
              {dayEvents.map((ev) => {
                const c = COLOR[ev.color] ?? COLOR.blue
                return (
                  <li key={ev.id} className="calendar-card">
                    <span
                      className="calendar-accent"
                      style={{ background: c }}
                      aria-hidden
                    />
                    <div className="calendar-card-body">
                      <div className="calendar-card-top">
                        <div>
                          <div className="calendar-card-title">{ev.title}</div>
                          <div className="calendar-card-meta">
                            {formatTime(ev.start)} – {formatTime(ev.end)}
                            {ev.location && <span> · {ev.location}</span>}
                          </div>
                          {ev.description && (
                            <p className="calendar-desc">{ev.description}</p>
                          )}
                        </div>
                        <span className="duration-pill">{duration(ev.start, ev.end)}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
