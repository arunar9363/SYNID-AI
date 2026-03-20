import { useState } from 'react';
import { Search, Download, Sliders, Pin, PinOff, Trash2, MoreHorizontal } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { exportConversation, pinConversation, clearMessages } from '../utils/api';
import SettingsModal from './SettingsModal';
import SearchModal from './SearchModal';

export default function TopBar({ systemPrompt, setSystemPrompt }) {
  const { activeId, conversations, selectConversation, messages, streaming, sidebarOpen } = useChat(); 
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pinned, setPinned] = useState(false);

  const activeConvo = conversations.find(c => c._id === activeId);

  // Rough token estimate: ~4 chars per token
  const estimatedTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);

  const handlePin = async () => {
    if (!activeId) return;
    const r = await pinConversation(activeId);
    setPinned(r.pinned);
  };

  const handleClearMessages = async () => {
    if (!activeId || !confirm('Clear all messages in this chat?')) return;
    await clearMessages(activeId);
    window.location.reload();
  };

  // Keyboard shortcut: Ctrl+K for search
  useState(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <>
      <div className="topbar" style={{ paddingLeft: sidebarOpen ? '20px' : '64px' }}>
        <div className="topbar-left">
          {activeConvo && (
            <div className="chat-title-display">
              <span className="chat-title-text">{activeConvo.title}</span>
              <span className="model-chip">{activeConvo.model}</span>
            </div>
          )}
          {!activeConvo && (
            <span className="chat-title-text muted">New Conversation</span>
          )}
        </div>

        <div className="topbar-right">
          {/* Token counter */}
          {messages.length > 0 && (
            <div className="token-badge" title="Estimated tokens in context">
              ~{estimatedTokens.toLocaleString()} tokens
            </div>
          )}

          {/* Streaming indicator */}
          {streaming && (
            <div className="gen-badge">
              <span className="gen-dot" />
              Generating
            </div>
          )}

          {/* Search */}
          <button className="topbar-btn" onClick={() => setShowSearch(true)} title="Search (Ctrl+K)">
            <Search size={15} />
          </button>

          {/* Settings */}
          <button className="topbar-btn" onClick={() => setShowSettings(true)} title="Settings & Personas">
            <Sliders size={15} />
            {systemPrompt && <span className="active-dot" />}
          </button>

          {/* More menu */}
          {activeId && (
            <div className="relative">
              <button className="topbar-btn" onClick={() => setShowMenu(m => !m)} title="More options">
                <MoreHorizontal size={15} />
              </button>
              {showMenu && (
                <div className="dropdown-menu" onMouseLeave={() => setShowMenu(false)}>
                  <button onClick={() => { exportConversation(activeId, 'markdown'); setShowMenu(false); }}>
                    <Download size={13} />Export as Markdown
                  </button>
                  <button onClick={() => { exportConversation(activeId, 'json'); setShowMenu(false); }}>
                    <Download size={13} />Export as JSON
                  </button>
                  <div className="menu-divider" />
                  <button onClick={() => { handlePin(); setShowMenu(false); }}>
                    {activeConvo?.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                    {activeConvo?.pinned ? 'Unpin' : 'Pin'} Chat
                  </button>
                  <button className="danger" onClick={() => { handleClearMessages(); setShowMenu(false); }}>
                    <Trash2 size={13} />Clear Messages
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
        />
      )}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSelect={selectConversation}
        />
      )}

      <style>{`
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          height: 52px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-base);
          flex-shrink: 0;
          position: relative; z-index: 10;
        }
        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .chat-title-display { display: flex; align-items: center; gap: 8px; }
        .chat-title-text {
          font-size: 14px; font-weight: 600; color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .chat-title-text.muted { color: var(--text-muted); font-weight: 400; }
        .model-chip {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 5px; padding: 1px 7px;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--text-muted);
        }

        .topbar-right { display: flex; align-items: center; gap: 6px; }
        .token-badge {
          font-size: 11px; color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 5px; padding: 2px 8px;
          font-family: var(--font-mono);
        }
        .gen-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--accent);
          background: var(--accent-dim); border: 1px solid var(--accent-glow);
          border-radius: 5px; padding: 3px 9px;
        }
        .gen-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); animation: pulse 1s infinite;
        }

        .topbar-btn {
          position: relative;
          width: 32px; height: 32px; border-radius: 8px;
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center; justify-content: center;
          transition: all var(--transition);
        }
        .topbar-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .active-dot {
          position: absolute; top: 5px; right: 5px;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
        }

        .relative { position: relative; }
        .dropdown-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 5px;
          min-width: 180px; z-index: 50;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: fadeUp 0.12s ease;
        }
        .dropdown-menu button {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; width: 100%; border: none;
          background: none; cursor: pointer; border-radius: 6px;
          color: var(--text-secondary); font-family: var(--font-sans);
          font-size: 13px; transition: all var(--transition);
          text-align: left;
        }
        .dropdown-menu button:hover { background: var(--bg-hover); color: var(--text-primary); }
        .dropdown-menu button.danger:hover { color: var(--danger); }
        .menu-divider { height: 1px; background: var(--border-subtle); margin: 4px 0; }
      `}</style>
    </>
  );
}
