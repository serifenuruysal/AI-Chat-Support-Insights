# Pulse AI — Demo Report
### AI-Powered Customer Support Platform for Web3 Super Apps
**Prepared for:** Project Owner  
**Date:** April 2026  
**Version:** 1.0.0  
**Status:** Live & Deployed

---

## Executive Summary

Pulse AI is a production-grade, AI-powered customer support platform purpose-built for Web3 super apps. It combines a cross-platform mobile application (iOS, Android, Web) with a smart backend that automatically analyzes every support conversation in real time — giving product teams instant visibility into what users are struggling with, what they want, and how they feel.

The platform is fully deployed, live on Railway (backend) and Vercel (web), and ready for demonstration.

---

## Live Deployments

| Service | URL | Status |
|---|---|---|
| Backend API | https://ai-chat-support-insights-production.up.railway.app | ✅ Live |
| Web App | https://pulse-ai-theta.vercel.app | ✅ Live |
| Health Check | /health | ✅ Responding |

---

## What the Product Does

Users open the app and chat with an AI support assistant. The assistant answers questions about wallets, payment cards, KYC, the marketplace, and general app usage. Every message is automatically tagged in the background — sentiment, intent, topic, complaints, feature requests — and all of that intelligence surfaces in a real-time analytics dashboard available to the product team.

The result: support that scales infinitely with zero human agents, and product insights that used to require manual ticket review.

---

## Core Features

### 1. AI Chat Interface
- Real-time conversation with an AI support assistant
- Supports **Claude (Anthropic)**, **OpenAI (GPT-4o)**, or a built-in mock provider — switchable via environment variable with no code changes
- Full **markdown rendering** in responses: bold, italic, bullet lists, numbered steps, headings, code snippets, blockquotes
- Typing indicator while AI is generating a response
- Conversation history persists across sessions
- **Suggested prompts** on empty state to guide users (wallet setup, card issues, KYC, account recovery)
- **Quick topic chips** on the conversations screen (Payment Issue, Account & KYC, Wallet Help, Bug Report, Feature Request, General Help)
- "Start New Conversation" always creates a fresh thread, never reopens a previous one
- Enter key sends message (mobile-optimised)

### 2. Conversation Management
- Full conversation history per user
- Search conversations by content
- Relative timestamps ("5m ago", "2d ago")
- Visual conversation list with message counts
- Multi-user support: 5 independent test user slots with persistent storage

### 3. Real-Time Analytics Dashboard
The analytics screen gives the product team a live view of support health:

| Metric | Description |
|---|---|
| Total Messages | Volume across the selected time window |
| Active Users | Unique users who sent messages |
| Returning Users | Users with more than one conversation |
| Complaints | Auto-flagged negative support requests |
| Feature Requests | Auto-detected product suggestions |
| Avg Sentiment | Aggregated emotional tone score (-1 to +1) |
| Avg AI Latency | Response time of the AI provider |

**Visual breakdowns:**
- Daily message volume line chart
- Top topics horizontal bar chart
- Sentiment breakdown (positive / neutral / negative) with progress bars
- Intent breakdown (complaint / feature request / question / support / general)
- Recent complaints feed (last 20, with full message content)

**Time range filters:** 7, 14, 30, or 90 days  
**Demo mode:** Pre-loaded mock data for presentations without a live backend

### 4. Background Intelligence Pipeline
Every user message is automatically processed through four analysis algorithms — completely invisible to the user and non-blocking to the response:

- **Sentiment Analysis** — scores each message on a -1 to +1 scale, classifies as positive / neutral / negative
- **Topic Extraction** — tags messages across 8 product areas: wallet, payment card, KYC, messenger, marketplace, social, onboarding, performance
- **Intent Classification** — detects complaint, feature request, question, support request, or general inquiry
- **Keyword Extraction** — pulls the 8 most meaningful words from each message

Results are stored per message and rolled up into live aggregates. The topic summary table updates atomically with every message — no data races, no double-counts.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Client Layer                       │
│  React Native (iOS / Android)                │
│  Expo Web (Browser)                          │
│  React + Vite (Dashboard Web)                │
└──────────────┬──────────────────────────────┘
               │  REST API  +  WebSocket
               ▼
┌─────────────────────────────────────────────┐
│           Backend (Express.js)               │
│  POST /api/chat/message                      │
│  GET  /api/chat/conversations                │
│  GET  /api/chat/messages/:id                 │
│  GET  /api/analytics/overview                │
│  WS   /ws (real-time fallback)               │
│                                              │
│  ┌────────────┐   ┌─────────────────────┐   │
│  │ Chat       │   │ AI Provider Layer   │   │
│  │ Service    │──▶│ Claude / OpenAI /   │   │
│  │            │   │ Mock (env-switched) │   │
│  └─────┬──────┘   └─────────────────────┘   │
│        │ setImmediate (async)                │
│  ┌─────▼──────┐                             │
│  │ Analytics  │                             │
│  │ Service    │                             │
│  │ (background│                             │
│  │  analysis) │                             │
│  └─────┬──────┘                             │
└────────┼────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL (Railway)                 │
│  conversations   messages                   │
│  message_analytics   topic_summary          │
└─────────────────────────────────────────────┘
```

### Key Architectural Decisions

**Non-blocking analytics:** The analysis pipeline runs via `setImmediate` — the AI response is returned to the user immediately, analytics happen in the background. Users never wait for tagging.

**Provider abstraction:** The AI provider is a single `chat()` function. Switching from OpenAI to Claude to mock requires only an environment variable change — no code changes, no redeployment logic.

**Atomic topic upserts:** Topic summary updates use PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` — no race conditions when multiple messages arrive simultaneously about the same topic.

