import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { openBrowserSession } from './utils/api';

function Workspace() {
  const { newChat, sidebarOpen, setSidebarOpen } = useChat();
  useEffect(() => {
    const handler = (event) => {
      const input = event.target instanceof Element && event.target.closest('input, textarea, [contenteditable]');
      if (event.key === 'n' && !input && !event.isComposing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        newChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [newChat]);

  return (
    <div className="workspace">
      {sidebarOpen && <div className="mobile-backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar />
      <ChatArea />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState({ id: null, error: '' });
  const activeSession = useRef(null);
  const check = useRef(0);

  const refresh = useCallback(async (reset = false) => {
    const current = ++check.current;
    if (reset) {
      activeSession.current = null;
      setSession({ id: null, error: '' });
    }
    try {
      const { id } = await openBrowserSession();
      if (check.current !== current) return;
      activeSession.current = id;
      setSession({ id, error: '' });
    } catch (error) {
      if (check.current === current && !activeSession.current) setSession({ id: null, error: error.message });
    }
  }, []);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const onRestore = event => { if (event.persisted) refresh(true); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onRestore);
    refresh();
    return () => {
      check.current++;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onRestore);
    };
  }, [refresh]);

  const onUnauthorized = useCallback(id => {
    if (activeSession.current === id) refresh(true);
  }, [refresh]);

  if (!session.id) {
    return (
      <main className="session-screen">
        <div className="welcome-logo"><img src="/assets/synidailogo.png" alt="" /></div>
        {session.error ? (
          <>
            <p className="form-error" role="alert">{session.error}</p>
            <button className="text-button" onClick={() => refresh(true)}>Try again</button>
          </>
        ) : <p role="status">Opening SYNID AI…</p>}
      </main>
    );
  }

  return (
    <ChatProvider key={session.id} sessionId={session.id} onUnauthorized={onUnauthorized}>
      <Workspace />
    </ChatProvider>
  );
}
