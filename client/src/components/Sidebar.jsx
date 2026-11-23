import { useState } from 'react';
import { Check, ChevronDown, ChevronLeft, Menu, MessageSquare, Pencil, Pin, Plus, Trash2, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';

function ConversationRow({ conversation, active, onSelect, onDelete, onRename }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');

  function save(event) {
    event.preventDefault();
    if (!title.trim()) return;
    onRename(conversation._id, title.trim());
    setRenaming(false);
  }

  if (renaming) {
    return (
      <form className="conversation-row active" onSubmit={save}>
        <input className="rename-input" value={title} onChange={event => setTitle(event.target.value)} autoFocus
          aria-label="Chat title" maxLength={120} required onKeyDown={event => {
            if (event.key === 'Escape') setRenaming(false);
          }} />
        <button className="icon-button small" title="Save chat title"><Check size={14} /></button>
        <button className="icon-button small" type="button" onClick={() => setRenaming(false)} title="Cancel rename"><X size={14} /></button>
      </form>
    );
  }
  return (
    <div className={`conversation-row${active ? ' active' : ''}`}>
      <button className="conversation-link" onClick={() => onSelect(conversation._id)} aria-current={active ? 'true' : undefined}
        title={conversation.title}>
        {conversation.pinned ? <Pin size={14} /> : <MessageSquare size={14} />}
        <span>{conversation.title}</span>
      </button>
      <div className="conversation-actions">
        <button className="icon-button small" title="Rename chat" onClick={() => {
          setTitle(conversation.title);
          setRenaming(true);
        }}><Pencil size={12} /></button>
        <button className="icon-button small danger" title="Delete chat" onClick={() => {
          if (window.confirm(`Delete “${conversation.title}”?`)) onDelete(conversation._id);
        }}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const {
    conversations, activeId, models, selectedModel, setSelectedModel, modelStatus, historyStatus,
    sidebarOpen, setSidebarOpen, streaming, retryConnection,
    newChat, selectConversation, deleteConversation, renameConversation, clearAll,
  } = useChat();
  const currentModel = models.find(model => model.name === selectedModel);

  if (!sidebarOpen) {
    return <button className="sidebar-toggle icon-button" onClick={() => setSidebarOpen(true)}
      aria-label="Open sidebar" title="Open sidebar"><Menu size={20} /></button>;
  }

  return (
    <aside className="sidebar" aria-label="Chat history">
      <div className="sidebar-header">
        <div className="sidebar-brand"><img src="/assets/synidailogo.png" alt="" /><span>SYNID AI</span></div>
        <button className="icon-button" onClick={() => setSidebarOpen(false)} title="Close sidebar"><ChevronLeft size={18} /></button>
      </div>
      <button className="new-chat-button" onClick={newChat} title="New chat (N)">
        <Plus size={18} /><span>New chat</span><kbd>N</kbd>
      </button>
      <div className="model-section">
        <label className="sidebar-label" htmlFor="model-picker">Model</label>
        {modelStatus === 'ready' ? (
          <>
            <div className="model-picker">
              <select id="model-picker" value={selectedModel} onChange={event => setSelectedModel(event.target.value)} disabled={streaming}>
                {models.map(model => <option key={model.name} value={model.name}>{model.label}</option>)}
              </select>
              <ChevronDown size={15} />
            </div>
            {currentModel?.description && <p>{currentModel.description}</p>}
          </>
        ) : modelStatus === 'loading' ? <p role="status">Loading models…</p> : (
          <p role="status">AI service unavailable <button className="text-button" onClick={retryConnection}>Retry</button></p>
        )}
      </div>
      <div className="history-header">
        <span className="sidebar-label">Recent chats</span>
        {conversations.length > 0 && (
          <button className="icon-button small danger" title="Delete all chats" onClick={() => {
            if (window.confirm('Delete all chats for this browser?')) clearAll();
          }}><Trash2 size={14} /></button>
        )}
      </div>
      <nav className="history-list" aria-label="Recent chats" aria-busy={historyStatus === 'loading'}>
        {historyStatus === 'loading' ? <p className="sidebar-status" role="status">Loading chat history…</p>
          : historyStatus === 'error' ? (
            <p className="sidebar-status" role="alert">Could not load chats. <button className="text-button" onClick={retryConnection}>Retry</button></p>
          ) : conversations.length === 0 ? <p className="sidebar-status">Your saved chats will appear here.</p>
            : conversations.map(conversation => (
              <ConversationRow key={conversation._id} conversation={conversation} active={conversation._id === activeId}
                onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} />
            ))}
      </nav>
    </aside>
  );
}
