import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Plus, MessageSquare, Trash2, Edit3, Check, X,
  ChevronLeft, Bot, Cpu, AlertCircle, Layers, ChevronDown
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

const MODEL_GROUPS = [
  {
    label: '⭐ Recommended',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b — Best Overall' },
      { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'llama-4-maverick — Most Capable' },
    ]
  },
  {
    label: '⚡ Fast & Light',
    models: [
      { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'llama-4-scout — Fast Multimodal' },
    ]
  },
  {
    label: '🧠 Reasoning & Analysis',
    models: [
      { value: 'qwen-qwq-32b', label: 'qwen-qwq-32b — Strong Reasoning' },
      { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b — Long Context' },
    ]
  },
  {
    label: '🔥 Large & Powerful',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b' },
      { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'llama-4-maverick' },
    ]
  },
];

const KNOWN_MODELS = Object.keys(MODEL_DESCRIPTIONS);

// Custom dropdown component — fully styled, works on all devices
function ModelDropdown({ selectedModel, setSelectedModel, extraModels }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get short display label for the selected model
  const getShortLabel = (val) => {
    for (const group of MODEL_GROUPS) {
      const found = group.models.find(m => m.value === val);
      if (found) return found.label;
    }
    const extra = extraModels.find(m => m.name === val);
    if (extra) return extra.name;
    return val;
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleSelect = (val) => {
    setSelectedModel(val);
    setOpen(false);
  };

  // Build extra models group if needed
  const extraGroup = extraModels.length > 0 ? [{
    label: '🆕 Other Available',
    models: extraModels.map(m => ({ value: m.name, label: m.name }))
  }] : [];

  const allGroups = [...MODEL_GROUPS, ...extraGroup];

  return (
    <div className="model-dropdown-wrapper" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        className="model-trigger"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="model-trigger-text">{getShortLabel(selectedModel)}</span>
        <ChevronDown size={14} className={`model-chevron ${open ? 'open' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="model-panel">
          {allGroups.map((group, gi) => (
            <div key={gi} className="model-group">
              <div className="model-group-label">{group.label}</div>
              {group.models.map((m, mi) => (
                <button
                  key={mi}
                  className={`model-option ${selectedModel === m.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(m.value)}
                  type="button"
                >
                  {selectedModel === m.value && <span className="model-check">✓</span>}
                  <span className="model-option-text">{m.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <ModelDropdown
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                extraModels={extraModels}
              />
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

        /* ── Custom model dropdown ── */
        .model-dropdown-wrapper {
          position: relative;
          width: 100%;
        }
        .model-trigger {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px;
          background: var(--accent-dim);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          transition: border-color var(--transition);
          gap: 8px;
        }
        .model-trigger:hover { border-color: var(--accent); }
        .model-trigger-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .model-chevron {
          flex-shrink: 0;
          color: var(--text-muted);
          transition: transform 0.18s ease;
        }
        .model-chevron.open { transform: rotate(180deg); }

        .model-panel {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px;
          z-index: 200;
          overflow-y: auto;
          max-height: 320px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: fadeUp 0.15s ease;
        }
        .model-group { padding: 6px 0; border-bottom: 1px solid var(--border-subtle); }
        .model-group:last-child { border-bottom: none; }
        .model-group-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 4px 12px 4px;
        }
        .model-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 12px;
          text-align: left;
          transition: background var(--transition), color var(--transition);
        }
        .model-option:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .model-option.selected {
          color: var(--accent);
          background: var(--accent-dim);
        }
        .model-check {
          font-size: 11px;
          color: var(--accent);
          flex-shrink: 0;
          width: 14px;
        }
        .model-option-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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