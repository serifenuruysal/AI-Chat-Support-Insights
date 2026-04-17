require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

// Run migrations on startup
require('./db/migrate');

const { setupWebSocket } = require('./services/websocketService');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting — 60 req/min per IP
const limiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_, res) => res.json({
  status: 'ok',
  provider: process.env.AI_PROVIDER || 'mock',
  ts: new Date().toISOString()
}));

// ─── 404 / error handlers ─────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── HTTP + WebSocket server ───────────────────────────────────────────────
const server = http.createServer(app);
setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI provider: ${process.env.AI_PROVIDER || 'mock'}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
});

module.exports = { app, server };
