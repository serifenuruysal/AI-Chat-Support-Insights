const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { chat } = require('./aiProvider');
const { analyzeMessage } = require('./analyticsService');

function getOrCreateConversation(userId) {
  const db = getDb();
  let conv = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(userId);
  if (!conv) {
    const id = uuidv4();
    db.prepare('INSERT INTO conversations (id, user_id) VALUES (?, ?)').run(id, userId);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  }
  return conv;
}

function getConversationHistory(conversationId, limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT role, content FROM messages
    WHERE conversation_id = ? AND role != 'system'
    ORDER BY created_at ASC LIMIT ?
  `).all(conversationId, limit);
}

async function sendMessage({ userId, content, conversationId }) {
  const db = getDb();

  // Get or create conversation
  let conv;
  if (conversationId) {
    conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
    if (!conv) throw new Error('Conversation not found');
  } else {
    conv = getOrCreateConversation(userId);
  }

  // Save user message
  const userMsgId = uuidv4();
  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)
  `).run(userMsgId, conv.id, content);

  // Touch conversation
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conv.id);

  // Get history for context window
  const history = getConversationHistory(conv.id, 20);

  // Analyze user message asynchronously (don't block response)
  setImmediate(() => {
    analyzeMessage({ messageId: userMsgId, conversationId: conv.id, userId, content }).catch(console.error);
  });

  // Call AI
  const aiResult = await chat(history);

  // Save assistant message
  const asstMsgId = uuidv4();
  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, tokens_used, ai_provider, latency_ms)
    VALUES (?, ?, 'assistant', ?, ?, ?, ?)
  `).run(asstMsgId, conv.id, aiResult.content, aiResult.tokens, aiResult.provider, aiResult.latency);

  return {
    conversationId: conv.id,
    messageId: asstMsgId,
    content: aiResult.content,
    provider: aiResult.provider,
    latency: aiResult.latency,
  };
}

function getConversations(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT c.id, c.created_at, c.updated_at,
           (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message,
           (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
    FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC LIMIT 50
  `).all(userId);
}

function getMessages(conversationId, userId) {
  const db = getDb();
  // Verify ownership
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!conv) throw new Error('Conversation not found');

  return db.prepare(`
    SELECT id, role, content, created_at, ai_provider, latency_ms
    FROM messages WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(conversationId);
}

module.exports = { sendMessage, getConversations, getMessages, getOrCreateConversation };
