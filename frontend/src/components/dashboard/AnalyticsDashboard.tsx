import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import type { AnalyticsOverview } from '../../types';
import { api } from '../../services/api';
import { MOCK_ANALYTICS } from './mockData';

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' };
const TOPIC_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#3b82f6','#84cc16','#e879f9','#fb923c'];

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: color || 'var(--color-text-primary)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-secondary)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color || 'var(--color-text-primary)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const LIVE_REFRESH_MS = 30_000;

export function AnalyticsDashboard({ mode = 'live' }: { mode?: 'demo' | 'live' }) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(LIVE_REFRESH_MS / 1000);

  const fetchLive = useCallback((d: number) => {
    api.getAnalytics(d)
      .then(res => { setData(res); setLastRefresh(new Date()); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(false);

    if (mode === 'demo') {
      setData(MOCK_ANALYTICS);
      return;
    }

    setLoading(true);
    fetchLive(days);

    const interval = setInterval(() => fetchLive(days), LIVE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [days, mode, fetchLive]);

  // Countdown ticker
  useEffect(() => {
    if (mode !== 'live') return;
    setCountdown(LIVE_REFRESH_MS / 1000);
    const tick = setInterval(() => setCountdown(c => c <= 1 ? LIVE_REFRESH_MS / 1000 : c - 1), 1000);
    return () => clearInterval(tick);
  }, [mode, days, lastRefresh]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
      Loading analytics…
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: 'var(--color-text-danger)', fontSize: 14 }}>Error: {error}</div>
  );

  if (!data) return null;

  if (mode === 'live' && data.total === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
      <div style={{ fontSize: 48 }}>💬</div>
      <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>No live data yet</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
        Start a conversation in the Messenger tab to see real-time analytics populate here.
        Every message is analyzed for sentiment, topics, and intent.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Try: "My card was declined"', 'Try: "How do I set up my wallet?"', 'Try: "Please add dark mode"'].map(s => (
          <div key={s} style={{
            fontSize: 12, padding: '6px 12px',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 20, color: 'var(--color-text-secondary)',
          }}>{s}</div>
        ))}
      </div>
    </div>
  );

  const sentimentScore = data.avg_sentiment;
  const sentimentLabel = sentimentScore > 0.2 ? '😊 Positive' : sentimentScore < -0.2 ? '😟 Negative' : '😐 Neutral';
  const sentimentColor = sentimentScore > 0.2 ? '#22c55e' : sentimentScore < -0.2 ? '#ef4444' : '#94a3b8';

  const pieData = data.sentiment_breakdown.map(s => ({
    name: s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1),
    value: s.count,
    color: SENTIMENT_COLORS[s.sentiment as keyof typeof SENTIMENT_COLORS] || '#94a3b8',
  }));

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 2px; }
        .day-btn { border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 12px; transition: all 0.15s; }
        .day-btn:hover { background: var(--color-background-secondary); }
        .day-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
        .complaint-row:hover { background: var(--color-background-secondary) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>Product Analytics</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {mode === 'live' ? (
              <span>
                Live data
                {lastRefresh && ` · Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                <span style={{ marginLeft: 6, color: 'var(--color-border-secondary)' }}>· refresh in {countdown}s</span>
              </span>
            ) : 'Demo data · sample insights'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'live' && (
            <button
              onClick={() => { setLoading(true); fetchLive(days); }}
              style={{
                border: '0.5px solid var(--color-border-secondary)', background: 'transparent',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
              }}
            >
              ↻ Refresh
            </button>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 14, 30, 90].map(d => (
              <button key={d} className={`day-btn${days === d ? ' active' : ''}`} onClick={() => setDays(d)}>
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards — row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
        <StatCard label="Total messages"    value={data.total.toLocaleString()} sub={`Last ${days} days`} />
        <StatCard label="Active users"      value={data.active_users} sub={`${data.returning_users} returning`} color="#6366f1" />
        <StatCard label="Avg response time" value={data.avg_latency_ms ? `${(data.avg_latency_ms / 1000).toFixed(1)}s` : '—'} sub="AI response latency" color="#06b6d4" />
        <StatCard label="Avg sentiment"     value={sentimentLabel} sub={`Score: ${sentimentScore.toFixed(2)}`} color={sentimentColor} />
      </div>

      {/* Stat cards — row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Complaints"        value={data.complaints} sub={`${data.total ? ((data.complaints/data.total)*100).toFixed(1) : 0}% of messages`} color="#ef4444" />
        <StatCard label="Feature requests"  value={data.feature_requests} sub="Ideas from users" color="#f59e0b" />
        <StatCard label="Positive messages" value={data.sentiment_breakdown.find(s => s.sentiment === 'positive')?.count ?? 0} sub="Happy users" color="#22c55e" />
        <StatCard label="Negative messages" value={data.sentiment_breakdown.find(s => s.sentiment === 'negative')?.count ?? 0} sub="Need attention" color="#ef4444" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Daily volume + sentiment */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>Daily message volume &amp; sentiment</SectionTitle>
          {data.daily_volume.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No data yet — start chatting to see trends
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.daily_volume} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Messages" />
                <Line type="monotone" dataKey="avg_sentiment" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Sentiment" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment pie */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>Sentiment breakdown</SectionTitle>
          {pieData.length === 0 || data.total === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Top topics */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>Top topics</SectionTitle>
          {data.top_topics.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No topics detected yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.top_topics} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]}>
                  {data.top_topics.map((_, i) => <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Intent breakdown */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>Message intent</SectionTitle>
          {data.by_intent.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No intent data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {data.by_intent.map((item, i) => {
                const pct = data.total ? Math.round((item.count / data.total) * 100) : 0;
                const icons: Record<string,string> = { complaint: '🔴', feature_request: '💡', question: '❓', support: '🛟', general: '💬' };
                return (
                  <div key={item.intent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                        {icons[item.intent] || '•'} {item.intent.replace('_',' ')}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-background-secondary)', borderRadius: 3 }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: TOPIC_COLORS[i % TOPIC_COLORS.length], transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Peak hours + returning users */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Peak hours */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>Peak activity hours</SectionTitle>
          {data.peak_hours.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.peak_hours} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false}
                  tickFormatter={h => h % 4 === 0 ? `${h}:00` : ''} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} formatter={(v: any, n: any) => [v, 'Messages']} labelFormatter={h => `${h}:00 – ${h}:59`} />
                <Bar dataKey="count" name="Messages" radius={[3, 3, 0, 0]}>
                  {data.peak_hours.map((entry, i) => (
                    <Cell key={i} fill={entry.count === Math.max(...data.peak_hours.map(p => p.count)) ? '#6366f1' : '#c7d2fe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User retention */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' }}>
          <SectionTitle>User retention</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            {[
              { label: 'Total active users',    value: data.active_users,    color: '#6366f1' },
              { label: 'Returning users',        value: data.returning_users, color: '#22c55e' },
              { label: 'New users',              value: Math.max(0, data.active_users - data.returning_users), color: '#06b6d4' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-background-secondary)', borderRadius: 3 }}>
                  <div style={{
                    height: 6, borderRadius: 3,
                    width: data.active_users ? `${Math.round((item.value / data.active_users) * 100)}%` : '0%',
                    background: item.color, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent complaints */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Recent complaints &amp; issues</span>
          <button
            onClick={() => {
              const rows = [['Time','User','Sentiment','Topics','Message']];
              data.recent_complaints.forEach(c => {
                const topics = (() => { try { return JSON.parse(c.topics).join('; '); } catch { return ''; } })();
                rows.push([new Date(c.analyzed_at).toLocaleString(), c.user_id, c.sentiment, topics, `"${c.content.replace(/"/g, '""')}"`]);
              });
              const csv = rows.map(r => r.join(',')).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              a.download = `complaints-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            style={{
              fontSize: 12, padding: '4px 10px',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 6, background: 'transparent',
              color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ↓ Export CSV
          </button>
        </div>
        {data.recent_complaints.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
            🎉 No complaints in this period
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '0 8px 8px 0', fontWeight: 500 }}>Message</th>
                <th style={{ textAlign: 'left', padding: '0 8px 8px', fontWeight: 500, width: 90 }}>Sentiment</th>
                <th style={{ textAlign: 'left', padding: '0 8px 8px', fontWeight: 500, width: 100 }}>Topics</th>
                <th style={{ textAlign: 'right', padding: '0 0 8px 8px', fontWeight: 500, width: 90 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_complaints.map(c => {
                const topics = (() => { try { return JSON.parse(c.topics) as string[]; } catch { return []; } })();
                return (
                  <tr key={c.id} className="complaint-row" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '10px 8px 10px 0', color: 'var(--color-text-primary)', maxWidth: 320 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 11,
                        background: c.sentiment === 'negative' ? '#fee2e2' : '#fef9c3',
                        color: c.sentiment === 'negative' ? '#991b1b' : '#854d0e',
                      }}>{c.sentiment}</span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)', fontSize: 11 }}>
                      {topics.slice(0, 2).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '10px 0 10px 8px', textAlign: 'right', color: 'var(--color-text-tertiary)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {new Date(c.analyzed_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
