import { useEffect, useState } from 'react';
import { Download, MoreHorizontal, Pin, PinOff, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import SettingsModal from './SettingsModal';
import SearchModal from './SearchModal';

export default function TopBar() {
  const {
    activeId, conversations, selectConversation, messages, streaming, loadingChat, sidebarOpen,
    systemPrompt, togglePin, clearMessages, exportConversation,
  } = useChat();
  const [modal, setModal] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const active = conversations.find(conversation => conversation._id === activeId);
  const estimatedTokens = messages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setModal('search');
      }
      if (event.key === 'Escape') {
        setModal(null);
        setShowMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => setShowMenu(false), [activeId]);

  function menuAction(action) {
    setShowMenu(false);
    action();
  }

  return (
    <>
      <header className={`topbar${sidebarOpen ? '' : ' with-sidebar-toggle'}`}>
        <span className="topbar-title" title={active?.title}>{active?.title || 'New chat'}</span>
        <div className="topbar-actions">
          {streaming ? <span className="generation-status" role="status"><span />Generating</span>
            : estimatedTokens > 0 && <span className="token-counter" title="Estimated message tokens">~{estimatedTokens.toLocaleString()} tokens</span>}
          <button className="icon-button" onClick={() => setModal('search')} title="Search chats (Ctrl+K)"><Search size={18} /></button>
          <button className="icon-button settings-button" onClick={() => setModal('settings')} title="Chat settings" disabled={streaming || loadingChat}>
            <SlidersHorizontal size={18} />{systemPrompt && <span className="settings-dot" />}
          </button>
          {activeId && !loadingChat && (
            <div className="chat-menu">
              <button className="icon-button" onClick={() => setShowMenu(value => !value)}
                aria-expanded={showMenu} title="Conversation actions"><MoreHorizontal size={19} /></button>
              {showMenu && (
                <>
                  <button className="menu-backdrop" tabIndex={-1} aria-label="Close actions" onClick={() => setShowMenu(false)} />
                  <div className="actions-popover">
                    <button onClick={() => menuAction(() => togglePin(activeId))}>
                      {active?.pinned ? <PinOff size={15} /> : <Pin size={15} />}{active?.pinned ? 'Unpin chat' : 'Pin chat'}
                    </button>
                    <button onClick={() => menuAction(() => exportConversation(activeId, 'markdown'))}><Download size={15} />Download Markdown</button>
                    <button onClick={() => menuAction(() => exportConversation(activeId, 'json'))}><Download size={15} />Download JSON</button>
                    <button className="danger" onClick={() => menuAction(() => {
                      if (window.confirm('Clear all messages in this chat?')) clearMessages(activeId);
                    })}><Trash2 size={15} />Clear messages</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      {modal === 'settings' && <SettingsModal key={activeId || 'new'} onClose={() => setModal(null)} />}
      {modal === 'search' && <SearchModal onClose={() => setModal(null)} onSelect={selectConversation} />}
    </>
  );
}
