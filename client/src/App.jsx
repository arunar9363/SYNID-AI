import { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

function AppInner() {
  const { newChat, sidebarOpen, setSidebarOpen } = useChat();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        newChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [newChat]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)', position: 'relative' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar />
      <ChatArea />
      <style>{`
        .mobile-backdrop {
          display: none;
        }
        @media (max-width: 640px) {
          .mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 199;
            backdrop-filter: blur(2px);
          }
        }
          // sidebar-toggle-btn CSS mein change karo
.sidebar-toggle-btn {
  position: fixed; 
  top: 14px; 
  left: 14px; 
  z-index: 50;
  width: 38px; height: 38px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); cursor: pointer;
  transition: all var(--transition);
}
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppInner />
    </ChatProvider>
  );
}
