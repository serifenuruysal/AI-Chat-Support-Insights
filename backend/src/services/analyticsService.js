const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// ─── Keyword dictionaries ──────────────────────────────────────────────────
const SENTIMENT_POSITIVE = ['great', 'love', 'excellent', 'perfect', 'awesome', 'helpful', 'thanks', 'thank', 'good', 'nice', 'easy', 'fast', 'works', 'solved', 'fixed'];
const SENTIMENT_NEGATIVE = ['broken', 'bug', 'error', 'fail', 'failed', 'issue', 'problem', 'wrong', 'stuck', 'crash', 'slow', 'not working', 'cannot', "can't", 'unable', 'lost', 'missing', 'frustrat', 'disappoint', 'terrible', 'useless', 'awful'];
const COMPLAINT_SIGNALS  = ['not working', "doesn't work", 'broken', 'bug', 'crash', 'error', 'lost funds', 'charged twice', 'wrong amount', 'never received', 'still waiting'];
const FEATURE_SIGNALS    = ['would be nice', 'should have', 'wish', 'feature request', 'can you add', 'please add', 'support for', 'integrate', 'when will'];

const TOPIC_KEYWORDS = {
  attention_marketplace: ['attention', 'marketplace', 'proof of attention', 'poa', 'earn', 'earning', 'influencer', 'creator', 'sponsored', 'campaign', 'paid message', 'message price', 'inbox price', 'attention price'],
  alem_token:            ['alem', '$alem', 'token', 'listing', 'exchange', 'tier 1', 'tier 2', 'pre-listing', 'investment', 'tokenomics', 'reward'],
  kyc:                   ['kyc', 'verify', 'verification', 'identity', 'document', 'passport', 'id', 'approved', 'rejected', 'pending', 'resubmit', 'id check'],
  trading:               ['trade', 'trading', 'stocks', 'crypto', 'token', 'buy', 'sell', 'market', 'order', 'portfolio', 'checkout', 'purchase', 'asset'],
  p2p_transfers:         ['p2p', 'peer to peer', 'transfer', 'send money', 'receive money', 'qr code', '@handle', 'contact', 'memo', 'recurring', 'instant transfer'],
  borderless_payments:   ['borderless', 'cross-border', 'international', 'payment', 'exchange rate', 'low fee', 'settlement', 'corridor', 'foreign', 'currency', 'wire'],
  partner_banks:         ['bank', 'banking', 'partner bank', 'bank account', 'open account', 'onboarding', 'bank onboarding', 'account status', 'bank transfer'],
  revenue_sharing:       ['revenue', 'revenue sharing', 'earnings split', 'payout', 'creator share', 'percentage', 'split', 'commission', 'creator earnings'],
  dapp_wallet:           ['dapp', 'wallet', 'web3', 'walletconnect', 'defi', 'protocol', 'private key', 'seed phrase', 'connect wallet', 'interoperability', 'smart contract', 'blockchain'],
  visa_card:             ['visa', 'card', 'debit card', 'physical card', 'virtual card', 'card activation', 'card declined', 'spending limit', 'contactless'],
  city_events:           ['event', 'city', 'tour', 'warsaw', 'berlin', 'madrid', 'sao paulo', 'buenos aires', 'medellin', 'mexico city', 'lagos', 'nairobi', 'cape town', 'jakarta', 'manila', 'ho chi minh', 'bangkok', 'dubai', 'conference', 'global'],
  value_transfer:        ['gift', 'stock gift', 'birthday', 'netflix stock', 'social post payment', 'post money', 'value transfer', 'send stock'],
  messenger:             ['message', 'chat', 'dm', 'encrypted', 'inbox', 'notification', 'video call', 'call price', 'paid call', 'read receipt'],
  social:                ['feed', 'post', 'follow', 'like', 'comment', 'profile', 'share', 'content', 'creator'],
  onboarding:            ['signup', 'register', 'login', 'account', 'password', 'setup', 'getting started', 'new user', 'founding creator'],
  performance:           ['slow', 'lag', 'loading', 'freeze', 'crash', 'battery', 'memory', 'bug', 'not working'],
};

// ─── Analysis helpers ──────────────────────────────────────────────────────
function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  SENTIMENT_POSITIVE.forEach(w => { if (lower.includes(w)) score += 1; });
  SENTIMENT_NEGATIVE.forEach(w => { if (lower.includes(w)) score -= 1.5; });
  const normalized = Math.max(-1, Math.min(1, score / 3));
  const sentiment = normalized > 0.2 ? 'positive' : normalized < -0.2 ? 'negative' : 'neutral';
  return { sentiment, sentiment_score: parseFloat(normalized.toFixed(3)) };
}

function extractTopics(text) {
  const lower = text.toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([topic]) => topic);
}

function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'do', 'i', 'my', 'me', 'we', 'you', 'how', 'what', 'why', 'can', 'have', 'has', 'this', 'that', 'with', 'for', 'and', 'or', 'but', 'not']);
  return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w)).slice(0, 8);
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  if (COMPLAINT_SIGNALS.some(s => lower.includes(s))) return 'complaint';
  if (FEATURE_SIGNALS.some(s => lower.includes(s))) return 'feature_request';
  if (['how', 'what', 'where', 'when', 'why', 'explain'].some(w => lower.startsWith(w))) return 'question';
  if (['help', 'support', 'assist', 'trouble'].some(w => lower.includes(w))) return 'support';
  return 'general';
}

