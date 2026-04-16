import { useState } from 'react';
import { ChatWindow } from './components/chat/ChatWindow';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { TestRunner } from './components/testrunner/TestRunner';
import { getOrCreateUserId } from './hooks/useChat';

type Tab  = 'chat' | 'analytics' | 'test';
type Mode = 'demo' | 'live';

const MAX_USERS = 5;
function getUsers() {
  return Array.from({ length: MAX_USERS }, (_, i) => ({
    id:    getOrCreateUserId(`user-slot-${i + 1}`),
    label: `U${i + 1}`,
    full:  `User ${i + 1}`,
  }));
}
const USERS = getUsers();

// ─── Nav icons ────────────────────────────────────────────────────────────────
function IconChat({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#6366f1' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconAnalytics({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#6366f1' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}

function IconTest({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#6366f1' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
    </svg>
  );
}

export default function App() {
  const [tab,          setTab]          = useState<Tab>('chat');
  const [mode,         setMode]         = useState<Mode>('live');
  const [activeUserId, setActiveUserId] = useState(USERS[0].id);

  const activeUser = USERS.find(u => u.id === activeUserId)!;

  const PAGE_TITLES: Record<Tab, string> = {
    chat:      'Messenger',
    analytics: 'Analytics',
    test:      'Test Runner',
  };

  return (
    <div style={{ height: '100vh', display: 'flex', fontFamily: 'var(--font-sans)', background: 'var(--color-background-tertiary)' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 100%; padding: 10px 0; border: none; background: transparent; cursor: pointer; color: var(--color-text-tertiary); font-size: 10px; font-family: var(--font-sans); font-weight: 500; border-radius: 10px; transition: all 0.15s; }
        .nav-item:hover { background: var(--color-background-secondary); color: var(--color-text-secondary); }
        .nav-item.active { color: #6366f1; background: #ede9fe; }
        .user-slot { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid var(--color-border-secondary); background: transparent; cursor: pointer; font-size: 11px; font-weight: 600; font-family: var(--font-sans); color: var(--color-text-secondary); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .user-slot:hover { border-color: #6366f1; color: #6366f1; background: #ede9fe; }
        .user-slot.active { border-color: #6366f1; background: #6366f1; color: #fff; }
        .mode-pill { display: flex; background: var(--color-background-tertiary); border-radius: 8px; padding: 2px; gap: 2px; }
        .mode-pill-btn { border: none; cursor: pointer; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; font-family: var(--font-sans); transition: all 0.15s; background: transparent; color: var(--color-text-secondary); }
        .mode-pill-btn.active-demo { background: #fff; color: #d97706; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .mode-pill-btn.active-live { background: #fff; color: #16a34a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      `}</style>

      {/* ── Left nav rail ── */}
      <div style={{
        width: 64, flexShrink: 0,
        background: 'var(--color-background-primary)',
        borderRight: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '12px 8px',
        gap: 4,
      }}>
        {/* Logo */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, marginBottom: 16,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>

        {/* Nav items */}
        <button className={`nav-item${tab === 'chat' ? ' active' : ''}`} onClick={() => setTab('chat')}>
          <IconChat active={tab === 'chat'} />
          Chat
        </button>

        <button className={`nav-item${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>
          <IconAnalytics active={tab === 'analytics'} />
          Analytics
        </button>

        <button className={`nav-item${tab === 'test' ? ' active' : ''}`} onClick={() => setTab('test')}>
          <IconTest active={tab === 'test'} />
          Tests
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User switcher — only relevant for chat */}
        {tab === 'chat' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
              User
            </div>
            {USERS.map(u => (
              <button
                key={u.id}
                className={`user-slot${activeUserId === u.id ? ' active' : ''}`}
                onClick={() => setActiveUserId(u.id)}
                title={u.full}
              >
                {u.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Content header */}
        <div style={{
          height: 48, flexShrink: 0,
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {PAGE_TITLES[tab]}
            </span>
            {tab === 'chat' && (
              <span style={{
                fontSize: 11, padding: '2px 8px',
                background: 'var(--color-background-secondary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 20, color: 'var(--color-text-tertiary)',
              }}>
                {activeUser.full}
              </span>
            )}
            {tab === 'test' && (
              <span style={{
                fontSize: 11, padding: '2px 8px',
                background: '#fef3c7',
                border: '0.5px solid #fde68a',
                borderRadius: 20, color: '#92400e',
              }}>
                dev only
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tab === 'analytics' && (
              <div className="mode-pill">
                <button
                  className={`mode-pill-btn${mode === 'demo' ? ' active-demo' : ''}`}
                  onClick={() => setMode('demo')}
                >
                  Demo
                </button>
                <button
                  className={`mode-pill-btn${mode === 'live' ? ' active-live' : ''}`}
                  onClick={() => setMode('live')}
                >
                  ● Live
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: tab === 'chat' ? 'block' : 'none', height: '100%' }}>
            <ChatWindow userId={activeUserId} />
          </div>
          <div style={{ display: tab === 'analytics' ? 'block' : 'none', height: '100%' }}>
            <AnalyticsDashboard mode={mode} />
          </div>
          <div style={{ display: tab === 'test' ? 'block' : 'none', height: '100%' }}>
            <TestRunner />
          </div>
        </div>
      </div>
    </div>
  );
}
