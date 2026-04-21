# AlemX AI Support — Demo Report
### AI-Powered Customer Support Platform for AlemX
**Prepared for:** Project Owner  
**Date:** April 2026  
**Version:** 1.0.0  
**Status:** Live & Deployed

---

## Executive Summary

AlemX AI Support is a production-grade, AI-powered customer support platform built specifically for [AlemX](https://www.alemx.com) — the next-generation Web3 social platform powered by the Proof-of-Attention (PoA) protocol.

The platform combines a cross-platform mobile application (iOS, Android, Web) with an intelligent backend that automatically analyzes every support conversation in real time — giving the AlemX product team instant visibility into what users are struggling with, what features they want, and how they feel about the product.

The AI assistant is fully trained on AlemX's product suite: the Paid Attention Marketplace, $Alem token, KYC verification, cross-border payments, encrypted messenger, Web3 wallet, and Founding Creator program.

The platform is fully deployed, live on Railway (backend) and Vercel (web), and ready for demonstration.

---

## Live Deployments

| Service | URL | Status |
|---|---|---|
| Backend API | https://ai-chat-support-insights-production.up.railway.app | ✅ Live |
| Web App | https://pulse-ai-theta.vercel.app | ✅ Live |
| Health Check | https://ai-chat-support-insights-production.up.railway.app/health | ✅ Responding |

---

## What the Product Does

AlemX users open the app and chat with an AI support assistant that knows everything about AlemX's platform. The assistant handles questions about the Paid Attention Marketplace, $Alem token, KYC verification, cross-border payments, wallet connectivity, and the Founding Creator program — escalating to `hello@alemx.com` when needed.

Every message is automatically tagged in the background — sentiment, intent, topic, complaints, feature requests — and all of that intelligence surfaces in a real-time analytics dashboard available to the AlemX product and support teams.

The result: support that scales infinitely with zero human agents, and product insights that used to require manual ticket review.

---

## AI Assistant — What It Knows

The assistant is fully briefed on AlemX's product suite via a detailed system prompt. It handles:

| Topic | What It Can Help With |
|---|---|
| **Paid Attention Marketplace** | How PoA protocol works, setting message prices, earning from posts and replies, creator revenue sharing |
| **$Alem Token** | Token utility, earning rewards, platform payments — with a strict no-financial-advice policy |
| **KYC Verification** | Document requirements, rejection reasons, re-submission steps, KYC reuse across partner banks |
| **Integrated Trading & Payments** | Trading stocks/crypto/tokens, failed trades, region restrictions, seamless checkout flow |
| **Peer-to-Peer Network** | Instant transfers via @handle or QR code, memos, recurring payments setup |
| **Borderless Payments** | Cross-border transfers (1–3 business days), live exchange rates, near-instant settlement |
| **Partner Bank Onboarding** | Opening bank accounts, KYC reuse, guided checklists, pending status troubleshooting |
| **Revenue Sharing** | Creator earnings splits, payout tracking, configuring percentages per content type |
| **DApp Interoperability** | Connecting Web3 wallets, WalletConnect support, DeFi protocol discovery, asset movement |
| **Encrypted Messenger** | Paid messaging setup, pricing calls, video call configuration |
| **Founding Creator Program** | Eligibility (first 1,000 users), exclusive benefits, standard creator program alternative |
| **Security** | Never requests private keys or seed phrases — flags impersonation attempts |

**Escalation:** For unresolved issues the assistant always directs users to `hello@alemx.com` and `alemx.com`.

**Language:** Responds in the same language the user writes in.

---

## Core Features

### 1. AI Chat Interface
- Real-time conversation with an AlemX-trained AI support assistant
- Supports **Claude (Anthropic)**, **OpenAI (GPT-4o)**, or a built-in mock provider — switchable via environment variable with no code changes
- Full **markdown rendering** in responses: bold, italic, bullet lists, numbered steps (including OpenAI's split-line format), headings, code snippets, blockquotes
- Typing indicator while AI is generating a response
- Conversation history persists across sessions
- **Suggested prompts** tailored to AlemX: Paid Attention Marketplace, $Alem Token, KYC, Cross-border Payments
- **Quick topic chips**: Attention Marketplace, $Alem Token, KYC Verification, Payments & Transfers, Wallet & Web3, Founding Creator
- "Start New Conversation" always creates a fresh thread, never reopens a previous one
- Enter key sends message (mobile-optimised)

### 2. Conversation Management
- Full conversation history per user
- Search conversations by content
- Relative timestamps ("5m ago", "2d ago")
- Visual conversation list with message counts and hero status banner ("Online · Available 24/7")
- Multi-user support: 5 independent test user slots with persistent storage

### 3. Real-Time Analytics Dashboard
The analytics screen gives the AlemX product team a live view of support health:

| Metric | Description |
|---|---|
| Total Messages | Volume across the selected time window |
| Active Users | Unique users who sent messages |
| Returning Users | Users with more than one conversation |
| Complaints | Auto-flagged negative support requests |
| Feature Requests | Auto-detected product suggestions |
| Avg Sentiment | Aggregated emotional tone score (-1 to +1) |
| Avg AI Latency | Response time of the AI provider in ms |

**Visual breakdowns:**
- Daily message volume line chart (7 / 14 / 30 / 90 day windows)
- Top topics horizontal bar chart
- Sentiment breakdown (positive / neutral / negative) with progress bars
- Intent breakdown (complaint / feature request / question / support / general)
- Recent complaints feed (last 20, with full message content and topic badges)

**Demo mode:** Pre-loaded mock data for presentations without a live backend connection

### 4. Background Intelligence Pipeline
Every user message is automatically processed through four analysis algorithms — completely invisible to the user and non-blocking to the response:

- **Sentiment Analysis** — scores each message on a -1 to +1 scale, classifies as positive / neutral / negative. Negative signals weighted 1.5× heavier than positive.
- **Topic Extraction** — tags messages across 8 AlemX product areas: wallet, payment card, KYC, messenger, marketplace, social, onboarding, performance
- **Intent Classification** — detects complaint, feature request, question, support request, or general inquiry
- **Keyword Extraction** — pulls the 8 most meaningful non-stopword tokens from each message

Results are stored per message and rolled up into live aggregates atomically — no data races, no double-counts.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Client Layer                       │
│  React Native (iOS / Android)                │
│  Expo Web (Browser / Vercel)                 │
└──────────────┬──────────────────────────────┘
               │  REST API  +  WebSocket
               ▼
┌─────────────────────────────────────────────┐
│           Backend (Express.js / Railway)     │
│  POST /api/chat/message                      │
│  GET  /api/chat/conversations                │
│  GET  /api/chat/messages/:id                 │
│  GET  /api/analytics/overview                │
│  WS   /ws (real-time)                        │
│                                              │
│  ┌────────────┐   ┌─────────────────────┐   │
│  │ Chat       │   │ AI Provider Layer   │   │
│  │ Service    │──▶│ Claude / OpenAI /   │   │
│  │            │   │ Mock (env-switched) │   │
│  └─────┬──────┘   └─────────────────────┘   │
│        │ setImmediate (async, non-blocking)  │
│  ┌─────▼──────┐                             │
│  │ Analytics  │                             │
│  │ Service    │                             │
│  │ (background│                             │
│  │  pipeline) │                             │
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

**Provider abstraction:** The AI provider is a single `chat()` function. Switching from OpenAI to Claude to mock requires only one environment variable change — no code changes, no redeployment.

**Atomic topic upserts:** Topic summary updates use PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` — no race conditions when multiple messages arrive simultaneously about the same topic.

**Environment-aware API URLs:** The mobile app automatically points to `localhost` in development and the Railway URL in production using `process.env.NODE_ENV`.

**Persistent database:** Migrated from SQLite to PostgreSQL on Railway — data survives all redeployments. Migrations run automatically on every server startup.

**Force-new conversations:** A `forceNew` flag ensures "Start New Conversation" always creates a fresh DB row, never reopening the previous session.

---

## Tech Stack

### Mobile App (pulse-ai)
| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | React Navigation v7 (bottom tabs + stack) |
| Charts | react-native-svg (custom SVG line + bar charts) |
| Storage | AsyncStorage (mobile) / localStorage (web) |
| Safe Area | react-native-safe-area-context |
| Web Export | Expo Web + Vercel |

### Backend (ai-chatbot)
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (Alpine Docker) |
| Framework | Express.js 4.18 |
| Language | JavaScript (ES2022) |
| Database | PostgreSQL via `pg` connection pool (max 10) |
| AI — Claude | @anthropic-ai/sdk 0.39 |
| AI — OpenAI | openai SDK 4.24 (GPT-4o default) |
| Real-time | WebSocket (`ws` 8.14) with heartbeat |
| Validation | Zod 3.22 |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Railway (Dockerfile + auto-migrate on startup) |

---

## Database Schema

```
conversations
  id, user_id, created_at, updated_at, metadata (JSONB)

messages
  id, conversation_id, role ('user'|'assistant'|'system'),
  content, created_at, tokens_used, ai_provider, latency_ms

message_analytics
  id, message_id, conversation_id, user_id,
  sentiment, sentiment_score, topics (JSONB),
  intent, is_complaint, is_feature_request,
  keywords (JSONB), analyzed_at

topic_summary
  topic (PK), count, sentiment_avg,
  last_seen, sample_messages (JSONB, max 5)
```

All tables indexed on high-frequency query columns: `user_id`, `conversation_id`, `sentiment`, `is_complaint`, `analyzed_at`.

---

## Security & Reliability

| Concern | Implementation |
|---|---|
| Rate limiting | 60 requests/minute per IP via express-rate-limit |
| Security headers | Helmet (XSS, CSRF, content-type sniffing) |
| Input validation | Zod schemas on all POST endpoints (max 4000 chars) |
| CORS | Configured for all origins |
| Proxy trust | `trust proxy = 1` for Railway's load balancer |
| DB connections | Connection pool (max 10), idle timeout 30s |
| Server restart | Railway auto-restart on failure (max 3 retries) |
| Health check | `/health` endpoint monitored by Railway every 30s |
| Secrets | All keys via Railway environment variables, never in code |
| AI security | Assistant never requests private keys or seed phrases |

---

## Project Structure

```
messengerDemo/
├── pulse-ai/                        # React Native mobile app (Vercel)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── ChatScreen.tsx       # Chat UI + full markdown renderer
│   │   │   ├── ConversationsScreen.tsx  # Conversation list + topic chips
│   │   │   ├── AnalyticsScreen.tsx  # Analytics dashboard (live + demo)
│   │   │   └── SettingsScreen.tsx   # Multi-user test slots
│   │   ├── hooks/
│   │   │   └── useChat.ts           # All chat state + forceNew logic
│   │   ├── services/
│   │   │   ├── api.ts               # HTTP client (dev/prod switching)
│   │   │   └── storage.ts           # AsyncStorage / localStorage abstraction
│   │   ├── theme/index.ts           # Colors, spacing, radius tokens
│   │   └── types/index.ts           # TypeScript interfaces
│   └── vercel.json                  # Vercel web deployment config
│
└── ai-chatbot/
    └── backend/                     # Express API (Railway)
        ├── src/
        │   ├── index.js             # Express app + async startup
        │   ├── routes/
        │   │   ├── chat.js          # Chat endpoints (Zod validated)
        │   │   └── analytics.js     # Analytics overview endpoint
        │   ├── services/
        │   │   ├── chatService.js   # Conversation + message logic
        │   │   ├── aiProvider.js    # Claude / OpenAI / Mock + AlemX prompt
        │   │   ├── analyticsService.js  # Tagging pipeline + DB queries
        │   │   └── websocketService.js  # WebSocket + heartbeat
        │   └── db/
        │       ├── index.js         # PostgreSQL connection pool
        │       └── migrate.js       # Auto-run schema migrations
        └── Dockerfile               # node:20-alpine, no native deps
```

---

## What's Ready for Demo

- ✅ AI assistant fully trained on AlemX product suite (PoA, $Alem, KYC, payments, wallet, Founding Creator)
- ✅ Real AI responses via OpenAI GPT-4o or Claude (switchable)
- ✅ Full markdown formatting in responses (lists, bold, numbered steps)
- ✅ Full conversation history, search, and multi-user switching
- ✅ Analytics dashboard with live data and demo mode
- ✅ Background sentiment, topic, and intent tagging on every message
- ✅ Mobile app running on iOS, Android, and web browser
- ✅ Persistent PostgreSQL database — data survives all redeployments
- ✅ Production deployment on Railway + Vercel
- ✅ "Start New Conversation" always creates a truly fresh thread

---

## Recommended Next Steps

| Priority | Item |
|---|---|
| High | Replace `userId` with JWT authentication tied to real AlemX user accounts |
| High | Add webhook / email alert to `hello@alemx.com` when high-severity complaint is detected |
| High | Expand system prompt with AlemX-specific FAQ content as the product grows |
| Medium | Per-user rate limiting (currently IP-based) |
| Medium | Conversation session timeout (auto-close after 30 min inactivity) |
| Medium | Upgrade analytics tagging from keyword rules to embeddings for semantic accuracy |
| Low | A/B testing between Claude and OpenAI to track response quality per topic |
| Low | Human escalation panel — flag conversations for AlemX support team review |

---

*AlemX AI Support — Built with React Native, Express.js, PostgreSQL, and the Anthropic / OpenAI APIs.*  
*Contact: hello@alemx.com | alemx.com*
