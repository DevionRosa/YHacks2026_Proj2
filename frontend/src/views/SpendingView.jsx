import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const CAT_COLORS = {
  transport: '#3b5bdb',
  food: '#0d9488',
  shopping: '#d97706',
  utilities: '#0891b2',
  travel: '#7c3aed',
  other: '#64748b',
}

const CAT_LABEL = {
  transport: 'Transport',
  food: 'Food',
  shopping: 'Shopping',
  utilities: 'Utilities',
  travel: 'Travel',
  other: 'Other',
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{CAT_LABEL[d.category] ?? d.category}</div>
      <div className="chart-tooltip-value">${Number(d.amount).toFixed(2)}</div>
    </div>
  )
}

export default function SpendingView({ spending }) {
  if (!spending) {
    return (
      <div className="panel panel-center empty-panel">
        <p className="empty-title">No spending data</p>
        <p className="muted">Run the assistant to load transactions.</p>
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
    <div className="stack">
      <section className="panel">
        <h2 className="section-title">Summary</h2>
        <div className="stat-row stat-row-3">
          <div className="stat-block">
            <div className="stat-block-value">${total.toFixed(2)}</div>
            <div className="stat-block-label">Total spent</div>
          </div>
          <div className="stat-block">
            <div className="stat-block-value">${budget.toLocaleString()}</div>
            <div className="stat-block-label">Budget</div>
          </div>
          <div className="stat-block">
            <div className="stat-block-value">{pct.toFixed(1)}%</div>
            <div className="stat-block-label">Of budget used</div>
          </div>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2 className="section-title">By category</h2>
          <div className="chart-wrap">
            {barData.length === 0 ? (
              <p className="muted panel-pad">No breakdown yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barSize={36}>
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,91,219,0.06)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={CAT_COLORS[d.category] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title">Breakdown</h2>
          <div className="panel-pad">
            {barData.map(({ category, amount }) => {
              const pctRow = total > 0 ? (amount / total) * 100 : 0
              const color = CAT_COLORS[category] ?? '#64748b'
              return (
                <div key={category} className="progress-block">
                  <div className="progress-head">
                    <span>{CAT_LABEL[category] ?? category}</span>
                    <span className="small">${amount.toFixed(2)}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pctRow}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="section-title">Recent transactions</h2>
          <span className="badge">{(transactions ?? []).length}</span>
        </div>
        {(transactions ?? []).length === 0 ? (
          <p className="muted panel-pad">No transactions listed.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="cell-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...(transactions ?? [])].reverse().map((t, i) => (
                  <tr key={i}>
                    <td className="cell-strong">{t.vendor}</td>
                    <td>
                      <span
                        className="tag"
                        style={{
                          background: `${CAT_COLORS[t.category] ?? '#64748b'}18`,
                          color: CAT_COLORS[t.category] ?? '#475569',
                        }}
                      >
                        {CAT_LABEL[t.category] ?? t.category}
                      </span>
                    </td>
                    <td className="muted">{t.date}</td>
                    <td className="cell-right cell-strong">${t.amount.toFixed(2)}</td>
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
