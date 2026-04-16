/**
 * AI Provider abstraction layer.
 * Switch providers via AI_PROVIDER env var: claude | openai | mock
 * All providers implement the same interface: { chat(messages, systemPrompt) }
 */

const SYSTEM_PROMPT = `You are a helpful support assistant for a Web3 super app that includes 
a self-custodial Solana wallet, payment card, encrypted messenger, social platform, 
and a Paid Attention Marketplace. You help users with:
- Wallet and transaction issues
- Payment card questions
- App navigation and features
- Bug reports and technical issues
- General product questions

Be concise, friendly, and professional. If you cannot resolve an issue, 
acknowledge it clearly and suggest escalating to the team.
Always respond in the same language the user writes in.`;

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
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
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
  "Thanks for reaching out! I can help you with that. Could you provide more details about the issue you're experiencing?",
  "I understand the frustration. Let me look into this for you. Your wallet address is safe and your funds are secure.",
  "That's a great question! The Paid Attention Marketplace allows you to earn USDC by engaging with sponsored content from verified brands.",
  "For payment card issues, please ensure your KYC verification is complete. This usually resolves most card activation problems.",
  "I've noted your feedback. Our team is working on improving the transaction speed. Expected update in the next release.",
  "The self-custodial wallet means only you hold your private keys. We never have access to your funds.",
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
