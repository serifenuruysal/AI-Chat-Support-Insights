# Pulse AI — Support Chatbot + Analytics

AI-powered customer support chatbot with real-time analytics for a Web3 super app. Multi-turn conversations, sentiment analysis, intent detection, and a built-in test runner to simulate realistic user scenarios.

---

## Project Structure

```
messengerDemo/
├── ai-chatbot/          # Web app (React + Node.js backend)
│   ├── backend/         # Express API + WebSocket + SQLite
│   ├── frontend/        # React + TypeScript (Vite)
│   └── scripts/         # Automated test runner
└── pulse-ai/            # React Native app (iOS + Android + Web)
    └── src/
        ├── screens/     # Chat, Analytics, Conversations, Settings
        ├── hooks/       # useChat state management
        └── services/    # API client
```

---

## Quick Start (Web App)

### Option A — One command
```bash
cd ai-chatbot
./start.sh
```
Opens backend on `:4000` and frontend on `:5173`.

### Option B — Manual
```bash
# Terminal 1 — Backend
cd ai-chatbot/backend
cp .env.example .env      # then edit AI provider settings
npm install
npm run db:migrate
npm run dev

# Terminal 2 — Frontend
cd ai-chatbot/frontend
npm install
npm run dev
```

### Option C — Docker
```bash
cd ai-chatbot
cp backend/.env.example backend/.env   # edit as needed
docker compose up --build
```
Opens at `http://localhost:3000`

---

## AI Provider Setup

Edit `ai-chatbot/backend/.env`:

```env
# Mock — no API key needed, good for UI testing
AI_PROVIDER=mock

# OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Claude (Anthropic)
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
```

No code changes needed — restart the backend after editing `.env`.

---

## Demo vs Live Mode

Both the web app and mobile app have a **Demo / Live** toggle in the Analytics tab.

| Mode | Data source | Use case |
|------|-------------|----------|
| **Demo** | Built-in mock dataset (284 messages, 5 topics, 14-day trend) | Show stakeholders without a running backend |
| **Live** | Real backend API (`GET /api/analytics/overview`) | Actual production or test data |

Switch between them with the **Demo / Live** pill in the top-right of the Analytics page. In Live mode with no data yet, an empty state guides you to start a conversation first.

---

## Test Scenarios

### Manual testing (UI Test Runner)

The web app has a built-in **Test Runner** panel (third tab in the sidebar).

1. Open `http://localhost:5173`
2. Click the **Tests** tab (flask icon)
3. Select one or more personas and click **Run**
4. Watch live turn-by-turn conversation logs with latency and status

Available personas:

| Persona | Scenario | What it tests |
|---------|----------|---------------|
| 😤 **Frustrated User** | Stuck transaction → escalates | Negative sentiment, complaint intent |
| 🤔 **Curious New User** | Onboarding questions, KYC | Neutral/positive sentiment, support intent |
| 😊 **Happy Power User** | Feature praise + suggestions | Positive sentiment, feature_request intent |
| 🛟 **KYC Support** | Document rejection issues | Negative sentiment, support/complaint mix |
| 🔧 **Technical User** | API, limits, advanced questions | Neutral sentiment, question intent |

Each persona runs 2–3 multi-turn conversations. Results appear in real time in the right panel.

### Automated testing (CLI script)

Run all 5 personas against the live backend:

```bash
cd ai-chatbot
node scripts/test-conversations.js
```

Options:
```bash
# Preview what will be sent — no API calls
node scripts/test-conversations.js --dry-run

# Run a single persona
node scripts/test-conversations.js --persona frustrated_user
node scripts/test-conversations.js --persona curious_new_user
node scripts/test-conversations.js --persona happy_power_user
node scripts/test-conversations.js --persona kyc_support
node scripts/test-conversations.js --persona technical_user
```

After the script finishes, switch Analytics to **Live** mode to see sentiment, intent, and topic data populated from the test conversations.

### What to verify after testing

- **Analytics > Live mode**: Total messages count increases
- **Sentiment breakdown**: Mix of positive / neutral / negative bars
- **Message intent**: Complaints from frustrated_user, feature requests from happy_power_user
- **Top topics**: wallet, kyc, payment_card should appear
- **Recent complaints**: Last few negative messages listed