**Environment-aware API URLs:** The mobile app automatically points to `localhost` in development and the Railway URL in production using React Native's `__DEV__` flag.

**Persistent database:** Migrated from SQLite to PostgreSQL on Railway — data survives all redeployments. Migrations run automatically on every server startup.

---

## Tech Stack

### Mobile App (pulse-ai)
| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | React Navigation v7 (bottom tabs + stack) |
| Charts | react-native-svg (custom line + bar charts) |
| Storage | AsyncStorage (mobile) / localStorage (web) |
| Safe Area | react-native-safe-area-context |
| Web Export | Expo Web + Vercel |

### Backend (ai-chatbot)
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (Alpine Docker) |
| Framework | Express.js 4.18 |
| Language | JavaScript (ES2022) |
| Database | PostgreSQL via `pg` connection pool |
| AI — Claude | @anthropic-ai/sdk 0.39 |
| AI — OpenAI | openai SDK 4.24 |
| Real-time | WebSocket (`ws` 8.14) |
| Validation | Zod 3.22 |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Railway (Dockerfile + auto-migrate) |

---

## Database Schema

```
conversations
  id, user_id, created_at, updated_at, metadata

messages
  id, conversation_id, role, content,
  created_at, tokens_used, ai_provider, latency_ms

message_analytics
  id, message_id, conversation_id, user_id,
  sentiment, sentiment_score, topics (JSONB),
  intent, is_complaint, is_feature_request,
  keywords (JSONB), analyzed_at

topic_summary
  topic (PK), count, sentiment_avg,
  last_seen, sample_messages (JSONB)
```

All tables indexed on the high-frequency query columns: `user_id`, `conversation_id`, `sentiment`, `is_complaint`, `analyzed_at`.

---

## Security & Reliability

| Concern | Implementation |
|---|---|
| Rate limiting | 60 requests/minute per IP via express-rate-limit |
| Security headers | Helmet (XSS, CSRF, content-type sniffing) |
| Input validation | Zod schemas on all POST endpoints |
| CORS | Configured for all origins (tighten for production) |
| Proxy trust | `trust proxy = 1` for Railway's load balancer |
| DB connections | Connection pool (max 10), idle timeout 30s |
| Server restart | Railway auto-restart on failure (max 3 retries) |
| Health check | `/health` endpoint monitored by Railway every 30s |
| Environment | Secrets via Railway environment variables, never in code |

---

## Project Structure

```
messengerDemo/
├── pulse-ai/                   # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── ChatScreen.tsx          # Chat UI + markdown renderer
│   │   │   ├── ConversationsScreen.tsx # Conversation list
│   │   │   ├── AnalyticsScreen.tsx     # Analytics dashboard
│   │   │   └── SettingsScreen.tsx      # User management
│   │   ├── hooks/
│   │   │   └── useChat.ts              # All chat state logic
│   │   ├── services/
│   │   │   ├── api.ts                  # HTTP client (dev/prod URL switching)
│   │   │   └── storage.ts              # AsyncStorage abstraction
│   │   ├── theme/
│   │   │   └── index.ts                # Colors, spacing, radius
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces
│   └── vercel.json                     # Vercel web deployment config
│
└── ai-chatbot/
    └── backend/
        ├── src/
        │   ├── index.js                # Express app + startup
        │   ├── routes/
        │   │   ├── chat.js             # Chat endpoints
        │   │   └── analytics.js        # Analytics endpoint
        │   ├── services/
        │   │   ├── chatService.js      # Conversation + message logic
        │   │   ├── aiProvider.js       # Claude / OpenAI / Mock
        │   │   ├── analyticsService.js # Tagging + analytics queries
        │   │   └── websocketService.js # WebSocket handler
        │   └── db/
        │       ├── index.js            # PostgreSQL pool
        │       └── migrate.js          # Schema migrations
        └── Dockerfile
```

---

## What's Ready for Demo

- ✅ Chat with real AI responses (OpenAI GPT-4o or Claude)
- ✅ Full conversation history, search, and multi-user switching
- ✅ Analytics dashboard with live data and demo mode
- ✅ Background sentiment, topic, and intent tagging on every message
- ✅ Mobile app running on iOS, Android, and web browser
- ✅ Persistent PostgreSQL database (data survives redeployments)
- ✅ Markdown-formatted AI responses (lists, bold, steps)
- ✅ Production deployment on Railway + Vercel

---

## Recommended Next Steps

| Priority | Item |
|---|---|
| High | Replace `userId` with JWT authentication for real user identity |
| High | Add webhook / email alert when high-severity complaint is detected |
| Medium | Per-user rate limiting (currently IP-based) |
| Medium | Conversation session timeout (auto-close after 30min inactivity) |
| Medium | Upgrade analytics tagging from keyword rules to embeddings (semantic similarity) |
| Low | A/B testing across AI providers with satisfaction tracking |
| Low | Admin web dashboard for human agent escalation |

---

*Pulse AI — Built with React Native, Express, PostgreSQL, and the Anthropic / OpenAI APIs.*
