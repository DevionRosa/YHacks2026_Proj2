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
        weekday: 'long', month: 'long', day: 'numeric'
      })
    } catch { return iso }
  }

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch { return iso }
  }

  const duration = (start, end) => {
    try {
      const mins = (new Date(end) - new Date(start)) / 60000
      return mins >= 60 ? `${(mins/60).toFixed(1).replace('.0','')}h` : `${mins}m`
    } catch { return '' }
  }

  const colorMap = { blue:'#6366f1', green:'#10b981', orange:'#f59e0b', red:'#ef4444', purple:'#8b5cf6' }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        No upcoming events found. Run the pipeline to load calendar data.
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2>Upcoming Events</h2>
      </div>

      {Object.entries(grouped).map(([day, dayEvents]) => {
        const isToday = day === new Date().toISOString().slice(0,10)
        return (
          <div key={day} style={{marginBottom: 28}}>
            {/* Day header */}
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
              <div style={{
                padding:'4px 14px', borderRadius:99,
                background: isToday ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isToday ? 'rgba(99,102,241,0.35)' : 'var(--border)'}`,
                fontSize:13, fontWeight:600,
                color: isToday ? 'var(--text-accent)' : 'var(--text-secondary)',
              }}>
                {isToday ? '📍 Today — ' : ''}{formatDate(day)}
              </div>
              <div style={{flex:1, height:1, background:'var(--border)'}} />
              <span className="badge blue">{dayEvents.length}</span>
            </div>

            {/* Events */}
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {dayEvents.map(ev => {
                const c = colorMap[ev.color] ?? colorMap.blue
                return (
                  <div key={ev.id} style={{
                    display:'flex', gap:0,
                    background:'var(--bg-card)',
                    border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)',
                    overflow:'hidden',
                    transition:'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'none'
                  }}>
                    {/* Color sidebar */}
                    <div style={{width:4, background:c, flexShrink:0}} />

                    <div style={{padding:'14px 18px', flex:1}}>
                      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12}}>
                        <div>
                          <div style={{fontWeight:600, fontSize:15, marginBottom:6}}>{ev.title}</div>
                          <div style={{display:'flex', gap:16, fontSize:12, color:'var(--text-muted)'}}>
                            <span>🕐 {formatTime(ev.start)} – {formatTime(ev.end)}</span>
                            {ev.location && <span>📍 {ev.location}</span>}
                          </div>
                          {ev.description && (
                            <div style={{fontSize:12, color:'var(--text-muted)', marginTop:6, fontStyle:'italic'}}>
                              {ev.description}
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding:'4px 10px', borderRadius:99, flexShrink:0,
                          background:`${c}22`, color:c,
                          fontSize:11, fontWeight:600, border:`1px solid ${c}44`
                        }}>
                          {duration(ev.start, ev.end)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