---

## Mobile App (pulse-ai)

### Run locally
```bash
cd pulse-ai
npx expo start
```
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for browser
- Scan QR code in **Expo Go** app for physical device

### Connect to backend (real device)
Edit `pulse-ai/src/services/api.ts`:
```ts
// Find your Mac's local IP: System Preferences → Network
export const BASE_URL = 'http://192.168.1.42:4000';
```

---

## Deployment

### Web App → Railway (recommended)

The project includes a `railway.toml` config.

1. Push the repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select the `ai-chatbot/` folder as root (or set root in Railway settings)
4. Add environment variables in the Railway dashboard:

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
NODE_ENV=production
```

5. Railway assigns a public URL — update `BASE_URL` in the frontend and redeploy.

### Web App → Docker / VPS

```bash
cd ai-chatbot
docker compose up -d --build
```

Runs backend + nginx reverse proxy. Exposes port `3000`.

### Web App → Vercel (frontend) + Railway (backend)

Split deploy for cheaper hosting:
1. Deploy `ai-chatbot/backend/` to Railway (Node service)
2. Set `VITE_API_URL=https://your-railway-app.up.railway.app` in Vercel env vars
3. Deploy `ai-chatbot/frontend/` to Vercel

### Mobile App → Web (Vercel / Netlify)

```bash
cd pulse-ai
npx expo export --platform web
npx vercel dist/
```

### Mobile App → App Stores (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure          # one-time project setup

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios     # → App Store Connect / TestFlight
eas submit --platform android # → Google Play Console
```

For internal testing before submitting:
```bash
eas build --platform ios --profile preview
```

---

## API Reference

### Chat
```
POST /api/chat/message
  Body:    { userId, content, conversationId? }
  Returns: { conversationId, content, provider, latency }

GET /api/chat/conversations?userId=
GET /api/chat/messages/:conversationId?userId=
```

### Analytics
```
GET /api/analytics/overview?days=30
  Returns: {
    total, complaints, feature_requests,
    avg_sentiment, avg_latency_ms,
    active_users, returning_users,
    sentiment_breakdown, by_intent, top_topics,
    daily_volume, recent_complaints, peak_hours
  }
```

### WebSocket (`ws://localhost:4000/ws`)
```json
// Send
{ "type": "message", "userId": "...", "content": "...", "conversationId": "..." }

// Receive
{ "type": "typing", "conversationId": "..." }
{ "type": "reply",  "conversationId": "...", "content": "...", "provider": "openai", "latency": 320 }
{ "type": "error",  "error": "..." }
```

---

## Feature Overview

### Chat
- Real-time WebSocket messaging with typing indicator
- Multi-turn conversation history with context window
- Suggested prompts for new conversations
- Auto-resize input, message grouping, copy on hover
- Conversation search and list view
- 5 switchable test user slots

### Analytics
- Sentiment analysis — positive / neutral / negative per message
- Intent detection — complaint / feature_request / question / support / general
- Topic extraction — wallet, KYC, card, marketplace, performance
- Daily volume trend chart
- Peak hours bar chart
- User retention (active vs returning)
- Complaint feed with topic badges
- Demo / Live toggle
- Auto-refresh every 30 seconds (Live mode)
- Export complaints to CSV

### Test Runner
- 5 realistic personas with multi-turn scripts
- Real-time log with latency per message
- Progress bar, start / stop / reset controls
- CLI script for headless / CI runs

---

## Production Checklist

- [ ] Replace `userId` query param with JWT authentication
- [ ] Swap `better-sqlite3` for PostgreSQL (`pg` package — same query API)
- [ ] Set `NODE_ENV=production` and a strong `SESSION_SECRET`
- [ ] Configure CORS origin to your frontend domain
- [ ] Enable HTTPS (Railway/Vercel handle this automatically)
- [ ] Set rate limits (already at 60 req/min — adjust in `backend/src/index.js`)
- [ ] Update `BASE_URL` in `pulse-ai/src/services/api.ts` to production URL
