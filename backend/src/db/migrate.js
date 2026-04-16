const { getDb } = require('./index');

const db = getDb();

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tokens_used INTEGER DEFAULT 0,
    ai_provider TEXT,
    latency_ms INTEGER
  );

  CREATE TABLE IF NOT EXISTS message_analytics (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES messages(id),
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sentiment TEXT CHECK(sentiment IN ('positive','neutral','negative')),
    sentiment_score REAL,
    topics TEXT DEFAULT '[]',
    intent TEXT,
    is_complaint BOOLEAN DEFAULT 0,
    is_feature_request BOOLEAN DEFAULT 0,
    keywords TEXT DEFAULT '[]',
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS topic_summary (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    sentiment_avg REAL,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    sample_messages TEXT DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_user ON message_analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_sentiment ON message_analytics(sentiment);
  CREATE INDEX IF NOT EXISTS idx_analytics_complaint ON message_analytics(is_complaint);
  CREATE INDEX IF NOT EXISTS idx_analytics_date ON message_analytics(analyzed_at);
`);

console.log('✅ Database migrated');
module.exports = db;
