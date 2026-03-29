import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, TrendingDown, Loader2 } from 'lucide-react';

export default function CarbonView() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/carbon-intelligence')
      .then(res => res.json())
      .then(data => {
        setWeeklyData(data.weekly || []);
        setAnalysis(data.analysis || "");
        setLoading(false);
      })
      .catch(err => {
        console.error("Carbon fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="empty-state-centered">
      <Loader2 className="spinning text-[#ff69b4]" size={40} />
    </div>
  );

  return (
    <div className="pro-container">
      <section className="dashboard-half">
        <header className="section-header">
          <div className="title-group">
            <Leaf size={20} className="accent-icon" />
            <h2 className="pro-title">CO₂ Emission Trends</h2>
          </div>
        </header>

        <div className="content-card carbon-chart-card" style={{ height: '350px', padding: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff69b4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff69b4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2229', border: '1px solid #2a303a', borderRadius: '8px' }}
                itemStyle={{ color: '#ff69b4' }}
              />
              <Area
                type="monotone"
                dataKey="kg"
                stroke="#ff69b4"
                fillOpacity={1}
                fill="url(#colorKg)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-half mt-6">
        <header className="section-header">
          <div className="title-group">
            <TrendingDown size={20} className="accent-icon" />
            <h2 className="pro-title">AI Carbon Intelligence</h2>
          </div>
        </header>
        <div className="content-card ai-blurb-card p-6">
          <p className="ai-text-blurb text-[#94a3b8] leading-relaxed">
            {analysis || "Analysis pending synchronization..."}
          </p>
        </div>
      </section>
    </div>
  );
}