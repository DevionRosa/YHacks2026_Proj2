import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const MODE_COLORS = {
  flight: '#3b5bdb',
  gas: '#d97706',
  rideshare: '#0891b2',
  car: '#dc2626',
  train: '#0d9488',
  other: '#64748b',
}

const MODE_LABEL = {
  flight: 'Flight',
  gas: 'Gas',
  rideshare: 'Rideshare',
  car: 'Car',
  train: 'Train',
  other: 'Other',
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{MODE_LABEL[d.name] ?? d.name}</div>
      <div className="chart-tooltip-value">{Number(d.value).toFixed(2)} kg CO₂</div>
    </div>
  )
}

function Gauge({ pct, totalKg, targetKg }) {
  const r = 72
  const circ = 2 * Math.PI * r
  const filled = circ * Math.min(pct / 100, 1)
  const color = pct > 90 ? '#dc2626' : pct > 65 ? '#d97706' : '#0d9488'

  return (
    <div className="gauge-wrap">
      <svg width={180} height={180} viewBox="0 0 180 180" aria-hidden>
        <circle cx={90} cy={90} r={r} fill="none" stroke="#e8ecf4" strokeWidth={12} />
        <circle
          cx={90}
          cy={90}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
        <text x={90} y={82} textAnchor="middle" fill={color} fontSize="22" fontWeight="700">
          {totalKg.toFixed(1)}
        </text>
        <text x={90} y={100} textAnchor="middle" fill="#64748b" fontSize="11">
          kg CO₂
        </text>
        <text x={90} y={116} textAnchor="middle" fill="#94a3b8" fontSize="10">
          of {targetKg} kg goal
        </text>
      </svg>
      <p className="gauge-caption">{pct.toFixed(1)}% of monthly goal</p>
    </div>
  )
}

const TIPS = [
  'Direct flights often use less fuel than multi-stop routes.',
  'Short trips by bike or transit add up to real savings.',
  'Certified offsets can balance unavoidable travel emissions.',
]

export default function CarbonView({ carbon, stats }) {
  if (!carbon) {
    return (
      <div className="panel panel-center empty-panel">
        <p className="empty-title">No carbon data</p>
        <p className="muted">Run the assistant to estimate footprint.</p>
      </div>
    )
  }

  const { total_kg, by_mode, entries } = carbon
  const target = stats?.co2_target_kg ?? 200
  const pct = Math.min(100, (total_kg / target) * 100)

  const pieData = Object.entries(by_mode ?? {}).map(([mode, kg]) => ({
    name: mode,
    value: kg,
    fill: MODE_COLORS[mode] ?? '#64748b',
  }))

  return (
    <div className="stack">
      <div className="two-col">
        <section className="panel">
          <h2 className="section-title">This month</h2>
          <Gauge pct={pct} totalKg={total_kg} targetKg={target} />
          <div className="panel-pad">
            {Object.entries(by_mode ?? {}).map(([mode, kg]) => {
              const modePct = total_kg > 0 ? (kg / total_kg) * 100 : 0
              const color = MODE_COLORS[mode] ?? '#64748b'
              return (
                <div key={mode} className="progress-block">
                  <div className="progress-head">
                    <span>{MODE_LABEL[mode] ?? mode}</span>
                    <span className="small">{kg.toFixed(2)} kg</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${modePct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="stack stack-tight">
          <section className="panel">
            <h2 className="section-title">By travel mode</h2>
            <div className="chart-wrap chart-wrap-short">
              {pieData.length === 0 ? (
                <p className="muted panel-pad">No split yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="panel">
            <h2 className="section-title">Quick tips</h2>
            <ul className="tip-list">
              {TIPS.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="section-title">Emission events</h2>
          <span className="badge badge-green">{(entries ?? []).length}</span>
        </div>
        {(entries ?? []).length === 0 ? (
          <p className="muted panel-pad">No events logged.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Details</th>
                  <th>Date</th>
                  <th className="cell-right">CO₂ (kg)</th>
                </tr>
              </thead>
              <tbody>
                {[...(entries ?? [])].reverse().map((e, i) => (
                  <tr key={i}>
                    <td>
                      <span className="tag">{MODE_LABEL[e.mode] ?? e.mode}</span>
                    </td>
                    <td className="muted cell-clip">{e.description || '—'}</td>
                    <td className="muted">{e.date}</td>
                    <td className="cell-right cell-strong">{e.co2_kg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
