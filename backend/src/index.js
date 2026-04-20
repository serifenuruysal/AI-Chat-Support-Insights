require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

const { setupWebSocket } = require('./services/websocketService');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_, res) => res.json({
  status: 'ok',
  provider: process.env.AI_PROVIDER || 'mock',
  ts: new Date().toISOString(),
}));

app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Add a Postgres database in Railway.');
    process.exit(1);
  }

  const { migrate } = require('./db/migrate');
  await migrate();

  const server = http.createServer(app);
  setupWebSocket(server);

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🤖 AI provider: ${process.env.AI_PROVIDER || 'mock'}`);
  });
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
