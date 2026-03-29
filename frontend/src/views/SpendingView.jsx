import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, CreditCard, ArrowUpRight } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="shadcn-chart-tooltip">
        <p className="tooltip-label">{payload[0].payload.category}</p>
        <p className="tooltip-value">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function SpendingView() {
  const [data, setData] = useState({ graph_data: [], transactions: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/spending')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(err => console.error("Spending fetch error:", err));
  }, []);

  if (loading) return <div className="p-8 text-[#ff69b4]">Analyzing finances...</div>;

  return (
    <div className="pro-container spending-layout-grid">
      <section className="dashboard-half">
        <header className="section-header">
          <div className="title-group">
            <Wallet size={20} className="accent-icon" />
            <h2 className="pro-title">Spending Breakdown</h2>
          </div>
          <div className="total-badge">${data.total.toFixed(2)}</div>
        </header>

        <div className="content-card shadcn-card h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.graph_data} layout="vertical" margin={{ left: 40, right: 30 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="category"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 105, 180, 0.05)' }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                {data.graph_data.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#ff69b4' : '#2a303a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="content-card mt-6 bg-gradient-to-r from-[#1e2229] to-transparent border-l-2 border-[#ff69b4] p-4">
          <h4 className="text-[#ff69b4] text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <ArrowUpRight size={14} /> Finance Insight
          </h4>
          <p className="text-sm text-[#94a3b8]">
            Your largest expense this month is <strong>{data.graph_data[0]?.category || 'N/A'}</strong>.
          </p>
        </div>
      </section>

      <section className="dashboard-half">
        <header className="section-header">
          <div className="title-group">
            <CreditCard size={20} className="accent-icon" />
            <h2 className="pro-title">Transaction History</h2>
          </div>
        </header>

        <div className="content-card table-card custom-scrollbar overflow-y-auto max-h-[500px]">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t, i) => (
                <tr key={i} className="table-row-hover">
                  <td>
                    <div className="vendor-cell">
                      <span className="vendor-name">{t.vendor}</span>
                      <span className="vendor-date">{t.date}</span>
                    </div>
                  </td>
                  <td><span className="cat-tag">{t.category}</span></td>
                  <td className="text-right font-bold text-[#f1f5f9]">${t.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}