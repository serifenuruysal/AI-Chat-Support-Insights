const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { chat } = require('./aiProvider');
const { analyzeMessage } = require('./analyticsService');

async function getOrCreateConversation(pool, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [userId]
  );
  if (rows.length > 0) return rows[0];
  const id = uuidv4();
  const { rows: created } = await pool.query(
    'INSERT INTO conversations (id, user_id) VALUES ($1, $2) RETURNING *',
    [id, userId]
  );
  return created[0];
}

async function getConversationHistory(pool, conversationId, limit = 20) {
  const { rows } = await pool.query(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1 AND role != 'system'
     ORDER BY created_at ASC LIMIT $2`,
    [conversationId, limit]
  );
  return rows;
}

async function createNewConversation(pool, userId) {
  const id = uuidv4();
  const { rows } = await pool.query(
    'INSERT INTO conversations (id, user_id) VALUES ($1, $2) RETURNING *',
    [id, userId]
  );
  return rows[0];
}

async function sendMessage({ userId, content, conversationId, forceNew }) {
  const pool = getDb();

  let conv;
  if (forceNew) {
    conv = await createNewConversation(pool, userId);
  } else if (conversationId) {
    const { rows } = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    conv = rows[0] || await createNewConversation(pool, userId);
  } else {
    conv = await getOrCreateConversation(pool, userId);
  }

  const userMsgId = uuidv4();
  await pool.query(
    `INSERT INTO messages (id, conversation_id, role, content) VALUES ($1, $2, 'user', $3)`,
    [userMsgId, conv.id, content]
  );

  await pool.query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conv.id]
  );

  const history = await getConversationHistory(pool, conv.id, 20);

  setImmediate(() => {
    analyzeMessage({ messageId: userMsgId, conversationId: conv.id, userId, content }).catch(console.error);
  });

  const aiResult = await chat(history);

  const asstMsgId = uuidv4();
  await pool.query(
    `INSERT INTO messages (id, conversation_id, role, content, tokens_used, ai_provider, latency_ms)
     VALUES ($1, $2, 'assistant', $3, $4, $5, $6)`,
    [asstMsgId, conv.id, aiResult.content, aiResult.tokens, aiResult.provider, aiResult.latency]
  );

  return {
    conversationId: conv.id,
    messageId: asstMsgId,
    content: aiResult.content,
    provider: aiResult.provider,
    latency: aiResult.latency,
  };
}

async function getConversations(userId) {
  const pool = getDb();
  const { rows } = await pool.query(
    `SELECT c.id, c.created_at, c.updated_at,
       (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message,
       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id)::int as message_count
     FROM conversations c WHERE c.user_id = $1 ORDER BY c.updated_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

async function getMessages(conversationId, userId) {
  const pool = getDb();
  const { rows: conv } = await pool.query(
    'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (conv.length === 0) throw new Error('Conversation not found');

  const { rows } = await pool.query(
    `SELECT id, role, content, created_at, ai_provider, latency_ms
     FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return rows;
}

module.exports = { sendMessage, getConversations, getMessages, getOrCreateConversation };
