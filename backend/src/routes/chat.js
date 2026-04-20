const express = require('express');
const { z } = require('zod');
const { sendMessage, getConversations, getMessages } = require('../services/chatService');

const router = express.Router();

const SendSchema = z.object({
  content:        z.string().min(1).max(4000),
  userId:         z.string().min(1).max(100),
  conversationId: z.string().uuid().optional(),
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const parsed = SendSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

    const result = await sendMessage(parsed.data);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// GET /api/chat/conversations?userId=xxx
router.get('/conversations', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    res.json({ conversations: await getConversations(userId) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/chat/messages/:conversationId?userId=xxx
router.get('/messages/:conversationId', async (req, res) => {
  const { userId } = req.query;
  const { conversationId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    res.json({ messages: await getMessages(conversationId, userId) });
  } catch (err) {
    res.status(500).json({ error: 'Conversation not found' });
  }
});

module.exports = router;
