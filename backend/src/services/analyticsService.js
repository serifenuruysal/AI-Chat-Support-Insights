/**
 * Analytics service.
 * Analyzes user messages for: sentiment, topics, intent, complaints, feature requests.
 * Uses a lightweight rule-based engine by default (no API calls).
 */

const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

// ─── Keyword dictionaries ──────────────────────────────────────────────────
const SENTIMENT_POSITIVE = ['great', 'love', 'excellent', 'perfect', 'awesome', 'helpful', 'thanks', 'thank', 'good', 'nice', 'easy', 'fast', 'works', 'solved', 'fixed'];
const SENTIMENT_NEGATIVE = ['broken', 'bug', 'error', 'fail', 'failed', 'issue', 'problem', 'wrong', 'stuck', 'crash', 'slow', 'not working', 'cannot', "can't", 'unable', 'lost', 'missing', 'frustrat', 'disappoint', 'terrible', 'useless', 'awful'];
const COMPLAINT_SIGNALS  = ['not working', "doesn't work", 'broken', 'bug', 'crash', 'error', 'lost funds', 'charged twice', 'wrong amount', 'never received', 'still waiting'];
const FEATURE_SIGNALS    = ['would be nice', 'should have', 'wish', 'feature request', 'can you add', 'please add', 'support for', 'integrate', 'when will'];

const TOPIC_KEYWORDS = {
  wallet:       ['wallet', 'solana', 'sol', 'private key', 'seed phrase', 'balance', 'address', 'transaction', 'send', 'receive', 'transfer'],
  payment_card: ['card', 'payment', 'visa', 'mastercard', 'checkout', 'purchase', 'declined', 'spend', 'limit'],
  kyc:          ['kyc', 'verify', 'verification', 'identity', 'document', 'passport', 'id', 'approved', 'rejected'],
  messenger:    ['message', 'chat', 'dm', 'encrypted', 'inbox', 'notification', 'read receipt'],
  marketplace:  ['marketplace', 'attention', 'earn', 'usdc', 'brand', 'sponsored', 'campaign', 'influencer'],
  social:       ['feed', 'post', 'follow', 'like', 'comment', 'profile', 'share'],
  onboarding:   ['signup', 'register', 'login', 'account', 'password', 'setup', 'getting started', 'new user'],
  performance:  ['slow', 'lag', 'loading', 'freeze', 'crash', 'battery', 'memory'],
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
  const is_complaint = COMPLAINT_SIGNALS.some(s => lower.includes(s)) ? 1 : 0;
  const is_feature_request = FEATURE_SIGNALS.some(s => lower.includes(s)) ? 1 : 0;

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT OR REPLACE INTO message_analytics
    (id, message_id, conversation_id, user_id, sentiment, sentiment_score, topics, intent, is_complaint, is_feature_request, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, messageId, conversationId, userId, sentiment, sentiment_score,
    JSON.stringify(topics), intent, is_complaint, is_feature_request, JSON.stringify(keywords));

  // Update topic summary
  topics.forEach(topic => {
    const existing = db.prepare('SELECT * FROM topic_summary WHERE topic = ?').get(topic);
    if (existing) {
      const samples = JSON.parse(existing.sample_messages || '[]');
      if (samples.length < 5) samples.push(content.slice(0, 120));
      const newAvg = ((existing.sentiment_avg * existing.count) + sentiment_score) / (existing.count + 1);
      db.prepare(`UPDATE topic_summary SET count = count + 1, sentiment_avg = ?, last_seen = CURRENT_TIMESTAMP, sample_messages = ? WHERE topic = ?`)
        .run(parseFloat(newAvg.toFixed(3)), JSON.stringify(samples), topic);
    } else {
      db.prepare(`INSERT INTO topic_summary (id, topic, count, sentiment_avg, sample_messages) VALUES (?, ?, 1, ?, ?)`)
        .run(uuidv4(), topic, sentiment_score, JSON.stringify([content.slice(0, 120)]));
    }
  });

  return { sentiment, sentiment_score, topics, keywords, intent, is_complaint, is_feature_request };
}

// ─── Analytics queries ─────────────────────────────────────────────────────
function getOverviewStats(days = 30) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const total            = db.prepare('SELECT COUNT(*) as n FROM message_analytics WHERE analyzed_at >= ?').get(since);
  const sentimentBreakdown = db.prepare(`SELECT sentiment, COUNT(*) as count FROM message_analytics WHERE analyzed_at >= ? GROUP BY sentiment`).all(since);
  const complaints       = db.prepare(`SELECT COUNT(*) as n FROM message_analytics WHERE is_complaint = 1 AND analyzed_at >= ?`).get(since);
  const features         = db.prepare(`SELECT COUNT(*) as n FROM message_analytics WHERE is_feature_request = 1 AND analyzed_at >= ?`).get(since);
  const avgScore         = db.prepare(`SELECT AVG(sentiment_score) as avg FROM message_analytics WHERE analyzed_at >= ?`).get(since);
  const byIntent         = db.prepare(`SELECT intent, COUNT(*) as count FROM message_analytics WHERE analyzed_at >= ? GROUP BY intent ORDER BY count DESC`).all(since);
  const topTopics        = db.prepare(`SELECT topic, count, sentiment_avg FROM topic_summary ORDER BY count DESC LIMIT 10`).all();
  const dailyVolume      = db.prepare(`
    SELECT DATE(analyzed_at) as date, COUNT(*) as count,
           ROUND(AVG(sentiment_score), 3) as avg_sentiment
    FROM message_analytics WHERE analyzed_at >= ?
    GROUP BY DATE(analyzed_at) ORDER BY date ASC
  `).all(since);
  const recentComplaints = db.prepare(`
    SELECT ma.id, ma.user_id, ma.sentiment, ma.topics, ma.keywords, ma.analyzed_at, m.content
    FROM message_analytics ma
    JOIN messages m ON m.id = ma.message_id
    WHERE ma.is_complaint = 1 ORDER BY ma.analyzed_at DESC LIMIT 20
  `).all();

  const avgLatency = db.prepare(`
    SELECT ROUND(AVG(latency_ms)) as avg FROM messages
    WHERE role = 'assistant' AND latency_ms IS NOT NULL AND created_at >= ?
  `).get(since);

  const activeUsers = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as n FROM message_analytics WHERE analyzed_at >= ?
  `).get(since);

  const peakHours = db.prepare(`
    SELECT CAST(strftime('%H', analyzed_at) AS INTEGER) as hour, COUNT(*) as count
    FROM message_analytics WHERE analyzed_at >= ?
    GROUP BY hour ORDER BY hour ASC
  `).all(since);

  const returningUsers = db.prepare(`
    SELECT COUNT(*) as n FROM (
      SELECT user_id FROM conversations WHERE created_at >= ?
      GROUP BY user_id HAVING COUNT(*) > 1
    )
  `).get(since);

  return {
    total: total.n,
    complaints: complaints.n,
    feature_requests: features.n,
    avg_sentiment: parseFloat((avgScore.avg || 0).toFixed(3)),
    avg_latency_ms: avgLatency.avg || 0,
    active_users: activeUsers.n,
    returning_users: returningUsers.n,
    sentiment_breakdown: sentimentBreakdown,
    by_intent: byIntent,
    top_topics: topTopics,
    daily_volume: dailyVolume,
    recent_complaints: recentComplaints,
    peak_hours: peakHours,
  };
}

module.exports = { analyzeMessage, getOverviewStats };
