/**
 * Automated conversation test runner.
 * Simulates 5 realistic user personas across multi-turn conversations.
 * Hits the live backend so AI responses are real and analytics get populated.
 *
 * Usage:
 *   node scripts/test-conversations.js
 *   node scripts/test-conversations.js --dry-run   (print scenarios, no API calls)
 *   node scripts/test-conversations.js --persona frustrated_user
 */

// resolve paths relative to project root (one level up from scripts/)
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
require(path.join(ROOT, 'backend/node_modules/dotenv')).config({ path: path.join(ROOT, 'backend/.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;
const DRY_RUN  = process.argv.includes('--dry-run');
const ONLY     = process.argv.includes('--persona')
  ? process.argv[process.argv.indexOf('--persona') + 1]
  : null;

const DELAY_BETWEEN_MESSAGES = 800;  // ms — feels more natural, avoids rate limits
const DELAY_BETWEEN_CONVS    = 1200;

// ─── Colour helpers ────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  purple: '\x1b[35m',
};
const log = {
  info:    (s) => console.log(`${c.blue}ℹ${c.reset}  ${s}`),
  success: (s) => console.log(`${c.green}✓${c.reset}  ${s}`),
  warn:    (s) => console.log(`${c.yellow}⚠${c.reset}  ${s}`),
  error:   (s) => console.log(`${c.red}✗${c.reset}  ${s}`),
  user:    (s) => console.log(`  ${c.purple}👤 User:${c.reset} ${s}`),
  ai:      (s) => console.log(`  ${c.cyan}🤖 AI:${c.reset}   ${c.dim}${s.slice(0, 120)}${s.length > 120 ? '…' : ''}${c.reset}`),
  section: (s) => console.log(`\n${c.bold}${s}${c.reset}\n${'─'.repeat(60)}`),
};

// ─── Personas ──────────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id:          'frustrated_user',
    userId:      'test-user-frustrated',
    label:       '😤 Frustrated User',
    description: 'Has a real problem, getting increasingly annoyed',
    conversations: [
      {
        title: 'Stuck transaction',
        messages: [
          'my transaction has been stuck for 3 hours',
          'I already tried restarting the app, still stuck',
          'this is really unacceptable, I need my funds',
          'is there any way to cancel it?',
        ],
      },
      {
        title: 'Card double charge',
        messages: [
          'I was charged twice for the same purchase',
          'the amount is $47.50 and it appeared twice on my bank statement',
          'I want a refund immediately',
        ],
      },
    ],
  },
  {
    id:          'curious_new_user',
    userId:      'test-user-curious',
    label:       '🤔 Curious New User',
    description: 'Just signed up, exploring features, lots of questions',
    conversations: [
      {
        title: 'Wallet setup questions',
        messages: [
          'hi, I just created my account. How do I set up my Solana wallet?',
          'what is a seed phrase and do I need to write it down?',
          'is my wallet self-custodial? what does that mean exactly?',
          'how do I receive USDC from someone?',
        ],
      },
      {
        title: 'Marketplace curiosity',
        messages: [
          'what is the Paid Attention Marketplace?',
          'how much can I earn from it?',
          'do I need to complete KYC first?',
        ],
      },
    ],
  },
  {
    id:          'happy_power_user',
    userId:      'test-user-happy',
    label:       '😊 Happy Power User',
    description: 'Loves the product, gives positive feedback and feature ideas',
    conversations: [
      {
        title: 'Positive feedback + feature request',
        messages: [
          'just wanted to say the wallet setup was super easy, great job!',
          'the UI is really clean and fast',
          'one thing I would love is push notifications for incoming payments',
          'also would be amazing to have Apple Pay support for the card',
          'keep up the great work!',
        ],
      },
      {
        title: 'Feature requests',
        messages: [
          'would it be possible to add support for other Solana tokens beyond USDC?',
          'I would also love a desktop app or at least a web version',
          'dark mode would be nice too',
        ],
      },
    ],
  },
  {
    id:          'kyc_support',
    userId:      'test-user-kyc',
    label:       '📋 KYC Support Seeker',
    description: 'Struggling with identity verification',
    conversations: [
      {
        title: 'KYC verification failing',
        messages: [
          'my KYC verification keeps failing',
          'I submitted my passport but it says the document is invalid',
          'I tried 3 times already',
          'how long does the review process normally take?',
          'is there a way to speak to a human agent?',
        ],
      },
      {
        title: 'Card activation blocked',
        messages: [
          'my payment card is showing as inactive',
          'I completed KYC last week, thought it was approved',
          'the app says pending review but it has been 5 days',
        ],
      },
    ],
  },
  {
    id:          'technical_user',
    userId:      'test-user-technical',
    label:       '🔧 Technical User',
    description: 'Asks detailed technical and security questions',
    conversations: [
      {
        title: 'Security questions',
        messages: [
          'how does the self-custodial wallet work technically?',
          'where are the private keys stored on device?',
          'what happens if I lose my phone?',
          'does the app have 2FA support?',
        ],
      },
      {
        title: 'Transaction fees and speeds',
        messages: [
          'what are the transaction fees for USDC transfers on Solana?',
          'how fast are transactions confirmed?',
          'is there a way to speed up a pending transaction?',
          'what is the maximum transaction limit per day?',
        ],
      },
    ],
  },
];

