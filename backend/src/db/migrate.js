const { getDb } = require('./index');

async function migrate() {
  const pool = getDb();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
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
        topics JSONB DEFAULT '[]',
        intent TEXT,
        is_complaint BOOLEAN DEFAULT FALSE,
        is_feature_request BOOLEAN DEFAULT FALSE,
        keywords JSONB DEFAULT '[]',
        language TEXT DEFAULT 'en',
        analyzed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS topic_summary (
        topic TEXT PRIMARY KEY,
        count INTEGER DEFAULT 1,
        sentiment_avg REAL,
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        sample_messages JSONB DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS conversation_outcomes (
        conversation_id TEXT PRIMARY KEY REFERENCES conversations(id),
        resolved BOOLEAN DEFAULT FALSE,
        escalated BOOLEAN DEFAULT FALSE,
        resolution_note TEXT,
        resolved_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE message_analytics ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

      CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_user ON message_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sentiment ON message_analytics(sentiment);
      CREATE INDEX IF NOT EXISTS idx_analytics_complaint ON message_analytics(is_complaint);
      CREATE INDEX IF NOT EXISTS idx_analytics_date ON message_analytics(analyzed_at);
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    `);
    console.log('✅ Database migrated');
  } finally {
    client.release();
  }
}

module.exports = { migrate };
