import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Plus, MessageSquare, Trash2, Edit3, Check, X,
  ChevronLeft, Bot, Cpu, AlertCircle, Layers
} from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const MODEL_DESCRIPTIONS = {
  'llama-3.3-70b-versatile': '⭐ Balanced & Reliable · Best for coding and everyday tasks',

  'meta-llama/llama-4-maverick-17b-128e-instruct': '🚀 Most Capable · Best for complex reasoning and AI agents',

  'meta-llama/llama-4-scout-17b-16e-instruct': '⚡ Fast & Multimodal · Best for chat and long inputs',

  'qwen-qwq-32b': '🧠 Reasoning Specialist · Best for math, logic, and analysis',

  'mixtral-8x7b-32768': '📚 Long Context · Good for large documents and reasoning'
};

const KNOWN_MODELS = Object.keys(MODEL_DESCRIPTIONS);

function ConvoItem({ convo, active, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(convo.title);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitRename = () => {
    if (val.trim()) onRename(convo._id, val.trim());
    setEditing(false);
  };

  return (
    <div
      className={`convo-item ${active ? 'active' : ''}`}
      onClick={() => !editing && onSelect(convo._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MessageSquare size={14} className="convo-icon" />
      {editing ? (
        <input
          ref={inputRef}
          className="convo-rename-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="convo-title">{convo.title || 'New Chat'}</span>
      )}
      {(hovered || active) && !editing && (
        <div className="convo-actions" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(true)} title="Rename"><Edit3 size={12} /></button>
          <button onClick={() => onDelete(convo._id)} title="Delete" className="danger"><Trash2 size={12} /></button>
        </div>
      )}
      {editing && (
        <div className="convo-actions" onClick={e => e.stopPropagation()}>
          <button onClick={commitRename}><Check size={12} /></button>
          <button onClick={() => setEditing(false)}><X size={12} /></button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const {
    conversations, activeId, models, selectedModel, setSelectedModel,
    ollamaOnline, loadingConvos, sidebarOpen, setSidebarOpen,
    newChat, selectConversation, deleteConversation, renameConversation, clearAll,
  } = useChat();

  const extraModels = models.filter(m => !KNOWN_MODELS.includes(m.name));

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon"><img src="/assets/synidailogo.png" alt="SYNID AI" style={{ width: 30, height: 30, objectFit: 'contain' }} /></div>
            <span className="brand-name">SYNID AI</span>
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Close sidebar">
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* New Chat */}
        <button className="new-chat-btn" onClick={newChat}>
          <Plus size={16} />
          <span>New Chat</span>
          <span className="kbd">N</span>
        </button>

        {/* Model Selector */}
        <div className="model-section">
          <div className="section-label"><Cpu size={11} />Model</div>
          {ollamaOnline ? (
            <div className="model-select-wrapper">
              <select
                className="model-select"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                <optgroup label="⭐ Recommended">
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b — Best Overall</option>
                  <option value="meta-llama/llama-4-maverick-17b-128e-instruct">llama-4-maverick — Most Capable</option>
                </optgroup>

                <optgroup label="⚡ Fast & Light">
                  <option value="meta-llama/llama-4-scout-17b-16e-instruct">llama-4-scout — Fast Multimodal</option>
                </optgroup>

                <optgroup label="🧠 Reasoning & Analysis">
                  <option value="qwen-qwq-32b">qwen-qwq-32b — Strong Reasoning</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b — Long Context</option>
                </optgroup>

                <optgroup label="🔥 Large & Powerful">
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b</option>
                  <option value="meta-llama/llama-4-maverick-17b-128e-instruct">llama-4-maverick</option>
                </optgroup>

                {extraModels.length > 0 && (
                  <optgroup label="🆕 Other Available">
                    {extraModels.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {MODEL_DESCRIPTIONS[selectedModel] && (
                <div className="model-desc">
                  {MODEL_DESCRIPTIONS[selectedModel]}
                </div>
              )}
            </div>
          ) : (
            <div className="offline-badge">
              <AlertCircle size={12} />
              <span>SYNID AI offline</span>
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="section-label" style={{ margin: '16px 12px 6px' }}>
          <Layers size={11} />Recent Chats
        </div>
        <div className="convo-list">
          {loadingConvos ? (
            <div className="sidebar-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="convo-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-convos">No chats yet.<br />Start a conversation!</div>
          ) : (
            conversations.map(c => (
              <ConvoItem
                key={c._id}
                convo={c}
                active={c._id === activeId}
                onSelect={selectConversation}
                onDelete={deleteConversation}
                onRename={renameConversation}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="sidebar-footer">
            <button className="clear-btn" onClick={() => {
              if (confirm('Delete all conversations?')) clearAll();
            }}>
              <Trash2 size={12} />
              <span>Clear all chats</span>
            </button>
          </div>
        )}
      </aside>

      {/* Toggle when closed */}
      {!sidebarOpen && (
        <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
          <img src="/assets/synidailogo.png" alt="SYNID AI" style={{ width: 30, height: 30, objectFit: 'contain' }} />
        </button>
      )}

      <style>{`
        .sidebar {
          width: var(--sidebar-w);
          height: 100%;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          transition: width var(--transition), opacity var(--transition);
          overflow: hidden;
          flex-shrink: 0;
        }
        .sidebar.closed { width: 0; opacity: 0; pointer-events: none; }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 14px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .sidebar-brand { display: flex; align-items: center; gap: 9px; }
        .brand-icon {
          width: 3px; height: 3px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
        }
        .brand-name { font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.3px; margin-left: 7px; }
        .new-chat-btn {
          margin: 12px 10px 4px;
          padding: 9px 14px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          border-radius: var(--radius);
          color: var(--accent);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition);
        }
        .new-chat-btn:hover {
          background: rgba(227,106,106,0.2);
          border-color: var(--accent);
          transform: translateY(-1px);
        }
        .kbd {
          margin-left: auto;
          font-size: 10px; color: var(--text-muted);
          background: var(--bg-base); border: 1px solid var(--border);
          border-radius: 4px; padding: 1px 5px;
          font-family: var(--font-mono);
        }
        .model-section { padding: 12px 12px 0; }
        .section-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
          text-transform: uppercase; color: var(--text-muted);
          margin-bottom: 6px;
        }
        .model-select-wrapper { display: flex; flex-direction: column; gap: 6px; }
        .model-select {
          width: 100%; padding: 7px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 12px;
          cursor: pointer;
          outline: none;
          transition: border-color var(--transition);
        }
        .model-select:hover { border-color: var(--accent); }
        .model-select option {
          background: var(--bg-elevated);
          color: var(--text-primary);
          padding: 4px;
          white-space: normal;
        }
        .model-desc {
          font-size: 11px;
          color: var(--accent);
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          border-radius: 6px;
          padding: 5px 9px;
          line-height: 1.5;
          animation: fadeIn 0.2s ease;
        }
        .offline-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 10px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 8px;
          color: var(--danger);
          font-size: 12px;
        }
        .convo-list { flex: 1; overflow-y: auto; padding: 4px 8px; }
        .convo-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background var(--transition);
          position: relative;
          min-height: 36px;
        }
        .convo-item:hover { background: var(--bg-hover); }
        .convo-item.active { background: var(--bg-active); }
        .convo-icon { color: var(--text-muted); flex-shrink: 0; }
        .convo-title {
          flex: 1; font-size: 13px; color: var(--text-secondary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .convo-item.active .convo-title { color: var(--text-primary); }
        .convo-actions { display: flex; gap: 2px; flex-shrink: 0; }
        .convo-actions button {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 3px;
          border-radius: 5px; display: flex; align-items: center;
          transition: all var(--transition);
        }
        .convo-actions button:hover { background: var(--bg-hover); color: var(--text-primary); }
        .convo-actions button.danger:hover { color: var(--danger); }
        .convo-rename-input {
          flex: 1; background: var(--bg-base); border: 1px solid var(--accent);
          border-radius: 5px; color: var(--text-primary);
          font-family: var(--font-sans); font-size: 12px;
          padding: 2px 6px; outline: none;
        }
        .convo-skeleton {
          height: 32px; border-radius: 8px; margin-bottom: 4px;
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .empty-convos {
          text-align: center; color: var(--text-muted);
          font-size: 12px; padding: 24px 16px; line-height: 1.7;
        }
        .sidebar-footer {
          padding: 10px 10px 14px;
          border-top: 1px solid var(--border-subtle);
        }
        .clear-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none;
          color: var(--text-muted); font-family: var(--font-sans);
          font-size: 12px; cursor: pointer; padding: 6px 8px;
          border-radius: 6px; transition: all var(--transition); width: 100%;
        }
        .clear-btn:hover { color: var(--danger); background: rgba(248,113,113,0.08); }
        .sidebar-toggle-btn {
          position: fixed; top: 14px; left: 14px; z-index: 50;
          width: 38px; height: 38px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); cursor: pointer;
          transition: all var(--transition);
        }
        .sidebar-toggle-btn:hover { border-color: var(--accent); color: var(--accent); }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 5px;
          border-radius: 6px; display: flex; align-items: center;
          transition: all var(--transition);
        }
        .icon-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
      `}</style>
    </>
  );
}