// ─── API helpers ───────────────────────────────────────────────────────────────
async function sendMessage(userId, content, conversationId) {
  const body = { userId, content };
  if (conversationId) body.conversationId = conversationId;

  const res = await fetch(`${BASE_URL}/api/chat/message`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
  }
  return res.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkBackend() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// ─── Run a single conversation ─────────────────────────────────────────────────
async function runConversation(persona, conv) {
  log.info(`Starting: "${conv.title}"`);
  let conversationId = null;
  const results = [];

  for (const message of conv.messages) {
    log.user(message);

    if (DRY_RUN) {
      log.ai('[dry run — no API call]');
      await sleep(100);
      continue;
    }

    try {
      const result = await sendMessage(persona.userId, message, conversationId);
      conversationId = result.conversationId;
      log.ai(result.content);
      results.push({ message, reply: result.content, latency: result.latency, provider: result.provider });
      await sleep(DELAY_BETWEEN_MESSAGES);
    } catch (err) {
      log.error(`Failed: ${err.message}`);
      results.push({ message, error: err.message });
    }
  }

  return { title: conv.title, conversationId, messages: results };
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.purple}╔══════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.purple}║   AI Chatbot — Conversation Test Runner  ║${c.reset}`);
  console.log(`${c.bold}${c.purple}╚══════════════════════════════════════════╝${c.reset}\n`);

  if (DRY_RUN) log.warn('DRY RUN mode — no API calls will be made\n');

  // Check backend is up
  if (!DRY_RUN) {
    log.info(`Checking backend at ${BASE_URL}…`);
    const health = await checkBackend();
    if (!health) {
      log.error(`Backend not reachable at ${BASE_URL}. Start it with: cd backend && npm run dev`);
      process.exit(1);
    }
    log.success(`Backend online — provider: ${c.bold}${health.provider}${c.reset}`);
  }

  const personas = ONLY
    ? PERSONAS.filter(p => p.id === ONLY)
    : PERSONAS;

  if (ONLY && personas.length === 0) {
    log.error(`Unknown persona "${ONLY}". Valid: ${PERSONAS.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  const summary = [];
  let totalMessages = 0;
  let totalErrors   = 0;

  for (const persona of personas) {
    log.section(`${persona.label} — ${persona.description}`);

    for (const conv of persona.conversations) {
      const result = await runConversation(persona, conv);
      const errors = result.messages.filter(m => m.error).length;
      totalMessages += conv.messages.length;
      totalErrors   += errors;

      summary.push({
        persona:  persona.label,
        conv:     conv.title,
        messages: conv.messages.length,
        errors,
        convId:   result.conversationId,
      });

      console.log('');
      await sleep(DELAY_BETWEEN_CONVS);
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  log.section('📊 Run Summary');

  let passedConvs = 0;
  for (const s of summary) {
    const status = s.errors === 0 ? `${c.green}✓ passed${c.reset}` : `${c.red}✗ ${s.errors} error(s)${c.reset}`;
    console.log(`  ${status}  ${c.bold}${s.persona}${c.reset} › ${s.conv} (${s.messages} messages)`);
    if (s.errors === 0) passedConvs++;
  }

  console.log('');
  console.log(`  Total messages sent : ${c.bold}${totalMessages}${c.reset}`);
  console.log(`  Conversations       : ${c.bold}${summary.length}${c.reset} (${c.green}${passedConvs} passed${c.reset}${totalErrors > 0 ? `, ${c.red}${totalErrors} errors${c.reset}` : ''})`);
  console.log(`  Personas tested     : ${c.bold}${personas.length}${c.reset}`);

  if (!DRY_RUN && totalErrors === 0) {
    console.log(`\n  ${c.green}${c.bold}All conversations completed successfully.${c.reset}`);
    console.log(`  ${c.dim}Open Analytics → Live to see the data.${c.reset}\n`);
  } else if (totalErrors > 0) {
    console.log(`\n  ${c.yellow}Completed with ${totalErrors} error(s). Check logs above.${c.reset}\n`);
  }
}

main().catch(err => {
  log.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
