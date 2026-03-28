import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CAT_COLORS = {
  transport: '#6366f1',
  food:      '#10b981',
  shopping:  '#f59e0b',
  utilities: '#06b6d4',
  travel:    '#8b5cf6',
  other:     '#64748b',
}

const CAT_ICONS = {
  transport: '🚗',
  food:      '🍔',
  shopping:  '🛍️',
  utilities: '⚡',
  travel:    '✈️',
  other:     '📦',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-sm)', padding:'10px 14px',
      backdropFilter:'blur(16px)',
    }}>
      <div style={{fontWeight:600, fontSize:13}}>{CAT_ICONS[d.payload.category] ?? '📦'} {d.payload.category}</div>
      <div style={{color: d.fill, fontSize:20, fontWeight:800, marginTop:4}}>
        ${d.value.toFixed(2)}
      </div>
    </div>
  )
}

export default function SpendingChart({ spending }) {
  if (!spending) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💳</div>
        No spending data yet. Run the pipeline first.
      </div>
    )
  }

  const { total, budget, by_category, transactions } = spending
  const pct = Math.min(100, (total / budget) * 100)

  const barData = Object.entries(by_category ?? {}).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
  }))

  return (
    <div className="fade-in">
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)', marginBottom:24}}>
        <MiniStat icon="💳" label="Total Spent" value={`$${total.toFixed(2)}`} color="teal" />
        <MiniStat icon="🎯" label="Budget"      value={`$${budget.toLocaleString()}`} color="purple" />
        <MiniStat
          icon={pct > 80 ? '⚠️' : '✅'}
          label="Budget Used"
          value={`${pct.toFixed(1)}%`}
          color={pct > 80 ? 'amber' : 'green'}
        />
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-header"><div className="card-title">📊 Spend by Category</div></div>
          <div className="card-body">
            {barData.length === 0
              ? <div className="empty-state" style={{padding:24}}>No data</div>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} barSize={32}>
                    <XAxis dataKey="category" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99,102,241,0.06)'}} />
                    <Bar dataKey="amount" radius={[6,6,0,0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={CAT_COLORS[d.category] ?? '#64748b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="card-header"><div className="card-title">📋 Category Breakdown</div></div>
          <div className="card-body">
            {barData.map(({ category, amount }) => {
              const pct2 = total > 0 ? (amount / total) * 100 : 0
              const color = CAT_COLORS[category] ?? '#64748b'
              return (
                <div key={category} style={{marginBottom:14}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6}}>
                    <span>{CAT_ICONS[category] ?? '📦'} {category}</span>
                    <span style={{fontWeight:600}}>${amount.toFixed(2)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{
                      width:`${pct2}%`, background:color,
                      boxShadow:`0 0 8px ${color}66`
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🧾 Recent Transactions</div>
          <span className="badge blue">{(transactions ?? []).length}</span>
        </div>
        <div className="card-body">
          {(transactions ?? []).length === 0
            ? <div className="empty-state" style={{padding:24}}>No transactions</div>
            : (
              <table className="spend-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style={{textAlign:'right'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(transactions ?? [])].reverse().map((t, i) => (
                    <tr key={i}>
                      <td style={{fontWeight:500, color:'var(--text-primary)'}}>
                        {t.vendor}
                      </td>
                      <td>
                        <span className={`mode-pill ${t.category}`} style={{
                          background: `${CAT_COLORS[t.category] ?? '#64748b'}22`,
                          color: CAT_COLORS[t.category] ?? '#94a3b8',
                        }}>
                          {CAT_ICONS[t.category] ?? '📦'} {t.category}
                        </span>
                      </td>
                      <td>{t.date}</td>
                      <td style={{textAlign:'right', fontWeight:700, color:'#22d3ee'}}>
                        ${t.amount.toFixed(2)}
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

function MiniStat({ icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
