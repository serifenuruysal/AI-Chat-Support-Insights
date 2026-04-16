/**
 * Seed script — generates 30 days of realistic demo data.
 * Run: node src/db/seed.js
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./index');
require('./migrate');

const { analyzeMessage } = require('../services/analyticsService');

const DEMO_USERS = Array.from({ length: 20 }, (_, i) => `user-${i.toString().padStart(3,'0')}`);

const SAMPLE_MESSAGES = [
  // Complaints
  "My transaction has been stuck for 3 hours and I can't see my funds",
  "The app crashed when I tried to send USDC and now my balance is wrong",
  "Payment card keeps getting declined even though I have enough balance",
  "I can't complete KYC verification, it keeps saying my document is invalid",
  "Really frustrated — lost 2 hours trying to set up my wallet with no help",
  "The messenger is not sending messages, they just stay at pending forever",
  "My card was charged twice for the same purchase, this is unacceptable",
  "App is extremely slow and keeps freezing on the portfolio page",
  // Questions
  "How do I set up my self-custodial Solana wallet for the first time?",
  "What is the daily spending limit on the payment card?",
  "How does the Paid Attention Marketplace work exactly?",
  "Where can I see my transaction history for USDC transfers?",
  "Can I use the payment card internationally?",
  "How long does KYC verification normally take?",
  "What are the fees for sending USDC?",
  // Feature requests
  "It would be great if you could add support for other Solana tokens, not just USDC",
  "Please add a dark mode to the app, it would really help at night",
  "Would love to have push notifications for incoming messages and payments",
  "Can you add Apple Pay or Google Pay support for the card?",
  "Wish there was a desktop version of the app",
  // Positive
  "The wallet setup was really easy, great experience!",
  "Love the Paid Attention Marketplace idea, very innovative",
  "Support team was very helpful, resolved my issue quickly",
  "The app is fast and the UI is clean, well done",
  "KYC verification was surprisingly quick, approved in minutes",
];

async function seed() {
  const db = getDb();

  console.log('🌱 Seeding demo data...');

  // Clear existing demo data
  db.prepare("DELETE FROM message_analytics WHERE user_id LIKE 'user-%'").run();
  db.prepare("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id LIKE 'user-%')").run();
  db.prepare("DELETE FROM conversations WHERE user_id LIKE 'user-%'").run();
  db.prepare("DELETE FROM topic_summary").run();

  const now = Date.now();
  const DAY = 86400000;

  let totalInserted = 0;

  for (const userId of DEMO_USERS) {
    // Each user has 1-4 conversations over 30 days
    const numConvs = 1 + Math.floor(Math.random() * 3);

    for (let c = 0; c < numConvs; c++) {
      const convId = uuidv4();
      const convDaysAgo = Math.random() * 30;
      const convTs = new Date(now - convDaysAgo * DAY).toISOString();

      db.prepare('INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(convId, userId, convTs, convTs);

      // 2-6 messages per conversation
      const numMsgs = 2 + Math.floor(Math.random() * 4);
      for (let m = 0; m < numMsgs; m++) {
        if (Math.random() < 0.5) {
          // User message
          const content = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
          const msgId = uuidv4();
          const msgTs = new Date(now - (convDaysAgo - m * 0.01) * DAY).toISOString();

          db.prepare('INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(msgId, convId, 'user', content, msgTs);

          // Analyze synchronously for seeding
          try {
            await analyzeMessage({ messageId: msgId, conversationId: convId, userId, content });
            totalInserted++;
          } catch (e) { console.error('Analyze error:', e); }
        }
      }
    }
  }

  console.log(`✅ Seeded ${totalInserted} analyzed messages across ${DEMO_USERS.length} users`);

  // Print summary
  const totals = db.prepare('SELECT COUNT(*) as n FROM message_analytics').get();
  const complaints = db.prepare('SELECT COUNT(*) as n FROM message_analytics WHERE is_complaint = 1').get();
  const topics = db.prepare('SELECT COUNT(*) as n FROM topic_summary').get();
  console.log(`📊 Analytics: ${totals.n} total, ${complaints.n} complaints, ${topics.n} topic clusters`);
}

seed().catch(console.error);
