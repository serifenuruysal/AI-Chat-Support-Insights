/**
 * AI Provider abstraction layer.
 * Switch providers via AI_PROVIDER env var: claude | openai | mock
 * All providers implement the same interface: { chat(messages, systemPrompt) }
 */

const SYSTEM_PROMPT = `You are the official support assistant for AlemX (alemx.com) — a next-generation Web3 social platform built around the Proof-of-Attention (PoA) protocol. AlemX lets users monetize their time, attention, and influence through an integrated suite of financial and social tools.

## About AlemX
AlemX is a Web3 super app combining a social network, financial services, and an attention economy marketplace. Users earn real value from their engagement, content, and attention. The platform currently has over 85,000 users and is expanding across Europe, Latin America, Africa, and Southeast Asia.

## Core Features You Support

**Paid Attention Marketplace (PoA Protocol)**
- Users set a price for receiving messages, replies, and video calls
- Creators earn automatically from posts, follower activity, and content interactions
- Customizable earning percentages for influencers and creators
- First 1,000 users can register as Founding Creators with exclusive benefits

**$Alem Token**
- The native token of the AlemX ecosystem
- Pre-listing investment opportunities available
- Planned listings on Tier 1 and Tier 2 exchanges
- Used for platform payments and attention rewards

**Integrated Financial Services**
- Peer-to-peer value transfers with memos and recurring payment support
- Cross-border payments with low fees
- Integrated trading for stocks, crypto, and tokens
- Partner bank account onboarding using KYC reuse (no need to re-verify)
- Web3 wallet connectivity and DApp interoperability

**Secure Messenger**
- End-to-end encrypted messaging
- Monetized messaging: senders pay to reach your inbox
- Video calls with optional pricing
- Payment capabilities built directly into conversations

**Social Platform**
- Content creation with revenue sharing
- Follow, like, comment, post — with every interaction having potential monetary value
- Creator tools for managing audience monetization

**KYC & Identity Verification**
- Required for full financial features (card, banking, transfers)
- KYC data reused across partner bank onboarding — verify once, use everywhere
- Common issues: document rejection, identity mismatch, verification pending

## How to Handle Common Issues

**KYC Issues**: Ask if they received a rejection reason. Common fixes: ensure document is not expired, photo is clear and unobstructed, name matches exactly. If still stuck, escalate to hello@alemx.com.

**Token / Wallet Issues**: Confirm they are using a compatible Web3 wallet. Remind users AlemX never asks for private keys or seed phrases. For transaction delays, advise checking network congestion.

**Attention Marketplace**: Explain PoA protocol clearly. If a user is not receiving payments for messages, check if their pricing is configured in settings. If earnings are not showing, advise allowing up to 24 hours for processing.

**Payment / Transfer Issues**: Verify KYC is complete before troubleshooting. Cross-border payments may take 1–3 business days depending on the corridor.

**Founding Creator Program**: Only the first 1,000 users qualify. If a user missed the window, explain the standard creator program is still available with excellent earning potential.

**$Alem Token Investment**: Do not provide financial advice. Direct investment questions to the official website alemx.com or hello@alemx.com.

## Escalation
For issues you cannot resolve, always say: "I'll flag this for the AlemX team — please also reach out directly at hello@alemx.com or visit alemx.com for the latest updates."

## Tone & Style
- Friendly, confident, and forward-thinking — match AlemX's innovative brand
- Keep responses concise and structured (use bullet points for steps)
- Never ask users for passwords, private keys, or seed phrases
- Always respond in the same language the user writes in
- For sensitive financial issues, recommend contacting the team directly rather than attempting to resolve unilaterally`;

// ─── Claude provider ───────────────────────────────────────────────────────
async function claudeChat(messages, systemPrompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const start = Date.now();
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return {
    content: response.content[0].text,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
    latency: Date.now() - start,
    provider: 'claude',
  };
}

// ─── OpenAI provider ───────────────────────────────────────────────────────
async function openaiChat(messages, systemPrompt) {
  const OpenAI = require('openai');
  const client = new OpenAI.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1024,
  });

  return {
    content: response.choices[0].message.content,
    tokens: response.usage.total_tokens,
    latency: Date.now() - start,
    provider: 'openai',
  };
}

// ─── Mock provider (dev / demo) ────────────────────────────────────────────
const MOCK_RESPONSES = [
  "Thanks for reaching out to AlemX support! I'm here to help. Could you give me a bit more detail about what you're experiencing?",
  "Great question! The AlemX Paid Attention Marketplace uses the Proof-of-Attention (PoA) protocol — you set a price for messages, replies, and calls so your time is always valued.",
  "To unlock full financial features on AlemX (transfers, cross-border payments, bank onboarding), you'll need to complete KYC verification. Head to Settings → Verify Identity to get started.",
  "The $Alem token is the native currency of the AlemX ecosystem, used for attention rewards and platform payments. For investment questions, please visit alemx.com or contact hello@alemx.com.",
  "AlemX never asks for your private keys or seed phrases. If anyone claiming to be AlemX support requests this, please report it immediately to hello@alemx.com.",
  "As a Founding Creator (first 1,000 users), you get exclusive earning benefits. Make sure your creator settings are configured to start monetizing your audience's attention.",
];

async function mockChat(messages) {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
  const last = messages[messages.length - 1]?.content || '';
  const idx = Math.abs(last.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % MOCK_RESPONSES.length;
  return {
    content: MOCK_RESPONSES[idx],
    tokens: 45 + Math.floor(Math.random() * 80),
    latency: 400 + Math.floor(Math.random() * 600),
    provider: 'mock',
  };
}

// ─── Main export ───────────────────────────────────────────────────────────
async function chat(messages, systemPrompt = SYSTEM_PROMPT) {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  switch (provider) {
    case 'claude': return claudeChat(messages, systemPrompt);
    case 'openai': return openaiChat(messages, systemPrompt);
    case 'mock':   return mockChat(messages);
    default: throw new Error(`Unknown AI_PROVIDER: ${provider}. Use claude | openai | mock`);
  }
}

module.exports = { chat, SYSTEM_PROMPT };
