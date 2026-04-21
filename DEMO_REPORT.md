# AlemX  — Demo Report
### AI-Powered Customer Support Platform for AlemX
**Prepared for:** Project Owner  
**Date:** April 21, 2026  
**Version:** 1.0.0  
**Status:** Live & Deployed

---

## Executive Summary

AlemX AI Support is a production-grade, AI-powered customer support platform built specifically for [AlemX](https://www.alemx.com) — the next-generation Web3 social platform powered by the Proof-of-Attention (PoA) protocol.

The platform combines a cross-platform mobile application (iOS, Android, Web) with an intelligent backend that automatically analyzes every support conversation in real time — giving the AlemX product team instant visibility into what users are struggling with, what features they want, and how they feel about the product.

The AI assistant is purpose-built for AlemX, with comprehensive product knowledge covering the complete product suite: Paid Attention Marketplace, $Alem token, KYC verification, integrated trading, borderless payments, peer-to-peer transfers, partner bank onboarding, revenue sharing, DApp interoperability, AlemX Visa card, Founding Creator program, and the global city tour roadmap.

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

AlemX users open the app and chat with an AI support assistant that knows everything about AlemX's platform. The assistant handles questions across the full product — from PoA protocol and $Alem token to Visa card activation, city event dates, and DApp connectivity — always escalating to `hello@alemx.com` when a human touch is needed.

Every message is automatically tagged in the background — sentiment, intent, topic, complaints, feature requests — and all of that intelligence surfaces in a real-time analytics dashboard available to the AlemX product and support teams.

The result: support that scales with zero human agents, and product insights that used to require manual ticket review.

---

## AI Assistant — What It Knows

The assistant is fully briefed on AlemX's complete product suite. It handles:

| Topic | What It Can Help With |
|---|---|
| **Paid Attention Marketplace** | PoA protocol, setting message/call prices, earning from posts and replies, inbox monetization |
| **Founding Creator Program** | Eligibility (first 1,000 users), lifetime badge, double income, how to apply at alemx.com |
| **$Alem Token** | Token utility, pre-listing price, vesting schedule, Tier 1/2 exchange listings, SocialFi positioning |
| **AlemX Visa Card** | Physical/virtual card, activation steps, declined transactions, spending limits |
| **KYC Verification** | Document requirements, rejection reasons, re-submission, KYC reuse across partner banks |
| **Integrated Trading & Payments** | Stocks/crypto/token trading, failed trades, region restrictions, seamless checkout |
| **Peer-to-Peer Network** | Instant transfers via @handle or QR code, memos, recurring payments |
| **Borderless Payments** | Cross-border transfers, live exchange rates, near-instant settlement, corridor timelines |
| **Partner Bank Onboarding** | Opening bank accounts, KYC reuse, guided checklists, pending status troubleshooting |
| **Revenue Sharing** | Creator earnings splits, payout tracking, configuring percentages per content type |
| **DApp Interoperability** | WalletConnect, DeFi protocol discovery, asset movement, wallet connectivity |
| **Value Transfer on Social** | Gifting stocks/crypto/cash in posts, transferring to Web3 wallet or bank card |
| **City Events & Global Tour** | Full schedule: 15 cities across Europe, LATAM, Africa, SEA + Dubai conference Apr 27, 2027 |
| **Encrypted Messenger** | Paid messaging, pricing video calls, end-to-end encryption |
| **Security** | Never requests private keys or seed phrases — flags impersonation attempts immediately |

**Escalation:** For unresolved issues the assistant always directs users to `hello@alemx.com` and `alemx.com`.  
**Language:** Detects and responds in the same language the user writes in.

---

## Core Features

### 1. AI Chat Interface
- Real-time conversation with an AlemX-configured AI support assistant
- Supports **Claude (Anthropic)**, **OpenAI (GPT-4o)**, or a built-in mock provider — switchable via a single environment variable with no code changes
- Full **markdown rendering** in responses: bold, italic, bullet lists, numbered steps, headings, code snippets, blockquotes, horizontal rules
- Typing indicator while AI is generating a response
- Conversation history persists across sessions
- **Suggested prompts** on empty state — 6 AlemX-specific questions to guide new users
- **12 quick topic chips** on the conversations screen covering all major AlemX features
- "Start New Conversation" always creates a truly fresh thread (never reopens previous session)
- Enter key sends message (mobile-optimised)

### 2. Conversation Management
- Full conversation history per user with search by content
- Relative timestamps ("5m ago", "2d ago")
- Hero banner: AI avatar with live green online dot, "Available 24/7" status badge
- Visual conversation list with message counts and AI avatar
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
| Escalations | Conversations automatically flagged for team review |
| Avg Sentiment | Aggregated emotional tone score (-1 to +1) |
| Avg AI Latency | Response time of the AI provider in ms |

**Visual breakdowns:**
- Daily message volume line chart (7 / 14 / 30 / 90 day windows)
- Top topics horizontal bar chart with colour coding
- Sentiment breakdown (positive / neutral / negative) with progress bars
- Intent breakdown (complaint / feature request / question / support / general)
- Peak activity hours chart — 24-hour bar view of when users are most active
- User language breakdown — detects which languages users write in
- Recent complaints feed — last 20 with full message content and topic badges

**Demo mode:** Pre-loaded mock data for presentations without a live backend connection

### 4. Background Intelligence Pipeline
Every user message is automatically processed through five analysis algorithms — completely invisible to the user, non-blocking to the AI response:

- **Sentiment Analysis** — scores each message -1 to +1, classifies as positive / neutral / negative. Negative signals weighted 1.5× heavier.
- **Topic Extraction** — tags messages across **16 AlemX-specific topic buckets**: attention marketplace, $alem token, KYC, trading, P2P transfers, borderless payments, partner banks, revenue sharing, DApp/wallet, Visa card, city events, value transfer, messenger, social, onboarding, performance
- **Intent Classification** — detects complaint, feature request, question, support request, or general inquiry
- **Keyword Extraction** — pulls the 8 most meaningful non-stopword tokens per message
- **Language Detection** — identifies the user's language from the message text (supports English, Spanish, French, German, Portuguese, Russian, Arabic, Chinese, Japanese, Korean)

Results stored per message and rolled up into live aggregates atomically — no data races, no double-counts. Conversations containing complaints are automatically flagged in the escalation tracker.

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
│  conversation_outcomes                      │
└─────────────────────────────────────────────┘
```

### Key Architectural Decisions

**Non-blocking analytics:** The analysis pipeline runs via `setImmediate` — the AI response is returned to the user immediately, analytics happen in the background. Users never wait for tagging.

**Provider abstraction:** The AI provider is a single `chat()` function. Switching from OpenAI to Claude to mock requires only one environment variable — no code changes, no redeployment.

**Atomic topic upserts:** Topic summary updates use PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` — no race conditions when multiple messages arrive simultaneously about the same topic.

**Environment-aware API URLs:** The mobile app uses `process.env.NODE_ENV` to automatically switch between localhost (development) and the Railway URL (production). Vercel correctly sets `NODE_ENV=production` at build time.

**Persistent database:** Data lives in PostgreSQL on Railway and survives all redeployments. Migrations run automatically on every server startup before Express binds.

**Force-new conversations:** A `forceNew` flag sent from the client ensures "Start New Conversation" always inserts a fresh DB row, never re-opening the most recent session.

**Trust proxy:** `app.set('trust proxy', 1)` configured for Railway's load balancer — required for rate limiting to work correctly behind the proxy.

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
| AI — Claude | @anthropic-ai/sdk |
| AI — OpenAI | openai SDK (GPT-4o default) |
| Real-time | WebSocket (`ws`) with 30s heartbeat |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Railway (Dockerfile + auto-migrate on startup) |

---

## Security & Reliability

| Concern | Implementation |
|---|---|
| Rate limiting | 60 requests/minute per IP via express-rate-limit |
| Security headers | Helmet (XSS, CSRF, content-type sniffing) |
| Input validation | Zod schemas on all POST endpoints (max 4,000 chars) |
| CORS | Configured for all origins |
| Proxy trust | `trust proxy = 1` for Railway's load balancer |
| DB connections | Connection pool (max 10), idle timeout 30s |
| Server restart | Railway auto-restart on failure |
| Health check | `/health` endpoint monitored by Railway every 30s |
| Secrets | All API keys via Railway environment variables, never in code |
| AI safety | Assistant never requests private keys or seed phrases |

---

## Project Structure

```
messengerDemo/
├── pulse-ai/                        # React Native mobile app (Vercel)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── ChatScreen.tsx       # Chat UI + full markdown renderer
│   │   │   ├── ConversationsScreen.tsx  # Hero banner + 12 topic chips
│   │   │   ├── AnalyticsScreen.tsx  # Analytics dashboard (live + demo)
│   │   │   └── SettingsScreen.tsx   # 5 test user slots
│   │   ├── hooks/
│   │   │   └── useChat.ts           # Chat state, forceNew, optimistic UI
│   │   ├── services/
│   │   │   ├── api.ts               # HTTP client (NODE_ENV-based switching)
│   │   │   └── storage.ts           # AsyncStorage / localStorage abstraction
│   │   ├── theme/index.ts           # Colors, spacing, radius design tokens
│   │   └── types/index.ts           # TypeScript interfaces
│   └── vercel.json                  # Expo web export config for Vercel
│
└── ai-chatbot/
    └── backend/                     # Express API (Railway)
        ├── src/
        │   ├── index.js             # Async startup, await migration, trust proxy
        │   ├── routes/
        │   │   ├── chat.js          # Chat endpoints (Zod validated, forceNew support)
        │   │   └── analytics.js     # Analytics overview (async)
        │   ├── services/
        │   │   ├── chatService.js   # Conversation logic, forceNew, history fetch
        │   │   ├── aiProvider.js    # Claude / OpenAI / Mock + full AlemX system prompt
        │   │   ├── analyticsService.js  # 16-topic pipeline, language detection, escalation
        │   │   └── websocketService.js  # WebSocket + 30s heartbeat
        │   └── db/
        │       ├── index.js         # PostgreSQL pool (SSL auto-detect)
        │       └── migrate.js       # Exported async migrate(), idempotent
        └── Dockerfile               # node:20-alpine, production deps only
```

---

## What's Ready for Demo

- ✅ AI assistant purpose-built for AlemX with comprehensive product knowledge (16 topic areas)
- ✅ Real AI responses via OpenAI GPT-4o or Claude — switchable via env var
- ✅ Full markdown rendering (bold, italic, lists, numbered steps, headings, code)
- ✅ Full conversation history, search, multi-user switching (5 test slots)
- ✅ 12 quick topic chips covering all AlemX features
- ✅ 6 contextual suggested prompts on empty chat state
- ✅ Analytics dashboard — live data + demo mode with mock dataset
- ✅ 16-bucket topic detection tuned to AlemX product areas
- ✅ Background sentiment, intent, keyword, and language tagging on every message
- ✅ Automatic escalation flagging when complaints are detected
- ✅ Peak activity hours and user language breakdown in analytics
- ✅ Mobile app on iOS, Android, and web browser (Vercel)
- ✅ Persistent PostgreSQL on Railway — data survives all redeployments
- ✅ "Start New Conversation" always creates a fresh thread
- ✅ Rate limiter working correctly behind Railway's proxy

---

*AlemX AI Support — Built with React Native, Express.js, PostgreSQL, and the Anthropic / OpenAI APIs.*  
*Contact: hello@alemx.com | alemx.com*
