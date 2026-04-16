import { useState, useRef, useCallback } from 'react';
import { api } from '../../services/api';

// ─── Personas (mirrors scripts/test-conversations.js) ─────────────────────────
const PERSONAS = [
  {
    id: 'frustrated_user',
    label: '😤 Frustrated User',
    description: 'Has a real problem, getting increasingly annoyed',
    userId: 'test-user-frustrated',
    color: '#ef4444',
    bg: '#fee2e2',
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
    id: 'curious_new_user',
    label: '🤔 Curious New User',
    description: 'Just signed up, exploring features',
    userId: 'test-user-curious',
    color: '#6366f1',
    bg: '#ede9fe',
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
    id: 'happy_power_user',
    label: '😊 Happy Power User',
    description: 'Loves the product, has feature ideas',
    userId: 'test-user-happy',
    color: '#22c55e',
    bg: '#dcfce7',
    conversations: [
      {
        title: 'Positive feedback',
        messages: [
          'just wanted to say the wallet setup was super easy, great job!',
          'the UI is really clean and fast',
          'one thing I would love is push notifications for incoming payments',
          'also would be amazing to have Apple Pay support for the card',
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
    id: 'kyc_support',
    label: '📋 KYC Support Seeker',
    description: 'Struggling with identity verification',
    userId: 'test-user-kyc',
    color: '#f59e0b',
    bg: '#fef3c7',
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
    id: 'technical_user',
    label: '🔧 Technical User',
    description: 'Asks detailed technical and security questions',
    userId: 'test-user-technical',
    color: '#06b6d4',
    bg: '#cffafe',
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
        title: 'Transaction fees',
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

// ─── Types ─────────────────────────────────────────────────────────────────────
type MsgStatus = 'pending' | 'sending' | 'done' | 'error';

interface LogEntry {
  id: string;
  personaId: string;
  personaLabel: string;
  convTitle: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  latency?: number;
  provider?: string;
  status: MsgStatus;
}

type RunStatus = 'idle' | 'running' | 'done' | 'stopped';

// ─── Component ─────────────────────────────────────────────────────────────────
export function TestRunner() {
  const [selected,   setSelected]   = useState<Set<string>>(new Set(PERSONAS.map(p => p.id)));
  const [log,        setLog]        = useState<LogEntry[]>([]);
  const [runStatus,  setRunStatus]  = useState<RunStatus>('idle');
  const [stats,      setStats]      = useState({ sent: 0, done: 0, errors: 0, total: 0 });
  const stopRef  = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setLog(prev => [...prev, { ...entry, id }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    return id;
  }, []);

  const updateLog = useCallback((id: string, patch: Partial<LogEntry>) => {
    setLog(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const togglePersona = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalMessages = PERSONAS
    .filter(p => selected.has(p.id))
    .reduce((n, p) => n + p.conversations.reduce((m, c) => m + c.messages.length, 0), 0);

  const run = async () => {
    stopRef.current = false;
    setLog([]);
    setRunStatus('running');
    setStats({ sent: 0, done: 0, errors: 0, total: totalMessages });

    const personas = PERSONAS.filter(p => selected.has(p.id));
    let sent = 0, done = 0, errors = 0;

    for (const persona of personas) {
      if (stopRef.current) break;

      addLog({
        personaId: persona.id, personaLabel: persona.label,
        convTitle: '', role: 'system',
        content: `Starting ${persona.label} — ${persona.description}`,
        status: 'done',
      });

      for (const conv of persona.conversations) {
        if (stopRef.current) break;

        addLog({
          personaId: persona.id, personaLabel: persona.label,
          convTitle: conv.title, role: 'system',
          content: `Conversation: "${conv.title}"`,
          status: 'done',
        });

        let conversationId: string | undefined;

        for (const message of conv.messages) {
          if (stopRef.current) break;

          // User message
          const userLogId = addLog({
            personaId: persona.id, personaLabel: persona.label,
            convTitle: conv.title, role: 'user',
            content: message, status: 'sending',
          });

          // AI placeholder
          const aiLogId = addLog({
            personaId: persona.id, personaLabel: persona.label,
            convTitle: conv.title, role: 'ai',
            content: '', status: 'pending',
          });

          sent++;
          setStats(s => ({ ...s, sent }));

          try {
            const result = await api.sendMessage(persona.userId, message, conversationId);
            conversationId = result.conversationId;
            updateLog(userLogId, { status: 'done' });
            updateLog(aiLogId, {
              content: result.content,
              latency: result.latency,
              provider: result.provider,
              status: 'done',
            });
            done++;
            setStats(s => ({ ...s, done }));
          } catch (err: any) {
            updateLog(userLogId, { status: 'error' });
            updateLog(aiLogId, { content: err.message, status: 'error' });
            errors++;
            setStats(s => ({ ...s, errors }));
          }

          // Small delay between messages
          await new Promise(r => setTimeout(r, 600));
        }

        // Delay between conversations
        await new Promise(r => setTimeout(r, 800));
      }
    }

    setRunStatus(stopRef.current ? 'stopped' : 'done');
  };

  const stop = () => { stopRef.current = true; };
  const reset = () => { setLog([]); setRunStatus('idle'); setStats({ sent: 0, done: 0, errors: 0, total: 0 }); };

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .persona-card { border: 1.5px solid var(--color-border-secondary); border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.15s; user-select: none; }
        .persona-card:hover { border-color: #6366f1; }
        .persona-card.selected { border-color: #6366f1; background: #ede9fe; }
        .run-btn { border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
        .run-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .log-row { padding: 6px 0; border-bottom: 0.5px solid var(--color-border-tertiary); animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 2px; }
      `}</style>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left panel: config ── */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', flexDirection: 'column', padding: 16, gap: 16,
          overflowY: 'auto', background: 'var(--color-background-secondary)',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              Personas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PERSONAS.map(p => {
                const isSel = selected.has(p.id);
                const convCount = p.conversations.length;
                const msgCount  = p.conversations.reduce((n, c) => n + c.messages.length, 0);
                return (
                  <div
                    key={p.id}
                    className={`persona-card${isSel ? ' selected' : ''}`}
                    onClick={() => runStatus !== 'running' && togglePersona(p.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.label}</span>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: `1.5px solid ${isSel ? '#6366f1' : 'var(--color-border-secondary)'}`,
                        background: isSel ? '#6366f1' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isSel && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{p.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                      {convCount} conversations · {msgCount} messages
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Select all / none */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setSelected(new Set(PERSONAS.map(p => p.id)))}
                style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Select all
              </button>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>·</span>
              <button onClick={() => setSelected(new Set())}
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                None
              </button>
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <div><strong>{selected.size}</strong> personas · <strong>{totalMessages}</strong> messages</div>
            <div style={{ marginTop: 2, color: 'var(--color-text-tertiary)' }}>~{Math.ceil(totalMessages * 1.5)}s estimated</div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {runStatus !== 'running' ? (
              <button
                className="run-btn"
                onClick={run}
                disabled={selected.size === 0}
                style={{ background: '#6366f1', color: '#fff' }}
              >
                ▶ Run Test Scenarios
              </button>
            ) : (
              <button
                className="run-btn"
                onClick={stop}
                style={{ background: '#ef4444', color: '#fff' }}
              >
                ■ Stop
              </button>
            )}
            {(runStatus === 'done' || runStatus === 'stopped') && (
              <button
                className="run-btn"
                onClick={reset}
                style={{ background: 'var(--color-background-tertiary)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-secondary)' }}
              >
                ↺ Reset
              </button>
            )}
          </div>

          {/* Progress */}
          {runStatus !== 'idle' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {runStatus === 'running' ? 'Running…' : runStatus === 'done' ? '✓ Complete' : '■ Stopped'}
                </span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{stats.done}/{stats.total}</span>
              </div>
              <div style={{ height: 6, background: 'var(--color-border-secondary)', borderRadius: 3 }}>
                <div style={{
                  height: 6, borderRadius: 3, transition: 'width 0.3s ease',
                  width: `${progress}%`,
                  background: runStatus === 'done' ? '#22c55e' : stats.errors > 0 ? '#f59e0b' : '#6366f1',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11 }}>
                <span style={{ color: '#22c55e' }}>✓ {stats.done} done</span>
                {stats.errors > 0 && <span style={{ color: '#ef4444' }}>✗ {stats.errors} errors</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: live log ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Log header */}
          <div style={{
            padding: '10px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-background-primary)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Live output {log.length > 0 && <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>· {log.filter(l => l.role !== 'system').length / 2 | 0} exchanges</span>}
            </span>
            {log.length > 0 && (
              <button onClick={() => setLog([])} style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>

          {/* Log body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
            {log.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{ fontSize: 32 }}>🧪</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>Ready to run</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 320 }}>
                  Select personas on the left and click <strong>Run Test Scenarios</strong>. Messages will stream here in real time.
                </div>
              </div>
            ) : (
              log.map(entry => {
                if (entry.role === 'system') {
                  return (
                    <div key={entry.id} className="log-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{entry.content}</span>
                      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
                    </div>
                  );
                }

                const persona = PERSONAS.find(p => p.id === entry.personaId)!;
                const isUser  = entry.role === 'user';
                const isPending = entry.status === 'pending';
                const isError   = entry.status === 'error';

                return (
                  <div key={entry.id} className="log-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Role badge */}
                    <div style={{
                      flexShrink: 0, marginTop: 2,
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: isUser ? persona.bg : 'var(--color-background-secondary)',
                      color: isUser ? persona.color : '#6366f1',
                      minWidth: 28, textAlign: 'center',
                    }}>
                      {isUser ? 'USR' : 'AI'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isPending ? (
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                          <span style={{ animation: 'pulse 1s infinite' }}>···</span>
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 13, lineHeight: 1.5,
                          color: isError ? '#ef4444' : 'var(--color-text-primary)',
                        }}>
                          {entry.content}
                        </span>
                      )}
                      {entry.latency && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          {entry.provider} · {entry.latency}ms
                        </span>
                      )}
                    </div>

                    {/* Status icon */}
                    <div style={{ flexShrink: 0, fontSize: 12, marginTop: 2 }}>
                      {entry.status === 'sending'  && <span style={{ color: '#f59e0b' }}>⟳</span>}
                      {entry.status === 'done'     && <span style={{ color: '#22c55e' }}>✓</span>}
                      {entry.status === 'error'    && <span style={{ color: '#ef4444' }}>✗</span>}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
