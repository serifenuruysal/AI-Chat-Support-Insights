# AI-Powered Support Chatbot + Analytics

Web3 super app support chatbot with real-time AI responses and product analytics dashboard.

## Features

### Phase 1 — AI Chatbot
- Real-time messenger UI (WebSocket)
- Model-agnostic AI layer: swap Claude / OpenAI / mock via `.env`
- Conversation history with context window
- Optimistic message updates
- Suggested prompts for new users

### Phase 2 — Analytics Dashboard
- Sentiment analysis (positive / neutral / negative)
- Topic extraction (wallet, KYC, card, marketplace, etc.)
- Intent detection (complaint / feature request / question / support)
- Daily volume trends with recharts
- Complaint feed with filtering
- 30-day rolling window (configurable)

## Quick Start

### Option A — Local dev (fastest)
```bash
# 1. Backend
cd backend
cp .env.example .env
# Edit .env: set AI_PROVIDER=mock (or claude/openai + key)
npm install
npm run db:migrate
node src/db/seed.js   # optional: load demo analytics data
npm run dev           # runs on :4000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev           # runs on :5173
```

Open http://localhost:5173

### Option B — Docker (one command)
```bash
cp backend/.env.example .env
# Edit .env with your AI provider choice
docker compose up --build
```
Open http://localhost:3000

## AI Provider Setup

In `backend/.env`:

```env
# Use mock (no API key needed — good for demos)
AI_PROVIDER=mock

# Use Claude
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...

# Use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

Switching providers requires only a `.env` change and server restart — no code changes.

## Project Structure

```
├── backend/
│   └── src/
│       ├── index.js                  # Express + WebSocket server
│       ├── db/
│       │   ├── index.js              # DB connection singleton
│       │   ├── migrate.js            # Schema migration
│       │   └── seed.js               # Demo data generator
│       ├── routes/
│       │   ├── chat.js               # POST /api/chat/message
│       │   └── analytics.js          # GET /api/analytics/overview
│       └── services/
│           ├── aiProvider.js         # Model-agnostic AI layer
│           ├── analyticsService.js   # Sentiment + topic analysis
│           ├── chatService.js        # Conversation management
│           └── websocketService.js   # WS real-time handler
│
└── frontend/
    └── src/
        ├── App.tsx                   # Tab layout
        ├── types/index.ts            # TypeScript types
        ├── services/api.ts           # API + WebSocket client
        ├── hooks/useChat.ts          # Chat state management
        └── components/
            ├── chat/ChatWindow.tsx   # Messenger UI
            └── dashboard/
                └── AnalyticsDashboard.tsx  # Charts + insights
```

## API Reference

### Chat
```
POST /api/chat/message
  Body: { userId, content, conversationId? }
  Returns: { conversationId, content, provider, latency }

GET /api/chat/conversations?userId=
GET /api/chat/messages/:conversationId?userId=
```

### Analytics
```
GET /api/analytics/overview?days=30
  Returns: { total, complaints, feature_requests, avg_sentiment,
             sentiment_breakdown, by_intent, top_topics,
             daily_volume, recent_complaints }
```

### WebSocket (`ws://localhost:4000/ws`)
```json
// Send
{ "type": "message", "userId": "...", "content": "...", "conversationId": "..." }

// Receive
{ "type": "typing", "conversationId": "..." }
{ "type": "reply", "conversationId": "...", "content": "...", "provider": "...", "latency": 320 }
{ "type": "error", "error": "..." }
```

## Extending for Production

- **Auth**: Replace `userId` query param with JWT middleware
- **Database**: Swap `better-sqlite3` for `pg` (PostgreSQL) — same query API
- **Analytics AI upgrade**: Replace rule-based `analyticsService.js` with an AI call for nuanced sentiment
- **Rate limiting**: Already configured (60 req/min) — adjust in `src/index.js`
- **Codebase integration**: The messenger iframe can be embedded in the existing React Native WebView component

## Phase 3 Preview

Next: Ads Dashboard component (`/components/dashboard/AdsDashboard.tsx`) with:
- Campaign performance metrics
- Influencer engagement rates
- USDC payout tracking
- Audience targeting analytics
# AI-Chat-Support-Insights
