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

// ── Exact model names from Ollama Cloud API ───────────────────────────────────
const MODEL_DESCRIPTIONS = {
  'gemma3:4b': '⚡ Fast · Balanced · Best for beginners',
  'gemma3:12b': '⚡ Fast · Better quality than 4b',
  'gemma3:27b': '🔥 Powerful · High quality answers',
  'ministral-3:3b': '⚡ Fastest model · Simple quick tasks',
  'ministral-3:8b': '⚡ Fast & smart · Great everyday model',
  'ministral-3:14b': '⚡ Balanced speed and quality',
  'qwen3-coder-next': '💻 Best for coding · Fast · Recommended',
  'qwen3-coder:480b': '💻 Most powerful coding model available',
  'devstral-2:123b': '💻 Large coding model · Deep code understanding',
  'devstral-small-2:24b': '💻 Smaller coding model · Faster responses',
  'kimi-k2-thinking': '🧠 Deep thinking · Best for complex reasoning',
  'kimi-k2.5': '🧠 Strong reasoning · Good for analysis',
  'kimi-k2:1t': '🧠 Largest model · Most powerful reasoning',
  'deepseek-v3.2': '🧠 Excellent reasoning · Great for research',
  'deepseek-v3.1:671b': '🧠 Very large · Best deep analysis',
  'qwen3-next:80b': '🧠 Strong reasoning · Multilingual',
  'gpt-oss:20b': '🔥 Strong general model · Fast responses',
  'gpt-oss:120b': '🔥 Very powerful · Slower but much better',
  'cogito-2.1:671b': '🔥 Very large · Deep understanding',
  'nemotron-3-nano:30b': '🔥 NVIDIA model · High quality',
  'nemotron-3-super': '🔥 NVIDIA super · Most powerful NVIDIA',
  'mistral-large-3:675b': '🔥 Largest Mistral · Top tier quality',
  'minimax-m2': '🖼️ Multimodal · Images + text',
  'minimax-m2.1': '🖼️ Improved multimodal',
  'minimax-m2.5': '🖼️ Better multimodal quality',
  'minimax-m2.7': '🖼️ Latest multimodal · Best vision',
  'gemini-3-flash-preview': '🖼️ Google model · Fast multimodal',
  'qwen3-vl:235b': '🌍 Multilingual + vision · Huge model',
  'qwen3-vl:235b-instruct': '🌍 Instruction tuned multilingual',
  'qwen3.5:397b': '🌍 Largest multilingual model',
  'glm-4.6': '🌍 Chinese + English · GLM series',
  'glm-4.7': '🌍 Improved GLM · Better quality',
  'glm-5': '🌍 Latest GLM · Best multilingual',
  'rnj-1:8b': '⚡ Lightweight · Quick responses',
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
            <div className="brand-icon"><Bot size={16} /></div>
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
                {/* ── Recommended ── */}
                <optgroup label="⭐ Recommended">
                  <option value="gemma3:4b">gemma3:4b — Fast & General</option>
                  <option value="deepseek-v3.2">deepseek-v3.2 — Best Reasoning</option>
                  <option value="qwen3-coder-next">qwen3-coder-next — Best Coding</option>
                  <option value="ministral-3:8b">ministral-3:8b — Fast & Smart</option>
                  <option value="kimi-k2-thinking">kimi-k2-thinking — Deep Thinking</option>
                </optgroup>

                {/* ── Fast & Light ── */}
                <optgroup label="⚡ Fast & Light">
                  <option value="ministral-3:3b">ministral-3:3b — Fastest</option>
                  <option value="ministral-3:8b">ministral-3:8b</option>
                  <option value="ministral-3:14b">ministral-3:14b</option>
                  <option value="gemma3:4b">gemma3:4b</option>
                  <option value="gemma3:12b">gemma3:12b</option>
                  <option value="rnj-1:8b">rnj-1:8b</option>
                  <option value="gpt-oss:20b">gpt-oss:20b</option>
                </optgroup>

                {/* ── Coding ── */}
                <optgroup label="💻 Coding">
                  <option value="qwen3-coder-next">qwen3-coder-next — Recommended</option>
                  <option value="devstral-small-2:24b">devstral-small-2:24b — Fast</option>
                  <option value="devstral-2:123b">devstral-2:123b — Powerful</option>
                  <option value="qwen3-coder:480b">qwen3-coder:480b — Most Powerful</option>
                </optgroup>

                {/* ── Reasoning & Analysis ── */}
                <optgroup label="🧠 Reasoning & Analysis">
                  <option value="deepseek-v3.2">deepseek-v3.2 — Recommended</option>
                  <option value="kimi-k2-thinking">kimi-k2-thinking — Deep Thinking</option>
                  <option value="kimi-k2.5">kimi-k2.5</option>
                  <option value="qwen3-next:80b">qwen3-next:80b</option>
                  <option value="deepseek-v3.1:671b">deepseek-v3.1:671b — Largest</option>
                  <option value="kimi-k2:1t">kimi-k2:1t — Most Powerful</option>
                </optgroup>

                {/* ── Large & Powerful ── */}
                <optgroup label="🔥 Large & Powerful">
                  <option value="gpt-oss:120b">gpt-oss:120b</option>
                  <option value="gemma3:27b">gemma3:27b</option>
                  <option value="cogito-2.1:671b">cogito-2.1:671b</option>
                  <option value="nemotron-3-nano:30b">nemotron-3-nano:30b</option>
                  <option value="nemotron-3-super">nemotron-3-super</option>
                  <option value="mistral-large-3:675b">mistral-large-3:675b</option>
                </optgroup>

                {/* ── Multimodal & Vision ── */}
                <optgroup label="🖼️ Multimodal & Vision">
                  <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                  <option value="minimax-m2">minimax-m2</option>
                  <option value="minimax-m2.1">minimax-m2.1</option>
                  <option value="minimax-m2.5">minimax-m2.5</option>
                  <option value="minimax-m2.7">minimax-m2.7 — Latest</option>
                </optgroup>

                {/* ── Multilingual ── */}
                <optgroup label="🌍 Multilingual">
                  <option value="glm-4.6">glm-4.6</option>
                  <option value="glm-4.7">glm-4.7</option>
                  <option value="glm-5">glm-5 — Latest</option>
                  <option value="qwen3.5:397b">qwen3.5:397b — Largest</option>
                  <option value="qwen3-vl:235b-instruct">qwen3-vl:235b-instruct</option>
                  <option value="qwen3-vl:235b">qwen3-vl:235b</option>
                </optgroup>

                {/* ── Extra models from API not in above list ── */}
                {extraModels.length > 0 && (
                  <optgroup label="🆕 Other Available">
                    {extraModels.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Smart description badge */}
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
          <Bot size={18} />
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
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
        }
        .brand-name { font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.3px; }
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
          background: rgba(124,106,247,0.2);
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