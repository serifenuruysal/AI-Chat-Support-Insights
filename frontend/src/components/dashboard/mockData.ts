import type { AnalyticsOverview } from '../../types';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const MOCK_ANALYTICS: AnalyticsOverview = {
  total: 284,
  complaints: 38,
  feature_requests: 52,
  avg_sentiment: -0.12,
  avg_latency_ms: 820,
  active_users: 20,
  returning_users: 8,
  sentiment_breakdown: [
    { sentiment: 'positive', count: 74 },
    { sentiment: 'neutral',  count: 148 },
    { sentiment: 'negative', count: 62 },
  ],
  by_intent: [
    { intent: 'general',         count: 94 },
    { intent: 'question',        count: 71 },
    { intent: 'feature_request', count: 52 },
    { intent: 'complaint',       count: 38 },
    { intent: 'support',         count: 29 },
  ],
  top_topics: [
    { topic: 'wallet',       count: 88, sentiment_avg: -0.18 },
    { topic: 'payment_card', count: 64, sentiment_avg: -0.31 },
    { topic: 'kyc',          count: 47, sentiment_avg: -0.09 },
    { topic: 'marketplace',  count: 39, sentiment_avg:  0.21 },
    { topic: 'performance',  count: 28, sentiment_avg: -0.44 },
    { topic: 'onboarding',   count: 22, sentiment_avg:  0.15 },
    { topic: 'messenger',    count: 18, sentiment_avg: -0.07 },
  ],
  daily_volume: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    count: 4 + Math.floor(Math.sin(i * 0.4) * 4 + Math.random() * 8),
    avg_sentiment: parseFloat((-0.3 + Math.sin(i * 0.3) * 0.25 + Math.random() * 0.1).toFixed(3)),
  })),
  peak_hours: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: h >= 9 && h <= 18 ? 8 + Math.floor(Math.sin((h - 9) * 0.5) * 6 + Math.random() * 4) : Math.floor(Math.random() * 3),
  })),
  recent_complaints: [
    { id: '1', user_id: 'user-004', sentiment: 'negative', topics: '["wallet","performance"]',    content: 'My transaction has been stuck for 3 hours and I cannot see my funds',      analyzed_at: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: '2', user_id: 'user-011', sentiment: 'negative', topics: '["payment_card"]',            content: 'Payment card keeps getting declined even though I have enough balance',   analyzed_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '3', user_id: 'user-007', sentiment: 'negative', topics: '["kyc"]',                     content: 'KYC verification keeps failing, my document is clearly valid',           analyzed_at: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: '4', user_id: 'user-019', sentiment: 'negative', topics: '["wallet","payment_card"]',   content: 'App crashed when I tried to send USDC and now my balance is wrong',      analyzed_at: new Date(Date.now() - 6 * 3600000).toISOString() },
    { id: '5', user_id: 'user-002', sentiment: 'negative', topics: '["messenger"]',               content: 'Messages just stay at pending forever, messenger is completely broken',  analyzed_at: new Date(Date.now() - 9 * 3600000).toISOString() },
    { id: '6', user_id: 'user-014', sentiment: 'negative', topics: '["payment_card"]',            content: 'My card was charged twice for the same purchase, this is unacceptable',  analyzed_at: new Date(Date.now() - 12 * 3600000).toISOString() },
  ],
};
