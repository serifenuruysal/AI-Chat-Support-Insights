import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useChat } from '../../hooks/useChat';
import type { Message } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg, isFirst, isLast, showAvatar,
}: {
  msg: Message; isFirst: boolean; isLast: boolean; showAvatar: boolean;
}) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const br = isUser
    ? `${isFirst ? 18 : 6}px ${isFirst ? 18 : 6}px ${isLast ? 4 : 6}px 18px`
    : `${isFirst ? 18 : 6}px ${isFirst ? 18 : 6}px 18px ${isLast ? 4 : 6}px`;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: isLast ? 12 : 3,
        paddingLeft: isUser ? 0 : 40,
        position: 'relative',
        animation: 'msgIn 0.18s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* AI avatar — only on first message of group */}
      {!isUser && showAvatar && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#fff',
          flexShrink: 0, position: 'absolute', left: 0, bottom: 0,
        }}>AI</div>
      )}

      <div style={{ maxWidth: '68%', position: 'relative' }}>
        <div style={{
          background: isUser ? '#6366f1' : 'var(--color-background-secondary)',
          color: isUser ? '#fff' : 'var(--color-text-primary)',
          borderRadius: br,
          padding: '9px 13px',
          fontSize: 14,
          lineHeight: 1.55,
          border: isUser ? 'none' : '0.5px solid var(--color-border-tertiary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 1px 4px rgba(99,102,241,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {msg.content}
        </div>

        {/* Copy button — AI messages only, on hover */}
        {!isUser && hovered && (
          <button
            onClick={copy}
            title="Copy message"
            style={{
              position: 'absolute', top: 6, right: -28,
              width: 22, height: 22, borderRadius: 6,
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: copied ? '#22c55e' : 'var(--color-text-tertiary)',
              fontSize: 11, transition: 'all 0.15s',
            }}
          >
            {copied ? '✓' : '⎘'}
          </button>
        )}

        {/* Timestamp + provider — only on last of group */}
        {isLast && (
          <div style={{
            fontSize: 11, color: 'var(--color-text-tertiary)',
            marginTop: 3, textAlign: isUser ? 'right' : 'left',
            paddingLeft: 2, paddingRight: 2,
          }}>
            {timeLabel(msg.created_at)}
            {msg.ai_provider && (
              <span style={{ marginLeft: 5, opacity: 0.6 }}>
                · {msg.ai_provider}{msg.latency_ms ? ` ${msg.latency_ms}ms` : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Failed message ────────────────────────────────────────────────────────────
function FailedMessage({ content, onRetry }: { content: string; onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div style={{ maxWidth: '68%' }}>
        <div style={{
          background: '#fee2e2', color: '#991b1b',
          borderRadius: '18px 18px 4px 18px',
          padding: '9px 13px', fontSize: 14, lineHeight: 1.55,
          border: '0.5px solid #fca5a5',
        }}>{content}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: '#ef4444' }}>Failed to send</span>
          <button onClick={onRetry} style={{
            fontSize: 11, color: '#6366f1', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
          }}>Retry</button>
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12, paddingLeft: 40, animation: 'msgIn 0.18s ease-out' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
      }}>AI</div>
      <div style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '18px 18px 18px 4px',
        padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-text-tertiary)',
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '👛', text: 'How do I set up my Solana wallet?' },
  { icon: '💳', text: 'My payment card was declined' },
  { icon: '💰', text: 'What is the Paid Attention Marketplace?' },
  { icon: '🔐', text: 'I lost access to my account' },
  { icon: '📋', text: 'How does KYC verification work?' },
  { icon: '⚡', text: 'What are USDC transfer fees?' },
];

// ─── Main component ────────────────────────────────────────────────────────────
export function ChatWindow({ userId }: { userId: string }) {
  const {
    conversations, activeConvId, setActiveConvId,
    messages, isTyping, isLoading, error,
    sendMessage, newConversation, bottomRef,
  } = useChat(userId);

  const [input, setInput]           = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [failedMsg, setFailedMsg]   = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setFailedMsg(null);
    sendMessage(text).catch(() => setFailedMsg(text));
  }, [input, isLoading, sendMessage]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredConvs = conversations.filter(c =>
    !search || c.first_message?.toLowerCase().includes(search.toLowerCase())
  );

  // Group consecutive messages by role
  type Group = { role: string; msgs: Message[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.role === msg.role) last.msgs.push(msg);
    else groups.push({ role: msg.role, msgs: [msg] });
  }

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--color-background-primary)' }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes msgIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .conv-item { transition: background 0.12s; }
        .conv-item:hover { background: var(--color-background-primary) !important; }
        .send-btn:hover:not(:disabled) { background: #4f46e5 !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn { transition: background 0.15s, transform 0.1s; }
        .sugg-btn { transition: all 0.15s; }
        .sugg-btn:hover { background: #ede9fe !important; border-color: #6366f1 !important; color: #4f46e5 !important; transform: translateY(-1px); }
        .search-input:focus { outline: none; border-color: #6366f1 !important; }
        .chat-textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .new-conv-btn:hover { background: #4f46e5 !important; }
        .new-conv-btn { transition: background 0.15s; }
        .sidebar-toggle:hover { background: var(--color-background-secondary) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 2px; }
      `}</style>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div style={{
          width: 256, flexShrink: 0,
          borderRight: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--color-background-secondary)',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '14px 12px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Conversations
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {userId.slice(-6)}
              </span>
            </div>
            <button
              className="new-conv-btn"
              onClick={newConversation}
              style={{
                width: '100%', padding: '8px 12px',
                background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New conversation
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%', padding: '6px 10px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 8, fontSize: 12,
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {filteredConvs.length === 0 ? (
              <div style={{ padding: '16px', fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                {search ? 'No matches' : 'No conversations yet'}
              </div>
            ) : filteredConvs.map(conv => (
              <div
                key={conv.id}
                className="conv-item"
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  background: conv.id === activeConvId ? 'var(--color-background-primary)' : 'transparent',
                  borderLeft: conv.id === activeConvId ? '2.5px solid #6366f1' : '2.5px solid transparent',
                }}
              >
                <div style={{
                  fontSize: 13, color: 'var(--color-text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: conv.id === activeConvId ? 500 : 400,
                }}>
                  {conv.first_message || 'New conversation'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    {conv.message_count} messages
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    {relativeTime(conv.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-background-primary)',
        }}>
          {/* Sidebar toggle */}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-secondary)', fontSize: 14, flexShrink: 0,
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>AI</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Support Assistant
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
              {isTyping ? 'Typing…' : 'Online'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 8px' }}>

          {isEmpty ? (
            /* Empty state */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff', marginBottom: 16,
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}>AI</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                How can I help you today?
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 28, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                Ask anything about your wallet, payment card, or the app. I'm here to help.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
                {SUGGESTED.map(s => (
                  <button
                    key={s.text}
                    className="sugg-btn"
                    onClick={() => sendMessage(s.text)}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--color-background-secondary)',
                      border: '0.5px solid var(--color-border-secondary)',
                      borderRadius: 12, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 8,
                      color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.4,
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message groups */
            groups.map((group, gi) =>
              group.msgs.map((msg, mi) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isFirst={mi === 0}
                  isLast={mi === group.msgs.length - 1}
                  showAvatar={mi === group.msgs.length - 1}
                />
              ))
            )
          )}

          {isTyping && <TypingIndicator />}

          {failedMsg && (
            <FailedMessage
              content={failedMsg}
              onRetry={() => { sendMessage(failedMsg); setFailedMsg(null); }}
            />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '10px 16px 14px',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-primary)',
        }}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 16, padding: '8px 8px 8px 14px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>
            <textarea
              ref={inputRef}
              className="chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message Support Assistant…"
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1, resize: 'none',
                border: 'none', background: 'transparent',
                fontSize: 14, lineHeight: 1.5,
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit', overflow: 'hidden',
                minHeight: 24, maxHeight: 120,
                outline: 'none', padding: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: input.trim() ? '#6366f1' : 'var(--color-border-secondary)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', paddingRight: 2 }}>
                {input.length > 0 ? `${input.length}` : '↵ send'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