// ─── Main analysis ─────────────────────────────────────────────────────────
async function analyzeMessage({ messageId, conversationId, userId, content }) {
  const lower = content.toLowerCase();
  const { sentiment, sentiment_score } = analyzeSentiment(content);
  const topics = extractTopics(content);
  const keywords = extractKeywords(content);
  const intent = detectIntent(content);
  const is_complaint = COMPLAINT_SIGNALS.some(s => lower.includes(s));
  const is_feature_request = FEATURE_SIGNALS.some(s => lower.includes(s));

  const pool = getDb();

  await pool.query(
    `INSERT INTO message_analytics
     (id, message_id, conversation_id, user_id, sentiment, sentiment_score, topics, intent, is_complaint, is_feature_request, keywords)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO NOTHING`,
    [uuidv4(), messageId, conversationId, userId, sentiment, sentiment_score,
     JSON.stringify(topics), intent, is_complaint, is_feature_request, JSON.stringify(keywords)]
  );

  // Upsert topic summary — atomic, fixes race condition
  for (const topic of topics) {
    await pool.query(
      `INSERT INTO topic_summary (topic, count, sentiment_avg, last_seen, sample_messages)
       VALUES ($1, 1, $2, NOW(), $3::jsonb)
       ON CONFLICT (topic) DO UPDATE SET
         count         = topic_summary.count + 1,
         sentiment_avg = ROUND(((topic_summary.sentiment_avg * topic_summary.count) + $2) / (topic_summary.count + 1)::numeric, 3),
         last_seen     = NOW(),
         sample_messages = CASE
           WHEN jsonb_array_length(topic_summary.sample_messages) < 5
           THEN topic_summary.sample_messages || $3::jsonb
           ELSE topic_summary.sample_messages
         END`,
      [topic, sentiment_score, JSON.stringify([content.slice(0, 120)])]
    );
  }

  return { sentiment, sentiment_score, topics, keywords, intent, is_complaint, is_feature_request };
}

// ─── Analytics queries ─────────────────────────────────────────────────────
async function getOverviewStats(days = 30) {
  const pool = getDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [
    total, sentimentBreakdown, complaints, features, avgScore,
    byIntent, topTopics, dailyVolume, recentComplaints,
    avgLatency, activeUsers, peakHours, returningUsers,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int as n FROM message_analytics WHERE analyzed_at >= $1', [since]),
    pool.query('SELECT sentiment, COUNT(*)::int as count FROM message_analytics WHERE analyzed_at >= $1 GROUP BY sentiment', [since]),
    pool.query('SELECT COUNT(*)::int as n FROM message_analytics WHERE is_complaint = TRUE AND analyzed_at >= $1', [since]),
    pool.query('SELECT COUNT(*)::int as n FROM message_analytics WHERE is_feature_request = TRUE AND analyzed_at >= $1', [since]),
    pool.query('SELECT AVG(sentiment_score) as avg FROM message_analytics WHERE analyzed_at >= $1', [since]),
    pool.query('SELECT intent, COUNT(*)::int as count FROM message_analytics WHERE analyzed_at >= $1 GROUP BY intent ORDER BY count DESC', [since]),
    pool.query('SELECT topic, count, sentiment_avg FROM topic_summary ORDER BY count DESC LIMIT 10'),
    pool.query(`
      SELECT DATE(analyzed_at) as date, COUNT(*)::int as count, ROUND(AVG(sentiment_score)::numeric, 3) as avg_sentiment
      FROM message_analytics WHERE analyzed_at >= $1
      GROUP BY DATE(analyzed_at) ORDER BY date ASC`, [since]),
    pool.query(`
      SELECT ma.id, ma.user_id, ma.sentiment, ma.topics, ma.keywords, ma.analyzed_at, m.content
      FROM message_analytics ma
      JOIN messages m ON m.id = ma.message_id
      WHERE ma.is_complaint = TRUE ORDER BY ma.analyzed_at DESC LIMIT 20`),
    pool.query(`
      SELECT ROUND(AVG(latency_ms)) as avg FROM messages
      WHERE role = 'assistant' AND latency_ms IS NOT NULL AND created_at >= $1`, [since]),
    pool.query(`
      SELECT COUNT(DISTINCT user_id)::int as n FROM message_analytics WHERE analyzed_at >= $1`, [since]),
    pool.query(`
      SELECT EXTRACT(HOUR FROM analyzed_at)::int as hour, COUNT(*)::int as count
      FROM message_analytics WHERE analyzed_at >= $1
      GROUP BY hour ORDER BY hour ASC`, [since]),
    pool.query(`
      SELECT COUNT(*)::int as n FROM (
        SELECT user_id FROM conversations WHERE created_at >= $1
        GROUP BY user_id HAVING COUNT(*) > 1
      ) sub`, [since]),
  ]);

  return {
    total: total.rows[0].n,
    complaints: complaints.rows[0].n,
    feature_requests: features.rows[0].n,
    avg_sentiment: parseFloat((avgScore.rows[0].avg || 0).toFixed(3)),
    avg_latency_ms: avgLatency.rows[0].avg || 0,
    active_users: activeUsers.rows[0].n,
    returning_users: returningUsers.rows[0].n,
    sentiment_breakdown: sentimentBreakdown.rows,
    by_intent: byIntent.rows,
    top_topics: topTopics.rows,
    daily_volume: dailyVolume.rows,
    recent_complaints: recentComplaints.rows,
    peak_hours: peakHours.rows,
  };
}

module.exports = { analyzeMessage, getOverviewStats };
