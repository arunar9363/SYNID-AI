import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createChatApi } from '../utils/api';

const ChatContext = createContext(null);

function rememberConversation(conversations, conversation) {
  return [conversation, ...conversations.filter(item => item._id !== conversation._id)]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function ChatProvider({ sessionId, onUnauthorized, children }) {
  const api = useMemo(() => createChatApi(sessionId, onUnauthorized), [sessionId, onUnauthorized]);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelStatus, setModelStatus] = useState('loading');
  const [historyStatus, setHistoryStatus] = useState('loading');
  const [loadingChat, setLoadingChat] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 720);
  const [draft, setDraft] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [notice, setNotice] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const activeRef = useRef(null);
  const selection = useRef(null);
  const stream = useRef(null);
  const lifetime = useRef(null);

  const report = useCallback((error) => {
    if (error.status !== 401) setNotice({ message: error.message, error: true });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => {
      controller.abort();
      selection.current?.abort();
      stream.current?.controller.abort();
    };
  }, [api]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setModelStatus('loading');
    setHistoryStatus('loading');
    api.getModels(signal).then(list => {
      if (signal.aborted) return;
      setModels(list);
      setSelectedModel(current => list.some(model => model.name === current) ? current :
        (list.find(model => model.default) || list[0])?.name || '');
      setModelStatus(list.length ? 'ready' : 'error');
    }).catch(() => { if (!signal.aborted) setModelStatus('error'); });
    api.getConversations(signal).then(list => {
      if (signal.aborted) return;
      setConversations(list);
      setHistoryStatus('ready');
    }).catch(() => { if (!signal.aborted) setHistoryStatus('error'); });
    return () => controller.abort();
  }, [api, retryNonce]);

  const retryConnection = () => setRetryNonce(value => value + 1);

  const setActive = useCallback((id) => {
    activeRef.current = id;
    setActiveId(id);
  }, []);

  const cancelStream = useCallback((restore = false) => {
    const pending = stream.current;
    if (!pending) return;
    stream.current = null;
    pending.controller.abort();
    setStreaming(false);
    if (restore) {
      setMessages(pending.messages);
      if (pending.draft !== undefined) setDraft(pending.draft);
    }
  }, []);

  const newChat = useCallback(() => {
    selection.current?.abort();
    selection.current = null;
    cancelStream();
    setActive(null);
    setMessages([]);
    setDraft('');
    setSystemPrompt('');
    setLoadingChat(false);
    setNotice(null);
    if (window.innerWidth <= 720) setSidebarOpen(false);
  }, [cancelStream, setActive]);

  const selectConversation = async (id) => {
    if (window.innerWidth <= 720) setSidebarOpen(false);
    if (id === activeRef.current) return;
    newChat();
    const controller = new AbortController();
    selection.current = controller;
    setActive(id);
    setLoadingChat(true);
    try {
      const conversation = await api.getConversation(id, controller.signal);
      if (controller.signal.aborted) return;
      setMessages(conversation.messages);
      setSystemPrompt(conversation.systemPrompt || '');
      if (models.some(model => model.name === conversation.model)) setSelectedModel(conversation.model);
    } catch (error) {
      if (controller.signal.aborted) return;
      setActive(null);
      report(error);
    } finally {
      if (selection.current === controller) {
        selection.current = null;
        setLoadingChat(false);
      }
    }
  };

  function startTurn(body, visibleMessages, sentDraft) {
    if (stream.current || selection.current || modelStatus !== 'ready') return;
    const controller = new AbortController();
    const pending = { controller, messages, draft: sentDraft };
    const assistant = { role: 'assistant', content: '', timestamp: new Date(), _streaming: true };
    stream.current = pending;
    setNotice(null);
    setStreaming(true);
    if (sentDraft !== undefined) setDraft('');
    setMessages([...visibleMessages, assistant]);

    let reply = '';
    api.streamChat({ ...body, conversationId: activeRef.current, model: selectedModel, systemPrompt }, controller.signal, chunk => {
      if (stream.current !== pending || controller.signal.aborted) return;
      reply += chunk;
      const content = reply;
      setMessages([...visibleMessages, { ...assistant, content }]);
    }).then(conversation => {
      if (stream.current !== pending || controller.signal.aborted) return;
      setActive(conversation._id);
      setConversations(items => rememberConversation(items, conversation));
      setMessages([...visibleMessages, { ...assistant, content: reply, _streaming: false }]);
    }).catch(error => {
      if (stream.current !== pending || controller.signal.aborted) return;
      setMessages(pending.messages);
      if (sentDraft !== undefined) setDraft(sentDraft);
      report(error);
    }).finally(() => {
      if (stream.current !== pending) return;
      stream.current = null;
      setStreaming(false);
    });
  }

  const userMessage = content => ({ role: 'user', content, timestamp: new Date() });

  function sendMessage(text) {
    const message = text.trim();
    if (!message || text.length > 8000) return;
    startTurn({ message }, [...messages, userMessage(message)], text);
  }

  function editMessage(messageIndex, text) {
    const message = text.trim();
    if (!activeRef.current || !message || text.length > 8000) return;
    startTurn({ action: 'edit', messageIndex, message }, [...messages.slice(0, messageIndex), userMessage(message)]);
  }

  function regenerate() {
    const index = messages.findLastIndex(message => message.role === 'user');
    if (!activeRef.current || index < 0) return;
    startTurn({ action: 'regenerate' }, messages.slice(0, index + 1));
  }

  function stopGeneration() {
    cancelStream(true);
    setNotice({ message: 'Generation stopped.', error: false });
  }

  async function deleteConversation(id) {
    if (activeRef.current === id) cancelStream(true);
    try {
      await api.deleteConversation(id);
      setConversations(items => items.filter(conversation => conversation._id !== id));
      if (activeRef.current === id) newChat();
    } catch (error) { report(error); }
  }

  async function renameConversation(id, title) {
    try {
      const conversation = await api.updateConversation(id, { title });
      setConversations(items => rememberConversation(items, conversation));
    } catch (error) { report(error); }
  }

  async function clearAll() {
    cancelStream(true);
    try {
      await api.clearAllConversations();
      setConversations([]);
      newChat();
    } catch (error) { report(error); }
  }

  async function togglePin(id) {
    try {
      const conversation = await api.pinConversation(id);
      setConversations(items => rememberConversation(items, conversation));
    } catch (error) { report(error); }
  }

  async function clearMessages(id) {
    if (activeRef.current === id) cancelStream(true);
    try {
      const conversation = await api.clearMessages(id);
      setConversations(items => rememberConversation(items, conversation));
      if (activeRef.current === id) setMessages([]);
    } catch (error) { report(error); }
  }

  async function saveSystemPrompt(prompt) {
    const id = activeRef.current;
    if (id) await api.updateConversation(id, { systemPrompt: prompt });
    if (activeRef.current === id) setSystemPrompt(prompt);
  }

  async function exportConversation(id, format) {
    const signal = lifetime.current?.signal;
    try { await api.exportConversation(id, format, signal); }
    catch (error) { if (!signal?.aborted) report(error); }
  }

  return (
    <ChatContext.Provider value={{
      api, conversations, activeId, messages, models, selectedModel, setSelectedModel, modelStatus, historyStatus,
      loadingChat, sidebarOpen, setSidebarOpen, streaming, draft, setDraft, systemPrompt, saveSystemPrompt,
      notice, dismissNotice: () => setNotice(null), retryConnection, selectConversation, newChat,
      sendMessage, editMessage, regenerate, stopGeneration, deleteConversation, renameConversation,
      clearAll, togglePin, clearMessages, exportConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
