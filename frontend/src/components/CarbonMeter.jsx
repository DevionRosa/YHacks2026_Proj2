import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const MODE_COLORS = {
  flight:    '#6366f1',
  gas:       '#f59e0b',
  rideshare: '#06b6d4',
  car:       '#ef4444',
  train:     '#10b981',
  other:     '#64748b',
}
const MODE_ICONS = {
  flight:    '✈️',
  gas:       '⛽',
  rideshare: '🚖',
  car:       '🚗',
  train:     '🚂',
  other:     '🌍',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-sm)', padding:'10px 14px',
    }}>
      <div style={{fontWeight:600, fontSize:13}}>{MODE_ICONS[d.name] ?? '🌍'} {d.name}</div>
      <div style={{color:d.payload.fill, fontSize:20, fontWeight:800, marginTop:4}}>
        {d.value.toFixed(2)} kg CO₂
      </div>
    </div>
  )
}

// Circular gauge SVG
function CO2Gauge({ pct, totalKg, targetKg }) {
  const r = 80
  const circ = 2 * Math.PI * r
  const filled = circ * Math.min(pct / 100, 1)
  const color = pct > 90 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981'

  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0'}}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        {/* Track */}
        <circle cx={100} cy={100} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14} />
        {/* Fill */}
        <circle cx={100} cy={100} r={r}
          fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{filter:`drop-shadow(0 0 8px ${color}88)`, transition:'stroke-dasharray 1s ease'}}
        />
        {/* Center text */}
        <text x={100} y={88} textAnchor="middle" fill={color}
          fontSize="26" fontWeight="800" fontFamily="Inter">
          {totalKg.toFixed(1)}
        </text>
        <text x={100} y={108} textAnchor="middle" fill="#94a3b8"
          fontSize="12" fontFamily="Inter">
          kg CO₂
        </text>
        <text x={100} y={126} textAnchor="middle" fill="#475569"
          fontSize="11" fontFamily="Inter">
          of {targetKg} kg target
        </text>
      </svg>
      <div style={{
        marginTop:-8, padding:'4px 16px', borderRadius:99,
        background:`${color}22`, border:`1px solid ${color}44`,
        color, fontSize:13, fontWeight:700
      }}>
        {pct.toFixed(1)}% of monthly target
      </div>
    </div>
  )
}

export default function CarbonMeter({ carbon, stats }) {
  if (!carbon) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🌱</div>
        No carbon data yet. Run the pipeline first.
      </div>
    )
  }

  const { total_kg, by_mode, entries } = carbon
  const target = stats?.co2_target_kg ?? 200
  const pct    = Math.min(100, (total_kg / target) * 100)

  const pieData = Object.entries(by_mode ?? {}).map(([mode, kg]) => ({
    name: mode,
    value: kg,
    fill: MODE_COLORS[mode] ?? '#64748b',
  }))

  const tips = [
    { icon: '✈️', tip: 'Consider direct flights — they use ~20% less fuel than connecting routes.' },
    { icon: '🚲', tip: 'Cycling 3x per week for short trips could save ~15 kg CO₂/month.' },
    { icon: '🔋', tip: 'Switching to an EV could cut your transport emissions by ~60%.' },
    { icon: '🌳', tip: 'Offset your flight emissions for ~$10–25 via certified carbon programs.' },
  ]

  return (
    <div className="fade-in">
      <div className="grid-2" style={{marginBottom:24}}>
        {/* Gauge */}
        <div className="card" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div className="card-header" style={{width:'100%'}}>
            <div className="card-title">🌱 Monthly CO₂ Gauge</div>
          </div>
          <div className="card-body" style={{width:'100%'}}>
            <CO2Gauge pct={pct} totalKg={total_kg} targetKg={target} />

            <div style={{marginTop:8}}>
              {Object.entries(by_mode ?? {}).map(([mode, kg]) => {
                const modePct = total_kg > 0 ? (kg / total_kg) * 100 : 0
                const color = MODE_COLORS[mode] ?? '#64748b'
                return (
                  <div key={mode} style={{marginBottom:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5}}>
                      <span>{MODE_ICONS[mode] ?? '🌍'} {mode}</span>
                      <span style={{fontWeight:600}}>{kg.toFixed(2)} kg</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{
                        width:`${modePct}%`, background:color,
                        boxShadow:`0 0 8px ${color}66`
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pie + tips */}
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          <div className="card">
            <div className="card-header"><div className="card-title">📊 Breakdown by Mode</div></div>
            <div className="card-body">
              {pieData.length === 0
                ? <div className="empty-state" style={{padding:24}}>No data</div>
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                        paddingAngle={3} strokeWidth={0}>
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.fill}
                            style={{filter:`drop-shadow(0 0 6px ${d.fill}66)`}} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">💡 Eco Tips</div></div>
            <div className="card-body" style={{display:'flex', flexDirection:'column', gap:10}}>
              {tips.slice(0, 3).map((t, i) => (
                <div key={i} style={{
                  display:'flex', gap:12, padding:'10px 14px',
                  background:'rgba(16,185,129,0.05)',
                  border:'1px solid rgba(16,185,129,0.12)',
                  borderRadius:'var(--radius-sm)',
                  fontSize:13, color:'var(--text-secondary)', lineHeight:1.5,
                }}>
                  <span style={{fontSize:18, flexShrink:0}}>{t.icon}</span>
                  {t.tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emissions log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Emission Events</div>
          <span className="badge green">{(entries ?? []).length} logged</span>
        </div>
        <div className="card-body">
          {(entries ?? []).length === 0
            ? <div className="empty-state" style={{padding:24}}>No emissions logged</div>
            : (
              <table className="spend-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th style={{textAlign:'right'}}>CO₂ (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(entries ?? [])].reverse().map((e, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`mode-pill ${e.mode}`}>
                          {MODE_ICONS[e.mode] ?? '🌍'} {e.mode}
                        </span>
                      </td>
                      <td style={{color:'var(--text-secondary)', maxWidth:300,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {e.description || '—'}
                      </td>
                      <td>{e.date}</td>
                      <td style={{textAlign:'right', fontWeight:700,
                        color: e.co2_kg > 50 ? '#ef4444' : e.co2_kg > 20 ? '#f59e0b' : '#34d399'}}>
                        {e.co2_kg.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  )
}
